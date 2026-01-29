
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

export const MOCK_TASKS: Task[] = [
  {
    id: '1',
    title: '早起冥想与深呼吸',
    startTime: '07:30',
    endTime: '08:00',
    category: Category.HEALTH,
    priority: Priority.HIGH,
    completed: true,
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: '2',
    title: '深度工作：编写核心逻辑',
    startTime: '09:00',
    endTime: '11:30',
    category: Category.WORK,
    priority: Priority.HIGH,
    completed: false,
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: '3',
    title: '阅读《如何高效阅读》',
    startTime: '14:00',
    endTime: '15:00',
    category: Category.STUDY,
    priority: Priority.MEDIUM,
    completed: false,
    date: new Date().toISOString().split('T')[0]
  }
];
