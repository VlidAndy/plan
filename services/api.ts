
import { Task } from "../types";

// 开发环境下直连后端测试，生产环境通常使用相对路径 "/api/tasks"
const API_BASE = "http://192.168.1.10:8080/api/tasks";

/**
 * 通用响应结构适配 AjaxResult
 */
interface AjaxResult<T> {
  code: number;
  msg: string;
  data: T;
}

/**
 * 助手函数：处理 fetch 响应并进行健壮的 JSON 解析
 */
async function handleResponse<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get("content-type");
  const rawText = (await res.text()).trim(); // 获取原始文本并去空格
  
  if (!res.ok) {
    console.error(`[API 错误] HTTP ${res.status}:`, rawText);
    return null;
  }

  // 1. 如果后端返回的是像 "200 OK" 这种纯字符串而非 JSON
  if (!contentType || !contentType.includes("application/json")) {
    console.warn(`[意外响应] 期待 JSON 但收到: "${rawText}" (Content-Type: ${contentType})`);
    // 如果返回内容正好是 "200 OK"，则认为操作成功但没有返回数据
    if (rawText.toLowerCase() === "ok" || rawText.includes("200")) {
       return {} as T; 
    }
    return null;
  }

  // 2. 尝试解析 JSON
  try {
    const json: AjaxResult<T> = JSON.parse(rawText);
    // 适配 Java 后端 AjaxResult 约定 (200 为成功)
    if (json.code === 200 || json.code === 0) {
      return json.data;
    } else {
      console.warn(`[业务异常] 代码 ${json.code}:`, json.msg);
      return null;
    }
  } catch (e) {
    console.error("[JSON 解析失败] 无法将以下内容解析为 JSON 对象:", rawText);
    console.error("解析错误详情:", e);
    return null;
  }
}

export const taskApi = {
  /**
   * 获取所有任务
   */
  async getAll(): Promise<Task[]> {
    try {
      const res = await fetch(API_BASE, {
        mode: 'cors', // 显式开启跨域模式
      });
      const data = await handleResponse<Task[]>(res);
      return data || [];
    } catch (error) {
      console.error("[网络错误] 获取任务列表失败:", error);
      return [];
    }
  },

  /**
   * 创建任务
   */
  async create(task: Omit<Task, 'id'>): Promise<Task | null> {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
        mode: 'cors',
      });
      return await handleResponse<Task>(res);
    } catch (error) {
      console.error("[网络错误] 创建任务失败:", error);
      return null;
    }
  },

  /**
   * 更新任务
   */
  async update(id: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        mode: 'cors',
      });
      return await handleResponse<Task>(res);
    } catch (error) {
      console.error("[网络错误] 更新任务失败:", error);
      return null;
    }
  },

  /**
   * 删除任务
   */
  async delete(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        mode: 'cors',
      });
      // 删除操作通常只要 HTTP 200 或 AjaxResult.code 200 即算成功
      const data = await handleResponse<any>(res);
      return data !== null;
    } catch (error) {
      console.error("[网络错误] 删除任务失败:", error);
      return false;
    }
  }
};
