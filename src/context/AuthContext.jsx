import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(isSupabaseConfigured);

    // Fetch user profile from database
    const fetchUserProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching user profile:", error);
                return null;
            }
            
            return data || null;
        } catch (err) {
            console.error("Error fetching user profile:", err);
            return null;
        }
    };

    useEffect(() => {
        if (!isSupabaseConfigured) return;

        let isMounted = true;

        // Get initial session
        supabase.auth.getSession()
            .then(async ({ data: { session } }) => {
                if (!isMounted) return;
                setUser(session?.user ?? null);
                
                if (session?.user?.id) {
                    const profile = await fetchUserProfile(session.user.id);
                    if (isMounted) setUserProfile(profile);
                }
            })
            .catch((error) => {
                console.error("Auth getSession failed:", error);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted) return;
            setUser(session?.user ?? null);
            
            if (session?.user?.id) {
                const profile = await fetchUserProfile(session.user.id);
                if (isMounted) setUserProfile(profile);
            } else {
                if (isMounted) setUserProfile(null);
            }
            
            setLoading(false);
        });

        return () => {
            isMounted = false;
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
