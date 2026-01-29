
import React from 'react';
import { AIConfig } from '../types';

interface HeaderProps {
  selectedDate: string;
  onDateChange: (days: number) => void;
  onGoToday: () => void;
  currentView: 'timeline' | 'list';
  onViewChange: (view: 'timeline' | 'list') => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  aiConfig: AIConfig;
}

const Header: React.FC<HeaderProps> = ({ 
  selectedDate, onDateChange, onGoToday, currentView, 
  onViewChange, darkMode, onToggleDarkMode, onOpenSettings, aiConfig 
}) => {
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onDateChange(-1)}
          className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-all text-slate-400"
        >←</button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-orange-400 to-purple-500 flex items-center justify-center text-3xl shadow-xl shadow-orange-500/20 transform rotate-3">
            {isToday ? (new Date().getHours() < 12 ? '🌤️' : '🌙') : '📅'}
          </div>
          <div>
            <h1 className="text-2xl font-humanist font-bold text-slate-800 dark:text-slate-100">
              {isToday ? '今天' : selectedDate}
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-tight">
              {aiConfig.provider.toUpperCase()} 引擎驱动中
            </p>
          </div>
        </div>
        <button 
          onClick={() => onDateChange(1)}
          className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-all text-slate-400"
        >→</button>
      </div>
      
      <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl p-2 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
        {!isToday && (
          <button onClick={onGoToday} className="px-4 py-2 rounded-xl text-orange-500 text-xs font-bold hover:bg-orange-50 transition-colors">今日</button>
        )}
        <button 
          onClick={() => onViewChange('timeline')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${currentView === 'timeline' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-300' : 'text-slate-400'}`}
        >时间轴</button>
        <button 
          onClick={() => onViewChange('list')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${currentView === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-300' : 'text-slate-400'}`}
        >清单</button>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
        <button onClick={onToggleDarkMode} className="w-10 h-10 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
          {darkMode ? '🌙' : '☀️'}
        </button>
        <button onClick={onOpenSettings} className="w-10 h-10 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
          ⚙️
        </button>
      </div>
    </header>
  );
};

export default Header;
