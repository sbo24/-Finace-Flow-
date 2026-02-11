// ===========================================
// Servicio de Notificaciones
// Toast, push y notificaciones contextuales
// ===========================================

import { getTransactionSummary } from './transactionService';
import { getSavingsGoals } from './savingsService';
import type { TransactionFormData } from '../types';

// ==========================================
// TIPOS
// ==========================================

export type NotificationType = 'success' | 'warning' | 'info' | 'error' | 'achievement';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    icon?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    duration?: number; // ms, 0 = no auto-dismiss
    timestamp: Date;
}

export interface ContextualMessage {
    trigger: 'transaction_added' | 'goal_contribution' | 'budget_update' | 'daily_summary';
    message: string;
    icon: string;
    type: NotificationType;
}

// LocalStorage key para historial
const NOTIFICATIONS_KEY = 'financeflow_notifications';

// ==========================================
// GESTIÓN DE NOTIFICACIONES
// ==========================================

// Cola de notificaciones activas (en memoria)
let notificationQueue: AppNotification[] = [];
let listeners: ((notifications: AppNotification[]) => void)[] = [];

// Suscribirse a cambios
export const subscribeToNotifications = (callback: (notifications: AppNotification[]) => void) => {
    listeners.push(callback);
    return () => {
        listeners = listeners.filter(l => l !== callback);
    };
};

// Notificar cambios a suscriptores
const notifyListeners = () => {
    listeners.forEach(l => l([...notificationQueue]));
};

// Añadir notificación
export const pushNotification = (notification: Omit<AppNotification, 'id' | 'timestamp'>): string => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newNotification: AppNotification = {
        ...notification,
        id,
        timestamp: new Date(),
        duration: notification.duration ?? 5000
    };

    notificationQueue.push(newNotification);
    notifyListeners();

    // Auto-dismiss después del duration
    if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
            dismissNotification(id);
        }, newNotification.duration);
    }

    // Guardar en historial
    saveToHistory(newNotification);

    return id;
};

// Eliminar notificación
export const dismissNotification = (id: string) => {
    notificationQueue = notificationQueue.filter(n => n.id !== id);
    notifyListeners();
};

// Limpiar todas
export const clearAllNotifications = () => {
    notificationQueue = [];
    notifyListeners();
};

// Guardar en historial (localStorage)
const saveToHistory = (notification: AppNotification) => {
    const history = getNotificationHistory();
    history.unshift(notification);
    // Mantener solo últimas 50
    const trimmed = history.slice(0, 50);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(trimmed));
};

// Obtener historial
export const getNotificationHistory = (): AppNotification[] => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!data) return [];
    return JSON.parse(data).map((n: AppNotification) => ({
        ...n,
        timestamp: new Date(n.timestamp)
    }));
};

// ==========================================
// NOTIFICACIONES CONTEXTUALES
// ==========================================

// Genera mensaje contextual tras añadir una transacción
export const generateTransactionContextMessage = (
    userId: string,
    transaction: TransactionFormData
): ContextualMessage | null => {
    if (transaction.type !== 'expense') return null;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Gastos del día en la misma categoría
    const summary = getTransactionSummary(userId, startOfDay, now);
    const categoryTotal = summary.byCategory[transaction.category] || 0;

    // Buscar meta de ahorro activa
    const goals = getSavingsGoals(userId);
    const activeGoal = goals.find(g =>
        g.currentAmount < g.targetAmount &&
        new Date(g.deadline) > now
    );

    // Si ha gastado bastante en esta categoría hoy
    if (categoryTotal > 20) {
        if (activeGoal) {
            const daysToGoal = Math.ceil((new Date(activeGoal.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const remaining = activeGoal.targetAmount - activeGoal.currentAmount;
            const dailySaving = remaining / daysToGoal;

            // Si el gasto de hoy supera lo que debería ahorrar diariamente
            if (categoryTotal > dailySaving) {
                return {
                    trigger: 'transaction_added',
                    message: `Hoy llevas ${categoryTotal.toFixed(0)}€ en ${transaction.category}. Si reduces a la mitad, alcanzarás "${activeGoal.name}" ${Math.ceil(categoryTotal / (2 * dailySaving))} días antes.`,
                    icon: '💡',
                    type: 'info'
                };
            }
        }

        // Mensaje genérico de gasto elevado
        return {
            trigger: 'transaction_added',
            message: `Llevas ${categoryTotal.toFixed(0)}€ en ${transaction.category} hoy. ¿Seguro que necesitas más?`,
            icon: '🤔',
            type: 'warning'
        };
    }

    return null;
};

// Genera mensaje tras contribuir a una meta
export const generateGoalContributionMessage = (
    goalName: string,
    contribution: number,
    newTotal: number,
    target: number
): ContextualMessage => {
    const percentComplete = (newTotal / target) * 100;
    const remaining = target - newTotal;

    if (percentComplete >= 100) {
        return {
            trigger: 'goal_contribution',
            message: `🎉 ¡Has completado tu meta "${goalName}"! ¡Enhorabuena!`,
            icon: '🏆',
            type: 'achievement'
        };
    }

    if (percentComplete >= 75) {
        return {
            trigger: 'goal_contribution',
            message: `¡${percentComplete.toFixed(0)}% completado! Solo te faltan ${remaining.toFixed(0)}€ para "${goalName}".`,
            icon: '🔥',
            type: 'success'
        };
    }

    if (percentComplete >= 50) {
        return {
            trigger: 'goal_contribution',
            message: `¡Mitad del camino! Llevas ${newTotal.toFixed(0)}€ de ${target.toFixed(0)}€ para "${goalName}".`,
            icon: '🚀',
            type: 'success'
        };
    }

    return {
        trigger: 'goal_contribution',
        message: `+${contribution.toFixed(0)}€ a "${goalName}". Vas por el ${percentComplete.toFixed(0)}%. ¡Sigue así!`,
        icon: '💪',
        type: 'success'
    };
};

// ==========================================
// SHORTCUTS
// ==========================================

export const notifySuccess = (title: string, message: string) => {
    pushNotification({ type: 'success', title, message, icon: '✓' });
};

export const notifyWarning = (title: string, message: string) => {
    pushNotification({ type: 'warning', title, message, icon: '⚠️', duration: 8000 });
};

export const notifyError = (title: string, message: string) => {
    pushNotification({ type: 'error', title, message, icon: '✗', duration: 10000 });
};

export const notifyAchievement = (title: string, message: string) => {
    pushNotification({ type: 'achievement', title, message, icon: '🏆', duration: 8000 });
};
