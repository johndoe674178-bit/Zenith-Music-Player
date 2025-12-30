const { contextBridge, ipcRenderer } = require('electron');

// Expose Electron APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    toggleMiniPlayer: () => ipcRenderer.invoke('toggle-mini-player'),
    getMiniPlayerState: () => ipcRenderer.invoke('get-mini-player-state'),
    closeWindow: () => ipcRenderer.invoke('close-window'),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),

    // State sync
    getSharedState: () => ipcRenderer.invoke('get-shared-state'),
    updateSharedState: (state) => ipcRenderer.invoke('update-shared-state', state),
    sendPlaybackAction: (action) => ipcRenderer.invoke('playback-action', action),

    // Event listeners
    onPlaybackStateUpdate: (callback) => {
        ipcRenderer.on('playback-state-update', (event, state) => callback(state));
    },
    onPlaybackAction: (callback) => {
        ipcRenderer.on('playback-action', (event, action) => callback(action));
    },

    isElectron: true,
});
