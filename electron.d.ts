// TypeScript declarations for Electron API exposed via preload
interface PlaybackState {
    currentSong: import('./types').Song | null;
    isPlaying: boolean;
}

interface ElectronAPI {
    toggleMiniPlayer: () => Promise<boolean>;
    getMiniPlayerState: () => Promise<boolean>;
    closeWindow: () => Promise<void>;
    minimizeWindow: () => Promise<void>;

    // State sync
    getSharedState: () => Promise<PlaybackState>;
    updateSharedState: (state: Partial<PlaybackState>) => Promise<PlaybackState>;
    sendPlaybackAction: (action: string) => Promise<void>;

    // Event listeners
    onPlaybackStateUpdate: (callback: (state: PlaybackState) => void) => void;
    onPlaybackAction: (callback: (action: string) => void) => void;

    isElectron: boolean;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export { };
