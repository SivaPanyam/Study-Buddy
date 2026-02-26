import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import clsx from 'clsx';

const XPNotification = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const handleXPEarned = (event) => {
            const { xp, reason } = event.detail;
            const id = Date.now();
            
            setNotifications(prev => [...prev, { id, xp, reason }]);

            // Auto remove after 3 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 3000);
        };

        const handleLevelUp = (event) => {
            const { newLevel } = event.detail;
            const id = `level-${Date.now()}`;
            
            setNotifications(prev => [...prev, { id, xp: 0, reason: `🎉 LEVEL UP! Level ${newLevel}`, isLevelUp: true }]);

            // Auto remove after 4 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 4000);
        };

        window.addEventListener('xpEarned', handleXPEarned);
        window.addEventListener('levelUp', handleLevelUp);

        return () => {
            window.removeEventListener('xpEarned', handleXPEarned);
            window.removeEventListener('levelUp', handleLevelUp);
        };
    }, []);

    return (
        <div className="fixed top-20 right-6 z-50 space-y-3 pointer-events-none">
            {notifications.map((notif) => (
                <div
                    key={notif.id}
                    className={clsx(
                        "animate-bounce flex items-center gap-3 px-6 py-3 rounded-2xl backdrop-blur-sm border font-semibold shadow-2xl",
                        notif.isLevelUp
                            ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white border-yellow-300"
                            : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-cyan-300"
                    )}
                    style={{
                        animation: notif.isLevelUp
                            ? 'pulse 0.5s ease-in-out, slideIn 0.3s ease-out'
                            : 'slideIn 0.3s ease-out, slideOut 3s ease-in 3s forwards'
                    }}
                >
                    <Zap className={clsx(
                        "w-5 h-5",
                        notif.isLevelUp ? "animate-spin" : ""
                    )} />
                    <div className="flex flex-col">
                        <span className="text-sm">{notif.reason}</span>
                        {!notif.isLevelUp && <span className="text-xs opacity-90">+{notif.xp} XP</span>}
                    </div>
                </div>
            ))}
            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(400px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideOut {
                    to {
                        opacity: 0;
                        transform: translateX(400px);
                    }
                }
            `}</style>
        </div>
    );
};

export default XPNotification;
