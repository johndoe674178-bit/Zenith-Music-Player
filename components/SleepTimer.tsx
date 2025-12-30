import React, { useState, useEffect, useCallback } from 'react';

interface SleepTimerProps {
    onTimerEnd: () => void;
    isPlaying: boolean;
}

const PRESETS = [
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
    { label: '45 min', minutes: 45 },
    { label: '1 hour', minutes: 60 },
    { label: '1.5 hours', minutes: 90 },
    { label: '2 hours', minutes: 120 },
];

const SleepTimer: React.FC<SleepTimerProps> = ({ onTimerEnd, isPlaying }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [customMinutes, setCustomMinutes] = useState('');

    // Countdown logic
    useEffect(() => {
        if (remainingSeconds === null || remainingSeconds <= 0 || !isPlaying) return;

        const interval = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev === null || prev <= 1) {
                    onTimerEnd();
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [remainingSeconds, isPlaying, onTimerEnd]);

    const startTimer = useCallback((minutes: number) => {
        setRemainingSeconds(minutes * 60);
        setIsOpen(false);
    }, []);

    const cancelTimer = useCallback(() => {
        setRemainingSeconds(null);
    }, []);

    const handleCustomStart = () => {
        const mins = parseInt(customMinutes, 10);
        if (mins > 0 && mins <= 480) {
            startTimer(mins);
            setCustomMinutes('');
        }
    };

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="relative">
            {/* Timer Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          p-2 rounded-lg transition-all flex items-center gap-2
          ${remainingSeconds !== null
                        ? 'text-emerald-400 bg-emerald-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-white/10'
                    }
        `}
                title="Sleep Timer"
            >
                <i className="fas fa-clock"></i>
                {remainingSeconds !== null && (
                    <span className="text-xs font-mono">{formatTime(remainingSeconds)}</span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-56 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-zinc-800">
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                            <i className="fas fa-moon text-emerald-400"></i>
                            Sleep Timer
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">
                            Music will stop after the timer ends
                        </p>
                    </div>

                    {/* Active Timer */}
                    {remainingSeconds !== null && (
                        <div className="p-3 border-b border-zinc-800 bg-emerald-500/10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-zinc-400">Time remaining</p>
                                    <p className="text-lg font-mono text-emerald-400">{formatTime(remainingSeconds)}</p>
                                </div>
                                <button
                                    onClick={cancelTimer}
                                    className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Presets */}
                    <div className="p-2 grid grid-cols-2 gap-1">
                        {PRESETS.map((preset) => (
                            <button
                                key={preset.minutes}
                                onClick={() => startTimer(preset.minutes)}
                                className="px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-left"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {/* Custom Input */}
                    <div className="p-3 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500 mb-2">Custom duration</p>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min="1"
                                max="480"
                                value={customMinutes}
                                onChange={(e) => setCustomMinutes(e.target.value)}
                                placeholder="Minutes"
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                            />
                            <button
                                onClick={handleCustomStart}
                                disabled={!customMinutes || parseInt(customMinutes, 10) <= 0}
                                className="px-3 py-1.5 bg-emerald-500 text-black text-sm font-medium rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Start
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SleepTimer;
