import React, { createContext, useContext } from 'react';
import { useGamification } from '../hooks/useGamification';

const GamificationContext = createContext();

export const GamificationProvider = ({ children }) => {
    const gamification = useGamification();
    
    console.log("🎮 GamificationProvider rendering with:", {
        xp: gamification.xp,
        level: gamification.level,
        addXP: typeof gamification.addXP
    });
    
    return (
        <GamificationContext.Provider value={gamification}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamificationContext = () => {
    const context = useContext(GamificationContext);
    if (!context) {
        throw new Error('useGamificationContext must be used within GamificationProvider');
    }
    console.log("📊 useGamificationContext called, returning:", {
        xp: context.xp,
        level: context.level
    });
    return context;
};
