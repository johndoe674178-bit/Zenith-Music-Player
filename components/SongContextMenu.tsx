import React, { useState, useRef, useEffect } from 'react';
import { Song } from '../types';

interface SongContextMenuProps {
    song: Song;
    position: { x: number; y: number };
    onClose: () => void;
    onEdit?: (song: Song) => void;
    onDelete?: (songId: string) => void;
    onAddToQueue?: (song: Song) => void;
    onPlayNext?: (song: Song) => void;
    onToggleLike?: (song: Song) => void;
    isLiked?: boolean;
    isOwner?: boolean;
}

const SongContextMenu: React.FC<SongContextMenuProps> = ({
    song,
    position,
    onClose,
    onEdit,
    onDelete,
    onAddToQueue,
    onPlayNext,
    onToggleLike,
    isLiked = false,
    isOwner = false,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPosition, setAdjustedPosition] = useState(position);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        // Adjust position if menu would go off screen
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const adjustedX = position.x + rect.width > window.innerWidth
                ? position.x - rect.width
                : position.x;
            const adjustedY = position.y + rect.height > window.innerHeight
                ? window.innerHeight - rect.height - 10
                : position.y;
            setAdjustedPosition({ x: adjustedX, y: adjustedY });
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose, position]);

    const MenuItem: React.FC<{
        icon: string;
        label: string;
        onClick: () => void;
        danger?: boolean;
        disabled?: boolean;
    }> = ({ icon, label, onClick, danger = false, disabled = false }) => (
        <button
            onClick={() => {
                onClick();
                onClose();
            }}
            disabled={disabled}
            className={`
        w-full flex items-center space-x-3 px-4 py-2.5 text-left text-sm
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-white hover:bg-white/10'
                }
      `}
        >
            <i className={`${icon} w-4 text-center`}></i>
            <span>{label}</span>
        </button>
    );

    return (
        <div
            ref={menuRef}
            className="fixed z-[300] bg-zinc-900 border border-white/10 rounded-lg shadow-2xl py-2 min-w-[200px] animate-[fadeIn_0.1s_ease-out]"
            style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
        >
            {/* Song Preview */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center space-x-3">
                <img src={song.coverUrl} className="w-10 h-10 rounded shadow object-cover" alt="" />
                <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-white text-sm truncate">{song.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
                {onAddToQueue && (
                    <MenuItem
                        icon="fas fa-list"
                        label="Add to queue"
                        onClick={() => onAddToQueue(song)}
                    />
                )}

                {onPlayNext && (
                    <MenuItem
                        icon="fas fa-step-forward"
                        label="Play next"
                        onClick={() => onPlayNext(song)}
                    />
                )}

                {onToggleLike && (
                    <MenuItem
                        icon={isLiked ? 'fas fa-heart' : 'far fa-heart'}
                        label={isLiked ? 'Remove from Liked' : 'Add to Liked'}
                        onClick={() => onToggleLike(song)}
                    />
                )}

                <div className="border-t border-white/10 my-1"></div>

                {isOwner && onEdit && (
                    <MenuItem
                        icon="fas fa-edit"
                        label="Edit details"
                        onClick={() => onEdit(song)}
                    />
                )}

                {isOwner && onDelete && (
                    <MenuItem
                        icon="fas fa-trash"
                        label="Delete"
                        onClick={() => onDelete(song.id)}
                        danger
                    />
                )}
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
        </div>
    );
};

export default SongContextMenu;
