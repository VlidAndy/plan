
import { GoogleGenAI, Type } from "@google/genai";
import { NLPResult, Category, AIConfig, AIProvider, Task } from "../types";

// 延迟初始化 Gemini
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
  // 提示词升级：明确 reference 是 Today
  const prompt = `你是一个专业的日程解析助手。
【重要】今天的日期是: ${todayDate} (yyyy-MM-dd)。
任务描述: "${input}"。

请将其解析为JSON对象，要求：
1. date: 任务的日期 (yyyy-MM-dd)。
   - 如果描述包含"明天"、"后天"、"周五"等，请基于今天的日期 [${todayDate}] 准确计算。
   - 如果描述中没有任何日期信息，请直接返回今天的日期 [${todayDate}]。
2. startTime: 任务开始时间 (HH:mm:ss)。
3. endTime: 任务结束时间 (HH:mm:ss)，若无提及则默认开始后1小时。
4. category: 从 [工作, 学习, 健康, 生活] 中选一。
5. priority: 优先级 1(低), 2(中), 3(高)。

返回示例: {"title": "打羽毛球", "date": "2024-05-21", "startTime": "18:00:00", "endTime": "20:00:00", "category": "健康", "priority": 2}`;
  
  try {
    if (config.provider === AIProvider.GEMINI) {
      const client = getGeminiClient();
      if (!client) {
        return { title: input };
      }
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
      const result = await callOpenAICompatible(config, prompt, "你是一个只输出严格JSON的日程解析助手。", "json_object");
      return JSON.parse(result);
    }
  } catch (error) {
    console.error("AI Parsing Error:", error);
    return { title: input };
  }
}

export async function getSmartSuggestions(tasks: Task[], config: AIConfig): Promise<string> {
  const taskSummary = tasks.map(t => `${t.startTime}-${t.endTime}: ${t.title}`).join(', ');
  const prompt = `基于目前的日程: [${taskSummary}]，作为一位贴心的私人助理，给出一个极简的建议（20字以内）。`;
  const system = "你是一个清新、治愈、温柔的日程小助手，语气像宫崎骏电影里的角色。";

  try {
    if (config.provider === AIProvider.GEMINI) {
      const client = getGeminiClient();
      if (!client) return "保持专注，也要记得给心灵留白 ✨";
      
      const response = await client.models.generateContent({
        model: config.modelId,
        contents: prompt,
        config: { systemInstruction: system }
      });
      return response.text || "保持专注，也要记得给心灵留白 ✨";
    } else {
      return await callOpenAICompatible(config, prompt, system);
    }
  } catch (error) {
    return "接下来30分钟有空档，喝杯温水休息一下吧？☕";
  }
}

export async function generateJournalImage(tasks: Task[], mood: string | null, modelId: string = "gemini-2.5-flash-image"): Promise<string | null> {
  try {
    const client = getGeminiClient();
    if (!client) return null;

    const completedTasks = tasks.filter(t => t.completed).map(t => t.title).join(', ');
    const prompt = `A aesthetic watercolor illustration of a daily journal. Mood: ${mood || 'peaceful'}. Achievements: ${completedTasks || 'started today'}. Ghibli style.`;

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
  } catch (error) {
    return null;
  }
}
