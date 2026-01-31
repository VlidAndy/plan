
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Category, Priority, AIProvider, AIConfig, ViewType } from './types';
import { MOCK_TASKS, CATEGORY_COLORS } from './constants';
import Timeline from './components/Timeline';
import ListView from './components/ListView';
import Header from './components/Header';
import SidebarLeft from './components/SidebarLeft';
import SidebarRight from './components/SidebarRight';
import { parseNLPTask, getSmartSuggestions, generateJournalImage } from './services/ai';

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
  const [suggestion, setSuggestion] = useState("欢迎回来，开启有规划的一天吧 🌱");
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [journalImage, setJournalImage] = useState<string | null>(null);
  const [isGeneratingJournal, setIsGeneratingJournal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: AIProvider.GEMINI,
    baseUrl: '',
    apiKey: '',
    modelId: 'gemini-3-flash-preview'
  });

  useEffect(() => {
    const savedTasks = localStorage.getItem('zm_tasks');
    const savedConfig = localStorage.getItem('zm_ai_config');
    const savedDarkMode = localStorage.getItem('zm_darkmode');
    if (savedTasks) setTasks(JSON.parse(savedTasks)); else setTasks(MOCK_TASKS);
    if (savedConfig) setAiConfig(JSON.parse(savedConfig));
    const isDark = savedDarkMode === 'true';
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('zm_tasks', JSON.stringify(tasks));
    localStorage.setItem('zm_ai_config', JSON.stringify(aiConfig));
  }, [tasks, aiConfig]);

  useEffect(() => {
    localStorage.setItem('zm_darkmode', String(darkMode));
    if (darkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const filteredTasks = useMemo(() => tasks.filter(t => t.date === selectedDate), [tasks, selectedDate]);

  useEffect(() => {
    const hasKey = (aiConfig.provider === AIProvider.GEMINI && process.env.API_KEY && process.env.API_KEY !== 'undefined') || aiConfig.apiKey;
    if (!hasKey) {
      setSuggestion("配置 AI 引擎后，我将为您提供每日贴心建议 ✨");
      return;
    }
    const loadSuggestion = async () => {
      if (filteredTasks.length > 0) {
        const msg = await getSmartSuggestions(filteredTasks, aiConfig);
        setSuggestion(msg);
      } else {
        setSuggestion("这一天还没有安排，要不先定个小目标？🌱");
      }
    };
    const timer = setTimeout(loadSuggestion, 1500);
    return () => clearTimeout(timer);
  }, [filteredTasks, aiConfig]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      setTasks(prev => prev.filter(t => t.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const now = new Date();
    const isToday = selectedDate === now.toISOString().split('T')[0];
    const defaultStartHour = isToday ? (now.getHours() + 1) % 24 : 9;
    const defaultStartTime = `${String(defaultStartHour).padStart(2, '0')}:00`;
    const defaultEndTime = `${String((defaultStartHour + 1) % 24).padStart(2, '0')}:00`;
    const hasKey = (aiConfig.provider === AIProvider.GEMINI && process.env.API_KEY && process.env.API_KEY !== 'undefined') || aiConfig.apiKey;

    if (!hasKey) {
      const newTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        title: input,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        category: Category.LIFE,
        priority: Priority.MEDIUM,
        completed: false,
        date: selectedDate
      };
      setTasks(prev => [...prev, newTask]);
      setInput('');
      return;
    }

    setIsLoading(true);
    const result = await parseNLPTask(input, aiConfig);
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: result.title || input,
      startTime: result.startTime || defaultStartTime,
      endTime: result.endTime || defaultEndTime,
      category: (result.category as Category) || Category.LIFE,
      priority: result.priority || Priority.MEDIUM,
      completed: false,
      date: selectedDate
    };
    setTasks(prev => [...prev, newTask]);
    setInput('');
    setIsLoading(false);
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isEvening = new Date().getHours() >= 18;

  // 渲染不同视角的函数
  const renderView = () => {
    switch (currentView) {
      case 'day-timeline':
        return <Timeline tasks={filteredTasks} onToggleTask={toggleTask} onDeleteTask={setDeleteConfirmId} onAddTaskAt={(h) => setInput(`${String(h).padStart(2, '0')}:00 `)} />;
      case 'day-list':
        return <ListView tasks={filteredTasks} onToggleTask={toggleTask} onDeleteTask={setDeleteConfirmId} />;
      case 'week':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-xl font-black font-humanist mb-4">时光周记 🌿</h3>
              <div className="grid grid-cols-7 gap-2 h-64">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-end overflow-hidden p-1">
                      <div className="w-full bg-gradient-to-t from-purple-400 to-orange-400 rounded-xl transition-all duration-1000" style={{ height: `${20 + Math.random() * 60}%` }}></div>
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 text-center uppercase">Day {i+1}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl italic text-sm text-purple-600 dark:text-purple-300">
                “本周你已经完成了 12 个目标，生命中的种子正在悄悄萌发...”
              </div>
            </div>
          </div>
        );
      case 'month':
        return (
          <div className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm animate-in zoom-in-95 duration-500">
             <h3 className="text-xl font-black font-humanist mb-8">岁月棋盘 ♟️</h3>
             <div className="grid grid-cols-7 gap-4">
                {[...Array(31)].map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-center group hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all cursor-pointer">
                    <span className="text-xs font-bold text-slate-300 dark:text-slate-700 group-hover:text-orange-500">{i+1}</span>
                    {Math.random() > 0.7 && <div className="absolute w-1.5 h-1.5 rounded-full bg-purple-400 bottom-2"></div>}
                  </div>
                ))}
             </div>
          </div>
        );
      case 'year':
        return (
          <div className="p-10 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm animate-in fade-in duration-700">
             <h3 className="text-xl font-black font-humanist mb-10">年轮绘卷 🎨</h3>
             <div className="flex flex-wrap gap-1.5">
                {[...Array(365)].map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-900/50 hover:scale-150 transition-transform cursor-help" style={{ backgroundColor: Math.random() > 0.8 ? `rgba(138, 124, 254, ${Math.random()})` : undefined }} title={`Day ${i+1}`}></div>
                ))}
             </div>
             <div className="mt-12 flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest">
               <span>一月</span>
               <span>十二月</span>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-[#FBFCFF] dark:bg-[#1A1B26] pb-20">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8">
        <Header 
          selectedDate={selectedDate}
          onDateChange={changeDate}
          onGoToday={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          currentView={currentView}
          onViewChange={setCurrentView}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onOpenSettings={() => setShowSettings(true)}
          aiConfig={aiConfig}
        />

        {/* NLP Input - Only show in day views */}
        {currentView.startsWith('day') && (
          <div className="max-w-4xl mx-auto w-full relative group animate-in slide-in-from-top-4 duration-500">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-orange-500/10 rounded-[2.5rem] blur opacity-50"></div>
            <form onSubmit={handleQuickAdd} className="relative">
              <input 
                type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder="记录：'下午3点健身' 或 '10点深度学习'..."
                className="w-full bg-white dark:bg-slate-800 border-none shadow-2xl shadow-purple-500/5 rounded-[2.2rem] py-6 pl-10 pr-20 text-xl font-medium focus:ring-2 focus:ring-purple-400/20 transition-all outline-none dark:text-white"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-br from-[#8A7CFE] to-[#FF9E6D] w-14 h-14 rounded-[1.5rem] text-white shadow-xl flex items-center justify-center">
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
            {renderView()}

            {isEvening && selectedDate === new Date().toISOString().split('T')[0] && (
              <div className="p-10 bg-gradient-to-br from-[#8A7CFE] to-[#6366f1] rounded-[3rem] shadow-2xl shadow-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="relative z-10 text-center md:text-left">
                  <h4 className="font-bold text-2xl text-white font-humanist">夜色温柔，复盘今日？</h4>
                  <p className="text-sm text-white/70 mt-2 font-medium">生成一张专属的艺术时光手账</p>
                </div>
                <button onClick={() => setShowReviewModal(true)} className="relative z-10 bg-white text-indigo-600 px-10 py-5 rounded-[2rem] text-sm font-black shadow-xl hover:scale-105 transition-all">开启时光手账</button>
              </div>
            )}
          </main>

          <div className="md:col-span-3">
            <SidebarRight suggestion={suggestion} />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)}></div>
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center text-center gap-6 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-3xl">🗑️</div>
            <div>
              <h3 className="text-xl font-bold dark:text-white">确定要删除吗？</h3>
              <p className="text-sm text-slate-400 mt-2">此操作将永久移除该计划。</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm">取消</button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-500/20">确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowSettings(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 flex flex-col gap-8 animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black font-humanist">AI 实验室</h2>
            <div className="space-y-6">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                {Object.values(AIProvider).map(p => (
                  <button key={p} onClick={() => setAiConfig(prev => ({...prev, provider: p, ...PROVIDER_DEFAULTS[p]}))} className={`flex-1 py-2 text-[10px] font-bold rounded-xl transition-all ${aiConfig.provider === p ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600' : 'text-slate-400'}`}>
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">模型 ID</label>
                  <input type="text" value={aiConfig.modelId} onChange={(e) => setAiConfig({...aiConfig, modelId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-4 px-6 text-sm outline-none dark:text-white" />
                </div>
                {aiConfig.provider !== AIProvider.GEMINI && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">基础 URL</label>
                      <input type="text" value={aiConfig.baseUrl} onChange={(e) => setAiConfig({...aiConfig, baseUrl: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-4 px-6 text-sm outline-none dark:text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API Key</label>
                      <input type="password" value={aiConfig.apiKey} onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-4 px-6 text-sm outline-none dark:text-white" />
                    </div>
                  </>
                )}
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.8rem] font-black text-sm">应用配置</button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
            {!journalImage ? (
              <div className="text-center space-y-8">
                <div className="text-4xl">📔</div>
                <h2 className="text-3xl font-black font-humanist">记录今日闪光点</h2>
                <textarea placeholder="这一天最难忘的是..." className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-6 text-lg outline-none min-h-[150px] dark:text-white" />
                <div className="flex gap-4">
                  <button onClick={() => setShowReviewModal(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[1.8rem] font-black text-sm">取消</button>
                  <button 
                    onClick={async () => {
                      setIsGeneratingJournal(true);
                      const img = await generateJournalImage(filteredTasks, null, "gemini-2.5-flash-image");
                      if (img) setJournalImage(img);
                      setIsGeneratingJournal(false);
                    }} 
                    className="flex-1 py-5 bg-gradient-to-r from-purple-500 to-orange-500 text-white rounded-[1.8rem] font-black text-sm flex items-center justify-center gap-2"
                  >
                    {isGeneratingJournal ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "🎨 生成手账"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <img src={journalImage} alt="Daily Journal" className="w-full rounded-[2rem] shadow-2xl mb-8" />
                <button onClick={() => setShowReviewModal(false)} className="w-full py-5 bg-[#8A7CFE] text-white rounded-[1.8rem] font-black text-sm">保存</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
