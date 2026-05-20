import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../shared/db';
import { getUserSub, json } from '../shared/http';
import { isAllowedBarcodeLength, isDigitsOnly } from '../shared/validation';

const OFF_BASE_URL = process.env.OPENFOODFACTS_BASE_URL || 'https://world.openfoodfacts.org';
const OFF_FIELDS = process.env.OPENFOODFACTS_FIELDS || 'product_name,brands,nutriments';
const OFF_TIMEOUT_MS = Number(process.env.OFF_TIMEOUT_MS || 4000);
const BARCODE_CACHE_TABLE = process.env.BARCODE_CACHE_TABLE || '';
const FOODS_TABLE_NAME = process.env.FOODS_TABLE_NAME || '';
const CACHE_TTL_OK_SECONDS = Number(process.env.CACHE_TTL_OK_SECONDS || 60 * 60 * 24 * 14);
const CACHE_TTL_NOT_FOUND_SECONDS = Number(process.env.CACHE_TTL_NOT_FOUND_SECONDS || 60 * 60 * 24);
const CACHE_TTL_INCOMPLETE_SECONDS = Number(process.env.CACHE_TTL_INCOMPLETE_SECONDS || 60 * 60 * 6);
const MEM_CACHE_TTL_MS = Number(process.env.MEM_CACHE_TTL_MS || 10 * 60 * 1000);
const MAX_MEM_ITEMS = 500;

const memCache = new Map<string, { expiresAtMs: number; value: { statusCode: number; body: unknown } }>();

function nowSec() {
  return Math.floor(Date.now() / 1000);
}

function nowMs() {
  return Date.now();
}

function safeNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function getKcalPer100g(nutriments: Record<string, unknown> = {}) {
  const kcalCandidates = [
    nutriments['energy-kcal_100g'],
    nutriments['energy-kcal'],
    nutriments['energy-kcal_value'],
  ];

  for (const candidate of kcalCandidates) {
    const value = safeNumber(candidate);
    if (value !== null) return value;
  }

  const kjCandidates = [
    nutriments['energy-kj_100g'],
    nutriments['energy-kj'],
    nutriments['energy-kj_value'],
  ];

  for (const candidate of kjCandidates) {
    const value = safeNumber(candidate);
    if (value !== null) return round1(value / 4.184);
  }

  return null;
}

function normalizeProduct(barcode: string, product: Record<string, unknown>) {
  const nutriments = (product.nutriments as Record<string, unknown> | undefined) ?? {};
  const calories = getKcalPer100g(nutriments);
  const protein = safeNumber(nutriments.proteins_100g);
  const carbs = safeNumber(nutriments.carbohydrates_100g);
  const fats = safeNumber(nutriments.fat_100g);
  const present = [calories, protein, carbs, fats].filter((value) => value !== null).length;

  return {
    barcode,
    detectedName: (typeof product.product_name === 'string' ? product.product_name : '').trim() || 'Producto sin nombre',
    brand: (typeof product.brands === 'string' ? product.brands : '').trim() || null,
    referenceAmount: 100,
    referenceUnit: 'g',
    referenceMacros: { calories, protein, carbs, fats },
    source: 'openfoodfacts',
    fetchedAt: new Date().toISOString(),
    confidence: round1(present / 4),
  };
}

function hasAllCoreMacros(item: { referenceMacros: { calories: number | null; protein: number | null; carbs: number | null; fats: number | null } }) {
  const { calories, protein, carbs, fats } = item.referenceMacros;
  return calories !== null && protein !== null && carbs !== null && fats !== null;
}

function memGet(key: string) {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (entry.expiresAtMs <= nowMs()) {
    memCache.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key: string, value: { statusCode: number; body: unknown }, ttlMs = MEM_CACHE_TTL_MS) {
  if (memCache.size >= MAX_MEM_ITEMS) {
    memCache.clear();
  }
  memCache.set(key, { value, expiresAtMs: nowMs() + ttlMs });
}

async function ddbCacheGet(barcode: string) {
  if (!BARCODE_CACHE_TABLE) return null;
  try {
    const out = await docClient.send(
      new GetCommand({
        TableName: BARCODE_CACHE_TABLE,
        Key: { barcode },
        ConsistentRead: false,
      }),
    );
    const item = out.Item as { statusCode?: number; body?: unknown; expiresAt?: number } | undefined;
    if (!item) return null;
    if (typeof item.expiresAt === 'number' && item.expiresAt <= nowSec()) {
      return null;
    }
    return item;
  } catch (error) {
    console.error('DynamoDB Cache Get Error:', error);
    return null;
  }
}

async function ddbCachePut(barcode: string, statusCode: number, body: unknown, ttlSeconds: number) {
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
      }),
    );
  } catch (error) {
    console.error('DynamoDB Cache Put Error:', error);
  }
}

async function findExistingFoodByBarcode(userSub: string, barcode: string) {
  if (!FOODS_TABLE_NAME) {
    throw new Error('Missing FOODS_TABLE_NAME environment variable');
  }

  const result = await docClient.send(
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
    }),
  );

  return result.Items?.[0] ?? null;
}

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function cacheKey(barcode: string) {
  return `barcode:${barcode}`;
}

export const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  try {
    const sub = getUserSub(event);
    if (!sub) {
      return json(401, { message: 'Unauthorized' });
    }

    const barcode = event.pathParameters?.barcode?.trim();
    if (!barcode) {
      return json(400, { message: 'Missing barcode path parameter.' });
    }
    if (!isDigitsOnly(barcode) || !isAllowedBarcodeLength(barcode)) {
      return json(400, { message: 'Invalid barcode. Use digits only with length 8, 12 or 13.' });
    }

    const existing = await findExistingFoodByBarcode(sub, barcode);
    if (existing) {
      return json(
        200,
        {
          status: 'exists',
          barcode,
          existingFoodId: (existing as { foodId: string }).foodId,
          existingFoodName: (existing as { name: string }).name,
        },
        { 'X-Cache': 'BYPASS_EXISTS' },
      );
    }

    const key = cacheKey(barcode);
    const memHit = memGet(key);
    if (memHit) {
      return json(memHit.statusCode, memHit.body, { 'X-Cache': 'MEM_HIT' });
    }

    const ddbHit = await ddbCacheGet(barcode);
    if (ddbHit?.statusCode) {
      const cached = { statusCode: ddbHit.statusCode, body: ddbHit.body };
      let remainingTtlMs = MEM_CACHE_TTL_MS;
      if (ddbHit.expiresAt) {
        remainingTtlMs = Math.max(0, Math.min(ddbHit.expiresAt * 1000 - nowMs(), MEM_CACHE_TTL_MS));
      }
      if (remainingTtlMs > 0) {
        memSet(key, cached, remainingTtlMs);
      }
      return json(cached.statusCode, cached.body, { 'X-Cache': 'DDB_HIT' });
    }

    const offUrl = `${OFF_BASE_URL}/api/v3/product/${barcode}.json?fields=${encodeURIComponent(OFF_FIELDS)}`;
    const offResponse = await fetchWithTimeout(offUrl, OFF_TIMEOUT_MS);

    if (!offResponse.ok) {
      const body = { message: `OpenFoodFacts upstream error (${offResponse.status}).` };
      await ddbCachePut(barcode, 502, body, CACHE_TTL_INCOMPLETE_SECONDS);
      const payload = { statusCode: 502, body };
      memSet(key, payload);
      return json(502, body, { 'X-Cache': 'MISS_UPSTREAM_ERROR' });
    }

    const offData = (await offResponse.json()) as { status?: string; product?: Record<string, unknown> };
    if (offData.status !== 'success' || !offData.product) {
      const body = { message: 'Product not found for barcode.', barcode };
      await ddbCachePut(barcode, 404, body, CACHE_TTL_NOT_FOUND_SECONDS);
      const payload = { statusCode: 404, body };
      memSet(key, payload);
      return json(404, body, { 'X-Cache': 'MISS_NOT_FOUND' });
    }

    const item = normalizeProduct(barcode, offData.product);
    if (!hasAllCoreMacros(item)) {
      const body = { message: 'Product found but nutriments are incomplete.', item };
      await ddbCachePut(barcode, 422, body, CACHE_TTL_INCOMPLETE_SECONDS);
      const payload = { statusCode: 422, body };
      memSet(key, payload);
      return json(422, body, { 'X-Cache': 'MISS_INCOMPLETE' });
    }

    const body = { status: 'found', item };
    await ddbCachePut(barcode, 200, body, CACHE_TTL_OK_SECONDS);
    memSet(key, { statusCode: 200, body });
    return json(200, body, { 'X-Cache': 'MISS_STORED' });
  } catch (error) {
    const message = String((error as { message?: string } | undefined)?.message || error);
    const name = (error as { name?: string } | undefined)?.name;
    const isAbort = name === 'AbortError' || message.toLowerCase().includes('abort');
    const statusCode = isAbort ? 504 : 500;

    console.error(
      JSON.stringify({
        event: 'barcode_lookup_error',
        statusCode,
        errorName: name,
        errorMessage: message,
      }),
    );

    return json(statusCode, {
      message: isAbort ? 'Upstream request timed out.' : 'Unexpected server error.',
    }, { 'X-Cache': 'ERROR' });
  }
};
