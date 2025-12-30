import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Song } from '../types';

interface SearchBarProps {
    songs: Song[];
    onPlaySong: (song: Song) => void;
    onAddToQueue: (song: Song) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ songs, onPlaySong, onAddToQueue }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        return songs
            .filter(
                (song) =>
                    song.title.toLowerCase().includes(lowerQuery) ||
                    song.artist.toLowerCase().includes(lowerQuery) ||
                    song.album.toLowerCase().includes(lowerQuery)
            )
            .slice(0, 8);
    }, [query, songs]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Global keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                setIsOpen(true);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            e.preventDefault();
            onPlaySong(results[selectedIndex]);
            setQuery('');
            setIsOpen(false);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            inputRef.current?.blur();
        }
    };

    const handleSongClick = (song: Song) => {
        onPlaySong(song);
        setQuery('');
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-md">
            {/* Search Input */}
            <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search songs, artists, albums..."
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-full pl-10 pr-16 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 bg-zinc-700/50 text-zinc-400 text-[10px] font-mono rounded">
                        Ctrl+K
                    </kbd>
                </div>
            </div>

            {/* Results Dropdown */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-2 border-b border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider px-2">
                            {results.length} result{results.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {results.map((song, index) => (
                            <div
                                key={song.id}
                                onClick={() => handleSongClick(song)}
                                className={`
                  flex items-center gap-3 p-3 cursor-pointer transition-colors
                  ${index === selectedIndex ? 'bg-emerald-500/20' : 'hover:bg-white/5'}
                `}
                            >
                                <img
                                    src={song.coverUrl}
                                    alt=""
                                    className="w-10 h-10 rounded object-cover shadow"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{song.title}</p>
                                    <p className="text-xs text-zinc-400 truncate">
                                        {song.artist} • {song.album}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-500">{song.duration}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddToQueue(song);
                                        }}
                                        className="p-1.5 text-zinc-400 hover:text-emerald-400 transition-colors"
                                        title="Add to queue"
                                    >
                                        <i className="fas fa-plus text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 px-3">
                        <span><kbd className="px-1 py-0.5 bg-zinc-700/50 rounded">↑↓</kbd> to navigate</span>
                        <span><kbd className="px-1 py-0.5 bg-zinc-700/50 rounded">Enter</kbd> to play</span>
                        <span><kbd className="px-1 py-0.5 bg-zinc-700/50 rounded">Esc</kbd> to close</span>
                    </div>
                </div>
            )}

            {/* No Results */}
            {isOpen && query.trim() && results.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl p-8 text-center z-50">
                    <i className="fas fa-search text-3xl text-zinc-600 mb-3"></i>
                    <p className="text-sm text-zinc-400">No results for "{query}"</p>
                    <p className="text-xs text-zinc-500 mt-1">Try a different search term</p>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
