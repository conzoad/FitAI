import { BarcodeProduct, Macros } from '../models/types';

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product';
const OPEN_FOOD_FACTS_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl';

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const response = await fetch(`${OPEN_FOOD_FACTS_API}/${barcode}.json`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return null;
    }

    return parseProduct(data.product, barcode);
  } catch (error) {
    console.error('Barcode lookup error:', error);
    return null;
  }
}

export async function searchProducts(query: string): Promise<BarcodeProduct[]> {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page_size: '20',
      fields: 'code,product_name,product_name_ru,brands,nutriments,serving_size,image_front_small_url,image_url',
    });

    const response = await fetch(`${OPEN_FOOD_FACTS_SEARCH}?${params}`);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.products || !Array.isArray(data.products)) return [];

    return data.products
      .map((p: any) => parseProduct(p, p.code || ''))
      .filter((p: BarcodeProduct | null): p is BarcodeProduct => p !== null);
  } catch (error) {
    console.error('Product search error:', error);
    return [];
  }
}

function parseProduct(product: any, barcode: string): BarcodeProduct | null {
  const nutriments = product.nutriments || {};
  const name = product.product_name || product.product_name_ru;
  if (!name) return null;

  const macros: Macros = {
    calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
    proteins: Math.round((nutriments.proteins_100g || nutriments.proteins || 0) * 10) / 10,
    fats: Math.round((nutriments.fat_100g || nutriments.fat || 0) * 10) / 10,
    carbs: Math.round((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * 10) / 10,
  };

  return {
    barcode,
    name,
    brand: product.brands || undefined,
    servingSize: product.serving_size || '100\u0433',
    macros,
    imageUrl: product.image_front_small_url || product.image_url || undefined,
  };
}
