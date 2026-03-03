import React from 'react';
import { Settings as SettingsIcon, Trash2, User, Save, Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { wipeAllStorage } from '../utils/storageUtils';
import clsx from 'clsx';

const Settings = () => {
    const { theme, setTheme } = useTheme();
    const { user, userProfile } = useAuth();
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    // Fetch and refresh profile data
    const refreshProfile = React.useCallback(async () => {
        if (!user?.id) return;
        
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.warn("Error fetching profile:", error);
                return;
            }

            if (data) {
                setName(data.name || '');
                setEmail(data.email || '');
            } else {
                // Profile doesn't exist - create one
                const newProfile = {
                    user_id: user.id,
                    name: user.user_metadata?.full_name || '',
                    email: user.email || ''
                };
                
                const { data: createdProfile, error: createError } = await supabase
                    .from('user_profiles')
                    .insert([newProfile])
                    .select()
                    .single();

                if (!createError && createdProfile) {
                    setName(createdProfile.name || '');
                    setEmail(createdProfile.email || '');
                }
            }
        } catch (err) {
            console.error("Failed to refresh profile:", err);
        }
    }, [user?.id, user?.email, user?.user_metadata]);

    React.useEffect(() => {
        // Load profile from userProfile context
        if (userProfile) {
            setName(userProfile.name || '');
            setEmail(userProfile.email || '');
        } else if (user?.id) {
            // Fallback: fetch directly if userProfile not available
            refreshProfile();
        }
    }, [userProfile, user?.id, refreshProfile]);

    // Listen for profile updates
    React.useEffect(() => {
        const handleProfileUpdated = () => {
            refreshProfile();
        };

        window.addEventListener('profile-updated', handleProfileUpdated);
        return () => window.removeEventListener('profile-updated', handleProfileUpdated);
    }, [refreshProfile]);

    const handleProfileUpdate = async () => {
        if (!name.trim()) {
            alert("Name cannot be empty.");
            return;
        }
        setLoading(true);
        try {
            // Update user_profiles table
            const { error: profileError } = await supabase
                .from('user_profiles')
                .update({ name: name.trim() })
                .eq('user_id', user.id);

            if (profileError) throw profileError;

            // Optionally update auth user metadata if needed
            // This is more complex and might not be required if you only use user_profiles
            
            alert("Profile updated successfully!");
            // You might want to trigger a refresh of the userProfile in AuthContext
            window.dispatchEvent(new Event('profile-updated'));

        } catch (error) {
            alert("Failed to update profile: " + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleReset = async () => {
        if (window.confirm("CRITICAL WARNING: This will delete ALL your goals, progress, streaks, and quiz history. This action cannot be undone.\n\nAre you sure?")) {
            try {
                // Correctly destructure user from the response
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError) throw userError;

                const result = await wipeAllStorage(user?.id);

                if (result.success) {
                    // Force a full reload to the auth page
                    window.location.href = '/auth';
                } else {
                    alert("Failed to perform a complete cleanup: " + result.error);
                }
            } catch (err) {
                console.error("Reset Error:", err);
                // Fallback: at least clear local storage and try to sign out
                localStorage.clear();
                await supabase.auth.signOut();
                window.location.href = '/auth';
            }
        }
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto pb-20 space-y-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8 text-primary-start" />
                    Settings
                </h1>
                <p className="mt-2 text-gray-400">Manage your preferences and account data.</p>
            </header>

            {/* Profile Section */}
            <section className="bg-card border border-gray-800 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                        <p className="text-sm text-gray-400">Update your personal details</p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-start/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-400 focus:outline-none cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleProfileUpdate}
                        disabled={loading}
                        className="bg-primary-start hover:bg-primary-end text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Save className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </section>

            {/* Preferences */}
            <section className="bg-card border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-800 rounded-xl"><Bell className="w-5 h-5 text-gray-400" /></div>
                        <div>
                            <h3 className="font-semibold text-white">Notifications</h3>
                            <p className="text-sm text-gray-400">Receive daily study reminders</p>
                        </div>
                    </div>
                    <div className="w-12 h-6 bg-primary-start rounded-full relative cursor-pointer opacity-80">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-800 pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-800 rounded-xl">
                            {theme === 'dark' ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Dark Mode</h3>
                            <p className="text-sm text-gray-400">
                                {theme === 'dark' ? 'Switch to light mode for a fresh look' : 'Switch to dark mode for better focus'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={clsx(
                            "w-12 h-6 rounded-full relative transition-colors duration-200",
                            theme === 'dark' ? "bg-primary-start" : "bg-gray-400"
                        )}
                    >
                        <div className={clsx(
                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200",
                            theme === 'dark' ? "right-1" : "left-1"
                        )} />
                    </button>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <h2 className="text-xl font-semibold text-red-500">Danger Zone</h2>
                </div>
                <p className="text-gray-400 mb-6 text-sm">Irreversible actions regarding your data.</p>

                <button
                    onClick={handleReset}
                    className="border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
                >
                    Reset All Progress
                </button>
            </section>
        </div>
    );
};

export default Settings;
