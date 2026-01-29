
import React, { useMemo } from 'react';
import { Task, Category } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface ListViewProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const ListView: React.FC<ListViewProps> = ({ tasks, onToggleTask, onDeleteTask }) => {
  const groups = useMemo(() => {
    const morning = tasks.filter(t => t.startTime < '12:00').sort((a, b) => a.startTime.localeCompare(b.startTime));
    const afternoon = tasks.filter(t => t.startTime >= '12:00' && t.startTime < '18:00').sort((a, b) => a.startTime.localeCompare(b.startTime));
    const evening = tasks.filter(t => t.startTime >= '18:00').sort((a, b) => a.startTime.localeCompare(b.startTime));
    return [
      { name: '早晨', icon: '🌅', items: morning },
      { name: '午后', icon: '☀️', items: afternoon },
      { name: '傍晚', icon: '🌙', items: evening },
    ];
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
        <div className="text-6xl mb-4">🍃</div>
        <h3 className="text-xl font-bold text-slate-400 font-humanist">今日清单空空如也</h3>
        <p className="text-sm text-slate-300 mt-2">点击上方输入框，开启有规划的一天吧</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-8 overflow-y-auto no-scrollbar pb-10">
      {groups.map((group, gIdx) => group.items.length > 0 && (
        <section key={gIdx} className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <span className="text-xl">{group.icon}</span>
            <h3 className="font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] text-xs">
              {group.name} · {group.items.length}项
            </h3>
          </div>
          <div className="grid gap-3">
            {group.items.map(task => (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className={`group relative flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer ${task.completed ? 'opacity-50 grayscale' : ''}`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-sm ${CATEGORY_COLORS[task.category]}`}>
                    {task.completed ? '✓' : task.startTime.split(':')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-slate-700 dark:text-slate-200 truncate ${task.completed ? 'line-through' : ''}`}>
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-mono">{task.startTime} - {task.endTime}</span>
                      <span className="text-[10px] text-slate-400">/</span>
                      <span className="text-[10px] text-slate-400">{task.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex gap-1">
                      {Array.from({ length: task.priority }).map((_, i) => (
                        <span key={i} className="text-[10px] text-amber-400">★</span>
                      ))}
                   </div>
                   <button 
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      onDeleteTask(task.id); 
                    }}
                    className="opacity-40 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl text-red-400 transition-all z-20"
                    title="删除任务"
                   >
                     🗑️
                   </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ListView;
