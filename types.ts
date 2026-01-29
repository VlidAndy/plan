
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

export interface Task {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  category: Category;
  priority: Priority;
  completed: boolean;
  review?: string;
  date: string; // YYYY-MM-DD
}

export interface UserStats {
  completionRate: number;
  focusTimeMinutes: number;
  mood?: Mood;
}

export interface NLPResult {
  title: string;
  startTime?: string;
  endTime?: string;
  category?: Category;
  priority?: Priority;
}
