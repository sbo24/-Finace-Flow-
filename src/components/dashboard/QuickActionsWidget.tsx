import { TrendingUp, TrendingDown, CreditCard, Target } from 'lucide-react';

interface QuickActionsWidgetProps {
    t: (key: any) => any;
    onQuickAction: (type: 'expense' | 'income') => void;
}

export default function QuickActionsWidget({ t, onQuickAction }: QuickActionsWidgetProps) {
    return (
        <div className="glass-card p-4 md:p-6 h-full">
            <h3 className="font-bold mb-4">{t('dashboard.quick_actions')}</h3>
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => onQuickAction('expense')}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--danger)] transition-all flex flex-col items-center gap-2 text-center group w-full"
                >
                    <div className="w-8 h-8 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingDown className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">{t('dashboard.quick_expense') || 'Gasto'}</span>
                </button>
                <button
                    onClick={() => onQuickAction('income')}
                    className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--success)] transition-all flex flex-col items-center gap-2 text-center group w-full"
                >
                    <div className="w-8 h-8 rounded-full bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">{t('dashboard.quick_income') || 'Ingreso'}</span>
                </button>
                <a href="/subscriptions" className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all flex flex-col items-center gap-2 text-center group">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">{t('dashboard.quick_subscription')}</span>
                </a>
                <a href="/budgets" className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--primary)] transition-all flex flex-col items-center gap-2 text-center group">
                    <div className="w-8 h-8 rounded-full bg-[var(--secondary)]/10 text-[var(--secondary)] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Target className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">{t('dashboard.quick_budget')}</span>
                </a>
            </div>
        </div>
    );
}
