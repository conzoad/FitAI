import { GeminiNutritionResponse } from '../models/types';

export function parseNutritionResponse(rawText: string): GeminiNutritionResponse {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  const parsed = JSON.parse(cleaned) as GeminiNutritionResponse;

  if (!parsed.items || !Array.isArray(parsed.items)) {
    throw new Error('Missing items array');
  }

  parsed.items = parsed.items.map((item) => ({
    name: item.name || 'Неизвестный продукт',
    amount: item.amount || '1 порция',
    calories: Math.max(0, Math.round(Number(item.calories) || 0)),
    proteins: Math.max(0, Math.round(Number(item.proteins) * 10) / 10 || 0),
    fats: Math.max(0, Math.round(Number(item.fats) * 10) / 10 || 0),
    carbs: Math.max(0, Math.round(Number(item.carbs) * 10) / 10 || 0),
    ...(item.glycemicIndex != null && { glycemicIndex: Math.max(0, Math.round(Number(item.glycemicIndex))) }),
    ...(item.insulinIndex != null && { insulinIndex: Math.max(0, Math.round(Number(item.insulinIndex))) }),
    ...(item.sugar != null && { sugar: Math.max(0, Math.round(Number(item.sugar) * 10) / 10) }),
    ...(item.salt != null && { salt: Math.max(0, Math.round(Number(item.salt) * 10) / 10) }),
  }));

  parsed.totalCalories = parsed.items.reduce((s, i) => s + i.calories, 0);
  parsed.totalProteins = Math.round(parsed.items.reduce((s, i) => s + i.proteins, 0) * 10) / 10;
  parsed.totalFats = Math.round(parsed.items.reduce((s, i) => s + i.fats, 0) * 10) / 10;
  parsed.totalCarbs = Math.round(parsed.items.reduce((s, i) => s + i.carbs, 0) * 10) / 10;
  parsed.totalSugar = Math.round(parsed.items.reduce((s, i) => s + (i.sugar || 0), 0) * 10) / 10;
  parsed.totalSalt = Math.round(parsed.items.reduce((s, i) => s + (i.salt || 0), 0) * 10) / 10;
  parsed.confidence = parsed.confidence || 'medium';

  return parsed;
}
