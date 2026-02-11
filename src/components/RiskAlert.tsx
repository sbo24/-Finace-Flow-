// ===========================================
// Componente de Alerta de Riesgos
// Muestra alertas financieras urgentes
// ===========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    analyzeFinancialRisks,
    type RiskSummary,
    type RiskLevel
} from '../services/riskAnalysisService';
import {
    AlertTriangle,
    AlertCircle,
    TrendingDown,
    X,
    Shield
} from 'lucide-react';

interface RiskAlertProps {
    currentBalance?: number;
    compact?: boolean;
}

export default function RiskAlert({ currentBalance = 0, compact = false }: RiskAlertProps) {
    const { currentUser } = useAuth();
    const [riskSummary, setRiskSummary] = useState<RiskSummary | null>(null);
    const [dismissedRisks, setDismissedRisks] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentUser) {
            loadRisks();
        }
    }, [currentUser, currentBalance]);

    const loadRisks = () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const summary = analyzeFinancialRisks(currentUser.id, currentBalance);
            setRiskSummary(summary);
        } finally {
            setLoading(false);
        }
    };

    const dismissRisk = (riskId: string) => {
        setDismissedRisks(prev => new Set([...prev, riskId]));
    };

    const getLevelStyles = (level: RiskLevel) => {
        switch (level) {
            case 'critical':
                return 'border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]';
            case 'high':
                return 'border-[var(--warning)] bg-[var(--warning)]/10 text-[var(--warning)]';
            case 'medium':
                return 'border-[var(--info)] bg-[var(--info)]/10 text-[var(--info)]';
            default:
                return 'border-[var(--text-muted)] bg-[var(--bg-tertiary)]';
        }
    };

    const getLevelIcon = (level: RiskLevel) => {
        switch (level) {
            case 'critical':
                return <AlertTriangle className="w-5 h-5" />;
            case 'high':
                return <AlertCircle className="w-5 h-5" />;
            default:
                return <TrendingDown className="w-5 h-5" />;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'liquidity': return '💧';
            case 'overspending': return '📈';
            case 'budget_breach': return '🎯';
            case 'savings_stall': return '🐌';
            default: return '⚠️';
        }
    };

    const visibleRisks = riskSummary?.risks.filter(r => !dismissedRisks.has(r.id)) || [];

    if (loading) {
        return null;
    }

    // Sin riesgos
    if (visibleRisks.length === 0) {
        if (compact) return null;

        return (
            <div className="glass-card p-4 border-l-4 border-[var(--success)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-[var(--success)]" />
                    </div>
                    <div>
                        <p className="font-medium text-[var(--text-primary)]">Todo en orden</p>
                        <p className="text-sm text-[var(--text-secondary)]">
                            No hay alertas de riesgo. Salud financiera: {riskSummary?.healthScore || 100}%
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Modo compacto - solo el más urgente
    if (compact) {
        const topRisk = visibleRisks[0];
        return (
            <div className={`p-3 rounded-lg border-l-4 ${getLevelStyles(topRisk.level)}`}>
                <div className="flex items-center gap-2">
                    {getLevelIcon(topRisk.level)}
                    <span className="font-medium text-sm">{topRisk.title}</span>
                    {visibleRisks.length > 1 && (
                        <span className="text-xs opacity-70">+{visibleRisks.length - 1} más</span>
                    )}
                </div>
            </div>
        );
    }

    // Modo completo
    return (
        <div className="space-y-3">
            {/* Header con resumen */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
                    Alertas de Riesgo
                    <span className="text-sm font-normal text-[var(--text-muted)]">
                        ({visibleRisks.length})
                    </span>
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-secondary)]">
                        Salud:
                    </span>
                    <span className={`font-bold ${(riskSummary?.healthScore || 0) >= 70 ? 'text-[var(--success)]' :
                        (riskSummary?.healthScore || 0) >= 40 ? 'text-[var(--warning)]' :
                            'text-[var(--danger)]'
                        }`}>
                        {riskSummary?.healthScore || 0}%
                    </span>
                </div>
            </div>

            {/* Lista de riesgos */}
            {visibleRisks.map(risk => (
                <div
                    key={risk.id}
                    className={`glass-card p-4 border-l-4 ${getLevelStyles(risk.level)}`}
                >
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">{getTypeIcon(risk.type)}</span>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-[var(--text-primary)]">
                                    {risk.title}
                                </h4>
                                {risk.level === 'critical' && (
                                    <span className="badge badge-danger text-xs">Urgente</span>
                                )}
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] mb-2">
                                {risk.message}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] mb-3">
                                {risk.details}
                            </p>

                            {/* Sugerencia */}
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-tertiary)]/50">
                                <span className="text-sm">💡</span>
                                <p className="text-sm text-[var(--text-primary)]">
                                    {risk.suggestedAction}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => dismissRisk(risk.id)}
                            className="p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            <X className="w-4 h-4 text-[var(--text-muted)]" />
                        </button>
                    </div>
                </div>
            ))}

            {/* Liquidez */}
            {riskSummary && riskSummary.liquidityDays < 30 && (
                <div className="text-center py-2 text-sm text-[var(--text-muted)]">
                    ⏱️ Liquidez actual: {riskSummary.liquidityDays} días de gastos
                </div>
            )}
        </div>
    );
}
