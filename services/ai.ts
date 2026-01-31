
import { GoogleGenAI, Type } from "@google/genai";
import { NLPResult, Category, AIConfig, AIProvider, Task } from "../types";

let geminiAi: GoogleGenAI | null = null;
const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey.includes("YOUR_API_KEY")) {
    return null;
  }
  if (!geminiAi) {
    geminiAi = new GoogleGenAI({ apiKey });
  }
  return geminiAi;
};

async function callOpenAICompatible(config: AIConfig, prompt: string, systemInstruction?: string, responseFormat?: 'json_object' | 'text') {
  if (!config.apiKey && !process.env.API_KEY) {
    throw new Error("Missing API Key for OpenAI compatible provider");
  }
  
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey || process.env.API_KEY}`
    },
    body: JSON.stringify({
      model: config.modelId,
      messages: [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        { role: 'user', content: prompt }
      ],
      response_format: responseFormat ? { type: responseFormat } : undefined
    })
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

export async function parseNLPTask(input: string, config: AIConfig, todayDate: string): Promise<Partial<NLPResult>> {
  const prompt = `你是一个专业的日程解析助手。今天的日期是: ${todayDate}。解析 "${input}" 为JSON对象。需包含title, date, startTime, endTime, category, priority。`;
  
  try {
    if (config.provider === AIProvider.GEMINI) {
      const client = getGeminiClient();
      if (!client) return { title: input };
      const response = await client.models.generateContent({
        model: config.modelId,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              category: { type: Type.STRING, enum: Object.values(Category) },
              priority: { type: Type.INTEGER }
            },
            required: ["title", "date", "startTime"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } else {
      const result = await callOpenAICompatible(config, prompt, "你是一个只输出JSON的助手。", "json_object");
      return JSON.parse(result);
    }
  } catch (error) {
    return { title: input };
  }
}

export async function getSmartSuggestions(tasks: Task[], config: AIConfig): Promise<string> {
  const taskSummary = tasks.map(t => `${t.startTime}: ${t.title}`).join(', ');
  const prompt = `基于日程: [${taskSummary}]，作为治愈系助理，给一个20字以内的贴心建议。`;
  const system = "你是一个清新、治愈的日程小助手，语气像宫崎骏电影里的角色。";

  try {
    if (config.provider === AIProvider.GEMINI) {
      const client = getGeminiClient();
      if (!client) return "愿你这一天，如晨曦般明媚 ✨";
      const response = await client.models.generateContent({
        model: config.modelId,
        contents: prompt,
        config: { systemInstruction: system }
      });
      return response.text || "记得给心灵留白 ✨";
    } else {
      return await callOpenAICompatible(config, prompt, system);
    }
  } catch (error) {
    return "记得喝杯温水休息一下吧？☕";
  }
}

export async function getMorningInspiration(config: AIConfig): Promise<string> {
  const prompt = "为用户新的一天提供一句充满力量且治愈的晨间寄语，包含对今日的期许。25字以内。";
  const system = "你是一位温柔的晨间播报员，言语中带着森林的清香。";
  try {
    const client = getGeminiClient();
    if (!client) return "早安！今天又是崭新的一页，尽情涂鸦吧。";
    const response = await client.models.generateContent({
      model: config.modelId,
      contents: prompt,
      config: { systemInstruction: system }
    });
    return response.text || "早安！";
  } catch { return "早安！"; }
}

export async function generateJournalImage(tasks: Task[], mood: string | null, modelId: string = "gemini-2.5-flash-image"): Promise<string | null> {
  try {
    const client = getGeminiClient();
    if (!client) return null;
    const completedTasks = tasks.filter(t => t.completed).map(t => t.title).join(', ');
    const prompt = `Hand-drawn aesthetic watercolor illustration. Concept: Daily achievement journal. Elements: ${completedTasks || 'peaceful moments'}. Mood: ${mood || 'cozy'}. Studio Ghibli inspired, high quality.`;
    const response = await client.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "3:4" } }
    });
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  } catch { return null; }
}
