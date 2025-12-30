import React, { useState, useRef } from 'react';

interface CreateAlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadAlbum: (songs: { file: File, title: string }[], metadata: { title: string; artist: string; cover?: File }) => Promise<any>;
}

const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({ isOpen, onClose, onUploadAlbum }) => {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [songEntries, setSongEntries] = useState<{ file: File, title: string, id: string }[]>([]);
    const [uploading, setUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newEntries = Array.from(e.target.files).map((file: File) => ({
                file,
                title: file.name.replace(/\.[^/.]+$/, ""),
                id: Math.random().toString(36).substr(2, 9)
            }));
            setSongEntries(prev => [...prev, ...newEntries]);
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const moveSong = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index > 0) {
            const newEntries = [...songEntries];
            [newEntries[index - 1], newEntries[index]] = [newEntries[index], newEntries[index - 1]];
            setSongEntries(newEntries);
        } else if (direction === 'down' && index < songEntries.length - 1) {
            const newEntries = [...songEntries];
            [newEntries[index + 1], newEntries[index]] = [newEntries[index], newEntries[index + 1]];
            setSongEntries(newEntries);
        }
    };

    const removeSong = (index: number) => {
        setSongEntries(songEntries.filter((_, i) => i !== index));
    };

    const updateSongTitle = (index: number, newTitle: string) => {
        const newEntries = [...songEntries];
        newEntries[index].title = newTitle;
        setSongEntries(newEntries);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !artist || songEntries.length === 0) return;

        setUploading(true);
        try {
            await onUploadAlbum(songEntries, { title, artist, cover: coverFile || undefined });
            onClose();
            // Reset form
            setTitle('');
            setArtist('');
            setSongEntries([]);
            setCoverFile(null);
            setCoverPreview(null);
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-neutral-800">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-neutral-800">
                    <h2 className="text-xl font-bold text-white">Create New Album</h2>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Metadata Section */}
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Cover Art Input */}
                            <div className="flex-shrink-0">
                                <div
                                    onClick={() => coverInputRef.current?.click()}
                                    className="w-40 h-40 bg-neutral-800 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-700 transition border border-neutral-700 overflow-hidden group relative"
                                >
                                    {coverPreview ? (
                                        <>
                                            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                <i className="fas fa-camera text-2xl text-white"></i>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            <i className="fas fa-music text-3xl text-neutral-500 mb-2"></i>
                                            <span className="text-xs text-neutral-400 block">Click to add cover</span>
                                        </div>
                                    )}
                                    <input
                                        ref={coverInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCoverChange}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Text Inputs */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-1">Album Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                                        placeholder="e.g. Dark Side of the Moon"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-1">Artist</label>
                                    <input
                                        type="text"
                                        value={artist}
                                        onChange={(e) => setArtist(e.target.value)}
                                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                                        placeholder="e.g. Pink Floyd"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Songs List */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-white">Songs ({songEntries.length})</h3>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2"
                                >
                                    <i className="fas fa-plus"></i> Add Songs
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="audio/*"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            {songEntries.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed border-neutral-800 rounded-xl">
                                    <p className="text-neutral-500">No songs added yet.</p>
                                    <p className="text-sm text-neutral-600 mt-1">Click "Add Songs" to verify track order</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {songEntries.map((entry, index) => (
                                        <div key={entry.id} className="flex items-center gap-3 bg-neutral-800/50 p-2 rounded-lg group">
                                            <span className="text-neutral-500 font-mono w-6 text-center text-sm">{index + 1}</span>

                                            <div className="flex-1 min-w-0 flex flex-col">
                                                <input
                                                    type="text"
                                                    value={entry.title}
                                                    onChange={(e) => updateSongTitle(index, e.target.value)}
                                                    className="bg-transparent text-white text-sm border-b border-transparent focus:border-emerald-500 focus:outline-none w-full"
                                                    placeholder="Song Title"
                                                />
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className="text-neutral-500 text-xs truncate">{entry.file.name}</p>
                                                    <p className="text-neutral-500 text-xs">{Math.round(entry.file.size / 1024 / 1024 * 10) / 10} MB</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    type="button"
                                                    onClick={() => moveSong(index, 'up')}
                                                    disabled={index === 0}
                                                    className="p-2 text-neutral-400 hover:text-white disabled:opacity-30"
                                                    title="Move Up"
                                                >
                                                    <i className="fas fa-chevron-up"></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveSong(index, 'down')}
                                                    disabled={index === songEntries.length - 1}
                                                    className="p-2 text-neutral-400 hover:text-white disabled:opacity-30"
                                                    title="Move Down"
                                                >
                                                    <i className="fas fa-chevron-down"></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSong(index)}
                                                    className="p-2 text-red-400 hover:text-red-300 ml-2"
                                                    title="Remove"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-neutral-800 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 rounded-full font-bold text-white hover:bg-neutral-800 transition"
                        disabled={uploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={uploading || songEntries.length === 0 || !title || !artist}
                        className="px-8 py-2 rounded-full font-bold bg-emerald-500 text-black hover:bg-emerald-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <i className="fas fa-circle-notch fa-spin"></i> Uploading...
                            </>
                        ) : (
                            'Create Album'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateAlbumModal;
