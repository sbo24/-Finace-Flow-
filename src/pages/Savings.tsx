import React, { useState, useEffect } from 'react';
import { Plus, Target, Edit2, Trash2, X, TrendingUp, Calendar, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
    getSavingsGoals,
    createSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addContribution
} from '../services/savingsService';
import { type SavingsGoal, type SavingsGoalFormData, type SavingsCategory } from '../types';
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

const categoryIcons: Record<SavingsCategory, string> = {
    vacation: '🏖️',
    emergency: '🛡️',
    investment: '📈',
    purchase: '🛒',
    retirement: '👴',
    education: '🎓',
    wedding: '💍',
    car: '🚗',
    home: '🏠',
    other: '💰'
};

const categoryColors: Record<SavingsCategory, string> = {
    vacation: '#06B6D4',
    emergency: '#EF4444',
    investment: '#22C55E',
    purchase: '#8B5CF6',
    retirement: '#F59E0B',
    education: '#3B82F6',
    wedding: '#EC4899',
    car: '#6366F1',
    home: '#10B981',
    other: '#64748B'
};

export default function Savings() {
    const { currentUser } = useAuth();
    const { t, settings } = useSettings();
    const [goals, setGoals] = useState<SavingsGoal[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
    const [contributeAmount, setContributeAmount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all');
    const [categoryFilter, setCategoryFilter] = useState<SavingsCategory | 'all'>('all');
    const [sortBy, setSortBy] = useState<'progress' | 'deadline' | 'name'>('progress');
    const [formData, setFormData] = useState<SavingsGoalFormData>({
        name: '',
        targetAmount: 0,
        deadline: '',
        category: 'other',
        icon: '💰',
        color: '#64748B'
    });

    const formatCurrencyLocal = (amount: number) => {
        return new Intl.NumberFormat(settings.language === 'es' ? 'es-ES' : settings.language === 'fr' ? 'fr-FR' : 'en-US', {
            style: 'currency',
            currency: settings.currency
        }).format(amount);
    };

    useEffect(() => {
        if (currentUser) {
            loadGoals();
        }
    }, [currentUser]);

    const loadGoals = () => {
        if (!currentUser) return;
        const data = getSavingsGoals(currentUser.id);
        setGoals(data);
    };

    const handleOpenModal = (goal?: SavingsGoal) => {
        if (goal) {
            setEditingGoal(goal);
            setFormData({
                name: goal.name,
                targetAmount: goal.targetAmount,
                deadline: goal.deadline.toISOString().split('T')[0],
                category: goal.category,
                icon: goal.icon,
                color: goal.color
            });
        } else {
            setEditingGoal(null);
            setFormData({
                name: '',
                targetAmount: 0,
                deadline: '',
                category: 'other',
                icon: '💰',
                color: '#64748B'
            });
        }
        setIsModalOpen(true);
    };

    const handleOpenContributeModal = (goal: SavingsGoal) => {
        setSelectedGoal(goal);
        setContributeAmount(0);
        setIsContributeModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (editingGoal) {
            updateSavingsGoal(editingGoal.id, formData);
        } else {
            createSavingsGoal(currentUser.id, formData);
        }

        loadGoals();
        setIsModalOpen(false);
    };

    const handleContribute = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGoal || contributeAmount <= 0) return;

        addContribution(selectedGoal.id, contributeAmount);
        loadGoals();
        setIsContributeModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm(t('savings.delete_confirm'))) {
            deleteSavingsGoal(id);
            loadGoals();
        }
    };

    const handleCategorySelect = (category: SavingsCategory) => {
        setFormData(prev => ({
            ...prev,
            category,
            icon: categoryIcons[category],
            color: categoryColors[category]
        }));
    };

    const getDaysRemaining = (deadline: Date) => {
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

    const filteredGoals = goals
        .filter(goal => {
            const matchesSearch = goal.name.toLowerCase().includes(searchTerm.toLowerCase());
            const daysRemaining = getDaysRemaining(goal.deadline);
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'completed' && isCompleted) ||
                (statusFilter === 'expired' && !isCompleted && daysRemaining <= 0) ||
                (statusFilter === 'active' && !isCompleted && daysRemaining > 0);
            const matchesCategory = categoryFilter === 'all' || goal.category === categoryFilter;
            return matchesSearch && matchesStatus && matchesCategory;
        })
        .sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'deadline') return a.deadline.getTime() - b.deadline.getTime();
            const progressA = a.targetAmount > 0 ? a.currentAmount / a.targetAmount : 0;
            const progressB = b.targetAmount > 0 ? b.currentAmount / b.targetAmount : 0;
            return progressB - progressA;
        });

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t('savings.title')}</h1>
                    <p className="text-[var(--text-secondary)]">{t('savings.subtitle')}</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    {t('savings.new')}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card p-5">
                    <p className="text-[var(--text-muted)] text-sm mb-1">{t('savings.total_saved')}</p>
                    <p className="text-2xl font-bold text-[var(--success)]">{formatCurrencyLocal(totalSaved)}</p>
                </div>
                <div className="glass-card p-5">
                    <p className="text-[var(--text-muted)] text-sm mb-1">{t('savings.total_target')}</p>
                    <p className="text-2xl font-bold">{formatCurrencyLocal(totalTarget)}</p>
                </div>
                <div className="glass-card p-5">
                    <p className="text-[var(--text-muted)] text-sm mb-1">{t('savings.overall_progress')}</p>
                    <p className="text-2xl font-bold">{totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%</p>
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
                            placeholder={settings.language === 'es' ? 'Buscar metas...' : settings.language === 'fr' ? 'Rechercher des objectifs...' : 'Search goals...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'completed' | 'expired')}>
                        <option value="all">{settings.language === 'es' ? 'Todos' : settings.language === 'fr' ? 'Tous' : 'All'}</option>
                        <option value="active">{settings.language === 'es' ? 'Activos' : settings.language === 'fr' ? 'Actifs' : 'Active'}</option>
                        <option value="completed">{settings.language === 'es' ? 'Completados' : settings.language === 'fr' ? 'Terminés' : 'Completed'}</option>
                        <option value="expired">{settings.language === 'es' ? 'Vencidos' : settings.language === 'fr' ? 'Expirés' : 'Expired'}</option>
                    </select>
                    <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as SavingsCategory | 'all')}>
                        <option value="all">{settings.language === 'es' ? 'Todas las categorías' : settings.language === 'fr' ? 'Toutes les catégories' : 'All categories'}</option>
                        {(Object.keys(categoryIcons) as SavingsCategory[]).map((cat) => (
                            <option key={cat} value={cat}>{categoryIcons[cat]} {t(`scat.${cat}` as TranslationKey)}</option>
                        ))}
                    </select>
                    <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'progress' | 'deadline' | 'name')}>
                        <option value="progress">{settings.language === 'es' ? 'Ordenar por progreso' : settings.language === 'fr' ? 'Trier par progression' : 'Sort by progress'}</option>
                        <option value="deadline">{settings.language === 'es' ? 'Ordenar por fecha' : settings.language === 'fr' ? 'Trier par date' : 'Sort by deadline'}</option>
                        <option value="name">{settings.language === 'es' ? 'Ordenar por nombre' : settings.language === 'fr' ? 'Trier par nom' : 'Sort by name'}</option>
                    </select>
                </div>
            </div>

            {/* Goals Grid */}
            {filteredGoals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredGoals.map((goal) => {
                        const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
                        const daysRemaining = getDaysRemaining(goal.deadline);
                        const isCompleted = goal.currentAmount >= goal.targetAmount;

                        return (
                            <div key={goal.id} className="glass-card p-5 relative overflow-hidden">
                                {isCompleted && (
                                    <div className="absolute top-3 right-3 badge badge-success">
                                        ✓ {t('savings.completed')}
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <div
                                        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                                        style={{ backgroundColor: `${goal.color}20` }}
                                    >
                                        {goal.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{goal.name}</h3>
                                        <p className="text-sm text-[var(--text-muted)] flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {daysRemaining > 0 ? `${daysRemaining} ${t('savings.days_left')}` : t('savings.expired')}
                                        </p>
                                    </div>
                                </div>

                                {/* Circular Progress */}
                                <div className="flex items-center justify-center my-6">
                                    <div className="relative w-32 h-32">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke="var(--bg-tertiary)"
                                                strokeWidth="12"
                                                fill="none"
                                            />
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke={goal.color}
                                                strokeWidth="12"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeDasharray={`${2 * Math.PI * 56}`}
                                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - Math.min(percentage, 100) / 100)}`}
                                                className="transition-all duration-500"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold">{percentage}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center mb-4">
                                    <p className="text-2xl font-bold">{formatCurrencyLocal(goal.currentAmount)}</p>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        {settings.language === 'es' ? 'de' : settings.language === 'fr' ? 'sur' : 'of'} {formatCurrencyLocal(goal.targetAmount)}
                                    </p>
                                </div>

                                {/* Monthly suggestion */}
                                {!isCompleted && daysRemaining > 0 && (
                                    <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] text-sm mb-4">
                                        <p className="text-[var(--text-secondary)]">
                                            <TrendingUp className="w-4 h-4 inline mr-1" />
                                            {t('savings.monthly_suggestion').replace('{amount}', formatCurrencyLocal((goal.targetAmount - goal.currentAmount) / Math.max(1, Math.ceil(daysRemaining / 30))))}
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {!isCompleted && (
                                        <button
                                            onClick={() => handleOpenContributeModal(goal)}
                                            className="btn btn-primary flex-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            {t('savings.contribute')}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleOpenModal(goal)}
                                        className="btn btn-secondary"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(goal.id)}
                                        className="btn btn-secondary text-[var(--danger)]"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <Target className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
                    <p className="text-[var(--text-muted)] mb-4">{t('savings.empty')}</p>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <Plus className="w-5 h-5" />
                        {t('savings.new')}
                    </button>
                </div>
            )}

            {/* Add/Edit Goal Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingGoal ? t('savings.edit') : t('savings.new')}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">{settings.language === 'es' ? 'Nombre de la Meta' : settings.language === 'fr' ? 'Nom de l\'objectif' : 'Goal Name'}</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Ej: Vacaciones de verano"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </div>

                    <div>
                        <label className="label">{t('transactions.category')}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(Object.keys(categoryIcons) as SavingsCategory[]).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleCategorySelect(cat)}
                                    className={`p-3 rounded-xl text-center transition-all ${formData.category === cat
                                        ? 'ring-2 ring-[var(--primary)]'
                                        : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border)]'
                                        }`}
                                    style={formData.category === cat ? { backgroundColor: `${categoryColors[cat]}20` } : {}}
                                >
                                    <span className="text-2xl">{categoryIcons[cat]}</span>
                                    <p className="text-xs mt-1 capitalize">{t(`scat.${cat}` as TranslationKey)}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="label">{t('savings.target_amount')}</label>
                        <input
                            type="number"
                            step="0.01"
                            className="input text-xl font-bold"
                            placeholder="0.00"
                            value={formData.targetAmount || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                            required
                        />
                    </div>

                    <div>
                        <label className="label">{t('savings.deadline')}</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.deadline}
                            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary flex-1">
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary flex-1">
                            {editingGoal ? t('common.save') : t('common.add')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Contribute Modal */}
            <Modal
                isOpen={isContributeModalOpen}
                onClose={() => setIsContributeModalOpen(false)}
                title={`${t('savings.contribute_to')} ${selectedGoal?.name}`}
            >
                <form onSubmit={handleContribute} className="space-y-4">
                    <div className="text-center mb-4">
                        <p className="text-[var(--text-muted)]">{settings.language === 'es' ? 'Progreso actual' : settings.language === 'fr' ? 'Progrès actuel' : 'Current progress'}</p>
                        <p className="text-2xl font-bold">
                            {formatCurrencyLocal(selectedGoal?.currentAmount || 0)} / {formatCurrencyLocal(selectedGoal?.targetAmount || 0)}
                        </p>
                    </div>

                    <div>
                        <label className="label">{settings.language === 'es' ? 'Monto a Aportar' : settings.language === 'fr' ? 'Montant à contribuer' : 'Amount to contribute'}</label>
                        <input
                            type="number"
                            step="0.01"
                            className="input text-2xl font-bold text-center"
                            placeholder="0.00"
                            value={contributeAmount || ''}
                            onChange={(e) => setContributeAmount(parseFloat(e.target.value) || 0)}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsContributeModalOpen(false)} className="btn btn-secondary flex-1">
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className="btn btn-primary flex-1">
                            {t('savings.contribute')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
