import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Song } from '../types';

interface UsePublicSongsReturn {
    publicSongs: Song[];
    loading: boolean;
    refreshPublicSongs: () => Promise<void>;
}

export const usePublicSongs = (): UsePublicSongsReturn => {
    const [publicSongs, setPublicSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPublicSongs = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setPublicSongs([]);
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('songs')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedSongs: Song[] = (data || []).map((record) => ({
                id: record.id,
                user_id: record.user_id,
                title: record.title,
                artist: record.artist || 'Unknown Artist',
                album: record.album || 'Unknown Album',
                duration: record.duration || 0,
                coverUrl: record.cover_url || 'https://picsum.photos/seed/default/300/300',
                audioUrl: record.audio_url || '',
                isPublic: record.is_public,
            }));

            setPublicSongs(transformedSongs);
        } catch (err) {
            console.error('Failed to fetch public songs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPublicSongs();
    }, [fetchPublicSongs]);

    return {
        publicSongs,
        loading,
        refreshPublicSongs: fetchPublicSongs,
    };
};
