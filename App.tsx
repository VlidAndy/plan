
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Category, Priority, AIProvider, AIConfig, ViewType, DailyLog, Mood } from './types';
import Timeline from './components/Timeline';
import ListView from './components/ListView';
import Header from './components/Header';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import { parseNLPTask, getSmartSuggestions, generateJournalImage, getMorningInspiration } from './services/ai';
import { taskApi } from './services/api';

const PROVIDER_DEFAULTS: Record<AIProvider, Partial<AIConfig>> = {
  [AIProvider.GEMINI]: { baseUrl: '', modelId: 'gemini-3-flash-preview' },
  [AIProvider.OPENAI]: { baseUrl: 'https://api.openai.com/v1', modelId: 'gpt-4o' },
  [AIProvider.DEEPSEEK]: { baseUrl: 'https://api.deepseek.com/v1', modelId: 'deepseek-chat' },
  [AIProvider.CUSTOM]: { baseUrl: '', modelId: '' },
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('day-timeline');
  const [isLoading, setIsLoading] = useState(false);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("正在为您同步云端数据... ✨");
  const [morningMsg, setMorningMsg] = useState("");
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isGeneratingJournal, setIsGeneratingJournal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Daily log state
  const [dailyLog, setDailyLog] = useState<DailyLog>({
    date: new Date().toISOString().split('T')[0],
    goal: '',
    mood: null,
    reflection: '',
    journalImageUrl: null
  });

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: AIProvider.GEMINI,
    baseUrl: '',
    apiKey: '',
    modelId: 'gemini-3-flash-preview'
  });

  const fetchTasks = async () => {
    setIsApiLoading(true);
    try {
      const data = await taskApi.getAll();
      setTasks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsApiLoading(false);
    }
  };

  useEffect(() => {
    const savedConfig = localStorage.getItem('zm_ai_config');
    const savedDarkMode = localStorage.getItem('zm_darkmode');
    const savedLog = localStorage.getItem(`zm_log_${selectedDate}`);
    
    if (savedConfig) setAiConfig(JSON.parse(savedConfig));
    const isDark = savedDarkMode === 'true';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
    
    if (savedLog) setDailyLog(JSON.parse(savedLog));
    else setDailyLog({ date: selectedDate, goal: '', mood: null, reflection: '', journalImageUrl: null });

    fetchTasks();
  }, [selectedDate]);

  useEffect(() => {
    localStorage.setItem('zm_ai_config', JSON.stringify(aiConfig));
  }, [aiConfig]);

  useEffect(() => {
    localStorage.setItem(`zm_log_${selectedDate}`, JSON.stringify(dailyLog));
  }, [dailyLog, selectedDate]);

  const filteredTasks = useMemo(() => tasks.filter(t => t.date === selectedDate), [tasks, selectedDate]);

  const now = new Date();
  const currentHour = now.getHours();
  const isMorning = currentHour >= 5 && currentHour < 11;
  const isEvening = currentHour >= 18 || currentHour < 5;

  useEffect(() => {
    const hasKey = (aiConfig.provider === AIProvider.GEMINI && process.env.API_KEY && process.env.API_KEY !== 'undefined') || aiConfig.apiKey;
    if (!hasKey) return;

    const loadAI = async () => {
      if (isMorning && !morningMsg) {
        const msg = await getMorningInspiration(aiConfig);
        setMorningMsg(msg);
      }
      if (filteredTasks.length > 0) {
        const msg = await getSmartSuggestions(filteredTasks, aiConfig);
        setSuggestion(msg);
      }
    };
    loadAI();
  }, [filteredTasks, aiConfig, isMorning]);

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    await taskApi.update(id, { completed: !task.completed });
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      const result = await parseNLPTask(input, aiConfig, selectedDate);
      const newTask = await taskApi.create({
        title: result.title || input,
        startTime: result.startTime?.substring(0, 5) || '09:00',
        endTime: result.endTime?.substring(0, 5) || '10:00',
        category: (result.category as Category) || Category.LIFE,
        priority: result.priority || Priority.MEDIUM,
        completed: false,
        date: result.date || selectedDate
      });
      if (newTask) {
        setTasks(prev => [...prev, newTask]);
        if (newTask.date !== selectedDate) setSelectedDate(newTask.date);
        setInput('');
      }
    } finally {
      setIsLoading(true); // Small delay feel
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  const renderPhaseHeader = () => {
    if (isMorning && selectedDate === new Date().toISOString().split('T')[0]) {
      return (
        <div className="bg-gradient-to-r from-orange-100/50 to-orange-200/50 dark:from-orange-900/10 dark:to-orange-800/20 p-8 rounded-[2.5rem] border border-orange-100/50 dark:border-orange-900/30 animate-in slide-in-from-top-4 duration-700 mb-8">
          <h2 className="text-xl font-humanist font-bold text-orange-900 dark:text-orange-100 mb-2">晨间规划 • 开启璀璨的一天 ☀️</h2>
          <p className="text-sm text-orange-700/60 dark:text-orange-300/60 italic mb-6">“{morningMsg || '清晨的露珠是昨夜星辰的留影，早安。'}”</p>
          <div className="flex gap-4">
             <input 
              type="text" 
              placeholder="今天的核心目标是..." 
              value={dailyLog.goal}
              onChange={(e) => setDailyLog({...dailyLog, goal: e.target.value})}
              className="flex-1 bg-white dark:bg-slate-800/50 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-orange-200 outline-none dark:text-white"
             />
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[#FBFCFF] dark:bg-[#1A1B26] pb-24">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col">
        <Header 
          selectedDate={selectedDate}
          onDateChange={(n) => {
            const d = new Date(selectedDate);
            d.setDate(d.getDate() + n);
            setSelectedDate(d.toISOString().split('T')[0]);
          }}
          onGoToday={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          currentView={currentView}
          onViewChange={setCurrentView}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onOpenSettings={() => setShowSettings(true)}
          aiConfig={aiConfig}
        />

        {renderPhaseHeader()}

        {currentView.startsWith('day') && (
          <div className="max-w-4xl mx-auto w-full mb-12 animate-in fade-in duration-500">
            <form onSubmit={handleQuickAdd} className="relative">
              <input 
                type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="明天早起晨跑，或者现在规划一下？✨"
                className="w-full bg-white dark:bg-slate-800 border-none shadow-2xl shadow-purple-500/5 rounded-full py-6 pl-10 pr-20 text-lg font-medium focus:ring-2 focus:ring-purple-400/20 transition-all outline-none dark:text-white"
              />
              <button type="submit" disabled={isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-br from-[#8A7CFE] to-[#FF9E6D] w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center">
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "✨"}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-3">
            <SidebarLeft tasks={filteredTasks} onToggleTask={toggleTask} onDeleteTask={setDeleteConfirmId} />
          </div>

          <main className="md:col-span-6 space-y-8">
            {currentView === 'day-timeline' ? (
              <Timeline tasks={filteredTasks} onToggleTask={toggleTask} onDeleteTask={setDeleteConfirmId} onAddTaskAt={(h) => setInput(`${String(h).padStart(2, '0')}:00 `)} />
            ) : <ListView tasks={filteredTasks} onToggleTask={toggleTask} onDeleteTask={setDeleteConfirmId} />}

            {isEvening && filteredTasks.some(t => t.completed) && selectedDate === new Date().toISOString().split('T')[0] && (
              <div className="p-10 bg-gradient-to-br from-indigo-600 to-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden group animate-in slide-in-from-bottom-8 duration-700">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl rounded-full translate-x-32 -translate-y-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h4 className="font-bold text-2xl text-white font-humanist">夜幕降临，复盘今日 🌙</h4>
                    <p className="text-sm text-indigo-200/70 mt-2 font-medium">整理今日思绪，将成就凝结成时光印记。</p>
                  </div>
                  <button onClick={() => setShowReviewModal(true)} className="bg-white text-indigo-900 px-10 py-5 rounded-[2rem] text-sm font-black shadow-xl hover:scale-105 transition-all">开启晚间复盘</button>
                </div>
              </div>
            )}
          </main>

          <div className="md:col-span-3">
            <SidebarRight suggestion={suggestion} />
          </div>
        </div>
      </div>

      {showReviewModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            {!dailyLog.journalImageUrl ? (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">✍️</div>
                  <h2 className="text-3xl font-black font-humanist dark:text-white">晚间复盘：今日心路</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-center gap-6">
                    {['😊', '😐', '😔'].map(m => (
                      <button 
                        key={m} 
                        onClick={() => setDailyLog({...dailyLog, mood: m as Mood})}
                        className={`text-3xl p-4 rounded-3xl transition-all ${dailyLog.mood === m ? 'bg-orange-100 scale-110' : 'bg-slate-50 dark:bg-slate-800 grayscale opacity-40'}`}
                      >{m}</button>
                    ))}
                  </div>
                  <textarea 
                    placeholder="今天最让你感到成就或感恩的事是？" 
                    value={dailyLog.reflection}
                    onChange={(e) => setDailyLog({...dailyLog, reflection: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-8 text-lg outline-none min-h-[180px] dark:text-white focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setShowReviewModal(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[1.8rem] font-black text-sm">稍后再说</button>
                  <button 
                    disabled={isGeneratingJournal}
                    onClick={async () => {
                      setIsGeneratingJournal(true);
                      const img = await generateJournalImage(filteredTasks, dailyLog.mood, "gemini-2.5-flash-image");
                      if (img) setDailyLog({...dailyLog, journalImageUrl: img});
                      setIsGeneratingJournal(false);
                    }} 
                    className="flex-1 py-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-[1.8rem] font-black text-sm flex items-center justify-center gap-2"
                  >
                    {isGeneratingJournal ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "🎨 生成手账海报"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <img src={dailyLog.journalImageUrl} alt="Daily Journal" className="w-full rounded-[2rem] shadow-2xl mb-8 border-8 border-white dark:border-slate-800" />
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl w-full mb-8 italic text-slate-500 text-center">
                  “{dailyLog.reflection || '在忙碌中寻得片刻宁静，也是一种修行。'}”
                </div>
                <button onClick={() => setShowReviewModal(false)} className="w-full py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-sm">珍藏时光</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 flex flex-col gap-8 animate-in zoom-in-95">
            <h2 className="text-2xl font-black font-humanist dark:text-white">AI 实验室配置</h2>
            <div className="space-y-6">
               <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                {Object.values(AIProvider).map(p => (
                  <button key={p} onClick={() => setAiConfig(prev => ({...prev, provider: p, ...PROVIDER_DEFAULTS[p]}))} className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${aiConfig.provider === p ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600' : 'text-slate-400'}`}>
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">模型 ID</label>
                  <input type="text" value={aiConfig.modelId} onChange={(e) => setAiConfig({...aiConfig, modelId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-4 px-6 text-sm outline-none dark:text-white" />
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.8rem] font-black text-sm">保存实验室配置</button>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 text-center animate-in scale-95">
             <div className="text-3xl mb-4">🗑️</div>
             <h3 className="text-xl font-bold mb-2 dark:text-white">确认删除？</h3>
             <p className="text-sm text-slate-400 mb-6">这一段时光将被从记忆中抹除。</p>
             <div className="flex gap-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold">取消</button>
                <button onClick={async () => {
                  if (deleteConfirmId) {
                    await taskApi.delete(deleteConfirmId);
                    setTasks(prev => prev.filter(t => t.id !== deleteConfirmId));
                    setDeleteConfirmId(null);
                  }
                }} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold">删除</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
