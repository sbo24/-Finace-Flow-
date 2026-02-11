import { Filter, Plus, Settings2, RotateCcw, X, Check } from 'lucide-react';
import type { Account } from '../../types';

interface DashboardHeaderProps {
    t: (key: any) => any;
    userName: string;
    dateString: string;
    accounts: Account[];
    selectedAccountId: string | null;
    onAccountFilterChange: (id: string) => void;
    isEditMode: boolean;
    onEnterEditMode: () => void;
    handleResetLayout: () => void;
    cancelEdit: () => void;
    saveLayout: () => void;
}

export default function DashboardHeader({
    t,
    userName,
    dateString,
    accounts,
    selectedAccountId,
    onAccountFilterChange,
    isEditMode,
    onEnterEditMode,
    handleResetLayout,
    cancelEdit,
    saveLayout
}: DashboardHeaderProps) {
    return (
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    {t('dashboard.welcome')}, {userName}
                </h1>
                <p className="text-[var(--text-muted)] mt-1 md:mt-2 text-base md:text-lg">
                    {dateString}
                </p>
            </div>

            <div className="flex gap-3 flex-wrap items-center">
                <div className="relative flex-1 sm:flex-none">
                    <select
                        value={selectedAccountId || 'all'}
                        onChange={(e) => onAccountFilterChange(e.target.value)}
                        className="appearance-none bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 pr-10 text-sm font-medium outline-none focus:border-[var(--primary)] transition-colors cursor-pointer w-full"
                    >
                        <option value="all">{t('dashboard.all_accounts')}</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.icon} {acc.name}</option>
                        ))}
                    </select>
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
                </div>

                <a href="/transactions" className="btn btn-primary px-4 sm:px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 flex-1 sm:flex-none">
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold whitespace-nowrap">{t('dashboard.new_transaction')}</span>
                </a>

                {!isEditMode ? (
                    <button
                        type="button"
                        onClick={onEnterEditMode}
                        className="btn btn-secondary px-4 py-3 rounded-2xl flex items-center gap-2"
                        title={t('dashboard.customize')}
                    >
                        <Settings2 className="w-5 h-5" />
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleResetLayout}
                            className="btn btn-secondary px-3 py-3 rounded-xl"
                            title={t('dashboard.reset_layout')}
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="btn btn-secondary px-3 py-3 rounded-xl"
                            title={t('dashboard.cancel_edit')}
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={saveLayout}
                            className="btn btn-primary px-4 py-3 rounded-xl flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('dashboard.save_layout')}</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
