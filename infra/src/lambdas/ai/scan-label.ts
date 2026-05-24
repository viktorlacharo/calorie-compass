import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getUserSub, json } from '../shared/http';
import { isNonEmptyString } from '../shared/validation';

const s3 = new S3Client({});

const SYSTEM_PROMPT = `Analiza la imagen de la etiqueta nutricional provista.
Extrae los siguientes datos nutricionales obligatorios:
- Nombre descriptivo y limpio del producto (detectedName)
- Cantidad de referencia en gramos (referenceAmount, habitualmente es 100)
- Macronutrientes por cada cantidad de referencia: calorías (calories), proteínas (protein), carbohidratos (carbs) y grasas (fats).
- Cantidad de ración por defecto sugerida (defaultServingAmount, si la etiqueta menciona el tamaño de ración, ej. "ración de 30g", de lo contrario estima un valor razonable).

Devuelve estrictamente un objeto JSON que cumpla con este formato:
{
  "detectedName": string,
  "referenceAmount": number,
  "referenceMacros": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fats": number
  },
  "defaultServingAmount": number
}`;

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  try {
    const sub = getUserSub(event);
    if (!sub) {
      return json(401, { message: 'Unauthorized' });
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

    // 1. Download image from S3
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

    // 2. Convert stream to base64
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

    // 3. Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
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
      return json(502, { message: 'Failed to analyze label with Gemini' });
    }

    const data = await geminiResponse.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      return json(502, { message: 'Empty response from Gemini API' });
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response from Gemini:', responseText, parseError);
      return json(502, { message: 'Invalid format returned by Gemini' });
    }

    return json(200, {
      detectedName: result.detectedName || 'Producto Escaneado',
      referenceAmount: typeof result.referenceAmount === 'number' ? result.referenceAmount : 100,
      referenceMacros: {
        calories: Number(result.referenceMacros?.calories ?? 0),
        protein: Number(result.referenceMacros?.protein ?? 0),
        carbs: Number(result.referenceMacros?.carbs ?? 0),
        fats: Number(result.referenceMacros?.fats ?? 0),
      },
      defaultServingAmount: typeof result.defaultServingAmount === 'number' ? result.defaultServingAmount : null,
      confidence: 0.95,
      provider: 'lambda',
    });
  } catch (error) {
    console.error('ai-scan-label error', error);
    return json(500, { message: 'Internal Server Error' });
  }
};
