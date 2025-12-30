import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Song } from '../types';
import { useAuth } from '../components/AuthContext';

interface UseLikedSongsReturn {
    likedSongs: Song[];
    likedSongIds: Set<string>;
    loading: boolean;
    toggleLike: (song: Song) => Promise<void>;
    isLiked: (songId: string) => boolean;
}

export const useLikedSongs = (): UseLikedSongsReturn => {
    const { user } = useAuth();
    const [likedSongs, setLikedSongs] = useState<Song[]>([]);
    const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    const fetchLikedSongs = useCallback(async () => {
        if (!user) {
            setLikedSongs([]);
            setLikedSongIds(new Set());
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('liked_songs')
                .select(`
          song_id,
          songs (*)
        `)
                .eq('user_id', user.id);

            if (error) throw error;

            const songs: Song[] = (data || [])
                .filter((item) => item.songs)
                .map((item) => {
                    const record = item.songs as unknown as Record<string, unknown>;
                    return {
                        id: record.id as string,
                        user_id: record.user_id as string,
                        title: record.title as string,
                        artist: (record.artist as string) || 'Unknown Artist',
                        album: (record.album as string) || 'Unknown Album',
                        duration: (record.duration as number) || 0,
                        coverUrl: (record.cover_url as string) || 'https://picsum.photos/seed/default/300/300',
                        audioUrl: (record.audio_url as string) || '',
                    };
                });

            setLikedSongs(songs);
            setLikedSongIds(new Set(songs.map((s) => s.id)));
        } catch (err) {
            console.error('Failed to fetch liked songs:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchLikedSongs();
    }, [fetchLikedSongs]);

    const toggleLike = useCallback(async (song: Song) => {
        if (!user) return;

        const isCurrentlyLiked = likedSongIds.has(song.id);

        try {
            if (isCurrentlyLiked) {
                // Unlike
                await supabase
                    .from('liked_songs')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('song_id', song.id);

                setLikedSongs((prev) => prev.filter((s) => s.id !== song.id));
                setLikedSongIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(song.id);
                    return newSet;
                });
            } else {
                // Like
                await supabase
                    .from('liked_songs')
                    .insert({ user_id: user.id, song_id: song.id });

                setLikedSongs((prev) => [song, ...prev]);
                setLikedSongIds((prev) => new Set([...prev, song.id]));
            }
        } catch (err) {
            console.error('Failed to toggle like:', err);
        }
    }, [user, likedSongIds]);

    const isLiked = useCallback((songId: string) => {
        return likedSongIds.has(songId);
    }, [likedSongIds]);

    return {
        likedSongs,
        likedSongIds,
        loading,
        toggleLike,
        isLiked,
    };
};
