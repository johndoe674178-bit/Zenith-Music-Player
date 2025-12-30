const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// electron-squirrel-startup is optional
try {
    if (require('electron-squirrel-startup')) {
        app.quit();
    }
} catch (e) {
    // Module not found, ignore
}

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let miniPlayerWindow;
let isMiniPlayer = false;

// Shared playback state
let sharedState = {
    currentSong: null,
    isPlaying: false,
};

// Window configurations
const MAIN_WINDOW_CONFIG = {
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
};

const MINI_PLAYER_CONFIG = {
    width: 350,
    height: 120,
    minWidth: 280,
    minHeight: 100,
    maxWidth: 450,
    maxHeight: 150,
};

function createMainWindow() {
    mainWindow = new BrowserWindow({
        ...MAIN_WINDOW_CONFIG,
        backgroundColor: '#000000',
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#000000',
            symbolColor: '#ffffff',
            height: 40
        },
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'electron-preload.cjs'),
        },
    });

    loadApp(mainWindow);

    mainWindow.on('closed', () => {
        mainWindow = null;
        if (miniPlayerWindow) {
            miniPlayerWindow.close();
        }
    });
}

function createMiniPlayerWindow() {
    miniPlayerWindow = new BrowserWindow({
        ...MINI_PLAYER_CONFIG,
        backgroundColor: '#000000',
        frame: false,
        alwaysOnTop: true,
        resizable: true,
        skipTaskbar: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'electron-preload.cjs'),
        },
    });

    loadApp(miniPlayerWindow, '?miniPlayer=true');

    miniPlayerWindow.on('closed', () => {
        miniPlayerWindow = null;
        isMiniPlayer = false;
        // Show main window when mini player is closed
        if (mainWindow) {
            mainWindow.show();
        }
    });
}

function loadApp(window, queryParams = '') {
    if (isDev) {
        window.loadURL(`http://localhost:3000${queryParams}`);
        // Only open devtools for main window in dev
        if (window === mainWindow) {
            window.webContents.openDevTools();
        }
    } else {
        window.loadFile(path.join(__dirname, 'dist', 'index.html'), {
            search: queryParams.replace('?', '')
        });
    }

    // Open external links in browser
    window.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

// Broadcast state to all windows
function broadcastState() {
    const state = sharedState;
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('playback-state-update', state);
    }
    if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
        miniPlayerWindow.webContents.send('playback-state-update', state);
    }
}

// IPC handlers for mini player toggle
ipcMain.handle('toggle-mini-player', () => {
    if (isMiniPlayer) {
        // Switch back to main window
        if (miniPlayerWindow) {
            miniPlayerWindow.close();
        }
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
        } else {
            createMainWindow();
        }
        isMiniPlayer = false;
    } else {
        // Switch to mini player
        if (mainWindow) {
            mainWindow.hide();
        }
        if (!miniPlayerWindow) {
            createMiniPlayerWindow();
        } else {
            miniPlayerWindow.show();
            miniPlayerWindow.focus();
        }
        isMiniPlayer = true;
    }
    return isMiniPlayer;
});

ipcMain.handle('get-mini-player-state', () => isMiniPlayer);

// Playback state sync
ipcMain.handle('get-shared-state', () => sharedState);

ipcMain.handle('update-shared-state', (event, newState) => {
    sharedState = { ...sharedState, ...newState };
    broadcastState();
    return sharedState;
});

ipcMain.handle('playback-action', (event, action) => {
    // Forward action to all windows
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('playback-action', action);
    }
    if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
        miniPlayerWindow.webContents.send('playback-action', action);
    }
});

ipcMain.handle('close-window', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
        focusedWindow.close();
    }
});

ipcMain.handle('minimize-window', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow) {
        focusedWindow.minimize();
    }
});

app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
