
import React from 'react';
import { Task, Category } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface SidebarLeftProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ tasks, onToggleTask }) => {
  const morningTasks = tasks.filter(t => t.startTime < '12:00');
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <aside className="space-y-8">
      {/* 晨间规划卡片 */}
      <section className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-50/80 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border border-orange-100/50 dark:border-orange-900/20 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-orange-900 dark:text-orange-100 font-humanist flex items-center gap-2">
            <span>🌅</span> 晨间规划
          </h3>
          <span className="text-[10px] px-3 py-1 bg-white/80 dark:bg-black/20 rounded-full text-orange-600 dark:text-orange-400 font-bold">MORNING</span>
        </div>
        <div className="space-y-4">
          {morningTasks.length > 0 ? morningTasks.slice(0, 4).map(t => (
            <div key={t.id} onClick={() => onToggleTask(t.id)} className="flex items-center gap-3 text-sm cursor-pointer group">
              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${t.completed ? 'bg-orange-400 border-orange-400 text-white' : 'border-orange-200 bg-white dark:bg-slate-800'}`}>
                {t.completed && <span className="text-[10px]">✓</span>}
              </div>
              <span className={`truncate ${t.completed ? 'line-through opacity-40' : 'font-medium text-slate-700 dark:text-slate-300'}`}>{t.title}</span>
            </div>
          )) : (
            <p className="text-xs text-orange-600/40 italic py-4">清晨是留白的艺术...</p>
          )}
        </div>
      </section>

      {/* 分类看板 */}
      <section className="px-2">
        <h3 className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] mb-4">分类统计</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(Category).map(cat => {
            const count = tasks.filter(t => t.category === cat && !t.completed).length;
            return (
              <div key={cat} className="p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className={`w-8 h-8 rounded-xl ${CATEGORY_COLORS[cat]} bg-opacity-10 mb-3 flex items-center justify-center`}>
                  <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat]}`}></div>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-slate-500">{cat}</span>
                  <span className="text-sm font-mono font-black">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 成就进度 */}
      <section className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
        <h3 className="text-[10px] font-black mb-6 text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">今日成就</h3>
        <div className="flex justify-between items-end mb-4">
          <div className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{rate}%</div>
          <div className="text-right text-[10px] font-bold text-slate-400 uppercase">
            {completedCount}/{totalCount} <span className="text-green-400">DONE</span>
          </div>
        </div>
        <div className="h-2 w-full bg-slate-50 dark:bg-slate-900 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-400 to-orange-400 transition-all duration-1000" style={{ width: `${rate}%` }}></div>
        </div>
      </section>
    </aside>
  );
};

export default SidebarLeft;
