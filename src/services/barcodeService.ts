import { BarcodeProduct, Macros } from '../models/types';

const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2/product';

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

    const product = data.product;
    const nutriments = product.nutriments || {};

    const macros: Macros = {
      calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
      proteins: Math.round((nutriments.proteins_100g || nutriments.proteins || 0) * 10) / 10,
      fats: Math.round((nutriments.fat_100g || nutriments.fat || 0) * 10) / 10,
      carbs: Math.round((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * 10) / 10,
    };

    return {
      barcode,
      name: product.product_name || product.product_name_ru || 'Без названия',
      brand: product.brands || undefined,
      servingSize: product.serving_size || '100г',
      macros,
      imageUrl: product.image_front_small_url || product.image_url || undefined,
    };
  } catch (error) {
    console.error('Barcode lookup error:', error);
    return null;
  }
}
