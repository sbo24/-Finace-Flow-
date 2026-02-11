import { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    Search,
    Calendar,
    AlertCircle,
    Edit2,
    Trash2,
    X,
    Power,
    PowerOff,
    Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
    createFixedExpense,
    deleteFixedExpense,
    getFixedExpenses,
    getUpcomingFixedExpense,
    updateFixedExpense
} from '../services/fixedExpenseService';
import { type FixedExpense, type FixedExpenseFormData } from '../types';

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
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="glass-card w-full max-w-2xl p-6 relative z-10 animate-slide-up max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
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

export default function FixedExpenses() {
    const { currentUser } = useAuth();
    const { t, settings } = useSettings();
    const [items, setItems] = useState<FixedExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [frequencyFilter, setFrequencyFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<FixedExpense | null>(null);

    const [formData, setFormData] = useState<FixedExpenseFormData>({
        name: '',
        amount: 0,
        frequency: 'monthly',
        nextDueDate: new Date().toISOString().split('T')[0],
        category: 'General',
        provider: '',
        notes: '',
        autopay: false,
    });

    useEffect(() => {
        if (!currentUser) return;
        setItems(getFixedExpenses(currentUser.id));
        setLoading(false);
    }, [currentUser]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(
            settings.language === 'es' ? 'es-ES' : settings.language === 'fr' ? 'fr-FR' : 'en-US',
            { style: 'currency', currency: settings.currency }
        ).format(amount);
    };

    const upcoming = useMemo(() => {
        if (!currentUser) return null;
        return getUpcomingFixedExpense(currentUser.id);
    }, [currentUser, items]);

    const dueInDays = (date: Date) => {
        const today = new Date();
        const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const categories = useMemo(() => {
        const set = new Set(items.map(i => i.category));
        return Array.from(set).sort();
    }, [items]);

    const filtered = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
                || (item.provider || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
            const matchesFrequency = frequencyFilter === 'all' || item.frequency === frequencyFilter;
            const matchesStatus = statusFilter === 'all'
                || (statusFilter === 'active' && item.isActive)
                || (statusFilter === 'paused' && !item.isActive);
            return matchesSearch && matchesCategory && matchesFrequency && matchesStatus;
        });
    }, [items, searchTerm, categoryFilter, frequencyFilter, statusFilter]);

    const monthlyTotal = useMemo(() => {
        return items.reduce((sum, item) => {
            if (!item.isActive) return sum;
            if (item.frequency === 'yearly') return sum + item.amount / 12;
            if (item.frequency === 'quarterly') return sum + item.amount / 3;
            return sum + item.amount;
        }, 0);
    }, [items]);

    const exportCsv = () => {
        const escape = (value: string | number | undefined) =>
            `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = filtered.map(item => [
            item.name,
            item.category,
            item.frequency,
            item.amount,
            new Date(item.nextDueDate).toISOString().split('T')[0],
            item.provider || '',
            item.autopay ? 'yes' : 'no'
        ]);
        const header = ['Name', 'Category', 'Frequency', 'Amount', 'Next Due', 'Provider', 'Autopay'];
        const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fixed_expenses_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleOpenModal = (item?: FixedExpense) => {
        if (item) {
            setEditing(item);
            setFormData({
                name: item.name,
                amount: item.amount,
                frequency: item.frequency,
                nextDueDate: new Date(item.nextDueDate).toISOString().split('T')[0],
                category: item.category,
                provider: item.provider || '',
                notes: item.notes || '',
                autopay: item.autopay,
            });
        } else {
            setEditing(null);
            setFormData({
                name: '',
                amount: 0,
                frequency: 'monthly',
                nextDueDate: new Date().toISOString().split('T')[0],
                category: 'General',
                provider: '',
                notes: '',
                autopay: false,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        if (editing) {
            updateFixedExpense(editing.id, formData);
        } else {
            createFixedExpense(currentUser.id, formData);
        }
        setItems(getFixedExpenses(currentUser.id));
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        const confirmText = settings.language === 'es'
            ? '¿Seguro que quieres eliminar este gasto fijo?'
            : settings.language === 'fr'
                ? 'Voulez-vous supprimer cette dépense fixe ?'
                : 'Are you sure you want to delete this fixed expense?';
        if (confirm(confirmText)) {
            deleteFixedExpense(id);
            if (currentUser) setItems(getFixedExpenses(currentUser.id));
        }
    };

    const toggleActive = (item: FixedExpense) => {
        updateFixedExpense(item.id, { isActive: !item.isActive });
        setItems(prev => prev.map(i => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)));
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><div className="spinner"></div></div>;
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold">{t('fixed.title')}</h1>
                    <p className="text-[var(--text-muted)] mt-1">{t('fixed.subtitle')}</p>
                </div>
                <button className="btn btn-primary shadow-lg shadow-primary/20" onClick={() => handleOpenModal()}>
                    <Plus className="w-5 h-5" />
                    {t('fixed.new')}
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div>
                        <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-2">
                            {t('fixed.monthly_cost')}
                        </p>
                        <h2 className="text-4xl font-bold">{formatCurrency(monthlyTotal)}</h2>
                    </div>
                    <div className="mt-4 text-sm text-[var(--text-muted)] flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {t('fixed.estimate')}
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary)]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div>
                        <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-2">
                            {t('fixed.active')}
                        </p>
                        <h2 className="text-4xl font-bold">{items.filter(i => i.isActive).length}</h2>
                    </div>
                    <div className="mt-4 text-sm text-[var(--text-muted)] flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {t('fixed.total')} {items.length}
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--warning)]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div>
                        <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-2">
                            {t('fixed.upcoming')}
                        </p>
                        <h2 className="text-3xl font-bold">{upcoming?.name || t('fixed.none')}</h2>
                    </div>
                    <div className="mt-4 text-sm text-[var(--warning)] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {upcoming
                            ? `${t('fixed.due_in')} ${dueInDays(upcoming.nextDueDate)} ${t('fixed.days')} (${formatCurrency(upcoming.amount)})`
                            : t('fixed.no_upcoming')}
                    </div>
                </div>
            </div>

            <div className="glass-card p-4">
                <div className="filters-row">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            className="input search-field search-input"
                            placeholder={t('fixed.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="all">{t('fixed.filter_all')}</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select className="input" value={frequencyFilter} onChange={(e) => setFrequencyFilter(e.target.value)}>
                        <option value="all">{t('fixed.filter_frequency')}</option>
                        <option value="monthly">{t('fixed.frequency_monthly')}</option>
                        <option value="quarterly">{t('fixed.frequency_quarterly')}</option>
                        <option value="yearly">{t('fixed.frequency_yearly')}</option>
                    </select>
                    <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'paused')}>
                        <option value="all">{t('fixed.filter_status')}</option>
                        <option value="active">{t('fixed.status_active')}</option>
                        <option value="paused">{t('fixed.status_paused')}</option>
                    </select>
                    <button className="chip" onClick={exportCsv}>
                        <Download className="w-4 h-4" />
                        {settings.language === 'es' ? 'Exportar' : settings.language === 'fr' ? 'Exporter' : 'Export'}
                    </button>
                </div>
            </div>

            <div className="glass-card p-0 overflow-hidden">
                <div className="p-6 border-b border-[var(--border)]">
                    <h3 className="text-lg font-bold">{t('fixed.list')}</h3>
                </div>
                <div className="divide-y divide-[var(--border)]">
                    {filtered.length > 0 ? filtered.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-[var(--bg-tertiary)]/50 transition-colors flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center text-xl">
                                    {item.autopay ? '⚡' : '🧾'}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">{item.name}</h4>
                                    <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                                        <span className="tag">{item.category}</span>
                                        <span>•</span>
                                        <span>{item.frequency === 'monthly' ? t('fixed.frequency_monthly') : item.frequency === 'quarterly' ? t('fixed.frequency_quarterly') : t('fixed.frequency_yearly')}</span>
                                        {item.provider && (
                                            <>
                                                <span>•</span>
                                                <span>{item.provider}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="font-bold text-lg">{formatCurrency(item.amount)}</p>
                                    <p className="text-xs text-[var(--text-muted)]">
                                        {t('fixed.next')} {new Date(item.nextDueDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => toggleActive(item)}
                                        className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-white transition-colors"
                                    >
                                        {item.isActive ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={() => handleOpenModal(item)}
                                        className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-white transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 rounded-lg hover:bg-[var(--danger)]/10 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-12 text-[var(--text-muted)]">
                            <p className="mb-4">{t('fixed.empty')}</p>
                            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                                <Plus className="w-5 h-5" />
                                {t('fixed.add_first')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editing ? t('fixed.edit') : t('fixed.new')}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">{t('fixed.name')}</label>
                            <input
                                className="input"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">{t('fixed.amount')}</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input"
                                value={formData.amount || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">{t('fixed.frequency')}</label>
                            <select
                                className="input"
                                value={formData.frequency}
                                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as FixedExpenseFormData['frequency'] }))}
                            >
                                <option value="monthly">{t('fixed.frequency_monthly')}</option>
                                <option value="quarterly">{t('fixed.frequency_quarterly')}</option>
                                <option value="yearly">{t('fixed.frequency_yearly')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">{t('fixed.next_due')}</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.nextDueDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, nextDueDate: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">{t('fixed.category')}</label>
                            <input
                                className="input"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="label">{t('fixed.provider')}</label>
                            <input
                                className="input"
                                value={formData.provider || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">{t('fixed.notes')}</label>
                            <textarea
                                className="input min-h-[90px] resize-none"
                                value={formData.notes || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)]">
                                <input
                                    type="checkbox"
                                    checked={formData.autopay}
                                    onChange={(e) => setFormData(prev => ({ ...prev, autopay: e.target.checked }))}
                                    className="w-5 h-5 rounded accent-[var(--primary)]"
                                />
                                <div>
                                    <p className="font-medium">{t('fixed.autopay')}</p>
                                    <p className="text-sm text-[var(--text-muted)]">{t('fixed.autopay_desc')}</p>
                                </div>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
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
