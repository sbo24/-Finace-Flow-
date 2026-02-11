import { useState, useEffect, useMemo } from 'react';
import { Plus, Wallet, Trash2, Edit2, X, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { getAccounts, createAccount, updateAccount, deleteAccount, initializeDefaultAccount } from '../services/accountService';
import type { Account, AccountType, AccountFormData } from '../types';

export default function Accounts() {
    const { currentUser } = useAuth();
    const { settings } = useSettings();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<AccountType | 'all'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'balance'>('balance');
    const [formData, setFormData] = useState<AccountFormData>({
        name: '',
        type: 'checking',
        initialBalance: 0,
        color: '#3B82F6',
        icon: '💳',
        isDefault: false
    });

    useEffect(() => {
        if (currentUser) {
            loadAccounts();
        }
    }, [currentUser]);

    const loadAccounts = () => {
        if (!currentUser) return;
        let userAccounts = getAccounts(currentUser.id);
        if (userAccounts.length === 0) {
            // Create default account if none exists
            initializeDefaultAccount(currentUser.id);
            userAccounts = getAccounts(currentUser.id);
        }
        setAccounts(userAccounts);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(settings.language === 'es' ? 'es-ES' : settings.language === 'fr' ? 'fr-FR' : 'en-US', {
            style: 'currency',
            currency: settings.currency
        }).format(amount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (editingAccount) {
            updateAccount(currentUser.id, editingAccount.id, formData);
        } else {
            createAccount(currentUser.id, formData);
        }

        setShowModal(false);
        setEditingAccount(null);
        resetForm();
        loadAccounts();
    };

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setFormData({
            name: account.name,
            type: account.type,
            initialBalance: account.balance, // Note: This field is "initialBalance" in form but represents current balance when editing, though usually we don't edit balance directly here properly without transaction. For simplicity, we might lock it or allow it as "adjustment". 
            // In a real app, editing balance directly creates a "Balance Adjustment" transaction. Here we'll just allow editing properties, maybe lock balance.
            color: account.color,
            icon: account.icon,
            isDefault: account.isDefault
        });
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        const confirmText = settings.language === 'es'
            ? '¿Estás seguro de eliminar esta cuenta? Se perderá el historial asociado si no se migra.'
            : settings.language === 'fr'
                ? 'Êtes-vous sûr de supprimer ce compte ? L’historique associé sera perdu.'
                : 'Are you sure you want to delete this account? Associated history may be lost.';
        if (confirm(confirmText)) {
            // In a real app we should check for transactions first.
            deleteAccount(id);
            loadAccounts();
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'checking',
            initialBalance: 0,
            color: '#3B82F6',
            icon: '💳',
            isDefault: false
        });
    };

    const accountTypes: { value: AccountType, label: string, icon: string }[] = [
        { value: 'checking', label: settings.language === 'es' ? 'Cuenta Corriente' : settings.language === 'fr' ? 'Compte Courant' : 'Checking', icon: '💳' },
        { value: 'savings', label: settings.language === 'es' ? 'Ahorros' : settings.language === 'fr' ? 'Épargne' : 'Savings', icon: '🐷' },
        { value: 'cash', label: settings.language === 'es' ? 'Efectivo' : settings.language === 'fr' ? 'Espèces' : 'Cash', icon: '💵' },
        { value: 'credit', label: settings.language === 'es' ? 'Tarjeta de Crédito' : settings.language === 'fr' ? 'Carte de Crédit' : 'Credit Card', icon: '💳' },
        { value: 'investment', label: settings.language === 'es' ? 'Inversión' : settings.language === 'fr' ? 'Investissement' : 'Investment', icon: '📈' },
        { value: 'other', label: settings.language === 'es' ? 'Otro' : settings.language === 'fr' ? 'Autre' : 'Other', icon: '📦' },
    ];

    const filteredAccounts = useMemo(() => {
        return accounts
            .filter(acc => {
                const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesType = typeFilter === 'all' || acc.type === typeFilter;
                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                return b.balance - a.balance;
            });
    }, [accounts, searchTerm, typeFilter, sortBy]);

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{settings.language === 'es' ? 'Mis Cuentas' : settings.language === 'fr' ? 'Mes Comptes' : 'My Accounts'}</h1>
                    <p className="text-[var(--text-secondary)]">{settings.language === 'es' ? 'Gestiona tus cuentas y balances' : settings.language === 'fr' ? 'Gérez vos comptes et soldes' : 'Manage your accounts and balances'}</p>
                </div>
                <button
                    onClick={() => { resetForm(); setEditingAccount(null); setShowModal(true); }}
                    className="btn btn-primary"
                >
                    <Plus className="w-5 h-5" />
                    <span>{settings.language === 'es' ? 'Nueva Cuenta' : settings.language === 'fr' ? 'Nouveau Compte' : 'New Account'}</span>
                </button>
            </div>

            {/* Total Balance Card */}
            <div className="glass-card p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--secondary)]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[var(--primary)]/20 rounded-full backdrop-blur-sm">
                        <Wallet className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-[var(--text-muted)] font-medium">{settings.language === 'es' ? 'Balance Total' : settings.language === 'fr' ? 'Solde Total' : 'Total Balance'}</p>
                        <h2 className="text-3xl font-bold">{formatCurrency(totalBalance)}</h2>
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
                            placeholder={settings.language === 'es' ? 'Buscar cuentas...' : settings.language === 'fr' ? 'Rechercher des comptes...' : 'Search accounts...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm.length > 0 && (
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                onClick={() => setSearchTerm('')}
                                aria-label="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as AccountType | 'all')}>
                        <option value="all">{settings.language === 'es' ? 'Todos los tipos' : settings.language === 'fr' ? 'Tous les types' : 'All types'}</option>
                        {accountTypes.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                    <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'balance')}>
                        <option value="balance">{settings.language === 'es' ? 'Ordenar por balance' : settings.language === 'fr' ? 'Trier par solde' : 'Sort by balance'}</option>
                        <option value="name">{settings.language === 'es' ? 'Ordenar por nombre' : settings.language === 'fr' ? 'Trier par nom' : 'Sort by name'}</option>
                    </select>
                </div>
            </div>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAccounts.map((account) => (
                    <div key={account.id} className="glass-card p-6 relative group hover:shadow-md transition-shadow">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button
                                onClick={() => handleEdit(account)}
                                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(account.id)}
                                className="p-2 rounded-lg hover:bg-[var(--danger)]/10 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl" role="img" aria-label={account.name}>{account.icon}</span>
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2">
                                        {account.name}
                                        {account.isDefault && <span className="badge badge-success text-xs">Default</span>}
                                    </h3>
                                    <p className="text-sm text-[var(--text-muted)] capitalize">{accountTypeLabel(account.type, settings.language)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <p className="text-sm text-[var(--text-muted)]">{settings.language === 'es' ? 'Balance Actual' : settings.language === 'fr' ? 'Solde Actuel' : 'Current Balance'}</p>
                            <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--danger)]'}`}>
                                {formatCurrency(account.balance)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editingAccount ? (settings.language === 'es' ? 'Editar Cuenta' : settings.language === 'fr' ? 'Modifier le Compte' : 'Edit Account') : (settings.language === 'es' ? 'Nueva Cuenta' : settings.language === 'fr' ? 'Nouveau Compte' : 'New Account')}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="label">{settings.language === 'es' ? 'Nombre' : settings.language === 'fr' ? 'Nom' : 'Name'}</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    placeholder={settings.language === 'es' ? 'Ej: Banco Principal' : settings.language === 'fr' ? 'Ex: Banque Principale' : 'e.g. Main Bank'}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{settings.language === 'es' ? 'Tipo' : settings.language === 'fr' ? 'Type' : 'Type'}</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as AccountType })}
                                        className="input"
                                    >
                                        {accountTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">
                                        {editingAccount ? (settings.language === 'es' ? 'Balance (Ajuste)' : settings.language === 'fr' ? 'Solde (Ajustement)' : 'Balance (Adjustment)') : (settings.language === 'es' ? 'Balance Inicial' : settings.language === 'fr' ? 'Solde Initial' : 'Initial Balance')}
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        value={formData.initialBalance}
                                        onChange={e => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) })}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{settings.language === 'es' ? 'Icono' : settings.language === 'fr' ? 'Icône' : 'Icon'}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.icon}
                                        onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                        className="input"
                                        placeholder="🔍"
                                    />
                                </div>
                                <div>
                                    <label className="label">{settings.language === 'es' ? 'Color' : settings.language === 'fr' ? 'Couleur' : 'Color'}</label>
                                    <input
                                        type="color"
                                        required
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="w-full h-[42px] rounded-lg border border-[var(--border)] cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={formData.isDefault}
                                    onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                                    className="w-4 h-4 rounded accent-[var(--primary)]"
                                />
                                <label htmlFor="isDefault" className="text-sm text-[var(--text-secondary)]">
                                    {settings.language === 'es' ? 'Establecer como cuenta por defecto' : settings.language === 'fr' ? 'Définir comme compte par défaut' : 'Set as default account'}
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full mt-4"
                            >
                                {editingAccount ? (settings.language === 'es' ? 'Guardar Cambios' : settings.language === 'fr' ? 'Enregistrer' : 'Save Changes') : (settings.language === 'es' ? 'Crear Cuenta' : settings.language === 'fr' ? 'Créer un Compte' : 'Create Account')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function accountTypeLabel(type: AccountType, language: string): string {
    const labelsEs: Record<string, string> = {
        checking: 'Cuenta Corriente',
        savings: 'Ahorros',
        cash: 'Efectivo',
        credit: 'Tarjeta de Crédito',
        investment: 'Inversión',
        other: 'Otro'
    };
    const labelsFr: Record<string, string> = {
        checking: 'Compte Courant',
        savings: 'Épargne',
        cash: 'Espèces',
        credit: 'Carte de Crédit',
        investment: 'Investissement',
        other: 'Autre'
    };
    const labelsEn: Record<string, string> = {
        checking: 'Checking',
        savings: 'Savings',
        cash: 'Cash',
        credit: 'Credit Card',
        investment: 'Investment',
        other: 'Other'
    };
    if (language === 'es') return labelsEs[type] || type;
    if (language === 'fr') return labelsFr[type] || type;
    return labelsEn[type] || type;
}
