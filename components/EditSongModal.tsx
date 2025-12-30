import React, { useState, useEffect } from 'react';
import { Song } from '../types';

interface EditSongModalProps {
    isOpen: boolean;
    song: Song | null;
    onClose: () => void;
    onSave: (songId: string, updates: { title: string; artist: string; album: string }) => Promise<boolean>;
}

const EditSongModal: React.FC<EditSongModalProps> = ({
    isOpen,
    song,
    onClose,
    onSave
}) => {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [album, setAlbum] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (song) {
            setTitle(song.title);
            setArtist(song.artist);
            setAlbum(song.album);
            setError('');
        }
    }, [song]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!song) return;

        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const success = await onSave(song.id, {
                title: title.trim(),
                artist: artist.trim() || 'Unknown Artist',
                album: album.trim() || 'Unknown Album',
            });

            if (success) {
                onClose();
            } else {
                setError('Failed to save changes');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !song) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]">
            <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl w-full max-w-lg mx-4 shadow-2xl border border-white/10 overflow-hidden">
                {/* Header with Cover Art */}
                <div className="relative h-32 bg-gradient-to-b from-zinc-700 to-transparent">
                    <div className="absolute inset-0 flex items-end p-6">
                        <img
                            src={song.coverUrl}
                            alt=""
                            className="w-20 h-20 rounded-lg shadow-2xl object-cover"
                        />
                        <div className="ml-4 flex-1 overflow-hidden">
                            <h2 className="text-xl font-bold text-white truncate">Edit Song</h2>
                            <p className="text-zinc-400 text-sm truncate">Update track information</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            placeholder="Song title"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Artist
                        </label>
                        <input
                            type="text"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            placeholder="Artist name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Album
                        </label>
                        <input
                            type="text"
                            value={album}
                            onChange={(e) => setAlbum(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            placeholder="Album name"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-full transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Saving...
                                </span>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditSongModal;
