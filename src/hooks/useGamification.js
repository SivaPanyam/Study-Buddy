
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const XP_PER_LEVEL = 500; // More rewarding progression

const loadGamificationState = () => {
    const defaultState = { xp: 0, level: 1, badges: [] };
    const savedData = localStorage.getItem('studyGamification');

    if (!savedData) return defaultState;

    try {
        const parsed = JSON.parse(savedData);
        const xp = Number(parsed?.xp) || 0;
        return {
            xp,
            level: Math.max(1, Number(parsed?.level) || Math.floor(xp / XP_PER_LEVEL) + 1),
            badges: Array.isArray(parsed?.badges) ? parsed.badges : []
        };
    } catch (e) {
        console.error("Failed to load gamification data", e);
        return defaultState;
    }
};

export const useGamification = () => {
    const { user } = useAuth();
    const [state, setState] = useState(loadGamificationState);
    const { xp, level, badges } = state;
    const [isLoading, setIsLoading] = useState(true);
    const syncTimeout = useRef(null);
    const previousXpRef = useRef(xp);

    // Load from Supabase on mount if user exists
    useEffect(() => {
        const handleStorageChange = () => {
            const savedData = localStorage.getItem('studyGamification');
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    setState({
                        xp: Number(parsed?.xp) || 0,
                        level: Math.max(1, Number(parsed?.level) || 1),
                        badges: Array.isArray(parsed?.badges) ? parsed.badges : []
                    });
                    console.log("Gamification updated from localStorage:", parsed);
                } catch (e) {
                    console.error("Failed to parse gamification data", e);
                }
            }
        };

        // Listen for storage changes (sync between tabs/windows)
        window.addEventListener('storage', handleStorageChange);

        if (!user?.id) {
            console.log("⚠️ No user logged in - using localStorage only");
            setIsLoading(false);
            return () => window.removeEventListener('storage', handleStorageChange);
        }

        const fetchGamificationData = async () => {
            try {
                console.log("🔄 Fetching gamification from Supabase for user:", user.id);
                const { data, error } = await supabase
                    .from('user_gamification')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error("❌ Fetch gamification error:", error);
                }

                if (data) {
                    console.log("✅ Loaded gamification from Supabase:", data);
                    setState({
                        xp: data.xp_total || 0,
                        level: data.level || 1,
                        badges: data.badges || []
                    });
                    // Cache in localStorage
                    localStorage.setItem('studyGamification', JSON.stringify({
                        xp: data.xp_total,
                        level: data.level,
                        badges: data.badges
                    }));
                } else {
                    console.log("👤 New user - initializing in Supabase");
                    // New user - initialize in DB
                    const { error: upsertError } = await supabase
                        .from('user_gamification')
                        .upsert({
                            user_id: user.id,
                            xp_total: 0,
                            level: 1,
                            badges: [],
                            last_xp_update: new Date()
                        }, { onConflict: 'user_id' });

                    if (upsertError) console.error("❌ Initialize gamification error:", upsertError);
                }
            } catch (err) {
                console.error("❌ Gamification load error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGamificationData();

        return () => window.removeEventListener('storage', handleStorageChange);
    }, [user?.id]);

    const addXP = useCallback((amount, reason = 'Task Completed') => {
        if (typeof amount !== 'number' || isNaN(amount)) {
            console.error("Invalid XP amount:", amount);
            return;
        }

        console.log("🎮 addXP called with:", amount, "reason:", reason);
        
        setState(prev => {
            const newXp = prev.xp + amount;
            const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
            const leveledUp = newLevel > prev.level;
            
            console.log(`✅ Adding ${amount} XP: ${prev.xp} -> ${newXp}, Level: ${prev.level} -> ${newLevel}, LeveledUp: ${leveledUp}`);
            
            // Store info for event dispatch
            previousXpRef.current = newXp;
            
            // Dispatch events immediately while in setState callback
            if (leveledUp) {
                console.log("🎉 LEVEL UP!", newLevel);
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('levelUp', { detail: { newLevel } }));
                }, 0);
            } else {
                // Dispatch XP earned event
                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('xpEarned', { 
                        detail: { xp: amount, reason } 
                    }));
                }, 0);
            }
            
            return { ...prev, xp: newXp, level: newLevel };
        });
    }, []);

    const awardBadge = (badgeId) => {
        let awarded = false;

        setState(prev => {
            if (prev.badges.includes(badgeId)) return prev;
            awarded = true;
            console.log("Badge awarded:", badgeId);
            return { ...prev, badges: [...prev.badges, badgeId] };
        });

        return awarded;
    };

    // Debounced sync to Supabase (primary storage) and localStorage (cache)
    useEffect(() => {
        console.log("💾 Gamification sync effect triggered - xp:", xp, "level:", level, "user_id:", user?.id);
        
        // Cache in localStorage
        localStorage.setItem('studyGamification', JSON.stringify({ xp, level, badges }));
        console.log("✅ Cached to localStorage:", { xp, level, badges });

        // Only sync to Supabase if user exists
        if (!user?.id) {
            console.log("⚠️ No user ID, skipping Supabase sync");
            return;
        }

        // Clear previous timeout
        if (syncTimeout.current) {
            clearTimeout(syncTimeout.current);
        }

        // Debounce sync (wait 500ms before syncing to avoid excessive DB calls)
        syncTimeout.current = setTimeout(async () => {
            try {
                console.log("🔄 Syncing to Supabase (primary storage):", { 
                    user_id: user.id, 
                    xp_total: xp, 
                    level: level, 
                    badges: badges 
                });
                
                const { data, error } = await supabase
                    .from('user_gamification')
                    .upsert({
                        user_id: user.id,
                        xp_total: xp,
                        level: level,
                        badges: badges,
                        last_xp_update: new Date()
                    }, { onConflict: 'user_id' })
                    .select();

                if (error) {
                    console.error("❌ Gamification sync ERROR:", {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint
                    });
                } else {
                    console.log("✅ Gamification synced successfully to Supabase:", data);
                }
            } catch (err) {
                console.error("❌ Gamification sync exception:", err);
            }
        }, 500);

        return () => {
            if (syncTimeout.current) {
                clearTimeout(syncTimeout.current);
            }
        };
    }, [xp, level, badges, user?.id]);

    const xpForCurrentLevel = (level - 1) * XP_PER_LEVEL;
    const xpForNextLevel = level * XP_PER_LEVEL;
    const xpInCurrentLevel = xp - xpForCurrentLevel;
    const xpNeededForLevelUp = xpForNextLevel - xp;
    const levelProgress = (xpInCurrentLevel / XP_PER_LEVEL) * 100;

    return { 
        xp, 
        level, 
        badges, 
        addXP, 
        awardBadge, 
        XP_PER_LEVEL, 
        isLoading,
        xpInCurrentLevel,
        xpNeededForLevelUp,
        levelProgress,
        xpForCurrentLevel,
        xpForNextLevel
    };
};

