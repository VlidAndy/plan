
import { GoogleGenAI, Type } from "@google/genai";
import { NLPResult, Category, Priority, Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function parseNLPTask(input: string): Promise<Partial<NLPResult>> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `将以下自然语言日程描述解析为JSON对象。输入: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "任务标题" },
            startTime: { type: Type.STRING, description: "开始时间 HH:mm" },
            endTime: { type: Type.STRING, description: "结束时间 HH:mm" },
            category: { 
              type: Type.STRING, 
              enum: Object.values(Category),
              description: "工作, 学习, 健康, 生活之一" 
            },
            priority: { 
              type: Type.INTEGER, 
              description: "1-3 优先级" 
            }
          },
          required: ["title"]
        }
      }
    });

    const text = response.text;
    if (!text) return { title: input };
    return JSON.parse(text);
  } catch (error) {
    console.error("NLP Parsing Error:", error);
    return { title: input };
  }
}

export async function getSmartSuggestions(tasks: Task[]): Promise<string> {
  try {
    const taskSummary = tasks.map(t => `${t.startTime}-${t.endTime}: ${t.title}`).join(', ');
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `基于目前的日程: [${taskSummary}]，作为一位贴心的私人助理，给出一个极简的建议（20字以内）。`,
      config: {
        systemInstruction: "你是一个清新、治愈、温柔的日程小助手，语气像宫崎骏电影里的角色。"
      }
    });
    return response.text || "保持专注，也要记得给心灵留白 ✨";
  } catch (error) {
    return "接下来30分钟有空档，喝杯温水休息一下吧？☕";
  }
}

export async function generateJournalImage(tasks: Task[], mood: string | null): Promise<string | null> {
  try {
    const completedTasks = tasks.filter(t => t.completed).map(t => t.title).join(', ');
    const prompt = `A hand-drawn, aesthetic watercolor illustration of a daily journal summary. 
    Theme: Morning and Evening Planner. 
    Mood: ${mood || 'peaceful'}. 
    Achievements today: ${completedTasks || 'started the journey'}. 
    Style: Soft colors, Studio Ghibli inspired, high quality, artistic sketch, cozy atmosphere.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
}
