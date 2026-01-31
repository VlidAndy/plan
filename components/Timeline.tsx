
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Task, Category, Priority } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface TimelineProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddTaskAt: (hour: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ tasks, onToggleTask, onDeleteTask, onAddTaskAt }) => {
  // 坐标系常量
  const START_HOUR = 6;
  const END_HOUR = 24;
  const HOUR_HEIGHT = 80; // 每个小时的高度
  
  // 生成 06 到 23 的小时数组，共 18 个格子
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR); 
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const h = currentTime.getHours();
      if ((h >= START_HOUR && h <= 23) || h === 0) {
        const displayH = h === 0 ? 24 : h;
        const scrollTo = (displayH - START_HOUR) * HOUR_HEIGHT - 200; 
        scrollContainerRef.current.scrollTo({ top: scrollTo, behavior: 'smooth' });
      }
    }
  }, []);

  // 核心坐标映射函数：将时间转换为相对于顶部的像素值
  const getPixelsFromTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    // 处理凌晨 00:xx
    let displayH = h;
    if (h < START_HOUR && h >= 0) {
        // 如果是凌晨且在 0-5 点，映射到 24 点之后
        displayH = h + 24;
    }
    return (displayH - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
  };

  // 当前时间的 Top 值
  const nowTop = useMemo(() => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    let displayH = h;
    
    // 如果是凌晨 (00:00 - 05:59)
    if (h < START_HOUR) {
        displayH = h + 24;
    }
    
    // 限制在轴线显示范围内 (6:00 - 24:00)
    // 如果超过 24:00 则固定在底部 (1440px)
    const top = (displayH - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
    return Math.min(Math.max(-100, top), (END_HOUR - START_HOUR) * HOUR_HEIGHT);
  }, [currentTime]);

  const isNowVisible = nowTop >= 0 && nowTop <= (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  const getTaskStyle = (task: Task) => {
    const startY = getPixelsFromTime(task.startTime);
    const endY = getPixelsFromTime(task.endTime);
    const height = Math.max(45, endY - startY);
    
    return {
      top: `${startY}px`,
      height: `${height}px`,
      minHeight: '45px'
    };
  };

  const renderStars = (priority: Priority) => (
    <div className="flex gap-0.5 text-[10px] text-amber-400 mt-0.5">
      {Array.from({ length: priority }).map((_, i) => <span key={i}>★</span>)}
    </div>
  );

  return (
    <div className="relative flex-1 bg-white dark:bg-slate-800/50 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col border border-slate-100 dark:border-slate-700">
      {/* 头部固定信息 */}
      <div className="p-8 border-b border-slate-50 dark:border-slate-700/50 flex justify-between items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-md sticky top-0 z-40">
        <div>
          <h2 className="text-2xl font-humanist font-bold text-slate-800 dark:text-slate-100">今日时光流</h2>
          <p className="text-xs text-slate-400 mt-1">记录每一个闪闪发光的瞬间</p>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800">
          06:00 — 24:00
        </div>
      </div>

      {/* 滚动容器 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar relative">
        {/* 动态计算总高度：18小时 * 80px = 1440px */}
        <div className="relative ml-16 mr-4" style={{ height: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px`, marginTop: '20px', marginBottom: '40px' }}> 
          
          {/* 渲染小时刻度线 (6:00 - 23:00) */}
          {hours.map(hour => (
            <div key={hour} className="relative group" style={{ height: `${HOUR_HEIGHT}px` }}>
              <div className="absolute -left-12 top-0 text-[10px] font-bold text-slate-300 dark:text-slate-600 w-10 text-right font-mono">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div 
                className="absolute left-0 right-0 top-0 border-t border-slate-100 dark:border-slate-800 group-hover:border-orange-200 dark:group-hover:border-orange-900/30 transition-colors cursor-pointer z-20" 
                onClick={() => onAddTaskAt(hour)}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-3 left-2 text-[10px] text-orange-400 font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-lg shadow-sm border border-orange-50 dark:border-orange-900/20">
                  + 计划
                </div>
              </div>
            </div>
          ))}

          {/* 最后的 24:00 刻度线 */}
          <div className="absolute left-0 right-0 border-t border-slate-100 dark:border-slate-800" style={{ top: `${(END_HOUR - START_HOUR) * HOUR_HEIGHT}px` }}>
            <div className="absolute -left-12 -top-2 text-[10px] font-bold text-slate-300 dark:text-slate-600 w-10 text-right font-mono">
              24:00
            </div>
          </div>

          {/* 实时时间指示器 (Now) */}
          {isNowVisible && (
            <div 
              className="absolute left-0 right-0 z-50 flex items-center pointer-events-none transition-all duration-500"
              style={{ top: `${nowTop}px` }}
            >
              <div className="absolute -left-20 flex items-center">
                <div className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg shadow-orange-500/40 min-w-[38px] text-center">
                  {String(currentTime.getHours()).padStart(2, '0')}:{String(currentTime.getMinutes()).padStart(2, '0')}
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 ml-1.5 pulse-line border-2 border-white dark:border-slate-800"></div>
              </div>
              <div className="flex-1 h-[2px] bg-gradient-to-r from-orange-500 via-orange-500/40 to-transparent opacity-80"></div>
            </div>
          )}

          {/* 任务卡片 */}
          {tasks.map(task => {
            const [nowH, nowM] = [currentTime.getHours(), currentTime.getMinutes()];
            const currentTimeStr = `${String(nowH).padStart(2, '0')}:${String(nowM).padStart(2, '0')}`;
            const isOngoing = !task.completed && task.startTime <= currentTimeStr && task.endTime >= currentTimeStr;

            return (
              <div
                key={task.id}
                className={`absolute left-4 right-0 z-10 rounded-2xl p-4 border shadow-sm transition-all duration-300 cursor-pointer group flex flex-col justify-start overflow-hidden
                  ${task.completed ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/50 grayscale opacity-60' : 
                    'bg-white dark:bg-slate-700 border-slate-100 dark:border-slate-600 hover:shadow-xl hover:scale-[1.005] hover:z-30'}
                  ${isOngoing ? 'breath-border' : ''}
                `}
                style={getTaskStyle(task)}
                onClick={() => onToggleTask(task.id)}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${CATEGORY_COLORS[task.category]}`}></div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold text-white ${CATEGORY_COLORS[task.category]}`}>
                        {task.category}
                      </span>
                    </div>
                    <h3 className={`font-bold text-sm truncate pr-6 ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {renderStars(task.priority)}
                      <span className="text-[10px] font-mono text-slate-400 opacity-60">{task.startTime} — {task.endTime}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                  <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl text-xs text-red-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm" onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
