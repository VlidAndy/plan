
import React from 'react';
import { Task, Category } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface SidebarLeftProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

const SidebarLeft: React.FC<SidebarLeftProps> = ({ tasks, onToggleTask, onDeleteTask }) => {
  const currentHour = new Date().getHours();
  
  // 根据当前时间决定展示哪个时段的任务
  let timeTitle = "晨间规划";
  let timeIcon = "🌅";
  let timeTag = "MORNING";
  let displayTasks = tasks.filter(t => t.startTime < '12:00');

  if (currentHour >= 12 && currentHour < 18) {
    timeTitle = "午后进展";
    timeIcon = "☀️";
    timeTag = "AFTERNOON";
    displayTasks = tasks.filter(t => t.startTime >= '12:00' && t.startTime < '18:00');
  } else if (currentHour >= 18) {
    timeTitle = "晚间复盘";
    timeIcon = "🌙";
    timeTag = "EVENING";
    displayTasks = tasks.filter(t => t.startTime >= '18:00');
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <aside className="space-y-8">
      {/* 动态时段规划卡片 */}
      <section className="p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-50/80 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border border-orange-100/50 dark:border-orange-900/20 relative overflow-hidden transition-all duration-500">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-orange-900 dark:text-orange-100 font-humanist flex items-center gap-2">
            <span>{timeIcon}</span> {timeTitle}
          </h3>
          <span className="text-[10px] px-3 py-1 bg-white/80 dark:bg-black/20 rounded-full text-orange-600 dark:text-orange-400 font-bold tracking-wider">{timeTag}</span>
        </div>
        <div className="space-y-4">
          {displayTasks.length > 0 ? displayTasks.slice(0, 4).map(t => (
            <div key={t.id} className="flex items-center justify-between group">
              <div onClick={() => onToggleTask(t.id)} className="flex items-center gap-3 text-sm cursor-pointer flex-1 min-w-0">
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${t.completed ? 'bg-orange-400 border-orange-400 text-white' : 'border-orange-200 bg-white dark:bg-slate-800'}`}>
                  {t.completed && <span className="text-[10px]">✓</span>}
                </div>
                <span className={`truncate ${t.completed ? 'line-through opacity-40' : 'font-medium text-slate-700 dark:text-slate-300'}`}>{t.title}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteTask(t.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-orange-200/20 rounded-md text-[10px] text-orange-600 transition-all ml-2"
              >
                🗑️
              </button>
            </div>
          )) : (
            <p className="text-xs text-orange-600/40 italic py-4">当前时段暂无安排...</p>
          )}
        </div>
      </section>

      {/* 分类看板 - 完美还原截图样式 */}
      <section className="px-1">
        <h3 className="text-[11px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] mb-5 ml-1">分类统计</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.values(Category).map(cat => {
            const count = tasks.filter(t => t.category === cat).length;
            
            return (
              <div key={cat} className="p-6 bg-white dark:bg-slate-800/80 rounded-[2rem] border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-2xl ${CATEGORY_COLORS[cat]} bg-opacity-10 mb-6 flex items-center justify-center`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${CATEGORY_COLORS[cat]} shadow-sm`}></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{cat}</span>
                  <span className="text-lg font-mono font-black text-slate-800 dark:text-slate-100">{count}</span>
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
