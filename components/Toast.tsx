import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    icon?: string;
}

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error' | 'info', icon?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info', icon?: string) => {
        const id = Math.random().toString(36).substring(7);
        setToasts(prev => [...prev, { id, message, type, icon }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center space-y-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              px-4 py-3 rounded-lg shadow-xl backdrop-blur-md flex items-center space-x-3
              animate-[slideUp_0.3s_ease-out,fadeIn_0.3s_ease-out]
              ${toast.type === 'success' ? 'bg-[#1DB954]/90 text-white' : ''}
              ${toast.type === 'error' ? 'bg-red-500/90 text-white' : ''}
              ${toast.type === 'info' ? 'bg-zinc-800/90 text-white border border-white/10' : ''}
            `}
                    >
                        {toast.icon && <i className={`${toast.icon} text-sm`}></i>}
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                ))}
            </div>

            <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
        </ToastContext.Provider>
    );
};
