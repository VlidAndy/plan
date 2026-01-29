
import React, { useMemo, useEffect, useState } from 'react';
import { Task, Category, Priority } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface TimelineProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTaskAt: (hour: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ tasks, onToggleTask, onDeleteTask, onAddTaskAt }) => {
  const hours = Array.from({ length: 19 }, (_, i) => i + 6); // 06:00 to 24:00
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentMinuteOffset = useMemo(() => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    if (h < 6) return -1;
    if (h >= 24) return 18 * 60 + 59;
    return (h - 6) * 60 + m;
  }, [currentTime]);

  const getTaskStyle = (task: Task) => {
    const [startH, startM] = task.startTime.split(':').map(Number);
    const [endH, endM] = task.endTime.split(':').map(Number);
    
    const startMinutes = (startH - 6) * 60 + startM;
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    
    return {
      top: `${(startMinutes / 60) * 80 + 16}px`, // 80px per hour, +16 for padding
      height: `${Math.max(40, (duration / 60) * 80)}px`,
      minHeight: '40px'
    };
  };

  const renderStars = (priority: Priority) => {
    return (
      <div className="flex gap-0.5 text-[10px] text-amber-400 mt-1">
        {Array.from({ length: priority }).map((_, i) => (
          <span key={i}>★</span>
        ))}
      </div>
    );
  };

  return (
    <div className="relative flex-1 bg-white dark:bg-slate-800/50 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col border border-slate-100 dark:border-slate-700">
      <div className="p-8 border-b border-slate-50 dark:border-slate-700/50 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm sticky top-0 z-30">
        <div>
          <h2 className="text-2xl font-humanist font-bold text-slate-800 dark:text-slate-100">今日时光流</h2>
          <p className="text-xs text-slate-400 mt-1">记录每一个闪闪发光的瞬间</p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
          06:00 — 24:00
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative p-4 pl-16">
        {/* Time Indicators */}
        {hours.map(hour => (
          <div key={hour} className="relative h-20 group">
            <div className="absolute -left-12 top-0 text-xs font-medium text-slate-300 dark:text-slate-600 w-10 text-right font-mono">
              {String(hour).padStart(2, '0')}:00
            </div>
            <div className="absolute left-0 right-0 top-0 border-t border-slate-50 dark:border-slate-800 group-hover:border-orange-200 dark:group-hover:border-orange-900 transition-colors cursor-pointer" 
                 onClick={() => onAddTaskAt(hour)}>
            </div>
          </div>
        ))}

        {/* Current Time Line */}
        {currentMinuteOffset >= 0 && (
          <div 
            className="absolute left-0 right-0 z-20 flex items-center pointer-events-none transition-all duration-700"
            style={{ top: `${(currentMinuteOffset / 60) * 80 + 16}px` }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 pulse-line ml-[-5px]"></div>
            <div className="flex-1 h-[1.5px] bg-gradient-to-r from-orange-500/50 to-transparent ml-2"></div>
          </div>
        )}

        {/* Task Cards */}
        {tasks.map(task => {
          const isOngoing = !task.completed && 
            task.startTime <= `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}` && 
            task.endTime >= `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;

          return (
            <div
              key={task.id}
              className={`absolute left-16 right-4 z-10 rounded-2xl p-4 border shadow-sm transition-all duration-300 cursor-pointer group flex flex-col justify-between overflow-hidden
                ${task.completed ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/50 grayscale opacity-60' : 
                  'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 hover:shadow-xl hover:scale-[1.01]'}
                ${isOngoing ? 'breath-border shadow-purple-500/10' : ''}
              `}
              style={getTaskStyle(task)}
              onClick={() => onToggleTask(task.id)}
            >
              {/* Category accent bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${CATEGORY_COLORS[task.category]}`}></div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold text-white ${CATEGORY_COLORS[task.category]}`}>
                      {task.category}
                    </span>
                    {task.completed && <span className="text-xs text-green-500 font-bold">✓ 已完成</span>}
                  </div>
                  <h3 className={`font-bold text-sm truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {task.title}
                  </h3>
                  {renderStars(task.priority)}
                </div>
                
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {task.startTime} - {task.endTime}
                  </p>
                </div>
              </div>
              
              <div className="opacity-40 group-hover:opacity-100 flex gap-1 transition-opacity self-end mt-2">
                {!task.completed && (
                  <>
                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-xs transition-colors" title="编辑" onClick={(e) => e.stopPropagation()}>✏️</button>
                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-xs transition-colors" title="延后" onClick={(e) => e.stopPropagation()}>⏱️</button>
                  </>
                )}
                <button 
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-xs transition-colors text-red-400 z-50" 
                  title="删除" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    onDeleteTask(task.id); 
                  }}
                >
                  🗑️
                </button>
              </div>

              {/* Success Particle Decoration for completed */}
              {task.completed && (
                <div className="absolute -right-4 -bottom-4 opacity-10 text-6xl rotate-12 select-none">✨</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Timeline;
