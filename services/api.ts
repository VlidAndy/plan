
import { Task } from "../types";

const API_BASE = "/api/tasks";

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
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[API 错误] HTTP ${res.status}:`, errorText);
    return null;
  }

  // 确保响应是 JSON 格式
  if (contentType && contentType.includes("application/json")) {
    const rawText = await res.text();
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
      console.error("[JSON 解析失败] 原始响应内容内容:", rawText);
      console.error(e);
      return null;
    }
  } else {
    const text = await res.text();
    console.warn("[意外响应] 期待 JSON 但收到非 JSON 内容:", text.substring(0, 200));
    return null;
  }
}

export const taskApi = {
  /**
   * 获取所有任务
   */
  async getAll(): Promise<Task[]> {
    try {
      const res = await fetch(API_BASE);
      const data = await handleResponse<Task[]>(res);
      return data || [];
    } catch (error) {
      console.error("[网络错误] 获取任务列表失败:", error);
      return [];
    }
  },

  /**
   * 根据日期获取任务
   */
  async getByDate(date: string): Promise<Task[]> {
    const tasks = await this.getAll();
    return tasks.filter(t => t.date === date);
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
      });
      
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const json: AjaxResult<any> = await res.json();
        return json.code === 200 || json.code === 0;
      }
      return res.ok;
    } catch (error) {
      console.error("[网络错误] 删除任务失败:", error);
      return false;
    }
  }
};
