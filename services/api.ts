
import { Task } from "../types";

// 改为使用相对路径，以便通过 vite.config.ts 中配置的 proxy 进行转发
// 这样可以避免硬编码 IP 地址导致的 NetworkError，并解决开发环境下的跨域问题
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
  const rawText = (await res.text()).trim(); 
  
  if (!res.ok) {
    console.error(`[API 错误] HTTP ${res.status}:`, rawText);
    return null;
  }

  // 1. 如果后端返回的是像 "200 OK" 这种纯字符串而非 JSON
  if (!contentType || !contentType.includes("application/json")) {
    if (rawText.toLowerCase() === "ok" || rawText.includes("200")) {
       return {} as T; 
    }
    return null;
  }

  // 2. 尝试解析 JSON
  try {
    const json: AjaxResult<T> = JSON.parse(rawText);
    if (json.code === 200 || json.code === 0) {
      return json.data;
    } else {
      console.warn(`[业务异常] 代码 ${json.code}:`, json.msg);
      return null;
    }
  } catch (e) {
    console.error("[JSON 解析失败] 无法将以下内容解析为 JSON 对象:", rawText);
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
      if (data) {
        // 成功获取后同步一份到本地缓存，作为降级兜底
        localStorage.setItem('zm_tasks_backup', JSON.stringify(data));
        return data;
      }
      return [];
    } catch (error) {
      console.error("[网络错误] 获取任务列表失败，尝试读取本地备份:", error);
      // 网络错误时从本地备份读取，确保应用可用性
      const backup = localStorage.getItem('zm_tasks_backup');
      return backup ? JSON.parse(backup) : [];
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
      const data = await handleResponse<any>(res);
      return data !== null;
    } catch (error) {
      console.error("[网络错误] 删除任务失败:", error);
      return false;
    }
  }
};
