import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(isSupabaseConfigured);

    // Fetch user profile from database with timeout
    const fetchUserProfile = async (userId) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
            
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            clearTimeout(timeoutId);
            
            if (error && error.code !== 'PGRST116') {
                console.warn("Warning fetching user profile:", error);
                return null;
            }
            
            return data || null;
        } catch (err) {
            console.warn("Warning fetching user profile (timeout):", err);
            return null;
        }
    };

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        let sessionTimeout;

        // Add timeout protection for getSession
        const getSessionWithTimeout = Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => 
                sessionTimeout = setTimeout(() => reject(new Error("Session check timeout")), 5000)
            )
        ]);

        getSessionWithTimeout
            .then(async ({ data: { session } }) => {
                clearTimeout(sessionTimeout);
                if (!isMounted) return;
                setUser(session?.user ?? null);
                
                if (session?.user?.id) {
                    const profile = await fetchUserProfile(session.user.id);
                    if (isMounted) setUserProfile(profile);
                }
            })
            .catch((error) => {
                clearTimeout(sessionTimeout);
                console.warn("Auth getSession failed:", error?.message || error);
                if (isMounted) {
                    setUser(null);
                    setUserProfile(null);
                }
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted) return;
            setUser(session?.user ?? null);
            
            // Fetch profile in background without blocking UI
            if (session?.user?.id) {
                // Don't wait for profile - set it async
                fetchUserProfile(session.user.id).then((profile) => {
                    if (isMounted) setUserProfile(profile);
                }).catch(() => {
                    if (isMounted) setUserProfile(null);
                });
            } else {
                if (isMounted) setUserProfile(null);
            }
            
            setLoading(false);
        });

        return () => {
            isMounted = false;
            clearTimeout(sessionTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = () => supabase.auth.signOut();

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
