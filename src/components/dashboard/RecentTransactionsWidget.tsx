import { type Transaction } from '../../types';

interface RecentTransactionsWidgetProps {
    t: (key: any) => any;
    formatCurrency: (amount: number) => string;
    recentTransactions: Transaction[];
}

export default function RecentTransactionsWidget({ t, formatCurrency, recentTransactions }: RecentTransactionsWidgetProps) {
    return (
        <div className="glass-card p-4 md:p-6 h-full">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-xl font-bold">{t('dashboard.recent')}</h3>
                <a href="/transactions" className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                    {t('dashboard.view_all')}
                </a>
            </div>
            <div className="space-y-4">
                {recentTransactions.map((tx) => (
                    <div key={tx.id} className="group p-4 rounded-2xl bg-[var(--bg-secondary)]/50 hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border)] transition-all flex items-center justify-between">
                        <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${tx.type === 'income' ? 'bg-[var(--success)]/10 text-[var(--success)]' : tx.type === 'transfer' ? 'bg-[var(--secondary)]/10 text-[var(--secondary)]' : 'bg-[var(--bg-tertiary)]'}`}>
                                {tx.type === 'transfer' ? '↔️' : '📦'}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-semibold truncate text-sm md:text-base">{tx.description}</h4>
                                <p className="text-[10px] md:text-xs text-[var(--text-muted)]">{new Date(tx.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <span className={`font-bold font-mono text-sm md:text-base flex-shrink-0 ml-2 ${tx.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}`}>
                            {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
                        </span>
                    </div>
                ))}
                {recentTransactions.length === 0 && (
                    <div className="text-center py-10 text-[var(--text-muted)]">{t('dashboard.no_activity')}</div>
                )}
            </div>
        </div>
    );
}
