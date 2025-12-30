import React, { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';

interface MiniPlayerProps {
    currentSong: Song | null;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    onExpandPlayer: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({
    currentSong: propSong,
    isPlaying: propIsPlaying,
    onTogglePlay,
    onNext,
    onPrev,
    onExpandPlayer,
}) => {
    const [currentSong, setCurrentSong] = useState<Song | null>(propSong);
    const [isPlaying, setIsPlaying] = useState(propIsPlaying);
    const [progress, setProgress] = useState(0);

    // Get initial state and listen for updates
    useEffect(() => {
        if (window.electronAPI?.isElectron) {
            // Get initial state
            window.electronAPI.getSharedState().then((state) => {
                if (state.currentSong) {
                    setCurrentSong(state.currentSong);
                }
                setIsPlaying(state.isPlaying);
            });

            // Listen for updates
            window.electronAPI.onPlaybackStateUpdate((state) => {
                if (state.currentSong) {
                    setCurrentSong(state.currentSong);
                }
                setIsPlaying(state.isPlaying);
            });
        }
    }, []);

    // Sync with props as fallback
    useEffect(() => {
        if (!window.electronAPI?.isElectron) {
            setCurrentSong(propSong);
            setIsPlaying(propIsPlaying);
        }
    }, [propSong, propIsPlaying]);

    // Simulate progress
    useEffect(() => {
        let interval: number | null = null;
        if (isPlaying) {
            interval = window.setInterval(() => {
                setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
            }, 500);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPlaying]);

    const handleTogglePlay = useCallback(async () => {
        if (window.electronAPI?.isElectron) {
            const newState = { isPlaying: !isPlaying };
            await window.electronAPI.updateSharedState(newState);
        } else {
            onTogglePlay();
        }
    }, [isPlaying, onTogglePlay]);

    const handleNext = useCallback(async () => {
        if (window.electronAPI?.isElectron) {
            await window.electronAPI.sendPlaybackAction('next');
        }
        onNext();
    }, [onNext]);

    const handlePrev = useCallback(async () => {
        if (window.electronAPI?.isElectron) {
            await window.electronAPI.sendPlaybackAction('prev');
        }
        onPrev();
    }, [onPrev]);

    const handleClose = async () => {
        if (window.electronAPI) {
            await window.electronAPI.closeWindow();
        }
    };

    const handleMinimize = async () => {
        if (window.electronAPI) {
            await window.electronAPI.minimizeWindow();
        }
    };

    if (!currentSong) {
        return (
            <div className="h-screen bg-zinc-900 flex items-center justify-center text-zinc-500 text-sm">
                <p>No song playing</p>
            </div>
        );
    }

    return (
        <div
            className="h-screen bg-gradient-to-r from-zinc-900 to-black flex flex-col overflow-hidden select-none"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            {/* Progress bar at top */}
            <div className="h-1 bg-zinc-800 w-full">
                <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Main content */}
            <div className="flex-1 flex items-center px-3 py-2 gap-3">
                {/* Album art with animation */}
                <div className="relative w-14 h-14 flex-shrink-0">
                    <img
                        src={currentSong.coverUrl}
                        alt=""
                        className={`w-14 h-14 rounded-lg shadow-xl object-cover ${isPlaying ? 'animate-pulse' : ''}`}
                    />
                    {isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                            <div className="flex items-end space-x-0.5 h-4">
                                <div className="w-0.5 bg-emerald-400 animate-[bounce_0.5s_infinite_alternate]" style={{ height: '60%' }}></div>
                                <div className="w-0.5 bg-emerald-400 animate-[bounce_0.6s_infinite_alternate]" style={{ height: '100%' }}></div>
                                <div className="w-0.5 bg-emerald-400 animate-[bounce_0.4s_infinite_alternate]" style={{ height: '40%' }}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Song info */}
                <div className="flex-1 overflow-hidden min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate leading-tight">{currentSong.title}</h4>
                    <p className="text-xs text-zinc-400 truncate">{currentSong.artist}</p>
                </div>

                {/* Controls */}
                <div
                    className="flex items-center gap-1"
                    style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                    <button
                        onClick={handlePrev}
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                    >
                        <i className="fas fa-step-backward text-xs"></i>
                    </button>
                    <button
                        onClick={handleTogglePlay}
                        className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-black hover:scale-105 transition-transform shadow-lg"
                    >
                        <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-sm ${!isPlaying ? 'ml-0.5' : ''}`}></i>
                    </button>
                    <button
                        onClick={handleNext}
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                    >
                        <i className="fas fa-step-forward text-xs"></i>
                    </button>
                </div>

                {/* Window controls */}
                <div
                    className="flex items-center gap-1 ml-2 border-l border-zinc-700 pl-2"
                    style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                    <button
                        onClick={onExpandPlayer}
                        className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-all"
                        title="Expand to full player"
                    >
                        <i className="fas fa-expand-alt text-xs"></i>
                    </button>
                    <button
                        onClick={handleMinimize}
                        className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 rounded transition-all"
                        title="Minimize"
                    >
                        <i className="fas fa-minus text-xs"></i>
                    </button>
                    <button
                        onClick={handleClose}
                        className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                        title="Close"
                    >
                        <i className="fas fa-times text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MiniPlayer;
