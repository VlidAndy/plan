
import React from 'react';
import { AIConfig, ViewType } from '../types';

interface HeaderProps {
  selectedDate: string;
  onDateChange: (days: number) => void;
  onGoToday: () => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
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
  
  const viewTabs: { id: ViewType; label: string }[] = [
    { id: 'day-timeline', label: '日' },
    { id: 'week', label: '周' },
    { id: 'month', label: '月' },
    { id: 'year', label: '年' }
  ];

  return (
    <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
           <button 
            onClick={() => onDateChange(-1)}
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-all text-slate-400"
          >←</button>
          <button 
            onClick={() => onDateChange(1)}
            className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-all text-slate-400"
          >→</button>
        </div>
        
        <div className="flex items-center gap-4 ml-2">
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
      </div>
      
      <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl p-2 rounded-[1.8rem] shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl">
          {viewTabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => onViewChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${currentView.includes(tab.id.split('-')[0]) ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-300' : 'text-slate-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
        
        {!isToday && (
          <button onClick={onGoToday} className="px-4 py-2 rounded-xl text-orange-500 text-xs font-bold hover:bg-orange-50 transition-colors">今天</button>
        )}

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
