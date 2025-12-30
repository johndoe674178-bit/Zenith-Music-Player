import React from 'react';
import { Song } from '../types';

interface QueuePanelProps {
    queue: Song[];
    currentSong: Song | null;
    onPlaySong: (song: Song) => void;
    onRemoveFromQueue: (index: number) => void;
    onClearQueue: () => void;
    onReorderQueue: (fromIndex: number, toIndex: number) => void;
    onClose: () => void;
}

const QueuePanel: React.FC<QueuePanelProps> = ({
    queue,
    currentSong,
    onPlaySong,
    onRemoveFromQueue,
    onClearQueue,
    onReorderQueue,
    onClose,
}) => {
    const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== toIndex) {
            onReorderQueue(draggedIndex, toIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-zinc-900/95 backdrop-blur-xl border-l border-zinc-800 z-50 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                    <i className="fas fa-list-ol text-emerald-400"></i>
                    <h2 className="text-lg font-semibold text-white">Queue</h2>
                    <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                        {queue.length} songs
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                    <i className="fas fa-times"></i>
                </button>
            </div>

            {/* Now Playing */}
            {currentSong && (
                <div className="p-4 border-b border-zinc-800 bg-zinc-800/50">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Now Playing</p>
                    <div className="flex items-center gap-3">
                        <img
                            src={currentSong.coverUrl}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover shadow-lg"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{currentSong.title}</p>
                            <p className="text-xs text-zinc-400 truncate">{currentSong.artist}</p>
                        </div>
                        <div className="flex items-end space-x-0.5 h-4">
                            <div className="w-0.5 bg-emerald-400 animate-[bounce_0.5s_infinite_alternate]" style={{ height: '60%' }}></div>
                            <div className="w-0.5 bg-emerald-400 animate-[bounce_0.6s_infinite_alternate]" style={{ height: '100%' }}></div>
                            <div className="w-0.5 bg-emerald-400 animate-[bounce_0.4s_infinite_alternate]" style={{ height: '40%' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Queue Actions */}
            {queue.length > 0 && (
                <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider">Up Next</p>
                    <button
                        onClick={onClearQueue}
                        className="text-xs text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1"
                    >
                        <i className="fas fa-trash-alt text-[10px]"></i>
                        Clear
                    </button>
                </div>
            )}

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto">
                {queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8 text-center">
                        <i className="fas fa-music text-4xl mb-4 opacity-50"></i>
                        <p className="text-sm font-medium">Your queue is empty</p>
                        <p className="text-xs mt-1">Right-click on a song to add it to the queue</p>
                    </div>
                ) : (
                    <div className="p-2">
                        {queue.map((song, index) => (
                            <div
                                key={`${song.id}-${index}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`
                  group flex items-center gap-3 p-2 rounded-lg cursor-grab active:cursor-grabbing
                  transition-all duration-150
                  ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
                  ${dragOverIndex === index ? 'bg-emerald-500/20 border-t-2 border-emerald-500' : 'hover:bg-white/5'}
                `}
                            >
                                {/* Drag Handle */}
                                <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                    <i className="fas fa-grip-vertical text-xs"></i>
                                </div>

                                {/* Position */}
                                <span className="w-5 text-xs text-zinc-500 text-center font-mono">
                                    {index + 1}
                                </span>

                                {/* Cover */}
                                <img
                                    src={song.coverUrl}
                                    alt=""
                                    className="w-10 h-10 rounded object-cover shadow"
                                />

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{song.title}</p>
                                    <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                                </div>

                                {/* Duration */}
                                <span className="text-xs text-zinc-500">{song.duration}</span>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onPlaySong(song)}
                                        className="p-1.5 text-zinc-400 hover:text-emerald-400 transition-colors"
                                        title="Play now"
                                    >
                                        <i className="fas fa-play text-xs"></i>
                                    </button>
                                    <button
                                        onClick={() => onRemoveFromQueue(index)}
                                        className="p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
                                        title="Remove from queue"
                                    >
                                        <i className="fas fa-times text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Total Duration */}
            {queue.length > 0 && (
                <div className="p-4 border-t border-zinc-800 text-center">
                    <p className="text-xs text-zinc-500">
                        Total: {queue.length} songs
                    </p>
                </div>
            )}
        </div>
    );
};

export default QueuePanel;
