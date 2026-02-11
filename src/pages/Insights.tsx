// ===========================================
// Página de Insights - Recomendaciones financieras
// Aquí se muestran las mierdas inteligentes
// ===========================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    generateSavingRecommendations,
    analyzeSpendingByCategory,
    calculatePotentialSavings,
    type InsightRecommendation,
    type SpendingAnalysis
} from '../services/insightsService';
import {
    Lightbulb,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Award,
    PiggyBank,
    ArrowRight,
    Sparkles,
    Brain,
    Search
} from 'lucide-react';

export default function Insights() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [recommendations, setRecommendations] = useState<InsightRecommendation[]>([]);
    const [spendingAnalysis, setSpendingAnalysis] = useState<SpendingAnalysis[]>([]);
    const [potentialSavings, setPotentialSavings] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<InsightRecommendation['type'] | 'all'>('all');

    useEffect(() => {
        if (currentUser) {
            loadInsights();
        }
    }, [currentUser]);

    const loadInsights = () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const recs = generateSavingRecommendations(currentUser.id);
            const analysis = analyzeSpendingByCategory(currentUser.id);
            const savings = calculatePotentialSavings(currentUser.id);

            setRecommendations(recs);
            setSpendingAnalysis(analysis.slice(0, 6)); // Top 6
            setPotentialSavings(savings);
        } finally {
            setLoading(false);
        }
    };

    const getTypeStyles = (type: InsightRecommendation['type']) => {
        switch (type) {
            case 'alert':
                return 'border-[var(--danger)] bg-[var(--danger)]/10';
            case 'warning':
                return 'border-[var(--warning)] bg-[var(--warning)]/10';
            case 'achievement':
                return 'border-[var(--success)] bg-[var(--success)]/10';
            case 'tip':
            default:
                return 'border-[var(--info)] bg-[var(--info)]/10';
        }
    };

    const getTypeIcon = (type: InsightRecommendation['type']) => {
        switch (type) {
            case 'alert':
                return <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />;
            case 'warning':
                return <TrendingUp className="w-5 h-5 text-[var(--warning)]" />;
            case 'achievement':
                return <Award className="w-5 h-5 text-[var(--success)]" />;
            case 'tip':
            default:
                return <Lightbulb className="w-5 h-5 text-[var(--info)]" />;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const filteredRecommendations = useMemo(() => {
        return recommendations.filter(rec => {
            const matchesType = typeFilter === 'all' || rec.type === typeFilter;
            const matchesSearch = `${rec.title} ${rec.message}`.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [recommendations, typeFilter, searchTerm]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                        <Brain className="w-7 h-7 text-[var(--primary)]" />
                        Inteligencia Financiera
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Análisis y recomendaciones personalizadas pa' mejorar tus finanzas
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            className="input search-field search-input"
                            placeholder="Buscar insights..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as InsightRecommendation['type'] | 'all')}>
                        <option value="all">Todos</option>
                        <option value="alert">Alertas</option>
                        <option value="warning">Advertencias</option>
                        <option value="achievement">Logros</option>
                        <option value="tip">Tips</option>
                    </select>
                </div>
            </div>

            {/* Resumen de ahorro potencial */}
            {potentialSavings > 0 && (
                <div className="glass-card p-6 border-l-4 border-[var(--primary)]">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/20 flex items-center justify-center">
                            <PiggyBank className="w-7 h-7 text-[var(--primary)]" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                Podrías ahorrar hasta
                            </h3>
                            <p className="text-3xl font-bold text-[var(--primary)]">
                                {formatCurrency(potentialSavings)}
                            </p>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Siguiendo las recomendaciones de abajo
                            </p>
                        </div>
                        <Sparkles className="w-8 h-8 text-[var(--primary)] opacity-50" />
                    </div>
                </div>
            )}

            {/* Grid de contenido */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recomendaciones - 2 columnas */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-[var(--warning)]" />
                        Recomendaciones
                    </h2>

                    {filteredRecommendations.length === 0 ? (
                        <div className="glass-card p-8 text-center">
                            <Award className="w-12 h-12 text-[var(--success)] mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                ¡Todo en orden!
                            </h3>
                            <p className="text-[var(--text-secondary)]">
                                No hay alertas ni recomendaciones por ahora. Sigue así.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredRecommendations.map((rec) => (
                                <div
                                    key={rec.id}
                                    className={`glass-card p-4 border-l-4 ${getTypeStyles(rec.type)} cursor-pointer hover:scale-[1.01] transition-transform`}
                                    onClick={() => rec.category && navigate(`/transactions?search=${rec.category}`)}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 mt-0.5">
                                            {getTypeIcon(rec.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xl">{rec.icon}</span>
                                                <h3 className="font-semibold text-[var(--text-primary)]">
                                                    {rec.title}
                                                </h3>
                                                {rec.priority === 'high' && (
                                                    <span className="badge badge-danger text-xs">Importante</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                {rec.message}
                                            </p>
                                            {rec.potentialSavings && rec.potentialSavings > 0 && (
                                                <p className="text-sm text-[var(--success)] mt-2 font-medium">
                                                    💰 Ahorro potencial: {formatCurrency(rec.potentialSavings)}
                                                </p>
                                            )}
                                        </div>
                                        {rec.category && (
                                            <ArrowRight className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Análisis de gastos - 1 columna */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[var(--info)]" />
                        Cambios vs Mes Anterior
                    </h2>

                    {spendingAnalysis.length === 0 ? (
                        <div className="glass-card p-6 text-center">
                            <p className="text-[var(--text-secondary)]">
                                No hay datos suficientes pa' comparar
                            </p>
                        </div>
                    ) : (
                        <div className="glass-card divide-y divide-[var(--border)]">
                            {spendingAnalysis.map((item, index) => (
                                <div key={index} className="p-4 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="font-medium text-[var(--text-primary)] truncate">
                                            {item.category}
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {formatCurrency(item.currentMonth)}
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-1 ${item.change > 0
                                            ? 'text-[var(--danger)]'
                                            : item.change < 0
                                                ? 'text-[var(--success)]'
                                                : 'text-[var(--text-muted)]'
                                        }`}>
                                        {item.change > 0 ? (
                                            <TrendingUp className="w-4 h-4" />
                                        ) : item.change < 0 ? (
                                            <TrendingDown className="w-4 h-4" />
                                        ) : null}
                                        <span className="font-semibold">
                                            {item.change > 0 ? '+' : ''}{item.changePercent.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
