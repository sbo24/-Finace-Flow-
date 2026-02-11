// ===========================================
// Página de Configuración Mejorada
// Temas, idiomas y preferencias completas
// ===========================================

import { useState } from 'react';
import {
    User, Bell, Shield, Palette, Download, Trash2, Save, Loader2,
    Globe, Calendar, Zap, Eye, Moon, Sun, Leaf, Sunset, Stars
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings, type Theme, type Language, type Currency } from '../contexts/SettingsContext';

export default function Settings() {
    const { currentUser, updateProfile } = useAuth();
    const { settings, updateSettings, t } = useSettings();
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [notifications, setNotifications] = useState({
        emailWeekly: true,
        emailBudget: true,
        pushAlerts: false,
    });

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await updateProfile(displayName);
            setMessage({ type: 'success', text: settings.language === 'es' ? 'Perfil actualizado correctamente' : 'Profile updated successfully' });
        } catch {
            setMessage({ type: 'error', text: settings.language === 'es' ? 'Error al actualizar el perfil' : 'Error updating profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleExportData = () => {
        // Exportar todos los datos de localStorage
        const data: Record<string, unknown> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('financeflow')) {
                data[key] = JSON.parse(localStorage.getItem(key) || '{}');
            }
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financeflow_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        setMessage({ type: 'success', text: settings.language === 'es' ? 'Datos exportados correctamente' : 'Data exported successfully' });
    };

    const handleDeleteAccount = () => {
        const confirmText = settings.language === 'es'
            ? '¿Estás seguro de que deseas eliminar tu cuenta? Escribe "ELIMINAR" para confirmar.'
            : 'Are you sure you want to delete your account? Type "DELETE" to confirm.';

        const expected = settings.language === 'es' ? 'ELIMINAR' : 'DELETE';
        const input = prompt(confirmText);

        if (input === expected) {
            // Eliminar todos los datos del usuario
            const keysToDelete = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('financeflow')) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => localStorage.removeItem(key));
            window.location.reload();
        }
    };

    const themes: { id: Theme; name: string; icon: React.ElementType; color: string }[] = [
        { id: 'dark', name: t('theme.dark'), icon: Moon, color: '#10B981' },
        { id: 'light', name: t('theme.light'), icon: Sun, color: '#F59E0B' },
        { id: 'midnight', name: t('theme.midnight'), icon: Stars, color: '#6366F1' },
        { id: 'nature', name: t('theme.nature'), icon: Leaf, color: '#22C55E' },
        { id: 'sunset', name: t('theme.sunset'), icon: Sunset, color: '#F97316' },
    ];

    const languages: { id: Language; name: string; flag: string }[] = [
        { id: 'es', name: 'Español', flag: '🇪🇸' },
        { id: 'en', name: 'English', flag: '🇬🇧' },
        { id: 'fr', name: 'Français', flag: '🇫🇷' },
    ];

    const currencies: { id: Currency; name: string; symbol: string }[] = [
        { id: 'EUR', name: 'Euro', symbol: '€' },
        { id: 'USD', name: 'US Dollar', symbol: '$' },
        { id: 'GBP', name: 'British Pound', symbol: '£' },
        { id: 'MXN', name: 'Peso Mexicano', symbol: 'MX$' },
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
                <p className="text-[var(--text-secondary)]">{t('settings.subtitle')}</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl ${message.type === 'success'
                    ? 'bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)]'
                    : 'bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)]'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Theme Section */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
                        <Palette className="w-5 h-5 text-[var(--accent)]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">{t('settings.appearance')}</h2>
                        <p className="text-sm text-[var(--text-muted)]">{t('settings.appearance_desc')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="label">{t('settings.theme')}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {themes.map(theme => {
                            const Icon = theme.icon;
                            const isActive = settings.theme === theme.id;

                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => updateSettings({ theme: theme.id })}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${isActive
                                        ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                        : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                                        }`}
                                >
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: `${theme.color}20` }}
                                    >
                                        <Icon className="w-5 h-5" style={{ color: theme.color }} />
                                    </div>
                                    <span className="text-sm font-medium">{theme.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Language Section */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[var(--secondary)]/20 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-[var(--secondary)]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">{t('settings.language')}</h2>
                        <p className="text-sm text-[var(--text-muted)]">
                            {settings.language === 'es' ? 'Elige tu idioma preferido' : 'Choose your preferred language'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {languages.map(lang => (
                        <button
                            key={lang.id}
                            onClick={() => updateSettings({ language: lang.id })}
                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${settings.language === lang.id
                                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                                : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                                }`}
                        >
                            <span className="text-2xl">{lang.flag}</span>
                            <span className="font-medium">{lang.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Preferences Section */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[var(--warning)]/20 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-[var(--warning)]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">{t('settings.preferences')}</h2>
                        <p className="text-sm text-[var(--text-muted)]">{t('settings.preferences_desc')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="label">{t('settings.currency')}</label>
                        <select
                            className="input"
                            value={settings.currency}
                            onChange={(e) => updateSettings({ currency: e.target.value as Currency })}
                        >
                            {currencies.map(c => (
                                <option key={c.id} value={c.id}>{c.symbol} - {c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="label">{t('settings.date_format')}</label>
                        <select
                            className="input"
                            value={settings.dateFormat}
                            onChange={(e) => updateSettings({ dateFormat: e.target.value as typeof settings.dateFormat })}
                        >
                            <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                            <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                            <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                        </select>
                    </div>

                    <div>
                        <label className="label">{t('settings.week_start')}</label>
                        <select
                            className="input"
                            value={settings.weekStartDay}
                            onChange={(e) => updateSettings({ weekStartDay: e.target.value as 'monday' | 'sunday' })}
                        >
                            <option value="monday">{settings.language === 'es' ? 'Lunes' : 'Monday'}</option>
                            <option value="sunday">{settings.language === 'es' ? 'Domingo' : 'Sunday'}</option>
                        </select>
                    </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] cursor-pointer">
                        <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-[var(--text-muted)]" />
                            <div>
                                <p className="font-medium">{t('settings.compact_mode')}</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {settings.language === 'es' ? 'Reduce el espaciado para ver más contenido' : 'Reduce spacing to see more content'}
                                </p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.compactMode}
                            onChange={(e) => updateSettings({ compactMode: e.target.checked })}
                            className="w-5 h-5 rounded accent-[var(--primary)]"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] cursor-pointer">
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-[var(--text-muted)]" />
                            <div>
                                <p className="font-medium">{t('settings.animations')}</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {settings.language === 'es' ? 'Activa o desactiva las animaciones' : 'Enable or disable animations'}
                                </p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.animationsEnabled}
                            onChange={(e) => updateSettings({ animationsEnabled: e.target.checked })}
                            className="w-5 h-5 rounded accent-[var(--primary)]"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] cursor-pointer">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-[var(--text-muted)]" />
                            <div>
                                <p className="font-medium">{t('settings.show_tips')}</p>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {settings.language === 'es' ? 'Muestra consejos financieros diarios' : 'Show daily financial tips'}
                                </p>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.showTips}
                            onChange={(e) => updateSettings({ showTips: e.target.checked })}
                            className="w-5 h-5 rounded accent-[var(--primary)]"
                        />
                    </label>
                </div>
            </div>

            {/* Profile Section */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">{t('settings.profile')}</h2>
                        <p className="text-sm text-[var(--text-muted)]">{t('settings.profile_desc')}</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-3xl font-semibold">
                            {displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-[var(--text-muted)]">Email</p>
                            <p className="font-medium">{currentUser?.email}</p>
                        </div>
                    </div>

                    <div>
                        <label className="label">{settings.language === 'es' ? 'Nombre' : 'Name'}</label>
                        <input
                            type="text"
                            className="input"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder={settings.language === 'es' ? 'Tu nombre' : 'Your name'}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {t('common.save')}
                    </button>
                </form>
            </div>

            {/* Notifications Section */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[var(--info)]/20 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-[var(--info)]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">{t('settings.notifications')}</h2>
                        <p className="text-sm text-[var(--text-muted)]">{t('settings.notifications_desc')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] cursor-pointer">
                        <div>
                            <p className="font-medium">
                                {settings.language === 'es' ? 'Resumen semanal por email' : 'Weekly email summary'}
                            </p>
                            <p className="text-sm text-[var(--text-muted)]">
                                {settings.language === 'es' ? 'Recibe un resumen de tus gastos cada semana' : 'Receive a weekly summary of your spending'}
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.emailWeekly}
                            onChange={(e) => setNotifications(prev => ({ ...prev, emailWeekly: e.target.checked }))}
                            className="w-5 h-5 rounded accent-[var(--primary)]"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] cursor-pointer">
                        <div>
                            <p className="font-medium">
                                {settings.language === 'es' ? 'Alertas de presupuesto' : 'Budget alerts'}
                            </p>
                            <p className="text-sm text-[var(--text-muted)]">
                                {settings.language === 'es' ? 'Recibe alertas cuando superes tus límites' : 'Get alerts when you exceed your limits'}
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.emailBudget}
                            onChange={(e) => setNotifications(prev => ({ ...prev, emailBudget: e.target.checked }))}
                            className="w-5 h-5 rounded accent-[var(--primary)]"
                        />
                    </label>

                    <label className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] cursor-pointer">
                        <div>
                            <p className="font-medium">
                                {settings.language === 'es' ? 'Notificaciones push' : 'Push notifications'}
                            </p>
                            <p className="text-sm text-[var(--text-muted)]">
                                {settings.language === 'es' ? 'Recibe notificaciones en tu navegador' : 'Receive notifications in your browser'}
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={notifications.pushAlerts}
                            onChange={(e) => setNotifications(prev => ({ ...prev, pushAlerts: e.target.checked }))}
                            className="w-5 h-5 rounded accent-[var(--primary)]"
                        />
                    </label>
                </div>
            </div>

            {/* Data & Security Section */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[var(--danger)]/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-[var(--danger)]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">{t('settings.data')}</h2>
                        <p className="text-sm text-[var(--text-muted)]">{t('settings.data_desc')}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <button onClick={handleExportData} className="btn btn-secondary w-full justify-start">
                        <Download className="w-4 h-4" />
                        {t('settings.export')}
                    </button>

                    <button onClick={handleDeleteAccount} className="btn btn-danger w-full justify-start">
                        <Trash2 className="w-4 h-4" />
                        {t('settings.delete_account')}
                    </button>
                </div>
            </div>
        </div>
    );
}
