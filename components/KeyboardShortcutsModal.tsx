import React, { useEffect } from 'react';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const shortcuts = [
    {
        category: 'Playback',
        items: [
            { key: 'Space', description: 'Play / Pause' },
            { key: '→', description: 'Next track' },
            { key: '←', description: 'Previous track' },
            { key: 'Shift + →', description: 'Skip 10 seconds forward' },
            { key: 'Shift + ←', description: 'Skip 10 seconds back' },
        ]
    },
    {
        category: 'Volume',
        items: [
            { key: '↑', description: 'Volume up' },
            { key: '↓', description: 'Volume down' },
            { key: 'M', description: 'Mute / Unmute' },
        ]
    },
    {
        category: 'Controls',
        items: [
            { key: 'S', description: 'Toggle shuffle' },
            { key: 'R', description: 'Cycle repeat mode' },
            { key: 'Ctrl + K', description: 'Focus search' },
            { key: '?', description: 'Show this help' },
        ]
    }
];

const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <i className="fas fa-keyboard text-white"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                            <p className="text-xs text-neutral-400">Master your music with keys</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-neutral-400 hover:text-white transition-all flex items-center justify-center"
                    >
                        <i className="fas fa-times text-sm"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {shortcuts.map((group) => (
                        <div key={group.category}>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                                {group.category}
                            </h3>
                            <div className="space-y-2">
                                {group.items.map((shortcut) => (
                                    <div
                                        key={shortcut.key}
                                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <span className="text-neutral-300 text-sm">{shortcut.description}</span>
                                        <kbd className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 rounded-md text-xs font-mono text-white shadow-sm">
                                            {shortcut.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-white/5">
                    <p className="text-center text-xs text-neutral-500">
                        Press <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] font-mono">Esc</kbd> to close
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcutsModal;
