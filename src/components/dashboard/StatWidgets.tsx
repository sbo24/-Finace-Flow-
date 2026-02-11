import { Wallet, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';

interface StatWidgetProps {
    t: (key: any) => any;
    formatCurrency: (amount: number) => string;
    amount: number;
    changePct?: number;
    type: 'balance' | 'income' | 'expenses';
}

export function StatWidget({ t, formatCurrency, amount, changePct, type }: StatWidgetProps) {
    if (type === 'balance') {
        return (
            <div className="glass-card p-4 md:p-6 h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/20"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4 text-[var(--text-muted)]">
                        <Wallet className="w-5 h-5" />
                        <span className="font-medium text-sm uppercase tracking-wider">{t('dashboard.balance')}</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-bold mb-2 tracking-tight">
                        {formatCurrency(amount)}
                    </div>
                    {changePct !== undefined && (
                        <div className={`flex items-center gap-2 text-sm ${changePct >= 0 ? 'text-[var(--success)] bg-[var(--success)]/10' : 'text-[var(--danger)] bg-[var(--danger)]/10'} w-fit px-2 py-1 rounded-full`}>
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="font-medium">
                                {changePct >= 0 ? '+' : ''}{changePct}% {t('dashboard.vs_last_month')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (type === 'income') {
        return (
            <div className="glass-card p-4 md:p-6 h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--success)]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-[var(--success)]/20"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4 text-[var(--text-muted)]">
                        <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                        <span className="font-medium text-sm uppercase tracking-wider">{t('dashboard.income')}</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">
                        {formatCurrency(amount)}
                    </div>
                    <div className="w-full bg-[var(--bg-tertiary)] h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-[var(--success)] h-full rounded-full" style={{ width: '70%' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-4 md:p-6 h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--danger)]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-[var(--danger)]/20"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4 text-[var(--text-muted)]">
                    <TrendingDown className="w-5 h-5 text-[var(--danger)]" />
                    <span className="font-medium text-sm uppercase tracking-wider">{t('dashboard.expenses')}</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">
                    {formatCurrency(amount)}
                </div>
                <div className="w-full bg-[var(--bg-tertiary)] h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="bg-[var(--danger)] h-full rounded-full" style={{ width: '45%' }}></div>
                </div>
            </div>
        </div>
    );
}
