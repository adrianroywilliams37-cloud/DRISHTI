import { GoogleGenAI } from '@google/genai';

async function testModel(modelName) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Hello",
    });
    console.log(`[${modelName}] Success:`, response.text);
  } catch (error) {
    console.error(`[${modelName}] Error:`, error.message);
  }
}

async function run() {
  await testModel("gemini-3.6-flash");
}

run();
