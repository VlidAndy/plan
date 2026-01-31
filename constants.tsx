
import React from 'react';
import { Category, Priority, Task } from './types';

export const COLORS = {
  orange: '#FF9E6D',
  purple: '#8A7CFE',
  bgLight: '#FBFCFF',
  bgDark: '#1A1B26',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.WORK]: 'bg-blue-400',
  [Category.STUDY]: 'bg-emerald-400',
  [Category.HEALTH]: 'bg-orange-400',
  [Category.LIFE]: 'bg-amber-400',
};

// 生产环境下初始数据应为空
export const MOCK_TASKS: Task[] = [];
