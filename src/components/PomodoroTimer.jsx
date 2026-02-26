
import React, { useReducer, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { useGamification } from '../hooks/useGamification';
import clsx from 'clsx';

const WORK_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60; // 5 minutes

const initialState = {
    timeLeft: WORK_TIME,
    isActive: false,
    mode: 'work'
};

const timerReducer = (state, action) => {
    switch (action.type) {
        case 'toggle':
            return { ...state, isActive: !state.isActive };
        case 'reset':
            return { ...state, isActive: false, timeLeft: state.mode === 'work' ? WORK_TIME : BREAK_TIME };
        case 'tick':
            if (!state.isActive || state.timeLeft <= 0) return state;
            return { ...state, timeLeft: state.timeLeft - 1 };
        case 'sessionComplete':
            return state.mode === 'work'
                ? { timeLeft: BREAK_TIME, isActive: false, mode: 'break' }
                : { timeLeft: WORK_TIME, isActive: false, mode: 'work' };
        default:
            return state;
    }
};

const PomodoroTimer = () => {
    const [state, dispatch] = useReducer(timerReducer, initialState);
    const { timeLeft, isActive, mode } = state;
    const { addXP } = useGamification();

    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;

        const interval = setInterval(() => {
            dispatch({ type: 'tick' });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    useEffect(() => {
        if (timeLeft !== 0) return;

        if (mode === 'work') {
            addXP(50);
            alert("Work session complete! +50 XP!");
        } else {
            alert("Break over! Time to focus.");
        }

        dispatch({ type: 'sessionComplete' });
    }, [timeLeft, mode, addXP]);

    const toggleTimer = () => dispatch({ type: 'toggle' });

    const resetTimer = () => dispatch({ type: 'reset' });

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-card border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            {/* Background specific to mode */}
            <div className={clsx(
                "absolute inset-0 opacity-5 transition-colors duration-500",
                mode === 'work' ? "bg-red-500" : "bg-green-500"
            )} />

            <div className="relative z-10 flex flex-col items-center w-full">
                <div className="flex items-center gap-2 mb-2 text-sm font-bold uppercase tracking-wider text-gray-400">
                    {mode === 'work' ? <Brain className="w-4 h-4 text-red-400" /> : <Coffee className="w-4 h-4 text-green-400" />}
                    {mode === 'work' ? "Focus Time" : "Break Time"}
                </div>

                <div className="text-5xl font-mono font-bold text-white mb-6 tabular-nums tracking-widest">
                    {formatTime(timeLeft)}
                </div>

                <div className="flex gap-4 w-full justify-center">
                    <button
                        onClick={toggleTimer}
                        className={clsx(
                            "flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95",
                            isActive
                                ? "bg-gray-700 border border-gray-600"
                                : mode === 'work' ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-green-500 to-teal-500"
                        )}
                    >
                        {isActive ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" /> Start</>}
                    </button>

                    <button
                        onClick={resetTimer}
                        className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors border border-gray-700"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PomodoroTimer;
