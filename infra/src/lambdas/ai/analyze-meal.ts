import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db';
import { getUserSub, json } from '../shared/http';
import { isNonEmptyString } from '../shared/validation';

const s3 = new S3Client({});

type MacroNutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type Food = {
  id: string;
  name: string;
  referenceAmount: number;
  defaultServingAmount?: number | null;
  referenceMacros: MacroNutrients;
};

type GeminiDetectionItem = {
  detectedFoodName: string;
  estimatedQuantity: number;
  matchedFoodId: string | null;
  confidence: number;
  unmatchedMacrosPer100g?: MacroNutrients | null;
};

type VisualAnalysisItem = {
  detectedFoodName: string;
  estimatedQuantity: number;
  matchedFoodId: string | null;
  estimatedMacros: MacroNutrients;
  confidence: number;
};

function calculateServingMacros(
  referenceMacros: MacroNutrients,
  referenceAmount: number,
  servingAmount: number,
): MacroNutrients {
  if (referenceAmount <= 0 || servingAmount <= 0) {
    return { calories: 0, protein: 0, carbs: 0, fats: 0 };
  }

  const factor = servingAmount / referenceAmount;

  return {
    calories: Math.round(referenceMacros.calories * factor),
    protein: Number((referenceMacros.protein * factor).toFixed(1)),
    carbs: Number((referenceMacros.carbs * factor).toFixed(1)),
    fats: Number((referenceMacros.fats * factor).toFixed(1)),
  };
}

function sumMacros(items: MacroNutrients[]): MacroNutrients {
  return items.reduce<MacroNutrients>(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: Number((acc.protein + item.protein).toFixed(1)),
      carbs: Number((acc.carbs + item.carbs).toFixed(1)),
      fats: Number((acc.fats + item.fats).toFixed(1)),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
}

const SYSTEM_PROMPT = `Analiza la imagen del plato de comida provisto y cruza los ingredientes detectados con el catálogo de alimentos del usuario.

Tu tarea:
1. Identifica los diferentes alimentos, ingredientes o componentes individuales que componen el plato en la imagen.
2. Para cada componente identificado, compáralo con los alimentos del catálogo del usuario.
3. Si hay un alimento en el catálogo que coincida razonablemente con el componente detectado (por ejemplo, "pechuga de pollo a la plancha" coincide con "pollo", "arroz integral" coincide con "arroz", "aceite de oliva" coincide con "aceite"), asocia ese ID en el campo "matchedFoodId".
4. Estima el peso/cantidad del componente en gramos (estimatedQuantity) basándote en la porción visualizada.
5. Si no encuentras ninguna coincidencia en el catálogo, pon "matchedFoodId": null y estima los macros nutricionales de ese alimento por cada 100 gramos en el campo "unmatchedMacrosPer100g".

Devuelve estrictamente un objeto JSON con este formato:
{
  "items": [
    {
      "detectedFoodName": string, // Nombre del alimento detectado en español (ej. "Arroz Blanco", "Pechuga de Pollo")
      "estimatedQuantity": number, // Peso estimado en gramos
      "matchedFoodId": string | null, // ID del catálogo si coincide, o null
      "confidence": number, // Confianza en la estimación (0.0 a 1.0)
      "unmatchedMacrosPer100g": { // Requerido solo si matchedFoodId es null. Macros por 100g estimados para este alimento.
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number
      }
    }
  ]
}`;

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  try {
    const sub = getUserSub(event);
    if (!sub) {
      return json(401, { message: 'Unauthorized' });
    }

    const tableName = process.env.TABLE_NAME;
    if (!tableName) {
      return json(500, { message: 'Missing TABLE_NAME environment variable' });
    }

    const bucketName = process.env.MEDIA_BUCKET_NAME;
    if (!bucketName) {
      return json(500, { message: 'Missing MEDIA_BUCKET_NAME environment variable' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'PLACEHOLDER_KEY') {
      return json(500, { message: 'Gemini API key is not configured' });
    }

    let body: Record<string, any> | null = null;
    try {
      body = event.body ? (JSON.parse(event.body) as Record<string, any>) : null;
    } catch {
      return json(400, { message: 'Invalid JSON body' });
    }

    if (!body) {
      return json(400, { message: 'Missing request body' });
    }

    const { imageKey } = body;
    if (!isNonEmptyString(imageKey)) {
      return json(400, { message: 'Field "imageKey" is invalid' });
    }

    let foodsCatalog: Food[] = body.foodsCatalog;

    // 1. Fetch user's foods catalog from DynamoDB if not passed in
    if (!foodsCatalog || foodsCatalog.length === 0) {
      const foodsResult = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
          ExpressionAttributeValues: {
            ':pk': `USER#${sub}`,
            ':skPrefix': 'FOOD#',
          },
        }),
      );
      foodsCatalog = (foodsResult.Items ?? []).map((item) => ({
        id: item.logId || item.SK.replace('FOOD#', ''),
        name: item.name,
        referenceAmount: item.referenceAmount || 100,
        defaultServingAmount: item.defaultServingAmount,
        referenceMacros: item.referenceMacros,
      }));
    }

    // 2. Download image from S3
    let s3Response;
    try {
      s3Response = await s3.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: imageKey,
        }),
      );
    } catch (s3Error: any) {
      console.error('S3 GetObject error', s3Error);
      return json(404, { message: `Image with key "${imageKey}" not found in S3` });
    }

    if (!s3Response.Body) {
      return json(500, { message: 'S3 response body is empty' });
    }

    // 3. Convert stream to base64
    const bytes = await s3Response.Body.transformToByteArray();
    const base64Image = Buffer.from(bytes).toString('base64');

    // Determine mimeType
    const extension = imageKey.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg';
    if (extension === 'png') {
      mimeType = 'image/png';
    } else if (extension === 'webp') {
      mimeType = 'image/webp';
    }

    // 4. Call Gemini API with system prompt + catalog context + image
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const catalogSnippet = `CATÁLOGO DEL USUARIO EN FORMATO JSON:\n${JSON.stringify(
      foodsCatalog.map(f => ({ id: f.id, name: f.name, referenceAmount: f.referenceAmount, referenceMacros: f.referenceMacros })),
      null,
      2
    )}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${SYSTEM_PROMPT}\n\n${catalogSnippet}` },
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API Error:', errorText);
      return json(502, { message: 'Failed to analyze meal image with Gemini' });
    }

    const data = await geminiResponse.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      return json(502, { message: 'Empty response from Gemini API' });
    }

    let parsedResult: { items: GeminiDetectionItem[] };
    try {
      parsedResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response from Gemini:', responseText, parseError);
      return json(502, { message: 'Invalid format returned by Gemini' });
    }

    const detectionItems = parsedResult.items || [];
    const catalogMap = new Map(foodsCatalog.map((food) => [food.id, food]));

    // 5. Perform the exact rule-of-three calculation on matched or unmatched items
    const items: VisualAnalysisItem[] = detectionItems.map((item) => {
      const matchedFood = item.matchedFoodId ? catalogMap.get(item.matchedFoodId) : null;

      let estimatedMacros: MacroNutrients;
      let matchedFoodId: string | null = null;
      let detectedFoodName = item.detectedFoodName;

      if (matchedFood) {
        matchedFoodId = matchedFood.id;
        detectedFoodName = matchedFood.name; // Keep standard catalog name
        estimatedMacros = calculateServingMacros(
          matchedFood.referenceMacros,
          matchedFood.referenceAmount,
          item.estimatedQuantity,
        );
      } else {
        // Fallback: use unmatched macros estimated by Gemini
        const fallbackMacros = item.unmatchedMacrosPer100g || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0,
        };
        estimatedMacros = calculateServingMacros(fallbackMacros, 100, item.estimatedQuantity);
      }

      return {
        detectedFoodName,
        estimatedQuantity: item.estimatedQuantity,
        matchedFoodId,
        estimatedMacros,
        confidence: typeof item.confidence === 'number' ? item.confidence : 0.8,
      };
    });

    const total = sumMacros(items.map((item) => item.estimatedMacros));

    return json(200, {
      imageId: `visual_${Date.now()}`,
      items,
      total,
      provider: 'lambda',
    });
  } catch (error) {
    console.error('ai-analyze-meal error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
