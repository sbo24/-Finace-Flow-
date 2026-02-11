// ===========================================
// Componente de Recordatorios Inteligentes
// Muestra próximos pagos y eventos financieros
// ===========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUpcomingPayments } from '../services/projectionService';
import { Bell, Calendar, AlertCircle, Check, Clock } from 'lucide-react';
import { DEFAULT_EXPENSE_CATEGORIES } from '../types';

interface Payment {
    name: string;
    amount: number;
    dueDate: Date;
    category: string;
}

interface SmartReminderProps {
    maxItems?: number;
}

export default function SmartReminder({ maxItems = 5 }: SmartReminderProps) {
    const { currentUser } = useAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [markedPaid, setMarkedPaid] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadPayments();
        }
    }, [currentUser]);

    const loadPayments = () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const upcoming = getUpcomingPayments(currentUser.id);
            setPayments(upcoming);
        } finally {
            setLoading(false);
        }
    };

    const markAsPaid = (paymentName: string) => {
        setMarkedPaid(prev => new Set([...prev, paymentName]));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const getDaysUntil = (date: Date): number => {
        const now = new Date();
        return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    const formatDueDate = (date: Date) => {
        const days = getDaysUntil(date);
        if (days === 0) return { text: 'Hoy', urgent: true };
        if (days === 1) return { text: 'Mañana', urgent: true };
        if (days <= 3) return { text: `En ${days} días`, urgent: true };
        if (days <= 7) return { text: `En ${days} días`, urgent: false };
        return {
            text: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
            urgent: false
        };
    };

    const getCategoryIcon = (categoryId: string) => {
        const cat = DEFAULT_EXPENSE_CATEGORIES.find(c => c.id === categoryId || c.name === categoryId);
        return cat?.icon || '📅';
    };

    const visiblePayments = payments
        .filter(p => !markedPaid.has(p.name))
        .slice(0, maxItems);

    if (loading) {
        return (
            <div className="glass-card p-6">
                <div className="flex items-center justify-center py-4">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[var(--primary)]" />
                    Recordatorios
                </h3>
                {payments.length > 0 && (
                    <span className="text-sm text-[var(--text-muted)]">
                        {payments.length} próximos
                    </span>
                )}
            </div>

            {visiblePayments.length === 0 ? (
                <div className="text-center py-6">
                    <Calendar className="w-10 h-10 mx-auto text-[var(--text-muted)] mb-3 opacity-50" />
                    <p className="text-[var(--text-secondary)]">
                        No hay pagos próximos
                    </p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Los pagos recurrentes aparecerán aquí
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {visiblePayments.map((payment, index) => {
                        const due = formatDueDate(payment.dueDate);

                        return (
                            <div
                                key={`${payment.name}-${index}`}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${due.urgent
                                        ? 'border-[var(--warning)] bg-[var(--warning)]/5'
                                        : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                                    }`}
                            >
                                <span className="text-xl">{getCategoryIcon(payment.category)}</span>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-[var(--text-primary)] truncate">
                                        {payment.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                                        <span className={`text-sm ${due.urgent ? 'text-[var(--warning)] font-medium' : 'text-[var(--text-secondary)]'
                                            }`}>
                                            {due.text}
                                        </span>
                                        {due.urgent && (
                                            <AlertCircle className="w-3 h-3 text-[var(--warning)]" />
                                        )}
                                    </div>
                                </div>

                                <div className="text-right mr-2">
                                    <p className="font-semibold text-[var(--text-primary)]">
                                        {formatCurrency(payment.amount)}
                                    </p>
                                </div>

                                <button
                                    onClick={() => markAsPaid(payment.name)}
                                    className="p-2 rounded-lg hover:bg-[var(--success)]/10 text-[var(--text-muted)] hover:text-[var(--success)] transition-colors"
                                    title="Marcar como pagado"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {payments.length > maxItems && (
                <p className="text-center text-sm text-[var(--text-muted)] pt-3 mt-3 border-t border-[var(--border)]">
                    +{payments.length - maxItems} pagos más
                </p>
            )}
        </div>
    );
}
