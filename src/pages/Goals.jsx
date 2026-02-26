import React, { useState, useEffect, useCallback } from 'react';
import { useStreak } from '../hooks/useStreak';
import { useGamificationContext } from '../context/GamificationContext';
import { generateJSON } from '../services/geminiService';
import { CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import DailyQuizModal from '../components/DailyQuizModal';

const Goals = () => {
    const { user, loading: authLoading } = useAuth();
    const [goalInput, setGoalInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]); // Array of up to 3 plans
    const [activePlanIndex, setActivePlanIndex] = useState(0);
    const [error, setError] = useState(null);
    const [dailyQuizData, setDailyQuizData] = useState(null);

    // Fetch from Supabase or LocalStorage
    const syncLocalToDB = useCallback(async (localPlans) => {
        if (!user?.id) return;

        const syncedPlans = [];
        for (const plan of localPlans) {
            const { data, error } = await supabase
                .from('study_plans')
                .insert([{
                    user_id: user.id,
                    title: plan.title,
                    description: plan.description,
                    weeks: plan.weeks
                }])
                .select()
                .single();
            if (error) {
                console.error("Sync Error:", error);
                continue;
            }
            if (data) syncedPlans.push(data);
        }

        return syncedPlans;
    }, [user]);

    const buildFallbackPlan = useCallback((goal) => {
        const safeGoal = goal.trim() || "General Study Goal";

        return {
            title: `${safeGoal} (Offline Plan)`,
            description: "Auto-generated fallback plan because AI generation is temporarily unavailable.",
            weeks: [1, 2, 3, 4].map((weekNumber) => ({
                weekNumber,
                theme: `Week ${weekNumber} Focus`,
                days: Array.from({ length: 7 }, (_, i) => ({
                    day: `day${i + 1}`,
                    focus: `Progress on ${safeGoal}`,
                    tasks: [
                        { description: `Study core concepts for ${safeGoal} (60 min)`, completed: false },
                        { description: `Practice questions/exercises (45 min)`, completed: false },
                        { description: "Review notes and summarize key points (20 min)", completed: false }
                    ]
                }))
            }))
        };
    }, []);

    const fetchPlans = useCallback(async () => {
        if (authLoading) return;

        // Always try to fetch from Supabase first if user is logged in
        if (user?.id) {
            try {
                const { data, error } = await supabase
                    .from('study_plans')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (error) {
                    console.error("Supabase Fetch Error:", error);
                } else {
                    // Use Supabase data as source of truth
                    setPlans(data || []);
                    return;
                }
            } catch (e) {
                console.error("Supabase Fetch Error:", e);
            }
        }

        // Fallback to localStorage only if NO user or Supabase failed
        const savedPlans = localStorage.getItem('studyGoalPlans');
        const oldPlan = localStorage.getItem('studyGoalPlan');

        if (savedPlans) {
            try {
                const parsed = JSON.parse(savedPlans);
                setPlans(parsed);
                // If logged in and DB was empty, migrate local to DB and use DB rows (with real IDs).
                if (user?.id && parsed.length > 0) {
                    const synced = await syncLocalToDB(parsed);
                    if (synced?.length > 0) {
                        setPlans(synced);
                    }
                }
            } catch (e) {
                console.error("Failed to parse saved plans", e);
            }
        } else if (oldPlan) {
            try {
                const parsedOldPlan = JSON.parse(oldPlan);
                const migratedPlans = [parsedOldPlan];
                setPlans(migratedPlans);
                if (user?.id) {
                    const synced = await syncLocalToDB(migratedPlans);
                    if (synced?.length > 0) {
                        setPlans(synced);
                    }
                }
            } catch (e) {
                console.error("Failed to migrate old plan", e);
            }
        }
    }, [user, syncLocalToDB, authLoading]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    // Listen for storage changes and plans-updated events
    useEffect(() => {
        const handleStorageChange = () => {
            fetchPlans();
        };

        const handlePlansUpdated = () => {
            // Force refetch from DB
            if (user?.id) {
                supabase
                    .from('study_plans')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3)
                    .then(({ data }) => {
                        if (data) setPlans(data);
                    });
            } else {
                fetchPlans();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('plans-updated', handlePlansUpdated);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('plans-updated', handlePlansUpdated);
        };
    }, [fetchPlans, user]);

    // Save to localStorage as backup (only if user doesn't have a Supabase account)
    useEffect(() => {
        // Only save to localStorage if user is NOT logged in
        // If user is logged in, Supabase is the source of truth
        if (!user?.id) {
            if (plans.length > 0) {
                localStorage.setItem('studyGoalPlans', JSON.stringify(plans));
            } else {
                localStorage.removeItem('studyGoalPlans');
            }
        }
    }, [plans, user]);

    const handleGenerate = async () => {
        if (!goalInput.trim()) return;
        if (plans.length >= 3) {
            setError("You can only have 3 active plans at a time. Please delete one to create a new one.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const prompt = `
        Create a detailed, structured study plan for the following goal: "${goalInput}".
        Return STRICT JSON format with title, description, and 4 weeks (each with 7 days).
        Each day should be named as "day1", "day2", "day3", ... "day7" in a week.
        Include tasks for each day with descriptions.
        
        Example structure:
        {
          "title": "Goal Title",
          "description": "Description",
          "weeks": [
            {
              "weekNumber": 1,
              "theme": "Week Theme",
              "days": [
                {"day": "day1", "focus": "Focus", "tasks": [{"description": "Task"}, ...]},
                ...
                {"day": "day7", "focus": "Focus", "tasks": [...]}
              ]
            },
            ...
          ]
        }
      `;

            let data;
            try {
                data = await generateJSON(prompt);
            } catch (aiError) {
                const aiMessage = aiError?.message || "";
                const isQuotaIssue = aiMessage.toLowerCase().includes("quota") || aiMessage.includes("429");

                if (!isQuotaIssue) throw aiError;

                data = buildFallbackPlan(goalInput);
                setError(`AI quota reached. Created an offline fallback plan instead. Details: ${aiMessage}`);
            }

            const dayNameMap = {
                'Monday': 'day1', 'monday': 'day1',
                'Tuesday': 'day2', 'tuesday': 'day2',
                'Wednesday': 'day3', 'wednesday': 'day3',
                'Thursday': 'day4', 'thursday': 'day4',
                'Friday': 'day5', 'friday': 'day5',
                'Saturday': 'day6', 'saturday': 'day6',
                'Sunday': 'day7', 'sunday': 'day7'
            };

            const processedPlan = {
                title: data.title,
                description: data.description,
                weeks: (data.weeks || []).map((week, wIdx) => ({
                    ...week,
                    days: (week.days || []).map((day, dIdx) => ({
                        ...day,
                        day: dayNameMap[day.day] || `day${dIdx + 1}` || day.day,
                        tasks: (day.tasks || []).map(task => ({
                            description: typeof task === 'string' ? task : task?.description || "Unknown Task",
                            completed: false
                        }))
                    }))
                }))
            };

            if (user) {
                const { data: savedData, error: dbError } = await supabase
                    .from('study_plans')
                    .insert([{
                        user_id: user.id,
                        title: processedPlan.title,
                        description: processedPlan.description,
                        weeks: processedPlan.weeks
                    }])
                    .select()
                    .single();

                if (dbError) throw dbError;
                setPlans([savedData, ...plans].slice(0, 3));
            } else {
                const localPlan = { ...processedPlan, id: Date.now() };
                setPlans([localPlan, ...plans].slice(0, 3));
            }

            setActivePlanIndex(0);
            setGoalInput('');
            window.dispatchEvent(new CustomEvent('plans-updated'));
        } catch (err) {
            setError(`Failed to generate plan: ${err.message || err.toString()}`);
        } finally {
            setLoading(false);
        }
    };

    const { markTaskCompleted } = useStreak();
    const { addXP } = useGamificationContext();

    const toggleTask = async (weekIndex, dayIndex, taskIndex) => {
        if (plans.length === 0) return;

        const newPlans = [...plans];
        const activePlan = newPlans[activePlanIndex];
        const day = activePlan.weeks[weekIndex].days[dayIndex];
        const task = day.tasks[taskIndex];

        console.log("📋 toggleTask called:", {
            taskIndex,
            taskCompleted: task.completed,
            dayName: day.day,
            dayFocus: day.focus,
            totalTasks: day.tasks.length
        });

        if (!task.completed) {
            console.log("🔄 Task is not completed, marking as completed");
            markTaskCompleted();
            addXP(50, 'Task Completed'); // 50 XP per task completed - event dispatched automatically

            // Mark as completed first
            task.completed = true;

            // Check if all tasks in this day are now completed
            const allTasksCompleted = day.tasks.every(t => t.completed);
            console.log("✅ Checking if all tasks completed:", {
                allTasksCompleted,
                completedCount: day.tasks.filter(t => t.completed).length,
                totalCount: day.tasks.length
            });

            if (allTasksCompleted) {
                console.log("🎉 All tasks completed for this day! Triggering quiz...", {
                    day: day.day,
                    dayFocus: day.focus,
                    taskCount: day.tasks.length
                });
                setDailyQuizData({
                    day: day.day,
                    dayFocus: day.focus,
                    tasks: day.tasks,
                    weekIndex,
                    dayIndex
                });
            } else {
                console.log("⏳ Not all tasks completed yet");
            }
        } else {
            console.log("🔙 Task is completed, unchecking it");
            task.completed = false;
        }

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
    };

    const deleteActivePlan = async () => {
        if (window.confirm("Are you sure you want to delete this plan?")) {
            const planToDelete = plans[activePlanIndex];
            if (!planToDelete) return;

            console.log("Deleting plan:", planToDelete);

            // Step 1: Delete from Supabase if user is logged in
            if (user?.id && planToDelete.id) {
                try {
                    console.log("Attempting to delete plan ID:", planToDelete.id, "for user:", user.id);
                    
                    const { data, error } = await supabase
                        .from('study_plans')
                        .delete()
                        .eq('id', planToDelete.id);
                    
                    console.log("Delete response - Data:", data, "Error:", error);
                    
                    if (error) {
                        console.error("Supabase delete error:", error);
                        alert("Failed to delete from cloud. Error: " + error.message);
                        return;
                    }
                } catch (err) {
                    console.error("Delete exception:", err);
                    alert("Failed to delete plan: " + err.message);
                    return;
                }
            } else {
                console.log("No user or plan ID, deleting locally only");
            }

            // Step 2: Update local state immediately
            const newPlans = plans.filter((_, i) => i !== activePlanIndex);
            setPlans(newPlans);
            
            // Step 3: Clear ALL storage aggressively
            localStorage.clear();
            sessionStorage.clear();
            
            // Step 4: Reset active plan index safely
            const newIndex = newPlans.length === 0 ? -1 : Math.min(activePlanIndex, newPlans.length - 1);
            setActivePlanIndex(newIndex);

            // Step 5: Force browser cache clear and refetch
            setTimeout(() => {
                // Clear caches
                if (typeof window !== 'undefined' && 'caches' in window) {
                    caches.keys().then(names => {
                        names.forEach(name => {
                            caches.delete(name);
                        });
                    });
                }
                // Force refetch from server
                fetchPlans();
            }, 300);
            
            alert("Plan deleted successfully!");
        }
    };

    const activePlan = plans[activePlanIndex];

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Goal Planner
                    </h1>
                    <p className="mt-2 text-gray-400">Manage multiple concurrent learning paths.</p>
                </div>

                {plans.length > 0 && (
                    <div className="flex bg-gray-800/50 p-1 rounded-xl border border-gray-700">
                        {plans.map((p, idx) => (
                            <button
                                key={p.id || idx}
                                onClick={() => setActivePlanIndex(idx)}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                    activePlanIndex === idx
                                        ? "bg-primary-start text-white shadow-lg"
                                        : "text-gray-400 hover:text-white"
                                )}
                            >
                                Plan {idx + 1}
                            </button>
                        ))}
                        {plans.length < 3 && (
                            <button
                                onClick={() => { setActivePlanIndex(-1); setGoalInput(''); }}
                                className="px-3 py-2 text-gray-500 hover:text-primary-start transition-colors"
                                title="Add New Plan"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
            </header>

            {/* Input Section (shown if no plans or if adding new) */}
            {(plans.length === 0 || activePlanIndex === -1) && (
                <div className="bg-card p-8 rounded-2xl border border-gray-800 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-300">What do you want to achieve?</label>
                        {plans.length > 0 && (
                            <button onClick={() => setActivePlanIndex(0)} className="text-xs text-gray-500 hover:text-white">Cancel</button>
                        )}
                    </div>
                    <div className="flex gap-4 flex-col md:flex-row">
                        <input
                            type="text"
                            value={goalInput}
                            onChange={(e) => setGoalInput(e.target.value)}
                            placeholder="e.g., Learn React Native in 4 weeks..."
                            className="flex-1 bg-background border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-start/50 transition-all text-white placeholder-gray-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={loading || !goalInput.trim()}
                            className="bg-gradient-to-r from-primary-start to-primary-end px-6 py-3 rounded-xl font-bold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[160px] transition-all"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Create Plan
                                </>
                            )}
                        </button>
                    </div>
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                            {error}
                        </div>
                    )}
                </div>
            )}

            {/* Plan Display Section */}
            {activePlan && activePlanIndex !== -1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between bg-card p-6 rounded-2xl border border-gray-800">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{activePlan.title}</h2>
                            <p className="text-gray-400 text-sm line-clamp-2">{activePlan.description}</p>
                        </div>
                        <button
                            onClick={deleteActivePlan}
                            className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors flex-shrink-0"
                            title="Delete Plan"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {activePlan.weeks.map((week, wIndex) => (
                            <div key={wIndex} className="bg-card border border-gray-800 rounded-2xl overflow-hidden">
                                <div className="bg-gray-800/50 p-4 border-b border-gray-800 flex items-center gap-3">
                                    <div className="bg-primary-start/20 text-primary-start px-3 py-1 rounded-lg text-sm font-bold">
                                        Week {week.weekNumber}
                                    </div>
                                    <h3 className="font-semibold text-white">{week.theme}</h3>
                                </div>

                                <div className="divide-y divide-gray-800">
                                    {week.days.map((day, dIndex) => (
                                        <div key={dIndex} className="p-4 hover:bg-white/5 transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 min-w-[60px] text-xs font-bold text-gray-500 uppercase tracking-tighter">
                                                    {day.day}
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <p className="text-sm text-gray-300 font-medium mb-2">{day.focus}</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {day.tasks.map((task, tIndex) => (
                                                            <div
                                                                key={tIndex}
                                                                className="flex items-start gap-3 group cursor-pointer bg-black/20 p-2 rounded-lg border border-transparent hover:border-primary-start/30 transition-all text-left"
                                                                onClick={() => toggleTask(wIndex, dIndex, tIndex)}
                                                            >
                                                                <div className={clsx(
                                                                    "mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all flex-shrink-0",
                                                                    task.completed
                                                                        ? "bg-primary-start border-primary-start"
                                                                        : "border-gray-600 group-hover:border-primary-start"
                                                                )}>
                                                                    {task.completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                                </div>
                                                                <span className={clsx(
                                                                    "text-xs transition-all",
                                                                    task.completed ? "text-gray-500 line-through" : "text-gray-300"
                                                                )}>
                                                                    {task.description}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Daily Quiz Modal */}
            {dailyQuizData && (
                <>
                    {console.log("🎯 Rendering DailyQuizModal with data:", dailyQuizData)}
                    <DailyQuizModal
                        day={dailyQuizData.day}
                        dayFocus={dailyQuizData.dayFocus}
                        tasks={dailyQuizData.tasks}
                        onComplete={() => {
                            console.log("✅ Quiz modal closed by onComplete");
                            setDailyQuizData(null);
                        }}
                        onCancel={() => {
                            console.log("❌ Quiz modal closed by onCancel");
                            setDailyQuizData(null);
                        }}
                    />
                </>
            )}
        </div>
    );
};

export default Goals;
