import { useState, useEffect, useCallback } from 'react';
import { Song } from '../types';

const STORAGE_KEY = 'zenith-recently-played';
const MAX_ITEMS = 50;

export function useRecentlyPlayed() {
    const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setRecentlyPlayed(parsed);
                }
            }
        } catch (e) {
            console.warn('Failed to load recently played:', e);
        }
    }, []);

    // Save to localStorage when updated
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyPlayed));
        } catch (e) {
            console.warn('Failed to save recently played:', e);
        }
    }, [recentlyPlayed]);

    const addToRecentlyPlayed = useCallback((song: Song) => {
        setRecentlyPlayed((prev) => {
            // Remove if already exists (to move to top)
            const filtered = prev.filter((s) => s.id !== song.id);
            // Add to beginning and limit size
            return [song, ...filtered].slice(0, MAX_ITEMS);
        });
    }, []);

    const clearRecentlyPlayed = useCallback(() => {
        setRecentlyPlayed([]);
    }, []);

    return {
        recentlyPlayed,
        addToRecentlyPlayed,
        clearRecentlyPlayed,
    };
}
