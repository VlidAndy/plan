
export enum Category {
  WORK = '工作',
  STUDY = '学习',
  HEALTH = '健康',
  LIFE = '生活'
}

export enum Priority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export enum Mood {
  HAPPY = '😊',
  NEUTRAL = '😐',
  SAD = '😔'
}

export enum AIProvider {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  DEEPSEEK = 'deepseek',
  CUSTOM = 'custom'
}

export type ViewType = 'day-timeline' | 'day-list' | 'week' | 'month' | 'year';

export interface AIConfig {
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  modelId: string;
}

export interface Task {
  id: string;
  title: string;
  startTime: string; 
  endTime: string;   
  category: Category;
  priority: Priority;
  completed: boolean;
  review?: string;
  date: string; 
}

export interface DailyLog {
  date: string;
  goal: string;
  mood: Mood | null;
  reflection: string;
  journalImageUrl: string | null;
}

export interface NLPResult {
  title: string;
  date?: string; 
  startTime?: string;
  endTime?: string;
  category?: Category;
  priority?: Priority;
}
