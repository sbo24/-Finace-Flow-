// ===========================================
// Widget de Alertas Inteligentes
// Muestra alertas del briefing diario
// ===========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import {
    generateDailyBriefing,
    type DailyBriefing,
    type SmartAlert
} from '../../services/smartNotificationService';
import {
    Bell,
    AlertTriangle,
    TrendingUp,
    ChevronRight,
    X,
    Zap,
    ShieldAlert,
    CreditCard
} from 'lucide-react';

export default function SmartAlertsWidget() {
    const { currentUser } = useAuth();
    const { settings } = useSettings();
    const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        const data = generateDailyBriefing(currentUser.id);
        setBriefing(data);
    }, [currentUser]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(
            settings.language === 'es' ? 'es-ES' : settings.language === 'fr' ? 'fr-FR' : 'en-US',
            { style: 'currency', currency: settings.currency }
        ).format(amount);
    };

    const dismissAlert = (alertId: string) => {
        setDismissedAlerts(prev => new Set([...prev, alertId]));
    };

    if (!briefing) return null;

    const activeAlerts = briefing.alerts.filter(a => !dismissedAlerts.has(a.id));
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

    const getSeverityStyles = (severity: SmartAlert['severity']) => {
        switch (severity) {
            case 'critical': return {
                bg: 'bg-red-500/10',
                border: 'border-red-500/30',
                text: 'text-red-400',
                icon: <ShieldAlert className="w-4 h-4" />
            };
            case 'warning': return {
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/30',
                text: 'text-amber-400',
                icon: <AlertTriangle className="w-4 h-4" />
            };
            case 'positive': return {
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/30',
                text: 'text-emerald-400',
                icon: <TrendingUp className="w-4 h-4" />
            };
            default: return {
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/30',
                text: 'text-blue-400',
                icon: <Bell className="w-4 h-4" />
            };
        }
    };

    const displayedAlerts = expanded ? activeAlerts : activeAlerts.slice(0, 3);
    const hasBriefingContent = briefing.budgetsAtRisk.length > 0 || briefing.upcomingBills.length > 0 || activeAlerts.length > 0;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center relative">
                        <Bell className="w-4 h-4 text-violet-400" />
                        {criticalAlerts.length > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                                {criticalAlerts.length}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">
                            {settings.language === 'es' ? 'Alertas Inteligentes' : settings.language === 'fr' ? 'Alertes intelligentes' : 'Smart Alerts'}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">
                            {settings.language === 'es' ? 'Tu resumen del día' : 'Your daily summary'}
                        </p>
                    </div>
                </div>
                {activeAlerts.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                        {activeAlerts.length}
                    </span>
                )}
            </div>

            {/* Today's Summary Mini */}
            <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] text-center">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                        {settings.language === 'es' ? 'Gastos hoy' : 'Today\'s expenses'}
                    </p>
                    <p className="text-sm font-bold text-red-400">{formatCurrency(briefing.todayExpenses)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--bg-tertiary)] text-center">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
                        {settings.language === 'es' ? 'Ingresos hoy' : 'Today\'s income'}
                    </p>
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(briefing.todayIncome)}</p>
                </div>
            </div>

            {/* Alerts */}
            {displayedAlerts.length > 0 && (
                <div className="space-y-2">
                    {displayedAlerts.map(alert => {
                        const styles = getSeverityStyles(alert.severity);
                        return (
                            <div
                                key={alert.id}
                                className={`p-3 rounded-xl ${styles.bg} border ${styles.border} transition-all`}
                            >
                                <div className="flex items-start gap-2.5">
                                    <span className={`${styles.text} mt-0.5 shrink-0`}>
                                        {styles.icon}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold ${styles.text}`}>{alert.title}</p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{alert.message}</p>
                                    </div>
                                    <button
                                        onClick={() => dismissAlert(alert.id)}
                                        className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors shrink-0 opacity-50 hover:opacity-100"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upcoming Bills */}
            {briefing.upcomingBills.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">
                        {settings.language === 'es' ? '📅 Pagos próximos' : '📅 Upcoming bills'}
                    </p>
                    {briefing.upcomingBills.map((bill, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-tertiary)]">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                <span className="text-xs font-medium">{bill.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">{formatCurrency(bill.amount)}</span>
                                <span className="text-[10px] text-amber-400">
                                    {bill.daysUntil === 0
                                        ? (settings.language === 'es' ? 'Hoy' : 'Today')
                                        : `${bill.daysUntil}d`}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Budgets at Risk */}
            {briefing.budgetsAtRisk.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">
                        {settings.language === 'es' ? '⚠️ Presupuestos en riesgo' : '⚠️ Budgets at risk'}
                    </p>
                    {briefing.budgetsAtRisk.slice(0, 3).map((budget, i) => (
                        <div key={i} className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">{budget.name}</span>
                                <span className={`text-xs font-bold ${budget.percent >= 100 ? 'text-red-400' : 'text-amber-400'}`}>
                                    {budget.percent.toFixed(0)}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${budget.percent >= 100 ? 'bg-red-500' : budget.percent >= 85 ? 'bg-amber-500' : 'bg-yellow-500'}`}
                                    style={{ width: `${Math.min(budget.percent, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Show more/less */}
            {activeAlerts.length > 3 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full text-center text-xs text-[var(--primary)] hover:underline py-1 flex items-center justify-center gap-1"
                >
                    {expanded
                        ? (settings.language === 'es' ? 'Ver menos' : 'See less')
                        : (settings.language === 'es' ? `Ver ${activeAlerts.length - 3} más` : `See ${activeAlerts.length - 3} more`)
                    }
                    <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>
            )}

            {/* No alerts state */}
            {!hasBriefingContent && (
                <div className="text-center py-4">
                    <Zap className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-emerald-400">
                        {settings.language === 'es' ? '¡Todo en orden!' : 'All clear!'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                        {settings.language === 'es' ? 'No hay alertas pendientes' : 'No pending alerts'}
                    </p>
                </div>
            )}
        </div>
    );
}
