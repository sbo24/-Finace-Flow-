import { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Trash2,
    Edit2,
    ArrowUpCircle,
    ArrowDownCircle,
    X,
    MapPin,
    Store,
    FileText,
    RefreshCw,
    ChevronDown,
    Filter,
    Download,
    ArrowRightCircle // Import icon for transfer
} from 'lucide-react';
import CustomDatePicker from '../components/common/CustomDatePicker';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
} from '../services/transactionService';
import { getAccounts } from '../services/accountService'; // Import account service
import {
    type Transaction,
    type TransactionFormData,
    DEFAULT_EXPENSE_CATEGORIES,
    DEFAULT_INCOME_CATEGORIES,
    // type PaymentMethod, // Keep for backward compatibility/reference if needed, but not primary selector
    type RecurrenceType,
    type Account // Import Account type
} from '../types';
import { type TranslationKey } from '../contexts/SettingsContext';

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
    categories: typeof DEFAULT_EXPENSE_CATEGORIES;
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
                    placeholder={t('common.search')}
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

export default function Transactions() {
    const { currentUser } = useAuth();
    const { t, settings } = useSettings();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]); // State for accounts
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [filterMinAmount, setFilterMinAmount] = useState('');
    const [filterMaxAmount, setFilterMaxAmount] = useState('');
    const [filterAccountId, setFilterAccountId] = useState('');
    const [filterCategoryId, setFilterCategoryId] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [searchParams] = useSearchParams();

    // Form state
    const [formData, setFormData] = useState<TransactionFormData>({
        type: 'expense',
        amount: 0,
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'debit',
        accountId: '', // Add accountId
        toAccountId: '', // Add toAccountId
        tags: [],
        merchant: '',
        location: '',
        notes: '',
        isRecurring: false,
        recurrence: 'none'
    });

    const formatCurrencyLocal = (amount: number) => {
        return new Intl.NumberFormat(settings.language === 'es' ? 'es-ES' : settings.language === 'fr' ? 'fr-FR' : 'en-US', {
            style: 'currency',
            currency: settings.currency
        }).format(amount);
    };

    const formatDateLocal = (date: Date) => {
        return new Date(date).toLocaleDateString(settings.language === 'es' ? 'es-ES' : settings.language === 'fr' ? 'fr-FR' : 'en-US', {
            day: 'numeric',
            month: 'short'
        });
    };

    const getCategoryInfo = (categoryId: string, type: 'income' | 'expense') => {
        const categories = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
        const cat = categories.find(c => c.id === categoryId);
        if (cat) {
            return {
                ...cat,
                name: t(`cat.${cat.id}` as TranslationKey)
            };
        }
        return { name: categoryId, icon: '📦', color: '#64748B' };
    };

    // Load transactions on mount
    useEffect(() => {
        if (currentUser) {
            loadTransactions();
        }
    }, [currentUser]);

    useEffect(() => {
        const param = searchParams.get('search');
        if (param) {
            setSearchTerm(param);
        }
    }, [searchParams]);

    const loadTransactions = () => {
        if (!currentUser) return;
        const data = getTransactions(currentUser.id);
        const userAccounts = getAccounts(currentUser.id); // Load accounts
        setTransactions(data);
        setAccounts(userAccounts);
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.merchant?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesDateFrom = filterDateFrom ? new Date(t.date) >= new Date(filterDateFrom) : true;
        const matchesDateTo = filterDateTo ? new Date(t.date) <= new Date(filterDateTo) : true;
        const matchesMin = filterMinAmount ? t.amount >= Number(filterMinAmount) : true;
        const matchesMax = filterMaxAmount ? t.amount <= Number(filterMaxAmount) : true;
        const matchesAccount = filterAccountId ? t.accountId === filterAccountId || t.toAccountId === filterAccountId : true;
        const matchesCategory = filterCategoryId ? t.category === filterCategoryId : true;
        return matchesSearch && matchesType && matchesDateFrom && matchesDateTo && matchesMin && matchesMax && matchesAccount && matchesCategory;
    });

    // Sort by date (most recent first)
    const sortedTransactions = [...filteredTransactions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const handleOpenModal = (transaction?: Transaction) => {
        if (transaction) {
            setEditingTransaction(transaction);
            setFormData({
                type: transaction.type,
                amount: transaction.amount,
                category: transaction.category,
                subcategory: transaction.subcategory,
                description: transaction.description,
                date: new Date(transaction.date).toISOString().split('T')[0],
                paymentMethod: transaction.paymentMethod,
                accountId: transaction.accountId || (accounts.length > 0 ? accounts[0].id : ''),
                toAccountId: transaction.toAccountId || '',
                tags: transaction.tags,
                merchant: transaction.merchant || '',
                location: transaction.location || '',
                notes: transaction.notes || '',
                isRecurring: transaction.isRecurring || false,
                recurrence: transaction.recurrence || 'none'
            });
        } else {
            setEditingTransaction(null);
            setFormData({
                type: 'expense',
                amount: 0,
                category: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                paymentMethod: 'debit',
                accountId: accounts.length > 0 ? accounts[0].id : '',
                toAccountId: '',
                tags: [],
                merchant: '',
                location: '',
                notes: '',
                isRecurring: false,
                recurrence: 'none'
            });
        }
        setIsModalOpen(true);
        setShowAdvanced(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (editingTransaction) {
            updateTransaction(editingTransaction.id, formData);
        } else {
            createTransaction(currentUser.id, formData);
        }

        loadTransactions();
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm(t('transactions.delete_confirm'))) {
            deleteTransaction(id);
            loadTransactions();
        }
    };

    const clearFilters = () => {
        setFilterType('all');
        setSearchTerm('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setFilterMinAmount('');
        setFilterMaxAmount('');
        setFilterAccountId('');
        setFilterCategoryId('');
    };

    const exportCsv = () => {
        const escape = (value: string | number | undefined) =>
            `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = sortedTransactions.map(tx => [
            new Date(tx.date).toISOString().split('T')[0],
            tx.type,
            tx.description,
            tx.category,
            tx.amount,
            accounts.find(a => a.id === tx.accountId)?.name || '',
            tx.toAccountId ? accounts.find(a => a.id === tx.toAccountId)?.name || '' : '',
            tx.merchant || '',
            tx.notes || ''
        ]);
        const header = ['Date', 'Type', 'Description', 'Category', 'Amount', 'Account', 'To Account', 'Merchant', 'Notes'];
        const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const categories = formData.type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

    // Calculate totals for display
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    // Transfers don't affect net total generally unless we consider them "movement", but for summary cards usually ignore or show separately.
    // Keeping simple income/expense for now.

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t('transactions.title')}</h1>
                    <p className="text-[var(--text-secondary)]">{t('transactions.subtitle')}</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    {t('transactions.new')}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-4">
                    <p className="text-sm text-[var(--text-muted)]">{t('transactions.income_total')}</p>
                    <p className="text-xl font-bold text-[var(--success)]">+{formatCurrencyLocal(totalIncome)}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-sm text-[var(--text-muted)]">{t('transactions.expense_total')}</p>
                    <p className="text-xl font-bold text-[var(--danger)]">-{formatCurrencyLocal(totalExpense)}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-sm text-[var(--text-muted)]">{t('transactions.balance')}</p>
                    <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        {formatCurrencyLocal(totalIncome - totalExpense)}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-4">
                <div className="filters-row">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            className="input search-field search-input"
                            placeholder={t('transactions.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {(['all', 'income', 'expense', 'transfer'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`chip ${filterType === type ? 'chip-active' : ''}`}
                            >
                                {type === 'transfer' ? t('transactions.transfer') : t(`transactions.${type}` as TranslationKey)}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="chip"
                        >
                            <Filter className="w-4 h-4" />
                            {settings.language === 'es' ? 'Filtros' : settings.language === 'fr' ? 'Filtres' : 'Filters'}
                        </button>
                        <button
                            type="button"
                            onClick={exportCsv}
                            className="chip"
                        >
                            <Download className="w-4 h-4" />
                            {settings.language === 'es' ? 'Exportar' : settings.language === 'fr' ? 'Exporter' : 'Export'}
                        </button>
                    </div>
                </div>
                {showFilters && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">{settings.language === 'es' ? 'Desde' : settings.language === 'fr' ? 'De' : 'From'}</label>
                            <input type="date" className="input" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
                        </div>
                        <div>
                            <label className="label">{settings.language === 'es' ? 'Hasta' : settings.language === 'fr' ? 'À' : 'To'}</label>
                            <input type="date" className="input" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
                        </div>
                        <div>
                            <label className="label">{settings.language === 'es' ? 'Cuenta' : settings.language === 'fr' ? 'Compte' : 'Account'}</label>
                            <select className="input" value={filterAccountId} onChange={(e) => setFilterAccountId(e.target.value)}>
                                <option value="">{settings.language === 'es' ? 'Todas' : settings.language === 'fr' ? 'Toutes' : 'All'}</option>
                                {accounts.map(account => (
                                    <option key={account.id} value={account.id}>{account.icon} {account.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">{settings.language === 'es' ? 'Categoría' : settings.language === 'fr' ? 'Catégorie' : 'Category'}</label>
                            <select className="input" value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)}>
                                <option value="">{settings.language === 'es' ? 'Todas' : settings.language === 'fr' ? 'Toutes' : 'All'}</option>
                                {DEFAULT_EXPENSE_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.icon} {t(`cat.${cat.id}` as TranslationKey)}</option>
                                ))}
                                {DEFAULT_INCOME_CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.icon} {t(`cat.${cat.id}` as TranslationKey)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">{settings.language === 'es' ? 'Mínimo' : settings.language === 'fr' ? 'Minimum' : 'Minimum'}</label>
                            <input type="number" className="input" value={filterMinAmount} onChange={(e) => setFilterMinAmount(e.target.value)} placeholder="0" />
                        </div>
                        <div>
                            <label className="label">{settings.language === 'es' ? 'Máximo' : settings.language === 'fr' ? 'Maximum' : 'Maximum'}</label>
                            <input type="number" className="input" value={filterMaxAmount} onChange={(e) => setFilterMaxAmount(e.target.value)} placeholder="0" />
                        </div>
                        <div className="flex items-end">
                            <button type="button" onClick={clearFilters} className="btn btn-secondary w-full">
                                {settings.language === 'es' ? 'Limpiar filtros' : settings.language === 'fr' ? 'Effacer les filtres' : 'Clear filters'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction List */}
            <div className="glass-card overflow-hidden">
                {sortedTransactions.length > 0 ? (
                    <div className="divide-y divide-[var(--border)]">
                        {sortedTransactions.map((transaction) => {
                            const categoryInfo = transaction.type === 'transfer'
                                ? { name: t('transactions.transfer'), icon: '↔️', color: '#3B82F6' }
                                : getCategoryInfo(transaction.category, transaction.type);
                            return (
                                <div key={transaction.id} className="p-4 hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {/* Icon */}
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                            style={transaction.type === 'transfer' ? { backgroundColor: '#3B82F620' } : { backgroundColor: `${categoryInfo.color}20` }}
                                        >
                                            {transaction.type === 'transfer' ? '↔️' : categoryInfo.icon}
                                        </div>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold truncate">{transaction.description || (transaction.type === 'transfer' ? t('transactions.transfer') : '')}</p>
                                                {transaction.isRecurring && (
                                                    <span title={t('transactions.recurring')}>
                                                        <RefreshCw className="w-4 h-4 text-[var(--secondary)]" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                                                {transaction.type !== 'transfer' && (
                                                    <span>{categoryInfo.name}</span>
                                                )}
                                                {transaction.type === 'transfer' && (
                                                    <span className="text-blue-500">
                                                        {accounts.find(a => a.id === transaction.accountId)?.name} ➔ {accounts.find(a => a.id === transaction.toAccountId)?.name}
                                                    </span>
                                                )}
                                                {transaction.merchant && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <Store className="w-3 h-3" />
                                                            {transaction.merchant}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Amount & Date */}
                                        <div className="text-right">
                                            <p className={`font-bold ${transaction.type === 'income' ? 'text-[var(--success)]' : transaction.type === 'expense' ? 'text-[var(--danger)]' : 'text-[var(--secondary)]'}`}>
                                                {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}{formatCurrencyLocal(transaction.amount)}
                                            </p>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                {formatDateLocal(new Date(transaction.date))}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleOpenModal(transaction)}
                                                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(transaction.id)}
                                                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                            <Filter className="w-8 h-8 text-[var(--text-muted)]" />
                        </div>
                        <p className="text-[var(--text-muted)] mb-4">{t('transactions.empty')}</p>
                        <button onClick={() => handleOpenModal()} className="btn btn-primary">
                            <Plus className="w-5 h-5" />
                            {t('transactions.new')}
                        </button>
                    </div>
                )}
            </div>

            {/* Enhanced Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTransaction ? t('transactions.edit') : t('transactions.new')}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Type Toggle */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
                            className={`flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${formData.type === 'income'
                                ? 'bg-[var(--success)] text-white shadow-lg shadow-[var(--success)]/30'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                                }`}
                        >
                            <ArrowUpCircle className="w-5 h-5" />
                            {t('transactions.income')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
                            className={`flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${formData.type === 'expense'
                                ? 'bg-[var(--danger)] text-white shadow-lg shadow-[var(--danger)]/30'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                                }`}
                        >
                            <ArrowDownCircle className="w-5 h-5" />
                            {t('transactions.expense')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type: 'transfer', category: '' }))}
                            className={`flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${formData.type === 'transfer'
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                                }`}
                        >
                            <ArrowRightCircle className="w-5 h-5" />
                            {t('transactions.transfer')}
                        </button>
                    </div>

                    {/* Amount - Big Input */}
                    <div className="text-center py-4">
                        <label className="label text-center block">{t('transactions.amount')}</label>
                        <div className="relative inline-block">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl text-[var(--text-muted)]">
                                {settings.currency === 'EUR' ? '€' : settings.currency === 'USD' ? '$' : '£'}
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                className="bg-transparent border-none text-5xl font-bold text-center w-64 focus:outline-none"
                                placeholder="0.00"
                                value={formData.amount || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                required
                                style={{ paddingLeft: '2rem' }}
                            />
                        </div>
                    </div>

                    {/* Category Picker - Hide on Transfer */}
                    {formData.type !== 'transfer' && (
                        <div>
                            <label className="label">{t('transactions.category')}</label>
                            <CategoryPicker
                                categories={categories}
                                selectedCategory={formData.category}
                                onSelect={(id) => setFormData(prev => ({ ...prev, category: id }))}
                                t={t}
                                language={settings.language}
                            />
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="label">{t('transactions.description')}</label>
                        <input
                            type="text"
                            className="input"
                            placeholder={
                                formData.type === 'income'
                                    ? (settings.language === 'es' ? '¿De dónde vino el dinero?' : settings.language === 'fr' ? 'D\'où vient l\'argent ?' : 'Where did the money come from?')
                                    : formData.type === 'transfer'
                                        ? (settings.language === 'es' ? 'Motivo de la transferencia...' : settings.language === 'fr' ? 'Raison du transfert...' : 'Reason for transfer...')
                                        : (settings.language === 'es' ? '¿En qué gastaste?' : settings.language === 'fr' ? 'À quoi avez-vous dépensé ?' : 'What did you spend on?')
                            }
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            required
                        />
                    </div>

                    {/* Date & Payment Method Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <CustomDatePicker
                                label={t('transactions.date')}
                                value={formData.date}
                                onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                            />
                        </div>
                        <div>
                            <label className="label">{formData.type === 'transfer' ? (settings.language === 'es' ? 'Desde cuenta' : settings.language === 'fr' ? 'Depuis le compte' : 'From account') : (settings.language === 'es' ? 'Cuenta' : settings.language === 'fr' ? 'Compte' : 'Account')}</label>
                            <select
                                className="input"
                                value={formData.accountId}
                                onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                                required
                            >
                                <option value="" disabled>{settings.language === 'es' ? 'Seleccionar cuenta' : settings.language === 'fr' ? 'Sélectionner un compte' : 'Select account'}</option>
                                {accounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.icon} {account.name} ({formatCurrencyLocal(account.balance)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        {formData.type === 'transfer' && (
                            <div className="col-span-2">
                                <label className="label">{settings.language === 'es' ? 'Hacia cuenta' : settings.language === 'fr' ? 'Vers le compte' : 'To account'}</label>
                                <select
                                    className="input"
                                    value={formData.toAccountId || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, toAccountId: e.target.value }))}
                                    required={formData.type === 'transfer'}
                                >
                                    <option value="" disabled>{settings.language === 'es' ? 'Seleccionar destino' : settings.language === 'fr' ? 'Sélectionner la destination' : 'Select destination'}</option>
                                    {accounts.filter(a => a.id !== formData.accountId).map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.icon} {account.name} ({formatCurrencyLocal(account.balance)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Advanced Options Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                        {showAdvanced ? (settings.language === 'es' ? 'Ocultar opciones avanzadas' : settings.language === 'fr' ? 'Masquer les options avancées' : 'Hide advanced options') : t('transactions.advanced')}
                        <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Advanced Options */}
                    {showAdvanced && (
                        <div className="space-y-4 p-4 rounded-xl bg-[var(--bg-tertiary)]/50">
                            {/* Merchant & Location */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label flex items-center gap-2">
                                        <Store className="w-4 h-4" />
                                        {t('transactions.merchant')}
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder={settings.language === 'es' ? 'Ej: Mercadona' : settings.language === 'fr' ? 'Ex: Carrefour' : 'e.g. Walmart'}
                                        value={formData.merchant || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="label flex items-center gap-2">
                                        <MapPin className="w-4 h-4" />
                                        {t('transactions.location')}
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder={settings.language === 'es' ? 'Ej: Madrid' : settings.language === 'fr' ? 'Ex: Paris' : 'e.g. New York'}
                                        value={formData.location || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="label flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    {t('transactions.notes')}
                                </label>
                                <textarea
                                    className="input min-h-[80px] resize-none"
                                    placeholder={settings.language === 'es' ? 'Añade notas adicionales...' : settings.language === 'fr' ? 'Ajoutez des notes...' : 'Add additional notes...'}
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>

                            {/* Recurring */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <RefreshCw className="w-5 h-5 text-[var(--secondary)]" />
                                    <div>
                                        <p className="font-medium">{t('transactions.recurring')}</p>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            {settings.language === 'es' ? 'Se repite automáticamente' : settings.language === 'fr' ? 'Répète automatiquement' : 'Repeats automatically'}
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isRecurring || false}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                                    />
                                    <div className="w-11 h-6 bg-[var(--bg-tertiary)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                                </label>
                            </div>

                            {/* Recurrence Type */}
                            {formData.isRecurring && (
                                <div>
                                    <label className="label">{t('transactions.frequency')}</label>
                                    <select
                                        className="input"
                                        value={formData.recurrence || 'monthly'}
                                        onChange={(e) => setFormData(prev => ({ ...prev, recurrence: e.target.value as RecurrenceType }))}
                                    >
                                        <option value="daily">{settings.language === 'es' ? 'Diario' : settings.language === 'fr' ? 'Quotidien' : 'Daily'}</option>
                                        <option value="weekly">{settings.language === 'es' ? 'Semanal' : settings.language === 'fr' ? 'Hebdomadaire' : 'Weekly'}</option>
                                        <option value="biweekly">{settings.language === 'es' ? 'Quincenal' : settings.language === 'fr' ? 'Bimensuel' : 'Biweekly'}</option>
                                        <option value="monthly">{settings.language === 'es' ? 'Mensual' : settings.language === 'fr' ? 'Mensuel' : 'Monthly'}</option>
                                        <option value="yearly">{settings.language === 'es' ? 'Anual' : settings.language === 'fr' ? 'Annuel' : 'Yearly'}</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1">
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary flex-1">
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
