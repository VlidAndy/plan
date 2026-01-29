
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Category, Priority, Mood } from './types';
import { MOCK_TASKS, CATEGORY_COLORS } from './constants';
import Timeline from './components/Timeline';
import ListView from './components/ListView';
import { parseNLPTask, getSmartSuggestions, generateJournalImage } from './services/gemini';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [darkMode, setDarkMode] = useState(false);
  const [currentView, setCurrentView] = useState<'timeline' | 'list'>('timeline');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("正在为您规划美好的一天...");
  const [input, setInput] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [journalImage, setJournalImage] = useState<string | null>(null);
  const [isGeneratingJournal, setIsGeneratingJournal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Initialize data
  useEffect(() => {
    const saved = localStorage.getItem('zm_tasks');
    const savedDarkMode = localStorage.getItem('zm_darkmode');
    
    if (saved) setTasks(JSON.parse(saved));
    else setTasks(MOCK_TASKS);
    
    if (savedDarkMode === 'true') setDarkMode(true);
  }, []);

  // Sync to local
  useEffect(() => {
    localStorage.setItem('zm_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('zm_darkmode', String(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Filter tasks for the selected date
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => t.date === selectedDate);
  }, [tasks, selectedDate]);

  // Mood history logic
  const currentMood = useMemo(() => {
    const savedMoods = JSON.parse(localStorage.getItem('zm_mood_history') || '{}');
    return savedMoods[selectedDate] || null;
  }, [selectedDate, mood]);

  const updateMood = (m: Mood) => {
    setMood(m);
    const savedMoods = JSON.parse(localStorage.getItem('zm_mood_history') || '{}');
    savedMoods[selectedDate] = m;
    localStorage.setItem('zm_mood_history', JSON.stringify(savedMoods));
  };

  // Fetch AI suggestion based on today's tasks
  useEffect(() => {
    const loadSuggestion = async () => {
      if (filteredTasks.length > 0) {
        const msg = await getSmartSuggestions(filteredTasks);
        setSuggestion(msg);
      } else {
        setSuggestion("这一天还没有安排，要不先定个小目标？🌱");
      }
    };
    const timer = setTimeout(loadSuggestion, 1000);
    return () => clearTimeout(timer);
  }, [filteredTasks]);

  // Focus Timer Logic
  useEffect(() => {
    let interval: number | undefined;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        if (timerSeconds > 0) {
          setTimerSeconds(s => s - 1);
        } else if (timerMinutes > 0) {
          setTimerMinutes(m => m - 1);
          setTimerSeconds(59);
        } else {
          setIsTimerRunning(false);
          alert("专注时段结束，休息一下吧 ✨");
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerMinutes, timerSeconds]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsLoading(true);
    const result = await parseNLPTask(input);
    
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: result.title || input,
      startTime: result.startTime || "09:00",
      endTime: result.endTime || "10:00",
      category: (result.category as Category) || Category.LIFE,
      priority: result.priority || Priority.MEDIUM,
      completed: false,
      date: selectedDate
    };

    setTasks(prev => [...prev, newTask]);
    setInput('');
    setIsLoading(false);
  };

  const handleGenerateJournal = async () => {
    setIsGeneratingJournal(true);
    const img = await generateJournalImage(filteredTasks, currentMood);
    if (img) setJournalImage(img);
    setIsGeneratingJournal(false);
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const displayDateStr = useMemo(() => {
    const d = new Date(selectedDate);
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today) return `今天 · ${d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}`;
    return d.toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' });
  }, [selectedDate]);

  const stats = useMemo(() => {
    const completed = filteredTasks.filter(t => t.completed).length;
    const total = filteredTasks.length;
    return {
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total
    };
  }, [filteredTasks]);

  const morningTasks = filteredTasks.filter(t => t.startTime < '12:00').slice(0, 3);
  const isSelectedDateToday = selectedDate === new Date().toISOString().split('T')[0];
  const isEvening = new Date().getHours() >= 18;

  return (
    <div className={`min-h-screen transition-colors duration-500 bg-[#FBFCFF] dark:bg-[#1A1B26] pb-20`}>
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 flex flex-col gap-8">
        
        {/* Navigation / Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => changeDate(-1)}
              className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-all text-slate-400"
            >
              ←
            </button>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-orange-400 to-purple-500 flex items-center justify-center text-3xl shadow-xl shadow-orange-500/20 transform rotate-3">
                {isSelectedDateToday ? (new Date().getHours() < 12 ? '🌤️' : '🌙') : '📅'}
              </div>
              <div>
                <h1 className="text-3xl font-humanist font-bold text-slate-800 dark:text-slate-100 cursor-pointer" onClick={() => setShowCalendar(!showCalendar)}>
                  {displayDateStr}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {isSelectedDateToday ? "这是属于你的崭新时刻" : "回顾过往，是为了更好地出发"}
                </p>
              </div>
            </div>
            <button 
              onClick={() => changeDate(1)}
              className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-50 transition-all text-slate-400"
            >
              →
            </button>
          </div>
          
          <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl p-2 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
            {!isSelectedDateToday && (
              <button 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-5 py-2 rounded-xl text-orange-500 text-sm font-bold hover:bg-orange-50 transition-colors"
              >
                回到今天
              </button>
            )}
            <button 
              onClick={() => setCurrentView('timeline')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${currentView === 'timeline' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              时间轴
            </button>
            <button 
              onClick={() => setCurrentView('list')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${currentView === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              清单
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
          </div>
        </header>

        {/* NLP Input Bar */}
        <div className="relative group max-w-4xl mx-auto w-full">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-orange-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
          <form onSubmit={handleQuickAdd} className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder={`在 ${selectedDate} 安排：'下午3点健身' 或 '10点开会'...`}
              className="w-full bg-white dark:bg-slate-800 border-2 border-transparent focus:border-purple-400/20 dark:focus:border-purple-500/20 shadow-2xl shadow-purple-500/10 rounded-[2.2rem] py-6 pl-10 pr-20 text-xl font-medium focus:ring-0 transition-all outline-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-br from-[#8A7CFE] to-[#FF9E6D] w-14 h-14 rounded-[1.5rem] text-white shadow-xl hover:scale-110 active:scale-90 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : <span className="text-2xl">✨</span>}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Sidebar */}
          <aside className="md:col-span-3 space-y-8 h-full">
            <section className={`p-8 rounded-[2.5rem] bg-gradient-to-br from-orange-50/80 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10 border border-orange-100/50 dark:border-orange-900/20 shadow-sm relative overflow-hidden`}>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-200/20 rounded-full blur-3xl"></div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-orange-900 dark:text-orange-100 font-humanist text-lg flex items-center gap-2">
                  <span>🌅</span> 晨间规划
                </h3>
                <span className="text-[10px] px-3 py-1 bg-white/80 dark:bg-black/20 rounded-full text-orange-600 dark:text-orange-400 font-bold tracking-wider">MORNING</span>
              </div>
              <div className="space-y-4">
                {morningTasks.length > 0 ? morningTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 group cursor-pointer" onClick={() => toggleTask(t.id)}>
                    <div className={`flex-shrink-0 w-6 h-6 rounded-xl border-2 transition-all flex items-center justify-center ${t.completed ? 'bg-orange-400 border-orange-400 text-white shadow-lg shadow-orange-400/30' : 'border-orange-200 bg-white dark:bg-slate-800'}`}>
                      {t.completed && <span className="text-xs">✓</span>}
                    </div>
                    <span className={`transition-all ${t.completed ? 'line-through opacity-40 text-slate-400' : 'font-medium'}`}>{t.title}</span>
                  </div>
                )) : (
                  <p className="text-xs text-orange-600/60 dark:text-orange-400/60 italic text-center py-4">那天的清晨很安静...</p>
                )}
                {isSelectedDateToday && (
                  <button 
                    onClick={() => setInput('08:00 ')}
                    className="w-full py-4 mt-2 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-orange-600 dark:text-orange-400 rounded-2xl text-xs font-bold transition-all border border-orange-100 dark:border-orange-900/50"
                  >
                    + 开启晨间挑战
                  </button>
                )}
              </div>
            </section>

            <section className="space-y-5 px-2">
              <h3 className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">分类看板</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(Category).map(cat => {
                  const count = filteredTasks.filter(t => t.category === cat && !t.completed).length;
                  return (
                    <button key={cat} className="group flex flex-col items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-purple-300 dark:hover:border-purple-500 transition-all hover:-translate-y-1">
                      <div className={`w-10 h-10 rounded-2xl ${CATEGORY_COLORS[cat]} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center`}>
                        <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat]}`}></div>
                      </div>
                      <div className="w-full flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{cat}</span>
                        {count > 0 && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg font-mono">{count}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
               <h3 className="text-[10px] font-black mb-8 text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">当日成就</h3>
               <div className="space-y-8">
                 <div className="flex justify-between items-end">
                   <div>
                     <div className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{stats.rate}%</div>
                     <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase flex items-center gap-1">完成率 <span className="animate-pulse text-green-400">🌱</span></div>
                   </div>
                   <div className="text-right">
                     <div className="text-xl font-bold text-slate-600 dark:text-slate-300">{stats.completed}/{stats.total}</div>
                     <div className="text-[10px] font-bold text-slate-400 uppercase">TASKS</div>
                   </div>
                 </div>
                 <div className="w-full bg-slate-50 dark:bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-100 dark:border-slate-800">
                   <div 
                    className="h-full bg-gradient-to-r from-purple-400 via-orange-300 to-orange-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,158,109,0.3)]" 
                    style={{ width: `${stats.rate}%` }}>
                   </div>
                 </div>
                 <div className="pt-2 space-y-4">
                   <div className="flex justify-between text-xs items-center">
                     <span className="font-bold text-slate-400">✨ 专注时长</span>
                     <span className="text-slate-700 dark:text-slate-100 font-mono bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">
                       {isSelectedDateToday ? "3h 20m" : "-"}
                     </span>
                   </div>
                 </div>
               </div>
            </section>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-6 flex flex-col gap-8 h-full">
            {currentView === 'timeline' ? (
              <Timeline 
                tasks={filteredTasks} 
                onToggleTask={toggleTask} 
                onAddTaskAt={(h) => setInput(`${String(h).padStart(2, '0')}:00 `)}
              />
            ) : (
              <ListView 
                tasks={filteredTasks} 
                onToggleTask={toggleTask} 
              />
            )}
            
            {isSelectedDateToday && isEvening && (
              <div className="p-10 bg-gradient-to-br from-[#8A7CFE] to-[#6366f1] dark:from-indigo-900 dark:to-purple-900 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 group shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="text-center md:text-left relative z-10">
                  <h4 className="font-bold text-2xl text-white font-humanist">夜色温柔，复盘今日？</h4>
                  <p className="text-sm text-white/70 mt-3 font-medium">“每一份努力，都值得被温柔铭记。”</p>
                </div>
                <button 
                  onClick={() => setShowReviewModal(true)}
                  className="bg-white text-indigo-600 px-10 py-5 rounded-[2rem] text-sm font-black shadow-2xl hover:scale-105 active:scale-95 transition-all group-hover:bg-orange-50 relative z-10"
                >
                  开启时光手账
                </button>
              </div>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="md:col-span-3 space-y-8">
            <section className="p-8 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100/50 dark:border-purple-800/20 rounded-[2.5rem] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-transparent"></div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl shadow-sm">💡</div>
                <h3 className="font-bold text-purple-900 dark:text-purple-100 font-humanist text-lg">智愈建议</h3>
              </div>
              <p className="text-sm leading-relaxed text-purple-700/90 dark:text-purple-300/80 italic font-medium font-humanist">
                “{suggestion}”
              </p>
            </section>

            {isSelectedDateToday && (
              <section className="p-10 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-orange-400 to-purple-400 animate-gradient-x"></div>
                <h3 className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] mb-8">专注计时器</h3>
                <div className="text-6xl font-mono font-black text-slate-800 dark:text-slate-100 tracking-tighter relative z-10 mb-10">
                  {String(timerMinutes).padStart(2, '0')}<span className={`${isTimerRunning ? 'animate-pulse' : ''}`}>:</span>{String(timerSeconds).padStart(2, '0')}
                </div>
                <div className="flex gap-3 w-full relative z-10">
                  <button 
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`flex-1 py-5 rounded-[1.8rem] font-black text-sm transition-all shadow-lg ${isTimerRunning ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' : 'bg-[#8A7CFE] text-white'}`}
                  >
                    {isTimerRunning ? 'PAUSE' : 'FOCUS'}
                  </button>
                  <button onClick={() => { setIsTimerRunning(false); setTimerMinutes(25); setTimerSeconds(0); }} className="w-16 h-16 flex items-center justify-center bg-slate-50 dark:bg-slate-700 rounded-[1.8rem] text-slate-400">🔄</button>
                </div>
              </section>
            )}

            <section className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] mb-6 text-center">那天的心情</h3>
              <div className="flex justify-between items-center px-2">
                {[Mood.HAPPY, Mood.NEUTRAL, Mood.SAD].map(m => (
                  <button 
                    key={m}
                    onClick={() => updateMood(m)}
                    className={`text-4xl p-4 rounded-3xl transition-all hover:scale-125 ${currentMood === m ? 'bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-200 shadow-inner scale-110' : 'opacity-20 grayscale hover:grayscale-0 hover:opacity-100'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3.5rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
            {!journalImage ? (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">📔</div>
                  <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 font-humanist">时光手账生成中</h2>
                </div>
                <textarea placeholder="写下你最想记住的瞬间..." className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] p-6 text-lg font-medium outline-none min-h-[150px] dark:text-white" />
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setShowReviewModal(false)} className="py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[1.8rem] font-black text-sm">下次再说</button>
                  <button onClick={handleGenerateJournal} disabled={isGeneratingJournal} className="py-5 bg-gradient-to-r from-purple-500 to-orange-500 text-white rounded-[1.8rem] font-black text-sm flex items-center justify-center gap-3">
                    {isGeneratingJournal ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : "🎨 生成时光手账"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-10 duration-700">
                <img src={journalImage} alt="Daily Journal" className="w-full rounded-[2rem] shadow-2xl border-4 border-white dark:border-slate-800 mb-8" />
                <div className="flex gap-4 w-full">
                  <button onClick={() => setJournalImage(null)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-[1.8rem] font-black text-sm">重绘一张</button>
                  <button onClick={() => setShowReviewModal(false)} className="flex-1 py-5 bg-[#8A7CFE] text-white rounded-[1.8rem] font-black text-sm">保存并关闭</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
