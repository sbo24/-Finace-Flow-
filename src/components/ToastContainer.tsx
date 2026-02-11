// ===========================================
// Componente de Toast Notifications
// Sistema de notificaciones flotantes
// ===========================================

import { useState, useEffect } from 'react';
import {
    subscribeToNotifications,
    dismissNotification,
    type AppNotification
} from '../services/notificationService';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle, Trophy } from 'lucide-react';

export default function ToastContainer() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToNotifications(setNotifications);
        return unsubscribe;
    }, []);

    if (notifications.length === 0) return null;

    const getIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-[var(--success)]" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-[var(--danger)]" />;
            case 'achievement':
                return <Trophy className="w-5 h-5 text-[var(--warning)]" />;
            default:
                return <Info className="w-5 h-5 text-[var(--info)]" />;
        }
    };

    const getStyles = (type: AppNotification['type']) => {
        switch (type) {
            case 'success':
                return 'border-[var(--success)]';
            case 'warning':
                return 'border-[var(--warning)]';
            case 'error':
                return 'border-[var(--danger)]';
            case 'achievement':
                return 'border-[var(--warning)] bg-gradient-to-r from-[var(--bg-card)] to-[var(--warning)]/10';
            default:
                return 'border-[var(--info)]';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`glass-card p-4 border-l-4 animate-slide-up shadow-lg ${getStyles(notification.type)}`}
                >
                    <div className="flex items-start gap-3">
                        {notification.icon ? (
                            <span className="text-xl">{notification.icon}</span>
                        ) : (
                            getIcon(notification.type)
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--text-primary)] text-sm">
                                {notification.title}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                {notification.message}
                            </p>
                            {notification.action && (
                                <button
                                    onClick={() => {
                                        notification.action?.onClick();
                                        dismissNotification(notification.id);
                                    }}
                                    className="mt-2 text-sm font-medium text-[var(--primary)] hover:underline"
                                >
                                    {notification.action.label}
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => dismissNotification(notification.id)}
                            className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors flex-shrink-0"
                        >
                            <X className="w-4 h-4 text-[var(--text-muted)]" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
