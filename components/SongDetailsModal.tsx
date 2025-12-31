import React from 'react';
import { Song } from '../types';

interface SongDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    song: Song | null;
    onEdit?: (song: Song) => void;
}

const SongDetailsModal: React.FC<SongDetailsModalProps> = ({ isOpen, onClose, song, onEdit }) => {
    if (!isOpen || !song) return null;

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Album Art Header */}
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={song.coverUrl}
                        alt={song.album}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all"
                    >
                        <i className="fas fa-times text-white text-sm"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 -mt-12 relative z-10">
                    {/* Song Info */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-1">{song.title}</h2>
                        <p className="text-emerald-400 font-medium">{song.artist}</p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Album</p>
                            <p className="text-white font-medium truncate">{song.album}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Duration</p>
                            <p className="text-white font-medium">{formatDuration(song.duration)}</p>
                        </div>
                        {song.trackNumber && (
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Track #</p>
                                <p className="text-white font-medium">{song.trackNumber}</p>
                            </div>
                        )}
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Visibility</p>
                            <p className={`font-medium ${song.isPublic ? 'text-purple-400' : 'text-neutral-400'}`}>
                                <i className={`fas ${song.isPublic ? 'fa-globe' : 'fa-lock'} mr-2`}></i>
                                {song.isPublic ? 'Public' : 'Private'}
                            </p>
                        </div>
                    </div>

                    {/* Waveform Placeholder */}
                    <div className="bg-white/5 rounded-xl p-4 mb-6">
                        <p className="text-xs text-neutral-500 uppercase tracking-wider mb-3">Waveform</p>
                        <div className="flex items-end justify-center gap-[2px] h-16">
                            {Array.from({ length: 50 }).map((_, i) => {
                                const height = 20 + Math.sin(i * 0.3) * 30 + Math.random() * 20;
                                return (
                                    <div
                                        key={i}
                                        className="w-1 bg-emerald-500/60 rounded-full"
                                        style={{ height: `${Math.min(height, 100)}%` }}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {onEdit && (
                            <button
                                onClick={() => {
                                    onEdit(song);
                                    onClose();
                                }}
                                className="flex-1 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
                            >
                                <i className="fas fa-edit mr-2"></i>
                                Edit Details
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SongDetailsModal;
