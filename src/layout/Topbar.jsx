import React, { useState, useEffect } from 'react';
import { Bell, User, Trophy, X, Palette } from 'lucide-react';
import { useStreak } from '../hooks/useStreak';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useGamificationContext } from '../context/GamificationContext';
import clsx from 'clsx';

const Topbar = () => {
    const { streak } = useStreak();
    const { theme, setTheme } = useTheme();
    const { user, userProfile } = useAuth();
    const { level } = useGamificationContext();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { id: 1, title: "Daily Quiz Ready", message: "Test your knowledge on today's topics!", time: "2m ago", unread: true },
        { id: 2, title: "Goal Progress", message: "You're 80% through your weekly goal.", time: "1h ago", unread: false },
        { id: 3, title: "System Update", message: "New study tools added.", time: "1d ago", unread: false }
    ]);

    // DEBUG: Log user and userProfile objects
    useEffect(() => {
        console.log("--- Topbar Debug ---");
        console.log("Auth User:", user);
        console.log("User Profile:", userProfile);
        console.log("--------------------");
    }, [user, userProfile]);

    const unreadCount = notifications.filter(n => n.unread).length;

    const handleNotificationClick = () => {
        setShowNotifications(!showNotifications);
        // Mark all as read when opening? Or per item. Let's just toggle for now.
        if (!showNotifications) {
            setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
        }
    };

    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-end px-6 sticky top-0 z-20 text-text transition-colors duration-300">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                    <Trophy className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-bold text-orange-400">{streak} Day Streak</span>
                </div>

                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 rounded-full hover:bg-hover transition-colors"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    <Palette className={clsx(
                        "w-5 h-5 transition-colors",
                        theme === 'dark' ? "text-text-secondary" : "text-primary-start"
                    )} />
                </button>

                <div className="relative">
                    <button
                        onClick={handleNotificationClick}
                        className="p-2 rounded-full hover:bg-hover transition-colors relative"
                    >
                        <Bell className="w-5 h-5 text-text-secondary" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                            <div className="p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-semibold text-text">Notifications</h3>
                                <button onClick={() => setShowNotifications(false)} className="text-text-muted hover:text-text">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(n => (
                                        <div key={n.id} className={`p-4 border-b border-border last:border-0 hover:bg-hover transition-colors ${n.unread ? 'bg-primary-start/5' : ''}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-semibold text-text">{n.title}</h4>
                                                <span className="text-xs text-text-muted">{n.time}</span>
                                            </div>
                                            <p className="text-sm text-text-secondary">{n.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-text-muted text-sm">No new notifications</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-[1px] bg-border"></div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-start to-primary-end flex items-center justify-center border border-primary-start/50">
                        <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text">{userProfile?.name || user?.email}</p>
                        <p className="text-xs text-text-muted">Level {level}</p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Topbar;
