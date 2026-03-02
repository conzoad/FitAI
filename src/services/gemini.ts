import { GoogleGenAI } from '@google/genai';
import { getFoodTextPrompt, getFoodPhotoPrompt, getChatSystemPrompt, getExercisePhotoPrompt } from './prompts';
import { parseNutritionResponse } from './responseParser';
import { GeminiNutritionResponse, GeminiExerciseResponse } from '../models/types';
import Constants from 'expo-constants';
import { useProfileStore } from '../stores/useProfileStore';
import { useLanguageStore } from '../stores/useLanguageStore';

let _ai: GoogleGenAI | null = null;
let _currentApiKey: string = '';

function getModelName(): string {
  return useProfileStore.getState().profile.geminiModel || 'gemini-2.5-flash';
}

function getLang() {
  return useLanguageStore.getState().language;
}

function getAI(): GoogleGenAI {
  const userApiKey = useProfileStore.getState().profile.geminiApiKey;
  const defaultApiKey = Constants.expoConfig?.extra?.geminiApiKey || '';
  const apiKey = userApiKey?.trim() || defaultApiKey;

  const lang = getLang();

  if (!apiKey) {
    throw new Error(
      lang === 'ru'
        ? 'Gemini API ключ не настроен.\n\nУкажите свой ключ в Профиле или добавьте GEMINI_API_KEY в .env'
        : 'Gemini API key not configured.\n\nEnter your key in Profile or add GEMINI_API_KEY to .env'
    );
  }

  if (!_ai || _currentApiKey !== apiKey) {
    _ai = new GoogleGenAI({ apiKey });
    _currentApiKey = apiKey;
  }

  return _ai;
}

function handleGeminiError(error: any): never {
  const lang = getLang();

  if (error?.error?.code === 429 || error?.status === 'RESOURCE_EXHAUSTED') {
    const retryMatch = error?.error?.message?.match(/retry in ([\d.]+)s/i);
    const retrySeconds = retryMatch ? Math.ceil(parseFloat(retryMatch[1])) : 60;
    throw new Error(
      lang === 'ru'
        ? `Превышен лимит запросов к Gemini API.\n\nПодождите ${retrySeconds} секунд и попробуйте снова.\n\nИли проверьте квоту на ai.google.dev`
        : `Gemini API rate limit exceeded.\n\nWait ${retrySeconds} seconds and try again.\n\nOr check your quota at ai.google.dev`
    );
  }

  if (error?.error?.code === 401 || error?.error?.code === 403) {
    throw new Error(
      lang === 'ru'
        ? 'Неверный API ключ Gemini.\n\nПроверьте GEMINI_API_KEY в файле .env'
        : 'Invalid Gemini API key.\n\nCheck GEMINI_API_KEY in your .env file'
    );
  }

  if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
    throw new Error(
      lang === 'ru'
        ? 'Ошибка сети.\n\nПроверьте подключение к интернету.'
        : 'Network error.\n\nCheck your internet connection.'
    );
  }

  const message = error?.error?.message || error?.message || (lang === 'ru' ? 'Неизвестная ошибка' : 'Unknown error');
  throw new Error(
    lang === 'ru'
      ? `Ошибка Gemini API:\n\n${message}`
      : `Gemini API error:\n\n${message}`
  );
}

export async function analyzeTextMeal(description: string): Promise<GeminiNutritionResponse> {
  const model = getModelName();
  const lang = getLang();
  try {
    const prompt = getFoodTextPrompt(lang).replace('{USER_INPUT}', description);

    const response = await getAI().models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    useProfileStore.getState().incrementApiCount(model);
    return parseNutritionResponse(response.text ?? '');
  } catch (error) {
    handleGeminiError(error);
  }
}

export async function analyzePhotoMeal(base64Image: string, mimeType: string = 'image/jpeg', userComment?: string): Promise<GeminiNutritionResponse> {
  const model = getModelName();
  const lang = getLang();
  try {
    const basePrompt = getFoodPhotoPrompt(lang);
    const promptText = userComment?.trim()
      ? `${basePrompt}\n\n${lang === 'ru' ? 'Комментарий пользователя' : 'User comment'}: "${userComment.trim()}"`
      : basePrompt;

    const response = await getAI().models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
        {
          text: promptText,
        },
      ],
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    useProfileStore.getState().incrementApiCount(model);
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
  const model = getModelName();
  const lang = getLang();
  try {
    let systemPrompt = getChatSystemPrompt(lang);
    Object.entries(userContext).forEach(([key, value]) => {
      systemPrompt = systemPrompt.replace(`{${key}}`, value);
    });

    const readyMessage = lang === 'ru' ? 'Понял, я готов помочь!' : 'Got it, I\'m ready to help!';
    const fallbackMessage = lang === 'ru' ? 'Извините, не удалось получить ответ.' : 'Sorry, could not get a response.';

    const contents = [
      { role: 'user' as const, parts: [{ text: systemPrompt }] },
      { role: 'model' as const, parts: [{ text: readyMessage }] },
      ...chatHistory.map((msg) => ({
        role: (msg.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
        parts: [{ text: msg.content }],
      })),
      { role: 'user' as const, parts: [{ text: userMessage }] },
    ];

    const response = await getAI().models.generateContent({
      model,
      contents,
      config: {
        temperature: 0.7,
      },
    });

    useProfileStore.getState().incrementApiCount(model);
    return response.text ?? fallbackMessage;
  } catch (error) {
    handleGeminiError(error);
  }
}

export async function analyzeExercisePhoto(base64Image: string, mimeType: string = 'image/jpeg'): Promise<GeminiExerciseResponse> {
  const model = getModelName();
  const lang = getLang();
  try {
    const response = await getAI().models.generateContent({
      model,
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
        {
          text: getExercisePhotoPrompt(lang),
        },
      ],
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    useProfileStore.getState().incrementApiCount(model);

    const text = response.text ?? '';
    const cleaned = text.replace(/```json\s*|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const unknownExercise = lang === 'ru' ? 'Неизвестное упражнение' : 'Unknown exercise';

    return {
      name: parsed.name || unknownExercise,
      muscleGroup: parsed.muscleGroup || 'fullBody',
      equipment: parsed.equipment || 'none',
      category: parsed.category || 'strength',
      force: parsed.force || 'other',
      level: parsed.level || 'beginner',
      description: parsed.description || '',
      isCompound: parsed.isCompound ?? true,
      targetMuscles: {
        primary: parsed.targetMuscles?.primary || [],
        secondary: parsed.targetMuscles?.secondary || [],
      },
      confidence: parsed.confidence || 'medium',
    };
  } catch (error) {
    handleGeminiError(error);
  }
}
