import React, { useState, useEffect } from 'react';
import { Song } from '../types';

interface NowPlayingViewProps {
    isOpen: boolean;
    onClose: () => void;
    currentSong: Song | null;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onNext: () => void;
    onPrev: () => void;
    progress: number;
    currentTime: number;
    duration: number;
    onSeek?: (percent: number) => void;
}

const NowPlayingView: React.FC<NowPlayingViewProps> = ({
    isOpen,
    onClose,
    currentSong,
    isPlaying,
    onTogglePlay,
    onNext,
    onPrev,
    progress,
    currentTime,
    duration,
    onSeek
}) => {
    const [vinylRotation, setVinylRotation] = useState(0);

    // Vinyl rotation animation
    useEffect(() => {
        let animationFrame: number;
        const animate = () => {
            if (isPlaying) {
                setVinylRotation(prev => (prev + 0.5) % 360);
            }
            animationFrame = requestAnimationFrame(animate);
        };
        if (isOpen) {
            animationFrame = requestAnimationFrame(animate);
        }
        return () => cancelAnimationFrame(animationFrame);
    }, [isPlaying, isOpen]);

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen || !currentSong) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden">
            {/* Background with blur */}
            <div
                className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-40"
                style={{ backgroundImage: `url(${currentSong.coverUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />

            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 left-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all"
            >
                <i className="fas fa-chevron-down text-white"></i>
            </button>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
                {/* Vinyl Record */}
                <div className="relative mb-8">
                    {/* Vinyl disc */}
                    <div
                        className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 shadow-2xl flex items-center justify-center"
                        style={{ transform: `rotate(${vinylRotation}deg)` }}
                    >
                        {/* Vinyl grooves */}
                        <div className="absolute inset-4 rounded-full border border-neutral-700/30" />
                        <div className="absolute inset-8 rounded-full border border-neutral-700/30" />
                        <div className="absolute inset-12 rounded-full border border-neutral-700/30" />
                        <div className="absolute inset-16 rounded-full border border-neutral-700/30" />
                        <div className="absolute inset-20 rounded-full border border-neutral-700/30" />

                        {/* Center label with album art */}
                        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden shadow-inner border-4 border-neutral-800">
                            <img
                                src={currentSong.coverUrl}
                                alt={currentSong.album}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Center hole */}
                        <div className="absolute w-4 h-4 rounded-full bg-neutral-950 border border-neutral-700" />
                    </div>

                    {/* Vinyl shine effect */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Song Info */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                        {currentSong.title}
                    </h1>
                    <p className="text-lg text-emerald-400 font-medium">
                        {currentSong.artist}
                    </p>
                    <p className="text-sm text-neutral-400 mt-1">
                        {currentSong.album}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-md mb-8">
                    <div
                        className="h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden group"
                        onClick={(e) => {
                            if (onSeek) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const percent = (e.clientX - rect.left) / rect.width;
                                onSeek(percent);
                            }
                        }}
                    >
                        <div
                            className="h-full bg-emerald-400 rounded-full transition-all duration-100 relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-neutral-400">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-8">
                    <button
                        onClick={onPrev}
                        className="w-12 h-12 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                        <i className="fas fa-step-backward text-2xl"></i>
                    </button>
                    <button
                        onClick={onTogglePlay}
                        className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-transform shadow-2xl"
                    >
                        <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-3xl ${!isPlaying ? 'ml-1' : ''}`}></i>
                    </button>
                    <button
                        onClick={onNext}
                        className="w-12 h-12 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                    >
                        <i className="fas fa-step-forward text-2xl"></i>
                    </button>
                </div>
            </div>

            {/* Bottom fade */}
            <div className="h-24 bg-gradient-to-t from-black to-transparent" />
        </div>
    );
};

export default NowPlayingView;
