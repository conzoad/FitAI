import { GoogleGenAI } from '@google/genai';
import { FOOD_ANALYSIS_TEXT_PROMPT, FOOD_ANALYSIS_PHOTO_PROMPT, FITNESS_CHAT_SYSTEM_PROMPT } from './prompts';
import { parseNutritionResponse } from './responseParser';
import { GeminiNutritionResponse } from '../models/types';
import Constants from 'expo-constants';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey || '';
const MODEL_NAME = 'gemini-2.0-flash';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function analyzeTextMeal(description: string): Promise<GeminiNutritionResponse> {
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
}

export async function analyzePhotoMeal(base64Image: string, mimeType: string = 'image/jpeg'): Promise<GeminiNutritionResponse> {
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
}

export async function sendChatMessage(
  userMessage: string,
  chatHistory: { role: string; content: string }[],
  userContext: Record<string, string>
): Promise<string> {
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
}
