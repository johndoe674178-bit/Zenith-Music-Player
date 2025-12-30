import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Song } from '../types';
import { useAuth } from '../components/AuthContext';

interface UseSupabaseSongsReturn {
    songs: Song[];
    loading: boolean;
    error: string | null;
    uploadSong: (file: File, metadata: Partial<Song>) => Promise<Song | null>;
    deleteSong: (songId: string) => Promise<boolean>;
    updateSong: (songId: string, updates: { title: string; artist: string; album: string }) => Promise<boolean>;
    uploadAlbum: (songs: { file: File, title: string }[], metadata: { title: string; artist: string; cover?: File }) => Promise<Song[]>;
    togglePublic: (songId: string, isPublic: boolean) => Promise<boolean>;
    refreshSongs: () => Promise<void>;
}

export const useSupabaseSongs = (): UseSupabaseSongsReturn => {
    const { user } = useAuth();
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSongs = useCallback(async () => {
        if (!user) {
            setSongs([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('songs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            // Transform database records to Song type
            const transformedSongs: Song[] = (data || []).map((record) => ({
                id: record.id,
                user_id: record.user_id,
                title: record.title,
                artist: record.artist || 'Unknown Artist',
                album: record.album || 'Unknown Album',
                duration: record.duration || 0,
                coverUrl: record.cover_url || 'https://picsum.photos/seed/default/300/300',
                audioUrl: record.audio_url || '',
                isPublic: record.is_public || false,
            }));

            setSongs(transformedSongs);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch songs');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSongs();
    }, [fetchSongs]);

    const uploadSong = useCallback(async (file: File, metadata: Partial<Song>): Promise<Song | null> => {
        if (!user) {
            setError('You must be logged in to upload songs');
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            // Generate unique file path
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('music')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            // Get public URL for the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from('music')
                .getPublicUrl(fileName);

            // Get audio duration
            const duration = await getAudioDuration(file);

            // Insert record into database
            const { data: songData, error: insertError } = await supabase
                .from('songs')
                .insert({
                    user_id: user.id,
                    title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
                    artist: metadata.artist || 'Unknown Artist',
                    album: metadata.album || 'Unknown Album',
                    duration: duration,
                    cover_url: metadata.coverUrl || 'https://picsum.photos/seed/upload/300/300',
                    audio_url: publicUrl,
                    audio_path: fileName,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            const newSong: Song = {
                id: songData.id,
                user_id: songData.user_id,
                title: songData.title,
                artist: songData.artist,
                album: songData.album,
                duration: songData.duration,
                coverUrl: songData.cover_url,
                audioUrl: songData.audio_url,
                isPublic: songData.is_public || false,
            };

            setSongs((prev) => [newSong, ...prev]);
            return newSong;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload song');
            return null;
        } finally {
            setLoading(false);
        }
    }, [user]);

    const deleteSong = useCallback(async (songId: string): Promise<boolean> => {
        if (!user) {
            setError('You must be logged in to delete songs');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            // Get the song to find the audio path
            const { data: songData, error: fetchError } = await supabase
                .from('songs')
                .select('audio_path')
                .eq('id', songId)
                .single();

            if (fetchError) throw fetchError;

            // Delete from storage
            if (songData?.audio_path) {
                await supabase.storage
                    .from('music')
                    .remove([songData.audio_path]);
            }

            // Delete from database
            const { error: deleteError } = await supabase
                .from('songs')
                .delete()
                .eq('id', songId);

            if (deleteError) throw deleteError;

            setSongs((prev) => prev.filter((s) => s.id !== songId));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete song');
            return false;
        } finally {
            setLoading(false);
        }
    }, [user]);

    const togglePublic = useCallback(async (songId: string, isPublic: boolean): Promise<boolean> => {
        if (!user) {
            setError('You must be logged in to update songs');
            return false;
        }

        try {
            const { error: updateError } = await supabase
                .from('songs')
                .update({ is_public: isPublic })
                .eq('id', songId)
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            setSongs((prev) => prev.map((s) =>
                s.id === songId ? { ...s, isPublic } : s
            ));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update song');
            return false;
        }
    }, [user]);

    const updateSong = useCallback(async (songId: string, updates: { title: string; artist: string; album: string }): Promise<boolean> => {
        if (!user) {
            setError('You must be logged in to update songs');
            return false;
        }

        try {
            const { error: updateError } = await supabase
                .from('songs')
                .update({
                    title: updates.title,
                    artist: updates.artist,
                    album: updates.album,
                })
                .eq('id', songId)
                .eq('user_id', user.id);

            if (updateError) throw updateError;

            setSongs((prev) => prev.map((s) =>
                s.id === songId ? { ...s, ...updates } : s
            ));
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update song');
            return false;
        }
    }, [user]);

    const uploadAlbum = useCallback(async (songs: { file: File, title: string }[], metadata: { title: string; artist: string; cover?: File }): Promise<Song[]> => {
        if (!user) {
            setError('You must be logged in to upload songs');
            return [];
        }

        setLoading(true);
        setError(null);
        const uploadedSongs: Song[] = [];

        try {
            // 1. Upload Cover Art (if provided)
            let coverUrl = 'https://picsum.photos/seed/' + encodeURIComponent(metadata.title) + '/300/300';

            if (metadata.cover) {
                const fileExt = metadata.cover.name.split('.').pop();
                const fileName = `${user.id}/covers/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('music')
                    .upload(fileName, metadata.cover, { cacheControl: '3600', upsert: false });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('music').getPublicUrl(fileName);
                coverUrl = publicUrl;
            }

            // 2. Upload Each Song
            for (let i = 0; i < songs.length; i++) {
                const { file, title } = songs[i];
                const trackNumber = i + 1; // 1-based index

                // Generate unique file path
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}-${trackNumber}.${fileExt}`;

                // Upload Audio
                const { error: uploadError } = await supabase.storage
                    .from('music')
                    .upload(fileName, file, { cacheControl: '3600', upsert: false });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('music').getPublicUrl(fileName);
                const duration = await getAudioDuration(file);

                // Insert into DB
                const { data: songData, error: insertError } = await supabase
                    .from('songs')
                    .insert({
                        user_id: user.id,
                        title: title || file.name.replace(/\.[^/.]+$/, ''), // Use provided title or fallback
                        artist: metadata.artist || 'Unknown Artist',
                        album: metadata.title || 'Unknown Album',
                        duration: duration,
                        cover_url: coverUrl,
                        audio_url: publicUrl,
                        audio_path: fileName,
                        track_number: trackNumber, // Save order
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                uploadedSongs.push({
                    id: songData.id,
                    user_id: songData.user_id,
                    title: songData.title,
                    artist: songData.artist,
                    album: songData.album,
                    duration: songData.duration,
                    coverUrl: songData.cover_url,
                    audioUrl: songData.audio_url,
                    isPublic: songData.is_public || false,
                    trackNumber: songData.track_number,
                });
            }

            setSongs((prev) => [...uploadedSongs, ...prev]);
            return uploadedSongs;

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload album');
            // Consistent error handling - could implement rollback here in a real app
            return [];
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        songs,
        loading,
        error,
        uploadSong,
        uploadAlbum,
        deleteSong,
        updateSong,
        togglePublic,
        refreshSongs: fetchSongs,
    };
};

// Helper function to get audio duration
const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
        const audio = new Audio();
        audio.addEventListener('loadedmetadata', () => {
            resolve(Math.round(audio.duration));
        });
        audio.addEventListener('error', () => {
            resolve(0);
        });
        audio.src = URL.createObjectURL(file);
    });
};
