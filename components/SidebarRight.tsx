
import React, { useState, useEffect } from 'react';

interface SidebarRightProps {
  suggestion: string;
}

const SidebarRight: React.FC<SidebarRightProps> = ({ suggestion }) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [presetMinutes, setPresetMinutes] = useState(25);

  useEffect(() => {
    let interval: number;
    if (isActive) {
      interval = window.setInterval(() => {
        if (seconds > 0) setSeconds(seconds - 1);
        else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          setIsActive(false);
          new Audio('https://cdn.freesound.org/previews/242/242503_4414128-lq.mp3').play().catch(() => {});
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, minutes, seconds]);

  const adjustMinutes = (amount: number) => {
    if (isActive) return;
    const newMins = Math.max(1, Math.min(120, minutes + amount));
    setMinutes(newMins);
    setPresetMinutes(newMins);
    setSeconds(0);
  };

  return (
    <aside className="space-y-8 sticky top-8">
      {/* 智愈建议卡片 */}
      <section className="p-8 bg-gradient-to-br from-purple-50/80 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-900/10 border border-purple-100/50 dark:border-purple-800/20 rounded-[2.5rem] relative overflow-hidden transition-all hover:shadow-lg">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/40 blur-2xl rounded-full"></div>
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl shadow-sm">💡</div>
          <h3 className="font-bold text-purple-900 dark:text-purple-100 font-humanist">智愈建议</h3>
        </div>
        <p className="text-sm leading-relaxed text-purple-700/80 dark:text-purple-300/80 italic font-humanist relative z-10">
          “{suggestion || '在这一刻，请允许自己慢下来。'}”
        </p>
      </section>

      {/* 计时器卡片 */}
      <section className="p-10 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
        <h3 className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] mb-6">专注计时器</h3>
        
        <div className={`flex gap-2 mb-8 transition-opacity duration-300 ${isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {[15, 25, 45].map(m => (
            <button 
              key={m} 
              onClick={() => { setMinutes(m); setPresetMinutes(m); setSeconds(0); }}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${minutes === m ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' : 'text-slate-300 hover:text-slate-400'}`}
            >
              {m} MIN
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6 mb-12">
          {!isActive && (
            <button onClick={() => adjustMinutes(-5)} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-300 flex items-center justify-center font-bold hover:text-purple-400 transition-colors">－</button>
          )}
          
          <div className="text-5xl font-mono font-black text-slate-800 dark:text-slate-100 tracking-tighter tabular-nums">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          {!isActive && (
            <button onClick={() => adjustMinutes(5)} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-300 flex items-center justify-center font-bold hover:text-purple-400 transition-colors">＋</button>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`flex-1 py-5 rounded-2xl font-black text-xs transition-all ${isActive ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-xl shadow-purple-500/20 active:scale-95'}`}
          >
            {isActive ? '暂停' : '开启专注'}
          </button>
          <button 
            onClick={() => { setIsActive(false); setMinutes(presetMinutes); setSeconds(0); }}
            className="w-16 h-16 flex items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors"
          >🔄</button>
        </div>
      </section>
    </aside>
  );
};

export default SidebarRight;
