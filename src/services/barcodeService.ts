import { BarcodeProduct, Macros } from '../models/types';

const OFF_BASE = 'https://world.openfoodfacts.org';
const FIELDS = 'product_name,product_name_ru,brands,serving_size,nutriments,image_front_small_url,code';

const HEADERS = {
  'User-Agent': 'KBZHU Tracker/1.0 (Expo React Native)',
};

function barcodeUrl(barcode: string): string {
  return `${OFF_BASE}/api/v2/product/${barcode}.json?lc=ru&fields=${FIELDS}`;
}

function searchUrl(query: string): string {
  return `${OFF_BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&lc=ru&fields=${FIELDS}&page_size=20`;
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const response = await fetch(barcodeUrl(barcode), { headers: HEADERS });
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;

    return parseOFFProduct(data.product, barcode);
  } catch (error) {
    console.error('[OpenFoodFacts] barcode lookup error:', error);
    return null;
  }
}

export async function searchProducts(query: string): Promise<BarcodeProduct[]> {
  try {
    const response = await fetch(searchUrl(query), { headers: HEADERS });
    if (!response.ok) return [];

    const data = await response.json();
    const products = data?.products;
    if (!Array.isArray(products)) return [];

    return products
      .map((p: any) => parseOFFProduct(p, p.code || ''))
      .filter((p: BarcodeProduct | null): p is BarcodeProduct => p !== null);
  } catch (error) {
    console.error('[OpenFoodFacts] search error:', error);
    return [];
  }
}

function parseOFFProduct(product: any, barcode: string): BarcodeProduct | null {
  const name = product.product_name_ru || product.product_name;
  if (!name) return null;

  const n = product.nutriments;
  if (!n) return null;

  const macros: Macros = {
    calories: Math.round(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0),
    proteins: Math.round((n['proteins_100g'] ?? n['proteins'] ?? 0) * 10) / 10,
    fats: Math.round((n['fat_100g'] ?? n['fat'] ?? 0) * 10) / 10,
    carbs: Math.round((n['carbohydrates_100g'] ?? n['carbohydrates'] ?? 0) * 10) / 10,
  };

  return {
    barcode: barcode || product.code || '',
    name,
    brand: product.brands || undefined,
    servingSize: product.serving_size || '100г',
    macros,
    imageUrl: product.image_front_small_url || undefined,
  };
}
