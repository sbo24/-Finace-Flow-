// ===========================================
// Widget de Objetivos Rápidos y Microahorros
// Sugiere ahorros basados en patrones de gasto
// ===========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import {
    generateMicroSavingSuggestions,
    calculateUnallocatedMoney,
    type MicroSavingSuggestion
} from '../../services/smartNotificationService';
import { getActiveGoals } from '../../services/savingsService';
import { addContribution } from '../../services/savingsService';
import {
    Target,
    Sparkles,
    ChevronRight,
    Zap,
    PiggyBank,
    ArrowRight,
    CheckCircle
} from 'lucide-react';

export default function QuickGoalsWidget() {
    const { currentUser } = useAuth();
    const { settings } = useSettings();
    const [suggestions, setSuggestions] = useState<MicroSavingSuggestion[]>([]);
    const [unallocated, setUnallocated] = useState(0);
    const [activeGoals, setActiveGoals] = useState<{ id: string; name: string; current: number; target: number; icon: string }[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [savedToGoal, setSavedToGoal] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) return;

        const sug = generateMicroSavingSuggestions(currentUser.id);
        setSuggestions(sug);

        const unalloc = calculateUnallocatedMoney(currentUser.id);
        setUnallocated(unalloc);

        const goals = getActiveGoals(currentUser.id);
        setActiveGoals(goals.map(g => ({
            id: g.id,
            name: g.name,
            current: g.currentAmount,
            target: g.targetAmount,
            icon: g.icon
        })));
    }, [currentUser]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(
            settings.language === 'es' ? 'es-ES' : settings.language === 'fr' ? 'fr-FR' : 'en-US',
            { style: 'currency', currency: settings.currency }
        ).format(amount);
    };

    const handleQuickSave = (goalId: string, amount: number) => {
        addContribution(goalId, amount, 'Microahorro rápido');
        setSavedToGoal(goalId);
        setTimeout(() => setSavedToGoal(null), 2000);

        // Refresh data
        if (currentUser) {
            const goals = getActiveGoals(currentUser.id);
            setActiveGoals(goals.map(g => ({
                id: g.id,
                name: g.name,
                current: g.currentAmount,
                target: g.targetAmount,
                icon: g.icon
            })));
            setUnallocated(calculateUnallocatedMoney(currentUser.id));
        }
    };

    const getDifficultyBadge = (difficulty: 'easy' | 'medium' | 'hard') => {
        switch (difficulty) {
            case 'easy':
                return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Fácil</span>;
            case 'medium':
                return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">Medio</span>;
            case 'hard':
                return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Difícil</span>;
        }
    };

    const displayedSuggestions = showAll ? suggestions : suggestions.slice(0, 3);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">
                            {settings.language === 'es' ? 'Microahorros' : settings.language === 'fr' ? 'Micro-épargne' : 'Micro Savings'}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">
                            {settings.language === 'es' ? 'Oportunidades de ahorro' : 'Saving opportunities'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Unallocated Money Banner */}
            {unallocated > 10 && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <PiggyBank className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                                {settings.language === 'es' ? 'Dinero sin asignar' : 'Unallocated money'}
                            </p>
                            <p className="text-lg font-bold text-emerald-400">{formatCurrency(unallocated)}</p>
                        </div>
                        {activeGoals.length > 0 && unallocated > 5 && (
                            <button
                                onClick={() => handleQuickSave(activeGoals[0].id, Math.min(unallocated, 50))}
                                className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 
                                    text-emerald-400 text-xs font-medium transition-all flex items-center gap-1.5 shrink-0"
                            >
                                {savedToGoal === activeGoals[0].id ? (
                                    <><CheckCircle className="w-3.5 h-3.5" /> ¡Hecho!</>
                                ) : (
                                    <><ArrowRight className="w-3.5 h-3.5" /> {settings.language === 'es' ? 'Ahorrar' : 'Save'}</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Active Goals Mini Progress */}
            {activeGoals.length > 0 && (
                <div className="space-y-2">
                    {activeGoals.slice(0, 2).map(goal => {
                        const percent = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
                        return (
                            <div key={goal.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-tertiary)]">
                                <span className="text-lg shrink-0">{goal.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium truncate">{goal.name}</p>
                                        <span className="text-xs text-[var(--text-muted)] shrink-0">{percent.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] transition-all duration-500"
                                            style={{ width: `${Math.min(percent, 100)}%` }}
                                        />
                                    </div>
                                </div>
                                {savedToGoal === goal.id ? (
                                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                                ) : (
                                    <button
                                        onClick={() => handleQuickSave(goal.id, 10)}
                                        className="text-xs px-2 py-1 rounded-md bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 
                                            text-[var(--primary)] transition-all shrink-0"
                                        title={settings.language === 'es' ? 'Ahorrar 10€' : 'Save 10€'}
                                    >
                                        +10€
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Micro Saving Suggestions */}
            {suggestions.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">
                        {settings.language === 'es' ? '💡 Sugerencias' : '💡 Suggestions'}
                    </p>
                    {displayedSuggestions.map(sug => (
                        <div
                            key={sug.id}
                            className="p-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--border)] transition-all group"
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-xl shrink-0">{sug.categoryIcon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium capitalize">{sug.category}</p>
                                        {getDifficultyBadge(sug.difficulty)}
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{sug.message}</p>
                                    {sug.targetGoal && (
                                        <p className="text-xs text-[var(--primary)] mt-1 flex items-center gap-1">
                                            <Target className="w-3 h-3" />
                                            {settings.language === 'es'
                                                ? `→ Acerca a "${sug.targetGoal.name}" (faltan ${formatCurrency(sug.targetGoal.remaining)})`
                                                : `→ Closer to "${sug.targetGoal.name}" (${formatCurrency(sug.targetGoal.remaining)} left)`
                                            }
                                        </p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold text-emerald-400">
                                        +{formatCurrency(sug.monthlySavings)}
                                    </p>
                                    <p className="text-[10px] text-[var(--text-muted)]">
                                        /{settings.language === 'es' ? 'mes' : 'mo'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {suggestions.length > 3 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="w-full text-center text-xs text-[var(--primary)] hover:underline py-1 flex items-center justify-center gap-1"
                        >
                            {showAll
                                ? (settings.language === 'es' ? 'Ver menos' : 'See less')
                                : (settings.language === 'es' ? `Ver ${suggestions.length - 3} más` : `See ${suggestions.length - 3} more`)
                            }
                            <ChevronRight className={`w-3 h-3 transition-transform ${showAll ? 'rotate-90' : ''}`} />
                        </button>
                    )}
                </div>
            )}

            {/* Empty State */}
            {suggestions.length === 0 && activeGoals.length === 0 && (
                <div className="text-center py-6">
                    <Zap className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-[var(--text-muted)]">
                        {settings.language === 'es'
                            ? 'Añade transacciones para ver sugerencias de ahorro'
                            : 'Add transactions to see saving suggestions'}
                    </p>
                </div>
            )}
        </div>
    );
}
