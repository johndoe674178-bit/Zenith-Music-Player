import React, { useState } from 'react';
import { Settings, AccentColor, ACCENT_COLORS, ThemeMode, AudioQuality } from '../hooks/useSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onUpdateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
    onResetSettings: () => void;
}

type TabId = 'general' | 'playback' | 'shortcuts' | 'about';

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onUpdateSetting,
    onResetSettings,
}) => {
    const [activeTab, setActiveTab] = useState<TabId>('general');

    if (!isOpen) return null;

    const tabs: { id: TabId; label: string; icon: string }[] = [
        { id: 'general', label: 'General', icon: 'fas fa-cog' },
        { id: 'playback', label: 'Playback', icon: 'fas fa-play-circle' },
        { id: 'shortcuts', label: 'Shortcuts', icon: 'fas fa-keyboard' },
        { id: 'about', label: 'About', icon: 'fas fa-info-circle' },
    ];

    const Toggle: React.FC<{
        checked: boolean;
        onChange: (checked: boolean) => void;
        label: string;
        description?: string;
    }> = ({ checked, onChange, label, description }) => (
        <div className="flex items-center justify-between py-3">
            <div>
                <p className="text-white font-medium">{label}</p>
                {description && <p className="text-sm text-zinc-400">{description}</p>}
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-zinc-600'
                    }`}
            >
                <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'left-7' : 'left-1'
                        }`}
                />
            </button>
        </div>
    );

    const Slider: React.FC<{
        value: number;
        onChange: (value: number) => void;
        min: number;
        max: number;
        label: string;
        unit?: string;
    }> = ({ value, onChange, min, max, label, unit = '' }) => (
        <div className="py-3">
            <div className="flex items-center justify-between mb-2">
                <p className="text-white font-medium">{label}</p>
                <span className="text-emerald-400 font-mono text-sm">{value}{unit}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
            />
        </div>
    );

    const renderGeneralTab = () => (
        <div className="space-y-6">
            {/* Accent Color */}
            <div className="py-3">
                <p className="text-white font-medium mb-3">Accent Color</p>
                <div className="flex gap-3">
                    {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((color) => (
                        <button
                            key={color}
                            onClick={() => onUpdateSetting('accentColor', color)}
                            className={`w-10 h-10 rounded-full transition-all ${settings.accentColor === color
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110'
                                    : 'hover:scale-105'
                                }`}
                            style={{ backgroundColor: ACCENT_COLORS[color].primary }}
                            title={color.charAt(0).toUpperCase() + color.slice(1)}
                        />
                    ))}
                </div>
            </div>

            {/* Theme */}
            <div className="py-3">
                <p className="text-white font-medium mb-3">Theme</p>
                <div className="flex gap-2">
                    {(['dark', 'light', 'system'] as ThemeMode[]).map((theme) => (
                        <button
                            key={theme}
                            onClick={() => onUpdateSetting('theme', theme)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${settings.theme === theme
                                    ? 'bg-emerald-500 text-black'
                                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                }`}
                        >
                            <i className={`fas ${theme === 'dark' ? 'fa-moon' : theme === 'light' ? 'fa-sun' : 'fa-desktop'} mr-2`}></i>
                            {theme.charAt(0).toUpperCase() + theme.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <Toggle
                checked={settings.showNowPlaying}
                onChange={(v) => onUpdateSetting('showNowPlaying', v)}
                label="Now Playing Notifications"
                description="Show notifications when a new song starts"
            />

            <Toggle
                checked={settings.autoPlay}
                onChange={(v) => onUpdateSetting('autoPlay', v)}
                label="Auto-play"
                description="Automatically start playing when opening the app"
            />
        </div>
    );

    const renderPlaybackTab = () => (
        <div className="space-y-4">
            <Toggle
                checked={settings.crossfadeEnabled}
                onChange={(v) => onUpdateSetting('crossfadeEnabled', v)}
                label="Crossfade"
                description="Smooth transition between songs"
            />

            {settings.crossfadeEnabled && (
                <Slider
                    value={settings.crossfadeDuration}
                    onChange={(v) => onUpdateSetting('crossfadeDuration', v)}
                    min={1}
                    max={12}
                    label="Crossfade Duration"
                    unit="s"
                />
            )}

            <Toggle
                checked={settings.gaplessPlayback}
                onChange={(v) => onUpdateSetting('gaplessPlayback', v)}
                label="Gapless Playback"
                description="Remove silence between tracks"
            />

            <Toggle
                checked={settings.normalizeVolume}
                onChange={(v) => onUpdateSetting('normalizeVolume', v)}
                label="Normalize Volume"
                description="Maintain consistent volume across songs"
            />

            <Toggle
                checked={settings.showLyrics}
                onChange={(v) => onUpdateSetting('showLyrics', v)}
                label="Show Lyrics"
                description="Display lyrics when available"
            />

            {/* Audio Quality */}
            <div className="py-3">
                <p className="text-white font-medium mb-3">Streaming Quality</p>
                <div className="grid grid-cols-3 gap-2">
                    {([
                        { id: 'low', label: 'Low', desc: '96 kbps' },
                        { id: 'medium', label: 'Medium', desc: '160 kbps' },
                        { id: 'high', label: 'High', desc: '320 kbps' },
                    ] as { id: AudioQuality; label: string; desc: string }[]).map((quality) => (
                        <button
                            key={quality.id}
                            onClick={() => onUpdateSetting('audioQuality' as keyof Settings, quality.id as never)}
                            className={`p-3 rounded-lg text-center transition-all ${(settings as any).audioQuality === quality.id
                                    ? 'bg-emerald-500/20 border-2 border-emerald-500'
                                    : 'bg-zinc-700/50 border-2 border-transparent hover:border-zinc-600'
                                }`}
                        >
                            <p className="text-white font-medium">{quality.label}</p>
                            <p className="text-xs text-zinc-400">{quality.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const shortcuts = [
        { keys: ['Space'], action: 'Play / Pause' },
        { keys: ['←'], action: 'Previous Track' },
        { keys: ['→'], action: 'Next Track' },
        { keys: ['↑'], action: 'Volume Up' },
        { keys: ['↓'], action: 'Volume Down' },
        { keys: ['M'], action: 'Mute / Unmute' },
        { keys: ['S'], action: 'Toggle Shuffle' },
        { keys: ['R'], action: 'Toggle Repeat' },
        { keys: ['Ctrl', 'K'], action: 'Search' },
        { keys: ['L'], action: 'Like Song' },
    ];

    const renderShortcutsTab = () => (
        <div className="space-y-2">
            <p className="text-zinc-400 text-sm mb-4">
                Use these keyboard shortcuts to control playback without touching your mouse.
            </p>
            {shortcuts.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-b-0">
                    <span className="text-zinc-300">{shortcut.action}</span>
                    <div className="flex gap-1">
                        {shortcut.keys.map((key, j) => (
                            <kbd
                                key={j}
                                className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs font-mono rounded border border-zinc-600"
                            >
                                {key}
                            </kbd>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderAboutTab = () => (
        <div className="space-y-6 text-center">
            <div className="flex flex-col items-center py-6">
                <img src="/logo.png" alt="Zenith" className="w-20 h-20 rounded-2xl mb-4" />
                <h3 className="text-2xl font-bold text-white">Zenith Music Player</h3>
                <p className="text-zinc-400">Version 1.0.0</p>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4 text-left">
                <p className="text-sm text-zinc-300 leading-relaxed">
                    A beautiful, powerful music player for your desktop and browser.
                    Stream your collection, discover new music, and enjoy stunning visuals.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                    <i className="fab fa-github text-lg"></i>
                    <span className="text-sm">GitHub</span>
                </a>
                <a
                    href="#"
                    className="flex items-center justify-center gap-2 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                    <i className="fas fa-globe text-lg"></i>
                    <span className="text-sm">Website</span>
                </a>
            </div>

            <p className="text-xs text-zinc-500">
                © 2025 Zenith Music Player. All rights reserved.
            </p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl border border-zinc-800 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <i className="fas fa-cog text-emerald-400"></i>
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <i className="fas fa-times text-lg"></i>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                    ? 'text-emerald-400'
                                    : 'text-zinc-400 hover:text-white'
                                }`}
                        >
                            <i className={`${tab.icon} mr-2`}></i>
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'general' && renderGeneralTab()}
                    {activeTab === 'playback' && renderPlaybackTab()}
                    {activeTab === 'shortcuts' && renderShortcutsTab()}
                    {activeTab === 'about' && renderAboutTab()}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-zinc-800 bg-zinc-900/50">
                    <button
                        onClick={onResetSettings}
                        className="text-sm text-zinc-400 hover:text-red-400 transition-colors"
                    >
                        <i className="fas fa-undo mr-2"></i>
                        Reset to Defaults
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-full transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
