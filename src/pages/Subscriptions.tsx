import { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    Trash2,
    ExternalLink,
    Calendar,
    CreditCard,
    AlertCircle,
    Search,
    Edit2,
    X,
    Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { type Subscription, type SubscriptionFormData } from '../types';
import {
    createSubscription,
    deleteSubscription,
    getSubscriptions,
    getUpcomingSubscription,
    updateSubscription
} from '../services/subscriptionService';

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

export default function Subscriptions() {
    const { currentUser } = useAuth();
    const { t, settings } = useSettings();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Subscription | null>(null);

    const [formData, setFormData] = useState<SubscriptionFormData>({
        name: '',
        amount: 0,
        billingCycle: 'monthly',
        nextBillingDate: new Date().toISOString().split('T')[0],
        category: 'General',
        logoUrl: '',
        websiteUrl: '',
        description: '',
    });

    useEffect(() => {
        if (!currentUser) return;
        const data = getSubscriptions(currentUser.id);
        setSubscriptions(data);
        setLoading(false);
    }, [currentUser]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(
            settings.language === 'es' ? 'es-ES' : settings.language === 'fr' ? 'fr-FR' : 'en-US',
            { style: 'currency', currency: settings.currency }
        ).format(amount);
    };

    const monthlyTotal = useMemo(() => {
        return subscriptions.reduce((total, sub) => {
            if (sub.billingCycle === 'yearly') {
                return total + sub.amount / 12;
            }
            return total + sub.amount;
        }, 0);
    }, [subscriptions]);

    const upcoming = useMemo(() => {
        if (!currentUser) return null;
        return getUpcomingSubscription(currentUser.id);
    }, [currentUser, subscriptions]);

    const filtered = useMemo(() => {
        return subscriptions.filter(sub => {
            const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || sub.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [subscriptions, searchTerm, categoryFilter]);

    const exportCsv = () => {
        const escape = (value: string | number | undefined) =>
            `"${String(value ?? '').replace(/"/g, '""')}"`;
        const rows = filtered.map(sub => [
            sub.name,
            sub.category,
            sub.billingCycle,
            sub.amount,
            new Date(sub.nextBillingDate).toISOString().split('T')[0],
            sub.websiteUrl || '',
            sub.description || ''
        ]);
        const header = ['Name', 'Category', 'Billing', 'Amount', 'Next Billing', 'Website', 'Description'];
        const csv = [header, ...rows].map(r => r.map(escape).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const categories = useMemo(() => {
        const set = new Set(subscriptions.map(s => s.category));
        return Array.from(set).sort();
    }, [subscriptions]);

    const dueInDays = (date: Date) => {
        const today = new Date();
        const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const handleOpenModal = (sub?: Subscription) => {
        if (sub) {
            setEditing(sub);
            setFormData({
                name: sub.name,
                amount: sub.amount,
                billingCycle: sub.billingCycle,
                nextBillingDate: new Date(sub.nextBillingDate).toISOString().split('T')[0],
                category: sub.category,
                logoUrl: sub.logoUrl || '',
                websiteUrl: sub.websiteUrl || '',
                description: sub.description || '',
            });
        } else {
            setEditing(null);
            setFormData({
                name: '',
                amount: 0,
                billingCycle: 'monthly',
                nextBillingDate: new Date().toISOString().split('T')[0],
                category: 'General',
                logoUrl: '',
                websiteUrl: '',
                description: '',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        if (editing) {
            updateSubscription(editing.id, formData);
        } else {
            createSubscription(currentUser.id, formData);
        }
        setSubscriptions(getSubscriptions(currentUser.id));
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        const confirmText = settings.language === 'es'
            ? '¿Seguro que quieres eliminar esta suscripción?'
            : settings.language === 'fr'
                ? 'Voulez-vous supprimer cet abonnement ?'
                : 'Are you sure you want to delete this subscription?';
        if (confirm(confirmText)) {
            deleteSubscription(id);
            if (currentUser) {
                setSubscriptions(getSubscriptions(currentUser.id));
            }
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><div className="spinner"></div></div>;
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold">{t('subscriptions.title')}</h1>
                    <p className="text-[var(--text-muted)] mt-1">
                        {t('subscriptions.subtitle')}
                    </p>
                </div>
                <button className="btn btn-primary shadow-lg shadow-primary/20" onClick={() => handleOpenModal()}>
                    <Plus className="w-5 h-5" />
                    {t('subscriptions.new')}
                </button>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div>
                        <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-2">
                            {t('subscriptions.monthly_cost')}
                        </p>
                        <h2 className="text-4xl font-bold">{formatCurrency(monthlyTotal)}</h2>
                    </div>
                    <div className="mt-4 text-sm text-[var(--text-muted)] flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {t('subscriptions.next_month')}
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary)]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div>
                        <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-2">
                            {t('subscriptions.active')}
                        </p>
                        <h2 className="text-4xl font-bold">{subscriptions.length}</h2>
                    </div>
                    <div className="mt-4 text-sm text-[var(--text-muted)] flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        {t('subscriptions.connected')}
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--warning)]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div>
                        <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider mb-2">
                            {t('subscriptions.upcoming')}
                        </p>
                        <h2 className="text-3xl font-bold">{upcoming?.name || t('subscriptions.none')}</h2>
                    </div>
                    <div className="mt-4 text-sm text-[var(--warning)] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {upcoming
                            ? `${t('subscriptions.due_in')} ${dueInDays(upcoming.nextBillingDate)} ${t('subscriptions.days')} (${formatCurrency(upcoming.amount)})`
                            : t('subscriptions.no_upcoming')}
                    </div>
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
                            placeholder={t('subscriptions.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="input"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">{t('subscriptions.filter_all')}</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <button className="chip" onClick={exportCsv}>
                        <Download className="w-4 h-4" />
                        {settings.language === 'es' ? 'Exportar' : settings.language === 'fr' ? 'Exporter' : 'Export'}
                    </button>
                </div>
            </div>

            {/* Subscriptions List */}
            <div className="glass-card p-0 overflow-hidden">
                <div className="p-6 border-b border-[var(--border)]">
                    <h3 className="text-lg font-bold">{t('subscriptions.my_list')}</h3>
                </div>
                <div className="divide-y divide-[var(--border)]">
                    {filtered.length > 0 ? filtered.map((sub) => {
                        const logo = sub.logoUrl
                            || (sub.websiteUrl ? `https://logo.clearbit.com/${sub.websiteUrl.replace(/^https?:\/\//, '')}` : '');
                        return (
                            <div key={sub.id} className="p-4 hover:bg-[var(--bg-tertiary)]/50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center shadow-sm">
                                        {logo ? (
                                            <img
                                                src={logo}
                                                alt={sub.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${sub.name}&background=random`;
                                                }}
                                            />
                                        ) : (
                                            <span className="text-lg font-bold text-gray-600">{sub.name[0]?.toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">{sub.name}</h4>
                                        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                                            <span className="tag">{sub.category}</span>
                                            <span>•</span>
                                            <span>{sub.billingCycle === 'monthly' ? t('subscriptions.billing_monthly') : t('subscriptions.billing_yearly')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="font-bold text-lg">{formatCurrency(sub.amount)}</p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {t('subscriptions.next')} {new Date(sub.nextBillingDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {sub.websiteUrl && (
                                            <a
                                                href={sub.websiteUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-white transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleOpenModal(sub)}
                                            className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-white transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(sub.id)}
                                            className="p-2 rounded-lg hover:bg-[var(--danger)]/10 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-12 text-[var(--text-muted)]">
                            <p className="mb-4">{t('subscriptions.no_items')}</p>
                            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                                <Plus className="w-5 h-5" />
                                {t('subscriptions.add_first')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editing ? t('subscriptions.edit') : t('subscriptions.new')}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">{t('subscriptions.name')}</label>
                            <input
                                className="input"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">{t('subscriptions.amount')}</label>
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
                            <label className="label">{t('subscriptions.billing_cycle')}</label>
                            <select
                                className="input"
                                value={formData.billingCycle}
                                onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value as SubscriptionFormData['billingCycle'] }))}
                            >
                                <option value="monthly">{t('subscriptions.billing_monthly')}</option>
                                <option value="yearly">{t('subscriptions.billing_yearly')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">{t('subscriptions.next_billing')}</label>
                            <input
                                type="date"
                                className="input"
                                value={formData.nextBillingDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, nextBillingDate: e.target.value }))}
                                required
                            />
                        </div>
                        <div>
                            <label className="label">{t('subscriptions.category')}</label>
                            <input
                                className="input"
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="label">{t('subscriptions.website')}</label>
                            <input
                                className="input"
                                placeholder="https://example.com"
                                value={formData.websiteUrl || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">{t('subscriptions.logo')}</label>
                            <input
                                className="input"
                                placeholder="https://..."
                                value={formData.logoUrl || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label">{t('subscriptions.description')}</label>
                            <textarea
                                className="input min-h-[90px] resize-none"
                                value={formData.description || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            />
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
