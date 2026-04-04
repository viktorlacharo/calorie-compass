import {
  createFood as createFoodAws,
  getFoodByBarcode as getFoodByBarcodeAws,
  getFoods as getFoodsAws,
  updateFood as updateFoodAws,
} from '@/lib/api/generated/aws-api';
import type { BarcodeLookupExistsResponse, GetFoodByBarcode200 } from '@/lib/api/generated/model/index';
import { HttpRequestError } from '@/lib/api/http-client';
import type {
  BarcodeLookupItemIncomplete,
  BarcodeLookupResult,
  CreateFoodInput,
  DeleteFoodResult,
  FoodsListFilters,
  UpdateFoodInput,
} from '@/features/foods/domain/food.contracts';
import type { Food } from '@/types/nutrition';

function filterFoodsByQuery(foods: Food[], query: string | undefined) {
  if (!query?.trim()) {
    return foods;
  }

  const normalizedQuery = query.trim().toLowerCase();
  return foods.filter((food) => food.name.toLowerCase().includes(normalizedQuery));
}

function toBarcodeLookupItemIncomplete(item: Record<string, unknown>): BarcodeLookupItemIncomplete {
  const referenceMacros = (item.referenceMacros ?? {}) as Record<string, unknown>;

  return {
    barcode: String(item.barcode ?? ''),
    detectedName: String(item.detectedName ?? 'Producto sin nombre'),
    brand: typeof item.brand === 'string' ? item.brand : null,
    referenceAmount: Number(item.referenceAmount ?? 100),
    referenceUnit: 'g',
    referenceMacros: {
      calories: typeof referenceMacros.calories === 'number' ? referenceMacros.calories : null,
      protein: typeof referenceMacros.protein === 'number' ? referenceMacros.protein : null,
      carbs: typeof referenceMacros.carbs === 'number' ? referenceMacros.carbs : null,
      fats: typeof referenceMacros.fats === 'number' ? referenceMacros.fats : null,
    },
    source: 'openfoodfacts',
    fetchedAt: typeof item.fetchedAt === 'string' ? item.fetchedAt : new Date().toISOString(),
    confidence: typeof item.confidence === 'number' ? item.confidence : 0,
  };
}

export async function listFoods(filters?: FoodsListFilters) {
  const foodsResponse = await getFoodsAws();
  const foods = foodsResponse.items as Food[];
  return filterFoodsByQuery(foods, filters?.query);
}

export async function getFoodById(id: string) {
  const foods = await listFoods();
  return foods.find((entry) => entry.id === id) ?? null;
}

export async function createFood(input: CreateFoodInput) {
  const response = await createFoodAws({
    name: input.name.trim(),
    referenceAmount: input.referenceAmount,
    barcode: input.barcode,
    brand: input.brand,
    referenceMacros: { ...input.referenceMacros },
    defaultServingAmount: input.defaultServingAmount,
    supermarket: input.supermarket ?? null,
  });

  return response.item as Food;
}

export async function updateFood(id: string, input: UpdateFoodInput): Promise<Food> {
  const response = await updateFoodAws(id, {
    name: input.name.trim(),
    referenceAmount: input.referenceAmount,
    barcode: input.barcode,
    brand: input.brand,
    referenceMacros: { ...input.referenceMacros },
    defaultServingAmount: input.defaultServingAmount,
    supermarket: input.supermarket ?? null,
  });

  return response.item as Food;
}

export async function removeFood(id: string): Promise<DeleteFoodResult> {
  void id;
  throw new Error('Eliminar alimentos en AWS aun no esta disponible.');
}

export async function lookupFoodByBarcode(barcode: string): Promise<BarcodeLookupResult> {
  try {
    const response = await getFoodByBarcodeAws(barcode);

    if (response.status === 'exists') {
      const existsResponse = response as BarcodeLookupExistsResponse;
      return {
        status: 'exists',
        barcode: existsResponse.barcode,
        existingFoodId: existsResponse.existingFoodId,
        existingFoodName: existsResponse.existingFoodName,
      };
    }

    const foundResponse = response as GetFoodByBarcode200;
    return {
      status: 'found',
      item: {
        ...foundResponse.item,
        source: 'openfoodfacts',
        referenceUnit: 'g',
      },
    };

  } catch (error) {
    if (error instanceof HttpRequestError) {
      if (error.status === 422 && error.data && typeof error.data === 'object') {
        const payload = error.data as { message?: string; item?: unknown };

        if (payload.item && typeof payload.item === 'object') {
          return {
            status: 'incomplete',
            message: payload.message ?? 'Producto encontrado con macros incompletos.',
            item: toBarcodeLookupItemIncomplete(payload.item as Record<string, unknown>),
          };
        }
      }

      if (error.status === 404) {
        return {
          status: 'not-found',
          message: error.message || 'No se encontro producto para ese codigo.',
        };
      }

      return {
        status: 'error',
        message: error.message || 'No se pudo consultar el codigo de barras.',
      };
    }

    throw error;
  }
}
