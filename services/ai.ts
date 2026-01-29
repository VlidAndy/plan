
import { GoogleGenAI, Type } from "@google/genai";
import { NLPResult, Category, AIConfig, AIProvider, Task } from "../types";

// Gemini Native Client
const geminiAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function callOpenAICompatible(config: AIConfig, prompt: string, systemInstruction?: string, responseFormat?: 'json_object' | 'text') {
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

export async function parseNLPTask(input: string, config: AIConfig): Promise<Partial<NLPResult>> {
  const prompt = `将以下自然语言日程描述解析为JSON对象，只需返回JSON。输入: "${input}"。格式: {"title": string, "startTime": "HH:mm", "endTime": "HH:mm", "category": "工作/学习/健康/生活", "priority": 1-3}`;
  
  try {
    if (config.provider === AIProvider.GEMINI) {
      const response = await geminiAi.models.generateContent({
        model: config.modelId,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              category: { type: Type.STRING, enum: Object.values(Category) },
              priority: { type: Type.INTEGER }
            },
            required: ["title"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } else {
      const result = await callOpenAICompatible(config, prompt, "你是一个专业的日程解析助手，只输出JSON格式。", "json_object");
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
      const response = await geminiAi.models.generateContent({
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

// 图像生成目前依然主要依赖 Gemini 2.5/3.0，因为 OpenAI DALL-E 接口结构不同，此处保留 Gemini 逻辑
export async function generateJournalImage(tasks: Task[], mood: string | null, modelId: string = "gemini-2.5-flash-image"): Promise<string | null> {
  try {
    const completedTasks = tasks.filter(t => t.completed).map(t => t.title).join(', ');
    const prompt = `A aesthetic watercolor illustration of a daily journal. Mood: ${mood || 'peaceful'}. Achievements: ${completedTasks || 'started today'}. Ghibli style.`;

    const response = await geminiAi.models.generateContent({
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
