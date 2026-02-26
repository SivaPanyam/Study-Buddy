import { useState, useEffect } from 'react';
import { getToday, differenceInDays } from '../utils/dateUtils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'studyStreak';
const defaultStreakState = {
    currentStreak: 0,
    lastCompletionDate: null,
    lastBreakDate: null,
    history: []
};

const loadStreakData = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultStreakState;

    try {
        const parsed = JSON.parse(stored);
        return {
            currentStreak: Number(parsed?.currentStreak) || 0,
            lastCompletionDate: parsed?.lastCompletionDate || null,
            lastBreakDate: parsed?.lastBreakDate || null,
            history: Array.isArray(parsed?.history) ? parsed.history : []
        };
    } catch (e) {
        console.error("Failed to parse streak", e);
        return defaultStreakState;
    }
};

export const useStreak = () => {
    const { user } = useAuth();
    const [streakData, setStreakData] = useState(loadStreakData);
    const [synced, setSynced] = useState(false);

    // Load from Supabase on mount if user exists
    useEffect(() => {
        if (!user?.id || synced) return;

        const fetchStreakData = async () => {
            const { data, error } = await supabase
                .from('user_streaks')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setStreakData({
                    currentStreak: data.current_streak || 0,
                    lastCompletionDate: data.last_completion_date,
                    lastBreakDate: null,
                    history: data.history || []
                });
            }
            setSynced(true);
        };

        fetchStreakData();
    }, [user, synced]);

    const saveStreak = async (data) => {
        setStreakData(data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        // Sync to Supabase
        if (user?.id) {
            const { error } = await supabase
                .from('user_streaks')
                .upsert({
                    user_id: user.id,
                    current_streak: data.currentStreak,
                    longest_streak: Math.max(data.currentStreak, data.lastCompletionDate ? data.currentStreak : 0),
                    last_completion_date: data.lastCompletionDate,
                    history: data.history,
                    updated_at: new Date()
                }, { onConflict: 'user_id' });

            if (error) console.error("Streak sync error:", error);
        }
    };

    const markTaskCompleted = () => {
        const today = getToday();
        const { currentStreak, lastCompletionDate, lastBreakDate, history = [] } = streakData;

        // Helper to update history
        const updateHistory = (date) => {
            if (!history.includes(date)) {
                return [...history, date];
            }
            return history;
        };

        // If simple first time
        if (!lastCompletionDate) {
            const newHistory = updateHistory(today);
            saveStreak({
                currentStreak: 1,
                lastCompletionDate: today,
                lastBreakDate,
                history: newHistory
            });
            return { updated: true, streak: 1 };
        }

        const diff = differenceInDays(today, lastCompletionDate);

        if (diff === 0) {
            // Already completed a task today
            return { updated: false, streak: currentStreak };
        }

        if (diff === 1) {
            // Consecutive day
            const newStreak = currentStreak + 1;
            const newHistory = updateHistory(today);
            saveStreak({
                currentStreak: newStreak,
                lastCompletionDate: today,
                lastBreakDate,
                history: newHistory
            });
            return { updated: true, streak: newStreak };
        }

        if (diff === 2) {
            // Missed exactly one day. Check weekly break logic.
            const daysSinceLastBreak = lastBreakDate ? differenceInDays(today, lastBreakDate) : 999;

            if (daysSinceLastBreak >= 7) {
                // Use break
                console.log("Streak saved by weekly break!");
                const newHistory = updateHistory(today);
                saveStreak({
                    currentStreak: currentStreak + 1,
                    lastCompletionDate: today,
                    lastBreakDate: getToday(),
                    history: newHistory
                });
                return { updated: true, streak: currentStreak + 1, savedByBreak: true };
            }
        }

        // Gap too large or break already used
        const newHistory = updateHistory(today);
        saveStreak({
            currentStreak: 1, // Reset to 1 (today is done)
            lastCompletionDate: today,
            lastBreakDate, // Keep track of last break
            history: newHistory
        });
        return { updated: true, streak: 1, reset: true };
    };

    return {
        streak: streakData.currentStreak,
        history: streakData.history || [],
        markTaskCompleted
    };
};
