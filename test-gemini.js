const API_KEY = 'AIzaSyAfZpQK1JupIBtazPKgfwqS9QQy-BN8LE0';

async function testGeminiREST() {
  console.log('🔄 Тестирую Gemini API...\n');

  const models = ['gemini-2.0-flash', 'gemini-2.5-flash'];

  for (const modelName of models) {
    console.log(`\n📡 Тестирую модель: ${modelName}`);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'Ответь кратко: Привет! Ты работаешь?' }]
            }]
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Нет ответа';
        console.log('✅ УСПЕХ!');
        console.log('📝 Ответ от Gemini:', text.trim());
        console.log(`\n✅✅✅ API работает! Модель: ${modelName} ✅✅✅\n`);

        // Тест анализа еды
        console.log('📋 Тестирую анализ еды...');
        const foodResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: 'Рассчитай КБЖУ для: куриная грудка 100г. Ответь в формате JSON: {"calories": число, "proteins": число, "fats": число, "carbs": число}'
                }]
              }],
              generationConfig: {
                responseMimeType: 'application/json'
              }
            })
          }
        );

        const foodData = await foodResponse.json();
        if (foodResponse.ok) {
          const foodText = foodData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          console.log('📝 КБЖУ ответ:', foodText);
          console.log('\n✅ Анализ еды работает!\n');
        }

        return true;
      } else {
        console.error(`❌ Ошибка ${response.status}:`);
        console.error('Сообщение:', data.error?.message || JSON.stringify(data, null, 2));

        if (response.status === 429) {
          console.error('\n⚠️  ПРЕВЫШЕНА КВОТА API');
          console.error('Проверьте: https://ai.google.dev/rate-limits');
        } else if (response.status === 403 || response.status === 401) {
          console.error('\n⚠️  ПРОБЛЕМА С API КЛЮЧОМ');
          console.error('Создайте новый: https://aistudio.google.com/app/apikey');
        }
      }

    } catch (error) {
      console.error('❌ Сетевая ошибка:', error.message);
    }
  }

  console.error('\n❌ API не работает. Возможные причины:');
  console.error('1. Превышена квота (проверьте на https://ai.google.dev/rate-limits)');
  console.error('2. Неверный API ключ (создайте новый на https://aistudio.google.com/app/apikey)');
  console.error('3. Нет интернета');
  return false;
}

testGeminiREST();
