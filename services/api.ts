
import { Task } from "../types";

/**
 * 后端 API 基础路径
 * 注意：如果您通过隧道服务访问前端，请确保此处的 URL 指向正确的后端服务地址。
 * 如果前端和后端共享同一个隧道，可以使用相对路径，但必须确保 Vite 代理配置正确。
 */
const API_BASE_URL = "https://vli-task-manager-api-123.loca.lt";
const API_BASE = `${API_BASE_URL}/api/tasks`;

/**
 * 通用请求头，包含 bypass-tunnel-reminder 以绕过 localtunnel 的提醒页面
 */
const COMMON_HEADERS = {
  'bypass-tunnel-reminder': 'true',
  'Accept': 'application/json',
};

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
    // 如果返回的是 HTML（常见于请求到了前端静态服务器），记录警告
    if (rawText.startsWith('<!DOCTYPE html>')) {
      console.warn("[API 警告] 收到 HTML 响应而非 JSON。请检查后端 URL 是否正确。");
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
      const res = await fetch(API_BASE, {
        headers: COMMON_HEADERS,
        mode: 'cors'
      });
      const data = await handleResponse<Task[]>(res);
      if (data) {
        localStorage.setItem('zm_tasks_backup', JSON.stringify(data));
        return data;
      }
      return [];
    } catch (error) {
      console.error("[网络错误] 获取任务列表失败，尝试读取本地备份:", error);
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
        headers: { 
          'Content-Type': 'application/json',
          ...COMMON_HEADERS 
        },
        body: JSON.stringify(task),
        mode: 'cors'
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
        headers: { 
          'Content-Type': 'application/json',
          ...COMMON_HEADERS
        },
        body: JSON.stringify(updates),
        mode: 'cors'
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
        headers: COMMON_HEADERS,
        mode: 'cors'
      });
      const data = await handleResponse<any>(res);
      return data !== null;
    } catch (error) {
      console.error("[网络错误] 删除任务失败:", error);
      return false;
    }
  }
};
