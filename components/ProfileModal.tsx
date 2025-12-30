import React, { useState, useEffect } from 'react';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentName: string;
    onSave: (name: string) => Promise<boolean>;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    onClose,
    currentName,
    onSave
}) => {
    const [displayName, setDisplayName] = useState(currentName);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setDisplayName(currentName);
        setError('');
        setSuccess(false);
    }, [currentName, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!displayName.trim()) {
            setError('Display name cannot be empty');
            return;
        }

        if (displayName.trim().length > 50) {
            setError('Display name must be 50 characters or less');
            return;
        }

        setLoading(true);

        try {
            const result = await onSave(displayName.trim());
            if (result) {
                setSuccess(true);
                setTimeout(() => onClose(), 1000);
            } else {
                setError('Failed to update display name');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-white/10">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-user text-2xl text-black"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        This name will appear as the artist on your uploaded songs
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-700/50 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            placeholder="Your artist name"
                            maxLength={50}
                            required
                        />
                        <p className="text-zinc-500 text-xs mt-1">
                            {displayName.length}/50 characters
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-lg text-sm flex items-center">
                            <i className="fas fa-check-circle mr-2"></i>
                            Display name updated!
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
                            disabled={loading || displayName === currentName}
                            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Saving...
                                </span>
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;
