import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
    getBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    updateBudgetSpent
} from '../services/budgetService';
import { getTransactionSummary } from '../services/transactionService';
import { type Budget, type BudgetFormData, DEFAULT_EXPENSE_CATEGORIES } from '../types';
import { type TranslationKey } from '../contexts/SettingsContext';

// Modal Component
const Modal = ({
    isOpen,
    onClose,
    title,
    children
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="glass-card w-full max-w-lg p-6 relative z-10 animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default function Budgets() {
    const { currentUser } = useAuth();
    const { t, settings } = useSettings();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'over' | 'under'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'spent' | 'remaining'>('spent');
    const [formData, setFormData] = useState<BudgetFormData>({
        name: '',
        category: '',
        amount: 0,
        period: 'monthly',
        alertThreshold: 80
    });

    const formatCurrencyLocal = (amount: number) => {
        return new Intl.NumberFormat(settings.language === 'es' ? 'es-ES' : settings.language === 'fr' ? 'fr-FR' : 'en-US', {
            style: 'currency',
            currency: settings.currency
        }).format(amount);
    };

    const getCategoryInfo = (categoryId: string) => {
        const cat = DEFAULT_EXPENSE_CATEGORIES.find(c => c.id === categoryId);
        if (cat) {
            return {
                ...cat,
                name: t(`cat.${cat.id}` as TranslationKey)
            };
        }
        return { name: categoryId, icon: '📦', color: '#64748B' };
    };

    useEffect(() => {
        if (currentUser) {
            loadBudgets();
        }
    }, [currentUser]);

    const loadBudgets = () => {
        if (!currentUser) return;

        const data = getBudgets(currentUser.id);

        // Update spent amounts based on transactions
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const summary = getTransactionSummary(currentUser.id, startOfMonth, endOfMonth);

        // Update spent for each budget based on category
        data.forEach(budget => {
            const spent = summary.byCategory[budget.category] || 0;
            if (spent !== budget.spent) {
                updateBudgetSpent(budget.id, spent);
                budget.spent = spent;
            }
        });

        setBudgets(data);
    };

    const handleOpenModal = (budget?: Budget) => {
        if (budget) {
            setEditingBudget(budget);
            setFormData({
                name: budget.name,
                category: budget.category,
                amount: budget.amount,
                period: budget.period,
                alertThreshold: budget.alertThreshold
            });
        } else {
            setEditingBudget(null);
            setFormData({
                name: '',
                category: '',
                amount: 0,
                period: 'monthly',
                alertThreshold: 80
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (editingBudget) {
            updateBudget(editingBudget.id, formData);
        } else {
            createBudget(currentUser.id, formData);
        }

        loadBudgets();
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm(t('budgets.delete_confirm'))) {
            deleteBudget(id);
            loadBudgets();
        }
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 100) return 'progress-fill-danger';
        if (percentage >= 80) return 'progress-fill-warning';
        return 'progress-fill-success';
    };

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const overBudgetCount = budgets.filter(b => b.spent > b.amount).length;

    const filteredBudgets = budgets
        .filter(b => {
            const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'over' ? b.spent > b.amount : b.spent <= b.amount);
            const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;
            return matchesSearch && matchesStatus && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'remaining') return (b.amount - b.spent) - (a.amount - a.spent);
            return b.spent - a.spent;
        });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t('nav.budgets')}</h1>
                    <p className="text-[var(--text-secondary)]">{t('budgets.subtitle')}</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    {t('budgets.new')}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-5">
                    <p className="text-[var(--text-muted)] text-sm mb-1">{t('budgets.monthly_limit')}</p>
                    <p className="text-2xl font-bold">{formatCurrencyLocal(totalBudget)}</p>
                </div>
                <div className="glass-card p-5">
                    <p className="text-[var(--text-muted)] text-sm mb-1">{t('budgets.spent')}</p>
                    <p className="text-2xl font-bold text-[var(--danger)]">{formatCurrencyLocal(totalSpent)}</p>
                </div>
                <div className="glass-card p-5">
                    <p className="text-[var(--text-muted)] text-sm mb-1">{t('budgets.remaining')}</p>
                    <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                        {formatCurrencyLocal(totalBudget - totalSpent)}
                    </p>
                </div>
            </div>

            {/* Alert for over budget */}
            {overBudgetCount > 0 && (
                <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />
                    <p className="text-[var(--danger)]">
                        {settings.language === 'es' ? `Tienes ${overBudgetCount} presupuesto(s) excedido(s) este mes` :
                            settings.language === 'fr' ? `Vous avez ${overBudgetCount} budget(s) dépassé(s) ce mois-ci` :
                                `You have ${overBudgetCount} budget(s) exceeded this month`}
                    </p>
                </div>
            )}

            {/* Filters */}
            <div className="glass-card p-4">
                <div className="filters-row">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            className="input search-field search-input"
                            placeholder={settings.language === 'es' ? 'Buscar presupuestos...' : settings.language === 'fr' ? 'Rechercher des budgets...' : 'Search budgets...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'over' | 'under')}>
                        <option value="all">{settings.language === 'es' ? 'Todos' : settings.language === 'fr' ? 'Tous' : 'All'}</option>
                        <option value="over">{settings.language === 'es' ? 'Excedidos' : settings.language === 'fr' ? 'Dépassés' : 'Over budget'}</option>
                        <option value="under">{settings.language === 'es' ? 'En rango' : settings.language === 'fr' ? 'Dans le budget' : 'Within budget'}</option>
                    </select>
                    <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="all">{settings.language === 'es' ? 'Todas las categorías' : settings.language === 'fr' ? 'Toutes les catégories' : 'All categories'}</option>
                        {DEFAULT_EXPENSE_CATEGORIES.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.icon} {t(`cat.${cat.id}` as TranslationKey)}</option>
                        ))}
                    </select>
                    <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'spent' | 'remaining')}>
                        <option value="spent">{settings.language === 'es' ? 'Ordenar por gasto' : settings.language === 'fr' ? 'Trier par dépenses' : 'Sort by spent'}</option>
                        <option value="remaining">{settings.language === 'es' ? 'Ordenar por restante' : settings.language === 'fr' ? 'Trier par restant' : 'Sort by remaining'}</option>
                        <option value="name">{settings.language === 'es' ? 'Ordenar por nombre' : settings.language === 'fr' ? 'Trier par nom' : 'Sort by name'}</option>
                    </select>
                </div>
            </div>

            {/* Budget Grid */}
            {filteredBudgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredBudgets.map((budget) => {
                        const categoryInfo = getCategoryInfo(budget.category);
                        const percentage = Math.min((budget.spent / budget.amount) * 100, 100);
                        const isOverBudget = budget.spent > budget.amount;

                        return (
                            <div key={budget.id} className="glass-card p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                            style={{ backgroundColor: `${categoryInfo.color}20` }}
                                        >
                                            {categoryInfo.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{budget.name}</h3>
                                            <p className="text-sm text-[var(--text-muted)] capitalize">
                                                {budget.period === 'monthly' ? (settings.language === 'es' ? 'Mensual' : settings.language === 'fr' ? 'Mensuel' : 'Monthly') :
                                                    budget.period === 'weekly' ? (settings.language === 'es' ? 'Semanal' : settings.language === 'fr' ? 'Hebdomadaire' : 'Weekly') :
                                                        (settings.language === 'es' ? 'Diario' : settings.language === 'fr' ? 'Quotidien' : 'Daily')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleOpenModal(budget)}
                                            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--primary)]"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(budget.id)}
                                            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--danger)]"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-[var(--text-secondary)]">
                                            {formatCurrencyLocal(budget.spent)} {settings.language === 'es' ? 'de' : settings.language === 'fr' ? 'sur' : 'of'} {formatCurrencyLocal(budget.amount)}
                                        </span>
                                        <span className={`font-medium ${isOverBudget ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
                                            {Math.round((budget.spent / budget.amount) * 100)}%
                                        </span>
                                    </div>

                                    <div className="progress-bar">
                                        <div
                                            className={`progress-fill ${getProgressColor((budget.spent / budget.amount) * 100)}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>

                                    {isOverBudget && (
                                        <p className="text-sm text-[var(--danger)] flex items-center gap-1">
                                            <AlertTriangle className="w-4 h-4" />
                                            {settings.language === 'es' ? 'Excedido por' : settings.language === 'fr' ? 'Dépassé de' : 'Exceeded by'} {formatCurrencyLocal(budget.spent - budget.amount)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <p className="text-[var(--text-muted)] mb-4">{t('budgets.empty')}</p>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus className="w-5 h-5" />
                        {t('budgets.new')}
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingBudget ? t('common.edit') : t('budgets.new')}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">{settings.language === 'es' ? 'Nombre' : settings.language === 'fr' ? 'Nom' : 'Name'}</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Ej: Alimentación mensual"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </div>

                    <div>
                        <label className="label">{t('transactions.category')}</label>
                        <div className="grid grid-cols-4 gap-2">
                            {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                                    className={`p-3 rounded-xl text-center transition-all ${formData.category === cat.id
                                        ? 'ring-2 ring-[var(--primary)]'
                                        : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border)]'
                                        }`}
                                    style={formData.category === cat.id ? { backgroundColor: `${cat.color}20` } : {}}
                                >
                                    <span className="text-xl">{cat.icon}</span>
                                    <p className="text-xs mt-1 truncate">{t(`cat.${cat.id}` as TranslationKey)}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="label">{t('budgets.monthly_limit')}</label>
                        <input
                            type="number"
                            step="0.01"
                            className="input text-xl font-bold"
                            placeholder="0.00"
                            value={formData.amount || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                            required
                        />
                    </div>

                    <div>
                        <label className="label">{settings.language === 'es' ? 'Período' : settings.language === 'fr' ? 'Période' : 'Period'}</label>
                        <select
                            className="input"
                            value={formData.period}
                            onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value as 'daily' | 'weekly' | 'monthly' }))}
                        >
                            <option value="daily">{settings.language === 'es' ? 'Diario' : 'Daily'}</option>
                            <option value="weekly">{settings.language === 'es' ? 'Semanal' : 'Weekly'}</option>
                            <option value="monthly">{settings.language === 'es' ? 'Mensual' : 'Monthly'}</option>
                        </select>
                    </div>

                    <div>
                        <label className="label">{settings.language === 'es' ? 'Alerta al alcanzar (%)' : 'Alert at (%)'}</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            className="input"
                            value={formData.alertThreshold}
                            onChange={(e) => setFormData(prev => ({ ...prev, alertThreshold: parseInt(e.target.value) || 80 }))}
                        />
                    </div>

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
