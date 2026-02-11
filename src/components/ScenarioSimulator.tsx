// ===========================================
// Componente Simulador de Escenarios
// "Qué pasa si..." pa' proyectar tu pasta
// ===========================================

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { runScenario, projectBalance, type ScenarioChange, type ScenarioResult, type BalanceProjection } from '../services/projectionService';
import {
    Calculator,
    TrendingUp,
    Plus,
    Minus,
    Sparkles,
    RefreshCw
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export default function ScenarioSimulator() {
    const { currentUser } = useAuth();
    const [incomeChange, setIncomeChange] = useState(0);
    const [expenseChange, setExpenseChange] = useState(0);
    const [months, setMonths] = useState(12);
    const [result, setResult] = useState<ScenarioResult | null>(null);
    const [baseProjection, setBaseProjection] = useState<BalanceProjection[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentUser) {
            loadBaseProjection();
        }
    }, [currentUser, months]);

    const loadBaseProjection = () => {
        if (!currentUser) return;
        const base = projectBalance(currentUser.id, months);
        setBaseProjection(base);
    };

    const runSimulation = () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            const changes: ScenarioChange[] = [];

            if (incomeChange > 0) {
                changes.push({ type: 'income_increase', amount: incomeChange });
            } else if (incomeChange < 0) {
                changes.push({ type: 'income_decrease', amount: Math.abs(incomeChange) });
            }

            if (expenseChange > 0) {
                changes.push({ type: 'expense_increase', amount: expenseChange });
            } else if (expenseChange < 0) {
                changes.push({ type: 'expense_decrease', amount: Math.abs(expenseChange) });
            }

            if (changes.length > 0) {
                const simResult = runScenario(currentUser.id, changes, months);
                setResult(simResult);
            } else {
                setResult(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const resetSimulation = () => {
        setIncomeChange(0);
        setExpenseChange(0);
        setResult(null);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    // Combina datos pa'l gráfico
    const chartData = (result?.projection || baseProjection).map((item, index) => ({
        name: item.month.split(' ')[0].substring(0, 3),
        balance: item.projectedBalance,
        original: baseProjection[index]?.projectedBalance || 0
    }));

    return (
        <div className="glass-card p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Calculator className="w-6 h-6 text-[var(--accent)]" />
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        Simulador "Qué pasa si..."
                    </h3>
                </div>
                <button
                    onClick={resetSimulation}
                    className="btn btn-ghost btn-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                    Reset
                </button>
            </div>

            {/* Controles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cambio en ingresos */}
                <div className="space-y-2">
                    <label className="label flex items-center gap-2">
                        {incomeChange >= 0 ? (
                            <Plus className="w-4 h-4 text-[var(--success)]" />
                        ) : (
                            <Minus className="w-4 h-4 text-[var(--danger)]" />
                        )}
                        Cambio en Ingresos
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="-500"
                            max="1000"
                            step="50"
                            value={incomeChange}
                            onChange={(e) => setIncomeChange(Number(e.target.value))}
                            className="flex-1"
                        />
                        <span className={`font-mono text-sm w-20 text-right ${incomeChange > 0 ? 'text-[var(--success)]' :
                            incomeChange < 0 ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'
                            }`}>
                            {incomeChange >= 0 ? '+' : ''}{incomeChange}€
                        </span>
                    </div>
                </div>

                {/* Cambio en gastos */}
                <div className="space-y-2">
                    <label className="label flex items-center gap-2">
                        {expenseChange <= 0 ? (
                            <Minus className="w-4 h-4 text-[var(--success)]" />
                        ) : (
                            <Plus className="w-4 h-4 text-[var(--danger)]" />
                        )}
                        Cambio en Gastos
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="-500"
                            max="500"
                            step="50"
                            value={expenseChange}
                            onChange={(e) => setExpenseChange(Number(e.target.value))}
                            className="flex-1"
                        />
                        <span className={`font-mono text-sm w-20 text-right ${expenseChange < 0 ? 'text-[var(--success)]' :
                            expenseChange > 0 ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'
                            }`}>
                            {expenseChange >= 0 ? '+' : ''}{expenseChange}€
                        </span>
                    </div>
                </div>

                {/* Meses */}
                <div className="space-y-2">
                    <label className="label">Proyección</label>
                    <select
                        value={months}
                        onChange={(e) => setMonths(Number(e.target.value))}
                        className="input"
                    >
                        <option value={6}>6 meses</option>
                        <option value={12}>12 meses</option>
                        <option value={24}>24 meses</option>
                    </select>
                </div>
            </div>

            {/* Botón simular */}
            <button
                onClick={runSimulation}
                disabled={loading || (incomeChange === 0 && expenseChange === 0)}
                className="btn btn-primary w-full"
            >
                <Sparkles className="w-5 h-5" />
                Simular Escenario
            </button>

            {/* Resultados */}
            {result && (
                <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 rounded-lg bg-[var(--bg-tertiary)]">
                            <p className="text-sm text-[var(--text-secondary)]">Diferencia mensual</p>
                            <p className={`text-2xl font-bold ${result.monthlyDifference > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                                }`}>
                                {result.monthlyDifference > 0 ? '+' : ''}{formatCurrency(result.monthlyDifference)}
                            </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-[var(--bg-tertiary)]">
                            <p className="text-sm text-[var(--text-secondary)]">En {months} meses</p>
                            <p className={`text-2xl font-bold ${result.difference > 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                                }`}>
                                {result.difference > 0 ? '+' : ''}{formatCurrency(result.difference)}
                            </p>
                        </div>
                    </div>

                    {/* Gráfico comparativo */}
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '8px'
                                    }}
                                    formatter={(value) => [formatCurrency(value as number || 0), '']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="original"
                                    stroke="var(--text-muted)"
                                    fill="var(--bg-tertiary)"
                                    strokeDasharray="5 5"
                                    name="Original"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="var(--primary)"
                                    fill="var(--primary)"
                                    fillOpacity={0.3}
                                    name="Con cambios"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Mensaje si no hay resultado */}
            {!result && baseProjection.length > 0 && (
                <div className="text-center py-4 text-[var(--text-secondary)]">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Ajusta los valores y pulsa simular pa' ver el impacto</p>
                </div>
            )}
        </div>
    );
}
