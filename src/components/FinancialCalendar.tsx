// ===========================================
// Componente de Calendario Financiero
// Muestra próximos pagos y eventos financieros
// ===========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUpcomingPayments } from '../services/projectionService';
import { Calendar, AlertCircle, ChevronRight } from 'lucide-react';
import { DEFAULT_EXPENSE_CATEGORIES } from '../types';

interface UpcomingPayment {
    name: string;
    amount: number;
    dueDate: Date;
    category: string;
}

export default function FinancialCalendar() {
    const { currentUser } = useAuth();
    const [payments, setPayments] = useState<UpcomingPayment[]>([]);
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';
        if (diffDays <= 7) return `En ${diffDays} días`;

        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    const getCategoryIcon = (categoryId: string) => {
        const cat = DEFAULT_EXPENSE_CATEGORIES.find(c => c.id === categoryId || c.name === categoryId);
        return cat?.icon || '📅';
    };

    const isUrgent = (date: Date) => {
        const now = new Date();
        const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
    };

    if (loading) {
        return (
            <div className="glass-card p-6">
                <div className="flex items-center justify-center py-8">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    Próximos Pagos
                </h3>
            </div>

            {payments.length === 0 ? (
                <div className="text-center py-6 text-[var(--text-secondary)]">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>No hay pagos recurrentes programados</p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                        Marca transacciones como recurrentes pa' verlas aquí
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {payments.slice(0, 5).map((payment, index) => (
                        <div
                            key={index}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${isUrgent(payment.dueDate)
                                    ? 'border-[var(--warning)] bg-[var(--warning)]/5'
                                    : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                                }`}
                        >
                            <span className="text-xl">{getCategoryIcon(payment.category)}</span>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-[var(--text-primary)] truncate">
                                    {payment.name}
                                </p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {formatDate(payment.dueDate)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-[var(--text-primary)]">
                                    {formatCurrency(payment.amount)}
                                </p>
                                {isUrgent(payment.dueDate) && (
                                    <span className="flex items-center gap-1 text-xs text-[var(--warning)]">
                                        <AlertCircle className="w-3 h-3" />
                                        Pronto
                                    </span>
                                )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                        </div>
                    ))}

                    {payments.length > 5 && (
                        <p className="text-center text-sm text-[var(--text-muted)] pt-2">
                            +{payments.length - 5} pagos más
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
