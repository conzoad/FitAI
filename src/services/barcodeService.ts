import Constants from 'expo-constants';
import { BarcodeProduct, Macros } from '../models/types';

const TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const API_URL = 'https://platform.fatsecret.com/rest/server.api';

const clientId = Constants.expoConfig?.extra?.fatSecretClientId || '';
const clientSecret = Constants.expoConfig?.extra?.fatSecretClientSecret || '';

let cachedToken: string | null = null;
let tokenExpiry = 0;

function isConfigured(): boolean {
  return !!(
    clientId &&
    clientSecret &&
    !clientId.startsWith('YOUR_') &&
    !clientSecret.startsWith('YOUR_')
  );
}

async function getAccessToken(): Promise<string> {
  if (!isConfigured()) {
    throw new Error(
      'FatSecret API не настроен. Укажите FATSECRET_CLIENT_ID и FATSECRET_CLIENT_SECRET в файле .env'
    );
  }

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  console.log('[FatSecret] Requesting token, clientId:', clientId.substring(0, 8) + '...');

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&scope=basic`,
  });

  const text = await response.text();
  console.log('[FatSecret] Token response status:', response.status, 'body:', text.substring(0, 200));

  if (!response.ok) {
    throw new Error(`Ошибка авторизации FatSecret (${response.status}): ${text}`);
  }

  const data = JSON.parse(text);
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken!;
}

async function apiCall(params: Record<string, string>): Promise<any> {
  const token = await getAccessToken();
  const query = new URLSearchParams({ ...params, format: 'json' });

  const response = await fetch(`${API_URL}?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`FatSecret API error: ${response.status}`);
  }

  return response.json();
}

export async function lookupBarcode(barcode: string): Promise<BarcodeProduct | null> {
  try {
    const barcodeData = await apiCall({
      method: 'food.find_id_for_barcode',
      barcode,
    });

    const foodId = barcodeData?.food_id?.value;
    if (!foodId) return null;

    const foodData = await apiCall({
      method: 'food.get.v4',
      food_id: foodId,
    });

    return parseFatSecretFood(foodData?.food, barcode);
  } catch (error) {
    console.error('FatSecret barcode lookup error:', error);
    return null;
  }
}

export async function searchProducts(query: string): Promise<BarcodeProduct[]> {
  try {
    const data = await apiCall({
      method: 'foods.search',
      search_expression: query,
      max_results: '20',
    });

    const foods = data?.foods?.food;
    if (!foods) return [];

    const foodList = Array.isArray(foods) ? foods : [foods];

    return foodList
      .map((f: any) => parseSearchResult(f))
      .filter((p: BarcodeProduct | null): p is BarcodeProduct => p !== null);
  } catch (error) {
    console.error('FatSecret search error:', error);
    return [];
  }
}

function parseFatSecretFood(food: any, barcode: string): BarcodeProduct | null {
  if (!food || !food.food_name) return null;

  const servings = food.servings?.serving;
  if (!servings) return null;

  const servingList = Array.isArray(servings) ? servings : [servings];
  const serving = servingList.find((s: any) => s.metric_serving_amount === '100.000' && s.metric_serving_unit === 'g')
    || servingList[0];

  if (!serving) return null;

  const macros: Macros = {
    calories: Math.round(parseFloat(serving.calories) || 0),
    proteins: Math.round((parseFloat(serving.protein) || 0) * 10) / 10,
    fats: Math.round((parseFloat(serving.fat) || 0) * 10) / 10,
    carbs: Math.round((parseFloat(serving.carbohydrate) || 0) * 10) / 10,
  };

  const servingSize = serving.metric_serving_amount
    ? `${Math.round(parseFloat(serving.metric_serving_amount))}${serving.metric_serving_unit || 'г'}`
    : serving.serving_description || '100г';

  return {
    barcode,
    name: food.food_name,
    brand: food.brand_name || undefined,
    servingSize,
    macros,
  };
}

function parseSearchResult(food: any): BarcodeProduct | null {
  if (!food || !food.food_name) return null;

  const description = food.food_description || '';
  const macros = parseDescription(description);

  return {
    barcode: food.food_id || '',
    name: food.food_name,
    brand: food.brand_name || undefined,
    servingSize: extractServing(description) || '100г',
    macros,
  };
}

function parseDescription(desc: string): Macros {
  const cal = desc.match(/Calories:\s*([\d.]+)/i);
  const fat = desc.match(/Fat:\s*([\d.]+)/i);
  const carb = desc.match(/Carbs:\s*([\d.]+)/i);
  const prot = desc.match(/Protein:\s*([\d.]+)/i);

  return {
    calories: Math.round(parseFloat(cal?.[1] || '0')),
    fats: Math.round((parseFloat(fat?.[1] || '0')) * 10) / 10,
    carbs: Math.round((parseFloat(carb?.[1] || '0')) * 10) / 10,
    proteins: Math.round((parseFloat(prot?.[1] || '0')) * 10) / 10,
  };
}

function extractServing(desc: string): string | null {
  const match = desc.match(/^Per\s+(.+?)\s*-/i);
  return match ? match[1] : null;
}
