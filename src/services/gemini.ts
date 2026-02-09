import { GoogleGenAI } from '@google/genai';
import { FOOD_ANALYSIS_TEXT_PROMPT, FOOD_ANALYSIS_PHOTO_PROMPT, FITNESS_CHAT_SYSTEM_PROMPT } from './prompts';
import { parseNutritionResponse } from './responseParser';
import { GeminiNutritionResponse } from '../models/types';
import Constants from 'expo-constants';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey || '';
const MODEL_NAME = 'gemini-2.0-flash';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

function handleGeminiError(error: any): never {
  // Проверяем на ошибку quota exceeded (429)
  if (error?.error?.code === 429 || error?.status === 'RESOURCE_EXHAUSTED') {
    const retryMatch = error?.error?.message?.match(/retry in ([\d.]+)s/i);
    const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
    throw new Error(
      `Превышен лимит запросов к Gemini API.\n\nПодождите ${retrySeconds} секунд и попробуйте снова.\n\nИли проверьте квоту на ai.google.dev`
    );
  }

  // Проверяем на неверный API ключ
  if (error?.error?.code === 401 || error?.error?.code === 403) {
    throw new Error('Неверный API ключ Gemini.\n\nПроверьте GEMINI_API_KEY в файле .env');
  }

  // Проверяем на сетевые ошибки
  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    throw new Error('Ошибка сети.\n\nПроверьте подключение к интернету.');
  }

  // Общая ошибка
  const message = error?.error?.message || error?.message || 'Неизвестная ошибка';
  throw new Error(`Ошибка Gemini API:\n\n${message}`);
}

export async function analyzeTextMeal(description: string): Promise<GeminiNutritionResponse> {
  try {
    const prompt = FOOD_ANALYSIS_TEXT_PROMPT.replace('{USER_INPUT}', description);

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    return parseNutritionResponse(response.text ?? '');
  } catch (error) {
    handleGeminiError(error);
  }
}

export async function analyzePhotoMeal(base64Image: string, mimeType: string = 'image/jpeg'): Promise<GeminiNutritionResponse> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
        {
          text: FOOD_ANALYSIS_PHOTO_PROMPT,
        },
      ],
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    return parseNutritionResponse(response.text ?? '');
  } catch (error) {
    handleGeminiError(error);
  }
}

export async function sendChatMessage(
  userMessage: string,
  chatHistory: { role: string; content: string }[],
  userContext: Record<string, string>
): Promise<string> {
  try {
    let systemPrompt = FITNESS_CHAT_SYSTEM_PROMPT;
    Object.entries(userContext).forEach(([key, value]) => {
      systemPrompt = systemPrompt.replace(`{${key}}`, value);
    });

    const contents = [
      { role: 'user' as const, parts: [{ text: systemPrompt }] },
      { role: 'model' as const, parts: [{ text: 'Понял, я готов помочь!' }] },
      ...chatHistory.map((msg) => ({
        role: (msg.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
        parts: [{ text: msg.content }],
      })),
      { role: 'user' as const, parts: [{ text: userMessage }] },
    ];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        temperature: 0.7,
      },
    });

    return response.text ?? 'Извините, не удалось получить ответ.';
  } catch (error) {
    handleGeminiError(error);
  }
}
