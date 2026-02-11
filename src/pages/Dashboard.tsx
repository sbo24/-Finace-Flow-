import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { saveDashboardSettings, resetDashboardSettings, DEFAULT_SIZES } from '../services/dashboardSettingsService';
import { createTransaction } from '../services/transactionService';
import {
    type DashboardSettings,
    type TransactionFormData,
    DEFAULT_EXPENSE_CATEGORIES,
    DEFAULT_INCOME_CATEGORIES
} from '../types';
import { type TranslationKey } from '../contexts/SettingsContext';
import { X, Search, ChevronDown } from 'lucide-react';
import CustomDatePicker from '../components/common/CustomDatePicker';

// Modular Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import WidgetWrapper from '../components/dashboard/WidgetWrapper';
import { StatWidget } from '../components/dashboard/StatWidgets';
import CashflowWidget from '../components/dashboard/CashflowWidget';
import RecentTransactionsWidget from '../components/dashboard/RecentTransactionsWidget';
import TopCategoriesWidget from '../components/dashboard/TopCategoriesWidget';
import HealthScoreWidget from '../components/dashboard/HealthScoreWidget';
import QuickActionsWidget from '../components/dashboard/QuickActionsWidget';
import AccountsWidget from '../components/dashboard/AccountsWidget';
import TipOfTheDay from '../components/TipOfTheDay';

// Modal Component
const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md'
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'md' | 'lg';
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`glass-card w-full ${size === 'lg' ? 'max-w-2xl' : 'max-w-lg'} p-5 sm:p-6 relative z-10 animate-slide-up max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl`}>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// Category Picker Component
const CategoryPicker = ({
    categories,
    selectedCategory,
    onSelect,
    t,
    language
}: {
    categories: any[];
    selectedCategory: string;
    onSelect: (id: string) => void;
    t: (key: TranslationKey) => string;
    language: string;
}) => {
    const [categorySearch, setCategorySearch] = useState('');
    const [showAll, setShowAll] = useState(false);

    const filteredCategories = categories.filter(c =>
        t(`cat.${c.id}` as TranslationKey).toLowerCase().includes(categorySearch.toLowerCase())
    );

    const displayedCategories = showAll ? filteredCategories : filteredCategories.slice(0, 8);

    return (
        <div className="space-y-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                    type="text"
                    className="input py-2 text-sm search-field search-input"
                    placeholder={t('common.search' as TranslationKey)}
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                {displayedCategories.map((cat) => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => onSelect(cat.id)}
                        className={`p-2 rounded-xl text-center transition-all ${selectedCategory === cat.id
                            ? 'ring-2 ring-[var(--primary)] scale-105'
                            : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border)] hover:scale-[1.02]'
                            }`}
                        style={selectedCategory === cat.id ? { backgroundColor: `${cat.color}20` } : {}}
                    >
                        <span className="text-2xl block">{cat.icon}</span>
                        <p className="text-xs mt-1 truncate font-medium">{t(`cat.${cat.id}` as TranslationKey)}</p>
                    </button>
                ))}
            </div>
            {filteredCategories.length > 8 && (
                <button
                    type="button"
                    onClick={() => setShowAll(!showAll)}
                    className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1 mx-auto"
                >
                    {showAll ? (language === 'es' ? 'Ver menos' : language === 'fr' ? 'Voir moins' : 'See less') :
                        (language === 'es' ? `Ver ${filteredCategories.length - 8} más` : language === 'fr' ? `Voir ${filteredCategories.length - 8} de plus` : `See ${filteredCategories.length - 8} more`)}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
                </button>
            )}
        </div>
    );
};

export default function Dashboard() {
    const { currentUser } = useAuth();
    const { t, settings } = useSettings();
    const [showAccounts, setShowAccounts] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [tempSettings, setTempSettings] = useState<DashboardSettings | null>(null);
    const [isQuickActionModalOpen, setIsQuickActionModalOpen] = useState(false);
    const [quickActionFormData, setQuickActionFormData] = useState<TransactionFormData>({
        type: 'expense',
        amount: 0,
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'debit',
        accountId: '',
        tags: [],
        merchant: '',
        location: '',
        notes: '',
        isRecurring: false,
        recurrence: 'none'
    });

    const {
        loading,
        summary,
        recentTransactions,
        cashflowData,
        topCategories,
        accounts,
        accountsSummary,
        selectedAccountId,
        dashboardSettings,
        setDashboardSettings,
        handleAccountFilterChange,
        refreshData
    } = useDashboardData(currentUser?.id);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(settings.language === 'es' ? 'es-ES' : settings.language === 'fr' ? 'fr-FR' : 'en-US', {
            style: 'currency',
            currency: settings.currency
        }).format(amount);
    };

    // Customization Logic
    const enterEditMode = () => {
        setTempSettings(dashboardSettings ? { ...dashboardSettings } : null);
        setIsEditMode(true);
    };

    const saveLayout = () => {
        if (currentUser && tempSettings) {
            saveDashboardSettings(currentUser.id, tempSettings);
            setDashboardSettings(tempSettings);
        }
        setIsEditMode(false);
    };

    const cancelEdit = () => {
        setTempSettings(null);
        setIsEditMode(false);
    };

    const handleResetLayout = () => {
        if (currentUser) {
            const defaultSettings = resetDashboardSettings(currentUser.id);
            setDashboardSettings(defaultSettings);
            setTempSettings(defaultSettings);
        }
    };

    const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
        if (!tempSettings) return;
        const order = [...tempSettings.widgetOrder];
        const index = order.indexOf(widgetId);
        if (index === -1) return;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= order.length) return;
        [order[index], order[newIndex]] = [order[newIndex], order[index]];
        setTempSettings({ ...tempSettings, widgetOrder: order });
    };

    const resizeWidget = (widgetId: string) => {
        if (!tempSettings) return;
        const currentSizes = tempSettings.widgetSizes || DEFAULT_SIZES;
        const currentSize = currentSizes[widgetId] || 'small';
        const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
        const currentIndex = sizes.indexOf(currentSize);
        const nextIndex = (currentIndex + 1) % sizes.length;

        const newSizes = { ...(tempSettings.widgetSizes || DEFAULT_SIZES), [widgetId]: sizes[nextIndex] };
        setTempSettings({ ...tempSettings, widgetSizes: newSizes });
    };

    const toggleWidgetVisibility = (widgetId: string) => {
        if (!tempSettings) return;
        const newVisible = tempSettings.visibleWidgets.includes(widgetId)
            ? tempSettings.visibleWidgets.filter(w => w !== widgetId)
            : [...tempSettings.visibleWidgets, widgetId];
        setTempSettings({ ...tempSettings, visibleWidgets: newVisible });
    };

    const isWidgetVisible = (widgetId: string): boolean => {
        const settingsToCheck = isEditMode ? tempSettings : dashboardSettings;
        return settingsToCheck?.visibleWidgets.includes(widgetId) ?? true;
    };

    const getWidgetSize = (widgetId: string): 'small' | 'medium' | 'large' => {
        const settingsToCheck = isEditMode ? tempSettings : dashboardSettings;
        return settingsToCheck?.widgetSizes?.[widgetId] || 'small';
    };

    const handleQuickAction = (type: 'expense' | 'income') => {
        setQuickActionFormData({
            type,
            amount: 0,
            category: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: type === 'income' ? 'transfer' : 'debit',
            accountId: selectedAccountId || (accounts.length > 0 ? accounts[0].id : ''),
            tags: [],
            merchant: '',
            location: '',
            notes: '',
            isRecurring: false,
            recurrence: 'none'
        });
        setIsQuickActionModalOpen(true);
    };

    const handleQuickActionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        createTransaction(currentUser.id, quickActionFormData);
        refreshData();
        setIsQuickActionModalOpen(false);
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="spinner"></div></div>;

    const selectedAccount = selectedAccountId ? accounts.find(a => a.id === selectedAccountId) : null;
    const currentOrder = isEditMode ? tempSettings?.widgetOrder : dashboardSettings?.widgetOrder;

    const renderWidget = (widgetId: string) => {
        const isVisible = isWidgetVisible(widgetId);
        const widgetSize = getWidgetSize(widgetId);

        return (
            <WidgetWrapper
                widgetId={widgetId}
                isVisible={isVisible}
                isEditMode={isEditMode}
                size={widgetSize}
                onMove={moveWidget}
                onToggleVisibility={toggleWidgetVisibility}
                onResize={resizeWidget}
                key={widgetId}
            >
                {(() => {
                    switch (widgetId) {
                        case 'balance': return <StatWidget t={t} formatCurrency={formatCurrency} amount={summary.totalBalance} changePct={summary.balanceChangePct} type="balance" />;
                        case 'income': return <StatWidget t={t} formatCurrency={formatCurrency} amount={summary.totalIncome} type="income" />;
                        case 'expenses': return <StatWidget t={t} formatCurrency={formatCurrency} amount={summary.totalExpenses} type="expenses" />;
                        case 'cashflow': return <CashflowWidget t={t} formatCurrency={formatCurrency} cashflowData={cashflowData} />;
                        case 'recentTransactions': return <RecentTransactionsWidget t={t} formatCurrency={formatCurrency} recentTransactions={recentTransactions} />;
                        case 'topCategories': return <TopCategoriesWidget t={t} formatCurrency={formatCurrency} totalExpenses={summary.totalExpenses} topCategories={topCategories} />;
                        case 'healthScore': return <HealthScoreWidget t={t} healthScore={summary.healthScore} />;
                        case 'quickActions': return <QuickActionsWidget t={t} onQuickAction={handleQuickAction} />;
                        case 'tipOfTheDay': return <TipOfTheDay />;
                        case 'accounts': return (
                            <AccountsWidget
                                t={t}
                                formatCurrency={formatCurrency}
                                accounts={accounts}
                                accountsSummary={accountsSummary}
                                selectedAccountId={selectedAccountId}
                                showAccounts={showAccounts}
                                setShowAccounts={setShowAccounts}
                                handleAccountFilterChange={handleAccountFilterChange}
                            />
                        );
                        default: return null;
                    }
                })()}
            </WidgetWrapper>
        );
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <DashboardHeader
                t={t}
                userName={currentUser?.displayName?.split(' ')[0] || (settings.language === 'es' ? 'Usuario' : settings.language === 'fr' ? 'Utilisateur' : 'User')}
                dateString={new Date().toLocaleDateString(settings.language === 'es' ? 'es-ES' : settings.language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                onAccountFilterChange={handleAccountFilterChange}
                isEditMode={isEditMode}
                onEnterEditMode={enterEditMode}
                handleResetLayout={handleResetLayout}
                cancelEdit={cancelEdit}
                saveLayout={saveLayout}
            />

            {selectedAccount && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${selectedAccount.color}30` }}>
                        {selectedAccount.icon}
                    </div>
                    <span className="text-sm font-medium text-[var(--primary)]">
                        {t('dashboard.filter_account')}: <strong>{selectedAccount.name}</strong>
                    </span>
                    <button
                        onClick={() => handleAccountFilterChange('all')}
                        className="ml-auto text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        ✕ {t('dashboard.all_accounts')}
                    </button>
                </div>
            )}

            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-min">
                <AnimatePresence mode="popLayout">
                    {currentOrder?.map(renderWidget)}
                </AnimatePresence>
            </motion.div>

            {/* Quick Action Modal */}
            <Modal
                isOpen={isQuickActionModalOpen}
                onClose={() => setIsQuickActionModalOpen(false)}
                title={quickActionFormData.type === 'income' ? t('dashboard.quick_income' as TranslationKey) : t('dashboard.quick_expense' as TranslationKey)}
                size="lg"
            >
                <form onSubmit={handleQuickActionSubmit} className="space-y-5">
                    {/* Amount */}
                    <div className="text-center py-4">
                        <label className="label text-center block">{t('transactions.amount' as TranslationKey)}</label>
                        <div className="relative inline-block">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl text-[var(--text-muted)]">
                                {settings.currency === 'EUR' ? '€' : settings.currency === 'USD' ? '$' : '£'}
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                className="bg-transparent border-none text-5xl font-bold text-center w-64 focus:outline-none"
                                placeholder="0.00"
                                value={quickActionFormData.amount || ''}
                                onChange={(e) => setQuickActionFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                required
                                style={{ paddingLeft: '2rem' }}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Category Picker */}
                    <div>
                        <label className="label">{t('transactions.category' as TranslationKey)}</label>
                        <CategoryPicker
                            categories={quickActionFormData.type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES}
                            selectedCategory={quickActionFormData.category}
                            onSelect={(id) => setQuickActionFormData(prev => ({ ...prev, category: id }))}
                            t={t}
                            language={settings.language}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="label">{t('transactions.description' as TranslationKey)}</label>
                        <input
                            type="text"
                            className="input"
                            placeholder={
                                quickActionFormData.type === 'income'
                                    ? (settings.language === 'es' ? '¿De dónde vino el dinero?' : 'Where did the money come from?')
                                    : (settings.language === 'es' ? '¿En qué gastaste?' : 'What did you spend on?')
                            }
                            value={quickActionFormData.description}
                            onChange={(e) => setQuickActionFormData(prev => ({ ...prev, description: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Account & Date Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">{t('dashboard.accounts' as TranslationKey)}</label>
                            <select
                                className="input"
                                value={quickActionFormData.accountId}
                                onChange={(e) => setQuickActionFormData(prev => ({ ...prev, accountId: e.target.value }))}
                                required
                            >
                                <option value="" disabled>{t('transactions.select_account' as TranslationKey)}</option>
                                {accounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.icon} {account.name} ({formatCurrency(account.balance)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <CustomDatePicker
                                label={t('transactions.date' as TranslationKey)}
                                value={quickActionFormData.date}
                                onChange={(date) => setQuickActionFormData(prev => ({ ...prev, date }))}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full py-4 text-lg">
                        {t('common.save' as TranslationKey)}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
