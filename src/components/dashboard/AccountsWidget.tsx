import { type Account } from '../../types';

interface AccountsWidgetProps {
    t: (key: any) => any;
    formatCurrency: (amount: number) => string;
    accounts: Account[];
    accountsSummary: Map<string, { totalIncome: number; totalExpenses: number }>;
    selectedAccountId: string | null;
    showAccounts: boolean;
    setShowAccounts: (show: boolean) => void;
    handleAccountFilterChange: (id: string) => void;
}

export default function AccountsWidget({
    t,
    formatCurrency,
    accounts,
    accountsSummary,
    selectedAccountId,
    showAccounts,
    setShowAccounts,
    handleAccountFilterChange
}: AccountsWidgetProps) {
    return (
        <div className="glass-card p-4 md:p-6 h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-bold">{t('dashboard.accounts_title')}</h3>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                    <a href="/accounts" className="text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                        {t('dashboard.view_all')}
                    </a>
                    <button
                        type="button"
                        onClick={() => setShowAccounts(!showAccounts)}
                        className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        {showAccounts ? t('dashboard.hide_accounts') : t('dashboard.show_accounts')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {accounts.map(account => {
                    const accSummary = accountsSummary.get(account.id) || { totalIncome: 0, totalExpenses: 0 };
                    return (
                        <div
                            key={account.id}
                            className={`p-4 rounded-2xl bg-[var(--bg-secondary)]/60 border transition-all cursor-pointer hover:border-[var(--primary)] ${selectedAccountId === account.id ? 'border-[var(--primary)] ring-1 ring-[var(--primary)]' : 'border-[var(--border)]'
                                }`}
                            onClick={() => handleAccountFilterChange(selectedAccountId === account.id ? 'all' : account.id)}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${account.color}20` }}>
                                    {account.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold truncate">{account.name}</p>
                                    <p className="text-xs text-[var(--text-muted)]">{account.type}</p>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="text-xs text-[var(--text-muted)]">{t('dashboard.accounts_balance')}</div>
                                <div className={`text-xl font-bold ${account.balance >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--danger)]'}`}>
                                    {formatCurrency(account.balance)}
                                </div>
                            </div>

                            {showAccounts && (
                                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--border)]">
                                    <div>
                                        <div className="text-xs text-[var(--text-muted)]">{t('dashboard.account_income')}</div>
                                        <div className="text-sm font-semibold text-[var(--success)]">
                                            +{formatCurrency(accSummary.totalIncome)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-[var(--text-muted)]">{t('dashboard.account_expenses')}</div>
                                        <div className="text-sm font-semibold text-[var(--danger)]">
                                            -{formatCurrency(accSummary.totalExpenses)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {accounts.length === 0 && (
                <div className="text-center py-10 text-[var(--text-muted)]">{t('dashboard.accounts_empty')}</div>
            )}
        </div>
    );
}
