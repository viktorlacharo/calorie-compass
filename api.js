// Create 
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const ALLOWED_SUPERMARKETS = ['carrefour', 'mercadona', 'lidl', 'aldi', 'eroski'];
function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
function isValidNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}
function normalizeBarcode(raw) {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().replace(/\s+/g, '');
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) return null;
  if (![8, 12, 13].includes(normalized.length)) return null;
  return normalized;
}
function toApiFood(stored) {
  return {
    id: stored.foodId,
    name: stored.name,
    barcode: stored.barcode ?? null,
    brand: stored.brand ?? null,
    referenceAmount: stored.referenceAmount,
    referenceUnit: stored.referenceUnit,
    referenceMacros: stored.referenceMacros,
    defaultServingAmount: stored.defaultServingAmount ?? null,
    supermarket: stored.supermarket ?? null,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  };
}
export const handler = async (event) => {
  try {
    const claims = event?.requestContext?.authorizer?.jwt?.claims ?? {};
    const sub = claims.sub;
    if (!sub) {
      return json(401, { message: 'Unauthorized' });
    }
    const tableName = process.env.TABLE_NAME;
    if (!tableName) {
      return json(500, { message: 'Missing TABLE_NAME environment variable' });
    }
    let body = null;
    try {
      body = event?.body ? JSON.parse(event.body) : null;
    } catch {
      return json(400, { message: 'Invalid JSON body' });
    }
    if (!body || typeof body !== 'object') {
      return json(400, { message: 'Missing request body' });
    }
    const {
      name,
      barcode: rawBarcode,
      brand,
      referenceAmount = 100,
      referenceMacros,
      defaultServingAmount,
      supermarket = null,
    } = body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return json(400, { message: 'Field "name" is required' });
    }
    if (!isValidNumber(referenceAmount) || referenceAmount <= 0) {
      return json(400, {
        message: 'Field "referenceAmount" must be a number greater than 0',
      });
    }
    const barcode = rawBarcode === undefined ? null : normalizeBarcode(rawBarcode);
    if (rawBarcode !== undefined && barcode === null) {
      return json(400, {
        message: 'Field "barcode" must be digits only with length 8, 12 or 13',
      });
    }
    if (brand !== undefined && brand !== null && (typeof brand !== 'string' || !brand.trim())) {
      return json(400, { message: 'Field "brand" must be a non-empty string when provided' });
    }
    if (!referenceMacros || typeof referenceMacros !== 'object') {
      return json(400, { message: 'Field "referenceMacros" is required' });
    }
    const { calories, protein, carbs, fats } = referenceMacros;
    if (
      !isValidNumber(calories) ||
      !isValidNumber(protein) ||
      !isValidNumber(carbs) ||
      !isValidNumber(fats)
    ) {
      return json(400, {
        message: 'referenceMacros.calories, protein, carbs and fats must be valid numbers',
      });
    }
    if (
      defaultServingAmount !== undefined &&
      (!isValidNumber(defaultServingAmount) || defaultServingAmount <= 0)
    ) {
      return json(400, {
        message: 'Field "defaultServingAmount" must be a number greater than 0 when provided',
      });
    }
    if (
      supermarket !== null &&
      supermarket !== undefined &&
      !ALLOWED_SUPERMARKETS.includes(supermarket)
    ) {
      return json(400, { message: 'Field "supermarket" is invalid' });
    }
    // Dedupe por barcode para el mismo usuario
    if (barcode) {
      const existingResult = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :foodPrefix)',
          FilterExpression: '#barcode = :barcode',
          ExpressionAttributeNames: {
            '#pk': 'PK',
            '#sk': 'SK',
            '#barcode': 'barcode',
          },
          ExpressionAttributeValues: {
            ':pk': `USER#${sub}`,
            ':foodPrefix': 'FOOD#',
            ':barcode': barcode,
          },
        })
      );
      const existing = existingResult.Items?.[0];
      if (existing) {
        return json(409, {
          message: 'A food with this barcode already exists for this user',
          barcode,
          existingFoodId: existing.foodId,
          existingFoodName: existing.name,
        });
      }
    }
    const now = new Date().toISOString();
    const foodId = `food_${Date.now()}`;
    const item = {
      PK: `USER#${sub}`,
      SK: `FOOD#${foodId}`,
      entityType: 'FOOD',
      foodId,
      userSub: sub,
      name: name.trim(),
      referenceAmount,
      referenceUnit: 'g',
      referenceMacros: { calories, protein, carbs, fats },
      ...(barcode ? { barcode } : {}),
      ...(brand && typeof brand === 'string' ? { brand: brand.trim() } : {}),
      ...(defaultServingAmount !== undefined ? { defaultServingAmount } : {}),
      ...(supermarket !== null && supermarket !== undefined ? { supermarket } : {}),
      createdAt: now,
      updatedAt: now,
    };
    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
      })
    );
    return json(201, { item: toApiFood(item) });
  } catch (error) {
    console.error('foods-create error', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });
    return json(500, { message: 'Internal Server Error' });
  }
};


// Barcode 
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
// ============================================================================
// CONFIGURACION Y VARIABLES DE ENTORNO
// ============================================================================
const OFF_BASE_URL = process.env.OPENFOODFACTS_BASE_URL || 'https://world.openfoodfacts.org';
const OFF_FIELDS = process.env.OPENFOODFACTS_FIELDS || 'product_name,brands,nutriments';
const OFF_TIMEOUT_MS = Number(process.env.OFF_TIMEOUT_MS || 4000);
// Tabla de cache del lookup externo (la que ya usabas)
const BARCODE_CACHE_TABLE = process.env.BARCODE_CACHE_TABLE || '';
// Tabla principal de foods (misma que usa tu lambda foods-create)
const FOODS_TABLE_NAME = process.env.FOODS_TABLE_NAME || '';
const CACHE_TTL_OK_SECONDS = Number(process.env.CACHE_TTL_OK_SECONDS || 60 * 60 * 24 * 14);
const CACHE_TTL_NOT_FOUND_SECONDS = Number(process.env.CACHE_TTL_NOT_FOUND_SECONDS || 60 * 60 * 24);
const CACHE_TTL_INCOMPLETE_SECONDS = Number(process.env.CACHE_TTL_INCOMPLETE_SECONDS || 60 * 60 * 6);
const MEM_CACHE_TTL_MS = Number(process.env.MEM_CACHE_TTL_MS || 10 * 60 * 1000);
const MAX_MEM_ITEMS = 500;
// ============================================================================
// INICIALIZACION DE CLIENTES Y CACHE GLOBAL
// ============================================================================
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
// Cache en memoria del lookup externo (NO para exists por usuario)
const memCache = new Map(); // key -> { expiresAtMs, value }
// ============================================================================
// UTILIDADES
// ============================================================================
function nowSec() {
  return Math.floor(Date.now() / 1000);
}
function nowMs() {
  return Date.now();
}
function jsonResponse(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}
function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function isDigitsOnly(value) {
  return /^\d+$/.test(value);
}
function isAllowedLength(value) {
  return [8, 12, 13].includes(value.length);
}
// ============================================================================
// PROCESAMIENTO DE DATOS NUTRICIONALES
// ============================================================================
function getKcalPer100g(nutriments = {}) {
  const kcalCandidates = [
    nutriments['energy-kcal_100g'],
    nutriments['energy-kcal'],
    nutriments['energy-kcal_value'],
  ];
  for (const c of kcalCandidates) {
    const n = safeNumber(c);
    if (n !== null) return n;
  }
  const kjCandidates = [
    nutriments['energy-kj_100g'],
    nutriments['energy-kj'],
    nutriments['energy-kj_value'],
  ];
  for (const c of kjCandidates) {
    const kj = safeNumber(c);
    if (kj !== null) return round1(kj / 4.184);
  }
  return null;
}
function normalizeProduct(barcode, product) {
  const nutriments = product?.nutriments || {};
  const calories = getKcalPer100g(nutriments);
  const protein = safeNumber(nutriments.proteins_100g);
  const carbs = safeNumber(nutriments.carbohydrates_100g);
  const fats = safeNumber(nutriments.fat_100g);
  const item = {
    barcode,
    detectedName: (product?.product_name || '').trim() || 'Producto sin nombre',
    brand: (product?.brands || '').trim() || null,
    referenceAmount: 100,
    referenceUnit: 'g',
    referenceMacros: { calories, protein, carbs, fats },
    source: 'openfoodfacts',
    fetchedAt: new Date().toISOString(),
  };
  const present = [calories, protein, carbs, fats].filter((v) => v !== null).length;
  item.confidence = round1(present / 4);
  return item;
}
function hasAllCoreMacros(item) {
  const m = item.referenceMacros;
  return m.calories !== null && m.protein !== null && m.carbs !== null && m.fats !== null;
}
// ============================================================================
// CACHE EN MEMORIA
// ============================================================================
function memGet(key) {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (entry.expiresAtMs <= nowMs()) {
    memCache.delete(key);
    return null;
  }
  return entry.value;
}
function memSet(key, value, ttlMs = MEM_CACHE_TTL_MS) {
  if (memCache.size >= MAX_MEM_ITEMS) {
    memCache.clear();
  }
  memCache.set(key, { value, expiresAtMs: nowMs() + ttlMs });
}
// ============================================================================
// CACHE EN DYNAMODB (LOOKUP EXTERNO)
// ============================================================================
async function ddbCacheGet(barcode) {
  if (!BARCODE_CACHE_TABLE) return null;
  try {
    const out = await docClient.send(
      new GetCommand({
        TableName: BARCODE_CACHE_TABLE,
        Key: { barcode },
        ConsistentRead: false,
      })
    );
    if (!out.Item) return null;
    if (typeof out.Item.expiresAt === 'number' && out.Item.expiresAt <= nowSec()) {
      return null;
    }
    return out.Item;
  } catch (error) {
    console.error('DynamoDB Cache Get Error:', error);
    return null;
  }
}
async function ddbCachePut(barcode, statusCode, body, ttlSeconds) {
  if (!BARCODE_CACHE_TABLE) return;
  try {
    await docClient.send(
      new PutCommand({
        TableName: BARCODE_CACHE_TABLE,
        Item: {
          barcode,
          statusCode,
          body,
          createdAt: new Date().toISOString(),
          expiresAt: nowSec() + ttlSeconds,
        },
      })
    );
  } catch (error) {
    console.error('DynamoDB Cache Put Error:', error);
  }
}
// ============================================================================
// CHECK EXISTING FOOD POR USUARIO + BARCODE
// ============================================================================
async function findExistingFoodByBarcode(userSub, barcode) {
  if (!FOODS_TABLE_NAME) {
    throw new Error('Missing FOODS_TABLE_NAME environment variable');
  }
  const out = await docClient.send(
    new QueryCommand({
      TableName: FOODS_TABLE_NAME,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :foodPrefix)',
      FilterExpression: '#entityType = :entityType AND #barcode = :barcode',
      ExpressionAttributeNames: {
        '#pk': 'PK',
        '#sk': 'SK',
        '#entityType': 'entityType',
        '#barcode': 'barcode',
      },
      ExpressionAttributeValues: {
        ':pk': `USER#${userSub}`,
        ':foodPrefix': 'FOOD#',
        ':entityType': 'FOOD',
        ':barcode': barcode,
      },
    })
  );
  return out.Items?.[0] ?? null;
}
// ============================================================================
// FETCH EXTERNO
// ============================================================================
async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(t);
  }
}
function cacheKey(barcode) {
  return `barcode:${barcode}`;
}
// ============================================================================
// HANDLER
// ============================================================================
export async function handler(event) {
  const startedAt = Date.now();
  try {
    const claims = event?.requestContext?.authorizer?.jwt?.claims ?? {};
    const sub = claims.sub;
    if (!sub) {
      return jsonResponse(401, { message: 'Unauthorized' });
    }
    const barcode = event?.pathParameters?.barcode?.trim();
    if (!barcode) {
      return jsonResponse(400, { message: 'Missing barcode path parameter.' });
    }
    if (!isDigitsOnly(barcode) || !isAllowedLength(barcode)) {
      return jsonResponse(400, {
        message: 'Invalid barcode. Use digits only with length 8, 12 or 13.',
      });
    }
    // ------------------------------------------------------------
    // PASO 0 (NUEVO): check de existencia en foods del usuario
    // ------------------------------------------------------------
    const existing = await findExistingFoodByBarcode(sub, barcode);
    if (existing) {
      return jsonResponse(
        200,
        {
          status: 'exists',
          barcode,
          existingFoodId: existing.foodId,
          existingFoodName: existing.name,
        },
        { 'X-Cache': 'BYPASS_EXISTS' }
      );
    }
    const key = cacheKey(barcode);
    // ------------------------------------------------------------
    // PASO 1: cache en memoria (solo lookup externo)
    // ------------------------------------------------------------
    const memHit = memGet(key);
    if (memHit) {
      return jsonResponse(memHit.statusCode, memHit.body, { 'X-Cache': 'MEM_HIT' });
    }
    // ------------------------------------------------------------
    // PASO 2: cache DynamoDB (solo lookup externo)
    // ------------------------------------------------------------
    const ddbHit = await ddbCacheGet(barcode);
    if (ddbHit) {
      const cached = { statusCode: ddbHit.statusCode, body: ddbHit.body };
      let remainingTtlMs = MEM_CACHE_TTL_MS;
      if (ddbHit.expiresAt) {
        const ddbRemainingMs = ddbHit.expiresAt * 1000 - nowMs();
        remainingTtlMs = Math.max(0, Math.min(ddbRemainingMs, MEM_CACHE_TTL_MS));
      }
      if (remainingTtlMs > 0) {
        memSet(key, cached, remainingTtlMs);
      }
      return jsonResponse(cached.statusCode, cached.body, { 'X-Cache': 'DDB_HIT' });
    }
    // ------------------------------------------------------------
    // PASO 3: OpenFoodFacts
    // ------------------------------------------------------------
    const offUrl = `${OFF_BASE_URL}/api/v3/product/${barcode}.json?fields=${encodeURIComponent(OFF_FIELDS)}`;
    const offRes = await fetchWithTimeout(offUrl, OFF_TIMEOUT_MS);
    if (!offRes.ok) {
      const body = { message: `OpenFoodFacts upstream error (${offRes.status}).` };
      await ddbCachePut(barcode, 502, body, CACHE_TTL_INCOMPLETE_SECONDS);
      const payload = { statusCode: 502, body };
      memSet(key, payload);
      return jsonResponse(502, body, { 'X-Cache': 'MISS_UPSTREAM_ERROR' });
    }
    const offData = await offRes.json();
    if (offData?.status !== 'success' || !offData?.product) {
      const body = { message: 'Product not found for barcode.', barcode };
      await ddbCachePut(barcode, 404, body, CACHE_TTL_NOT_FOUND_SECONDS);
      const payload = { statusCode: 404, body };
      memSet(key, payload);
      return jsonResponse(404, body, { 'X-Cache': 'MISS_NOT_FOUND' });
    }
    // ------------------------------------------------------------
    // PASO 4: normalizacion y respuesta
    // ------------------------------------------------------------
    const item = normalizeProduct(barcode, offData.product);
    if (!hasAllCoreMacros(item)) {
      const body = { message: 'Product found but nutriments are incomplete.', item };
      await ddbCachePut(barcode, 422, body, CACHE_TTL_INCOMPLETE_SECONDS);
      const payload = { statusCode: 422, body };
      memSet(key, payload);
      return jsonResponse(422, body, { 'X-Cache': 'MISS_INCOMPLETE' });
    }
    const body = { status: 'found', item };
    await ddbCachePut(barcode, 200, body, CACHE_TTL_OK_SECONDS);
    const payload = { statusCode: 200, body };
    memSet(key, payload);
    const durationMs = Date.now() - startedAt;
    console.log(JSON.stringify({ event: 'barcode_lookup_success', barcode, durationMs }));
    return jsonResponse(200, body, { 'X-Cache': 'MISS_STORED' });
  } catch (error) {
    const message = String(error?.message || error);
    const isAbort = error?.name === 'AbortError' || message.toLowerCase().includes('abort');
    const statusCode = isAbort ? 504 : 500;
    const body = {
      message: isAbort ? 'Upstream request timed out.' : 'Unexpected server error.',
    };
    console.error(
      JSON.stringify({
        event: 'barcode_lookup_error',
        statusCode,
        errorName: error?.name,
        errorMessage: message,
      })
    );
    return jsonResponse(statusCode, body, { 'X-Cache': 'ERROR' });
  }
}
