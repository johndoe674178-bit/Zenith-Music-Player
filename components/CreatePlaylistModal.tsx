import React, { useState, useRef } from 'react';

interface CreatePlaylistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, description: string, coverUrl?: string) => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate(name.trim(), description.trim(), coverPreview || undefined);
        // Reset
        setName('');
        setDescription('');
        setCoverPreview(null);
        onClose();
    };

    const handleClose = () => {
        setName('');
        setDescription('');
        setCoverPreview(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
            <div
                className="bg-gradient-to-br from-neutral-900 to-neutral-950 rounded-2xl w-full max-w-md shadow-2xl border border-white/10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-bold text-white">Create Playlist</h2>
                    <p className="text-sm text-neutral-400 mt-1">Build your perfect collection</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Cover Art */}
                    <div className="flex gap-6">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-32 h-32 bg-neutral-800 rounded-lg flex-shrink-0 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-700 transition border border-dashed border-neutral-600 overflow-hidden group"
                        >
                            {coverPreview ? (
                                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <i className="fas fa-image text-2xl text-neutral-500 mb-2"></i>
                                    <span className="text-[10px] text-neutral-400">Add Cover</span>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleCoverChange}
                                className="hidden"
                            />
                        </div>

                        <div className="flex-1 space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Playlist Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                                    placeholder="My Awesome Playlist"
                                    autoFocus
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Description (optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                                    placeholder="A playlist for..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 rounded-full font-semibold text-sm text-neutral-300 hover:text-white hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="px-6 py-2.5 rounded-full font-bold text-sm bg-emerald-500 text-black hover:bg-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePlaylistModal;
