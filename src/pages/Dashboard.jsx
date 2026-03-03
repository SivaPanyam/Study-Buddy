import React, { useEffect, useState, useCallback } from 'react';
import { useStreak } from '../hooks/useStreak';
import { useGamificationContext } from '../context/GamificationContext';
import Card from '../components/Card';
import { BrainCircuit, Calendar as CalendarIcon, CheckCircle2, Target, Trophy, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import PomodoroTimer from '../components/PomodoroTimer';
import { getToday } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const Calendar = ({ history = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const generateDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);

        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 md:h-10"></div>);
        }

        for (let i = 1; i <= totalDays; i++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isCompleted = history.includes(dateStr);
            const isToday = dateStr === getToday();

            days.push(
                <div key={i} className="flex items-center justify-center h-8 md:h-10">
                    <div className={clsx(
                        "w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                        isCompleted ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20" :
                            isToday ? "border border-primary-start text-primary-start" : "text-gray-400 hover:bg-gray-800"
                    )}>
                        {i}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="p-4 bg-hover/20 rounded-2xl border border-border h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-text">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-hover rounded-lg text-text-secondary hover:text-text transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-hover rounded-lg text-text-secondary hover:text-text transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                    <div key={`${d}-${idx}`} className="text-xs font-bold text-gray-500 py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 flex-1">
                {generateDays()}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-400 justify-center border-t border-gray-800 pt-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-600"></div>
                    Study Done
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-primary-start"></div>
                    Today
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const { history, markTaskCompleted } = useStreak();
    const { xp, level, XP_PER_LEVEL, isLoading: gamificationLoading, xpInCurrentLevel, xpNeededForLevelUp, levelProgress } = useGamificationContext();
    const [plans, setPlans] = useState([]);
    const [activePlanIndex, setActivePlanIndex] = useState(0);
    const [stats, setStats] = useState({
        totalTasks: 0,
        completedTasks: 0,
        progress: 0,
        currentWeek: 1,
        activeDay: null
    });

    const calculateStats = useCallback((data) => {
        if (!data || !data.weeks) return;
        let total = 0;
        let completed = 0;
        let foundActiveDay = null;

        data.weeks.forEach((week, wIndex) => {
            week.days.forEach((day, dIndex) => {
                const dayTasks = (day.tasks || []).length;
                const dayCompleted = (day.tasks || []).filter(t => t.completed).length;

                total += dayTasks;
                completed += dayCompleted;

                if (!foundActiveDay && dayCompleted < dayTasks) {
                    foundActiveDay = {
                        ...day,
                        week: week.weekNumber,
                        weekTheme: week.theme,
                        wIndex,
                        dIndex
                    };
                }
            });
        });

        setStats({
            totalTasks: total,
            completedTasks: completed,
            progress: total > 0 ? Math.round((completed / total) * 100) : 0,
            activeDay: foundActiveDay
        });
    }, []);

    const fetchPlans = useCallback(async () => {
        if (authLoading) return;

        if (user) {
            try {
                const { data, error } = await supabase
                    .from('study_plans')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(3);
                if (error) throw error;
                if (data) {
                    setPlans(data);
                    if (data.length > 0) {
                        const activeIndex = activePlanIndex < data.length ? activePlanIndex : 0;
                        calculateStats(data[activeIndex]);
                    }
                    return; // Ensure we don't fall back to localStorage if logged in
                }
            } catch (e) {
                console.error("Dashboard Fetch Error:", e);
                setPlans([]);
                setStats({
                    totalTasks: 0,
                    completedTasks: 0,
                    progress: 0,
                    currentWeek: 1,
                    activeDay: null
                });
            }
        } else {
            const savedPlans = localStorage.getItem('studyGoalPlans');
            if (savedPlans) {
                try {
                    const parsed = JSON.parse(savedPlans);
                    setPlans(parsed);
                    if (parsed.length > 0) {
                        const activeIndex = activePlanIndex < parsed.length ? activePlanIndex : 0;
                        calculateStats(parsed[activeIndex]);
                    }
                } catch (e) {
                    console.error("Failed to parse plans", e);
                }
            } else {
                setPlans([]);
                setStats({
                    totalTasks: 0,
                    completedTasks: 0,
                    progress: 0,
                    currentWeek: 1,
                    activeDay: null
                });
            }
        }
    }, [user, activePlanIndex, calculateStats, authLoading]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    useEffect(() => {
        const onPlansUpdated = () => fetchPlans();
        window.addEventListener('plans-updated', onPlansUpdated);
        window.addEventListener('storage', onPlansUpdated);

        return () => {
            window.removeEventListener('plans-updated', onPlansUpdated);
            window.removeEventListener('storage', onPlansUpdated);
        };
    }, [fetchPlans]);

    const toggleTask = async (wIndex, dIndex, tIndex) => {
        if (plans.length === 0) return;

        const newPlans = [...plans];
        const activePlan = newPlans[activePlanIndex];
        const task = activePlan.weeks[wIndex].days[dIndex].tasks[tIndex];

        if (!task.completed) {
            markTaskCompleted();
        }

        task.completed = !task.completed;
        setPlans(newPlans);

        if (user && activePlan.id) {
            const { error } = await supabase
                .from('study_plans')
                .update({ weeks: activePlan.weeks })
                .eq('id', activePlan.id);
            if (error) console.error("Toggle Sync Error:", error);
        } else {
            localStorage.setItem('studyGoalPlans', JSON.stringify(newPlans));
        }
        calculateStats(activePlan);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header */}
                    <header>
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    Dashboard
                                </h1>
                                <p className="mt-1 text-gray-400">Welcome back! Here's your study overview.</p>
                            </div>
                            {plans.length > 1 && (
                                <div className="flex bg-gray-800/50 p-1 rounded-xl border border-gray-700">
                                    {plans.map((p, idx) => (
                                        <button
                                            key={p.id || idx}
                                            onClick={() => setActivePlanIndex(idx)}
                                            className={clsx(
                                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                activePlanIndex === idx
                                                    ? "bg-primary-start text-white shadow-lg"
                                                    : "text-gray-400 hover:text-white"
                                            )}
                                        >
                                            Plan {idx + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </header>

                    {/* Active Goal */}
                    <Card
                        className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 hover:border-primary-start/30 transition-colors p-6"
                    >
                        <div className="flex flex-col h-full justify-between gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-primary-start mb-2 flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Active Goal
                                    </p>
                                    {plans[activePlanIndex] ? (
                                        <>
                                            <h2 className="text-xl font-bold text-white mb-1">{plans[activePlanIndex].title}</h2>
                                            <p className="text-sm text-gray-400 line-clamp-1">{plans[activePlanIndex].description}</p>
                                        </>
                                    ) : (
                                        <div className="text-gray-400 italic">No active goal set. Start planning!</div>
                                    )}
                                </div>

                                {plans[activePlanIndex] && (
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <span className="text-3xl font-bold text-white">{stats.progress}%</span>
                                        <p className="text-xs text-gray-500 uppercase">Completion</p>
                                    </div>
                                )}
                            </div>

                            {plans[activePlanIndex] ? (
                                <div className="mt-2">
                                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-primary-start to-primary-end h-full transition-all duration-500"
                                            style={{ width: `${stats.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <Link to="/app/goals" className="self-start bg-primary-start text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity">
                                    Create Goal
                                </Link>
                            )}
                        </div>
                    </Card>

                    {/* Today's Focus */}
                    <Card title="Today's Focus" icon={CalendarIcon} className="h-full p-6">
                        {plans.length > 0 ? (
                            stats.activeDay ? (
                                <div className="space-y-4">
                                    <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-800">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-primary-start uppercase tracking-wider">
                                                Week {stats.activeDay.week} • {stats.activeDay.day}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">{stats.activeDay.focus}</h3>
                                    </div>

                                    <div className="space-y-3">
                                        {stats.activeDay.tasks.map((task, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => toggleTask(stats.activeDay.wIndex, stats.activeDay.dIndex, idx)}
                                                className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors group cursor-pointer border border-transparent hover:border-gray-800"
                                            >
                                                <div className={clsx(
                                                    "mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                                                    task.completed
                                                        ? "bg-primary-start border-primary-start"
                                                        : "border-gray-600 group-hover:border-primary-start"
                                                )}>
                                                    {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                </div>
                                                <p className={clsx(
                                                    "text-sm flex-1 transition-all",
                                                    task.completed ? "text-gray-500 line-through" : "text-gray-300 group-hover:text-white"
                                                )}>
                                                    {task.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-3 flex justify-end">
                                        <Link to="/app/goals" className="text-sm font-medium text-primary-start hover:text-white transition-colors flex items-center gap-1">
                                            View Full Plan <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                    <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                                    <h3 className="text-xl font-bold text-white">All Caught Up!</h3>
                                    <p className="text-sm text-gray-400 mt-2">You've completed all scheduled tasks for today.</p>
                                </div>
                            )
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10 text-gray-500">
                                <p>No active plan found.</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right Sidebar Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Pomodoro Timer */}
                    <PomodoroTimer />

                    {/* Daily Quiz */}
                    <Card className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border-indigo-500/20 p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                <BrainCircuit className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Daily Quiz</h3>
                                <p className="text-xs text-gray-400">Test: <strong>{stats.activeDay?.focus || "General"}</strong></p>
                            </div>
                        </div>
                        <Link
                            to="/app/quiz"
                            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-lg font-bold text-center text-sm transition-colors"
                        >
                            Start Quiz
                        </Link>
                    </Card>

                    {/* Gamification Card */}
                    <div className="bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-red-600/20 p-6 rounded-2xl border border-purple-500/30 shadow-2xl backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy className="w-7 h-7 text-yellow-400" />
                                    <span className="text-sm font-bold text-purple-300 uppercase tracking-widest">Level {level}</span>
                                </div>
                                <span className="text-5xl font-black bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500 bg-clip-text text-transparent">{xp}</span>
                                <span className="text-sm text-purple-300 font-semibold ml-1">XP</span>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 mb-1">Next Level</p>
                                <p className="text-3xl font-bold text-white">{xpNeededForLevelUp}</p>
                                <p className="text-xs text-gray-500">XP needed</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="w-full bg-gray-900/50 h-3 rounded-full overflow-hidden border border-purple-500/20 shadow-inner">
                                <div
                                    className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 h-full transition-all duration-500 rounded-full"
                                    style={{ width: `${levelProgress}%` }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-400 font-semibold">
                                <span>{xpInCurrentLevel} / {XP_PER_LEVEL} XP</span>
                                <span>{levelProgress.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Study Habit Calendar */}
                    <Card title="Study Habit" icon={CalendarIcon} className="p-0">
                         <Calendar history={history} />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
