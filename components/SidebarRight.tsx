
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
          alert("专注时光结束 ✨");
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

  const setPreset = (mins: number) => {
    if (isActive) return;
    setMinutes(mins);
    setPresetMinutes(mins);
    setSeconds(0);
  };

  return (
    <aside className="space-y-8">
      {/* 智愈建议卡片 */}
      <section className="p-8 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100/50 dark:border-purple-800/20 rounded-[2.5rem] relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl shadow-sm">💡</div>
          <h3 className="font-bold text-purple-900 dark:text-purple-100 font-humanist">智愈建议</h3>
        </div>
        <p className="text-sm leading-relaxed text-purple-700/80 dark:text-purple-300/80 italic font-humanist">
          “{suggestion}”
        </p>
      </section>

      {/* 计时器卡片 */}
      <section className="p-10 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center">
        <h3 className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] mb-4">专注计时器</h3>
        
        {/* Preset Selectors */}
        <div className={`flex gap-2 mb-6 transition-opacity duration-300 ${isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {[15, 25, 45, 60].map(m => (
            <button 
              key={m} 
              onClick={() => setPreset(m)}
              className={`px-3 py-1 rounded-full text-[10px] font-black transition-all ${minutes === m ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300' : 'text-slate-300 hover:text-slate-400'}`}
            >
              {m}M
            </button>
          ))}
        </div>

        {/* Timer Display with Adjusters */}
        <div className="flex items-center gap-4 mb-10">
          {!isActive && (
            <button 
              onClick={() => adjustMinutes(-5)}
              className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-300 flex items-center justify-center font-bold hover:text-purple-400 transition-colors"
            >－</button>
          )}
          
          <div className="text-5xl font-mono font-black text-slate-800 dark:text-slate-100 tracking-tighter">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>

          {!isActive && (
            <button 
              onClick={() => adjustMinutes(5)}
              className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-300 flex items-center justify-center font-bold hover:text-purple-400 transition-colors"
            >＋</button>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${isActive ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' : 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'}`}
          >
            {isActive ? '暂停' : '专注'}
          </button>
          <button 
            onClick={() => { setIsActive(false); setMinutes(presetMinutes); setSeconds(0); }}
            className="w-14 h-14 flex items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-2xl text-slate-400 hover:text-slate-600 transition-colors"
          >🔄</button>
        </div>
      </section>
    </aside>
  );
};

export default SidebarRight;
