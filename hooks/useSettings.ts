import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'emerald' | 'purple' | 'blue' | 'pink' | 'orange';
export type AudioQuality = 'low' | 'medium' | 'high';

export interface Settings {
    // Appearance
    theme: ThemeMode;
    accentColor: AccentColor;

    // Playback
    crossfadeEnabled: boolean;
    crossfadeDuration: number; // seconds
    normalizeVolume: boolean;
    gaplessPlayback: boolean;

    // Features
    showLyrics: boolean;
    autoPlay: boolean;

    // Notifications
    showNowPlaying: boolean;
}

const DEFAULT_SETTINGS: Settings = {
    theme: 'dark',
    accentColor: 'emerald',
    crossfadeEnabled: false,
    crossfadeDuration: 3,
    normalizeVolume: false,
    gaplessPlayback: true,
    showLyrics: true,
    autoPlay: false,
    showNowPlaying: true,
};

const STORAGE_KEY = 'zenith-settings';

// Accent color CSS variables
export const ACCENT_COLORS: Record<AccentColor, { primary: string; light: string; dark: string }> = {
    emerald: { primary: '#10b981', light: '#34d399', dark: '#059669' },
    purple: { primary: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed' },
    blue: { primary: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
    pink: { primary: '#ec4899', light: '#f472b6', dark: '#db2777' },
    orange: { primary: '#f97316', light: '#fb923c', dark: '#ea580c' },
};

export function useSettings() {
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }
        return DEFAULT_SETTINGS;
    });

    // Persist settings to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }, [settings]);

    // Apply accent color CSS variables
    useEffect(() => {
        const colors = ACCENT_COLORS[settings.accentColor];
        document.documentElement.style.setProperty('--accent-primary', colors.primary);
        document.documentElement.style.setProperty('--accent-light', colors.light);
        document.documentElement.style.setProperty('--accent-dark', colors.dark);
    }, [settings.accentColor]);

    const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
    }, []);

    return {
        settings,
        updateSetting,
        resetSettings,
        ACCENT_COLORS,
    };
}
