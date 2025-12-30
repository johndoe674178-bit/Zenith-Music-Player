import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { useAuth } from '../components/AuthContext';

interface Profile {
    id: string;
    display_name: string | null;
}

interface UseProfileReturn {
    profile: Profile | null;
    loading: boolean;
    updateDisplayName: (name: string) => Promise<boolean>;
    refreshProfile: () => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!user || !isSupabaseConfigured) {
            setProfile(null);
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setProfile({
                    id: data.id,
                    display_name: data.display_name,
                });
            } else {
                // Create profile if it doesn't exist
                const defaultName = user.email?.split('@')[0] || 'User';
                const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert({ id: user.id, display_name: defaultName })
                    .select()
                    .single();

                if (!insertError && newProfile) {
                    setProfile({
                        id: newProfile.id,
                        display_name: newProfile.display_name,
                    });
                }
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateDisplayName = useCallback(async (name: string): Promise<boolean> => {
        if (!user) return false;

        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ display_name: name, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (error) throw error;

            setProfile((prev) => prev ? { ...prev, display_name: name } : null);
            return true;
        } catch (err) {
            console.error('Failed to update display name:', err);
            return false;
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        profile,
        loading,
        updateDisplayName,
        refreshProfile: fetchProfile,
    };
};
