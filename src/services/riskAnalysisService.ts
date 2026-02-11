// ===========================================
// Servicio de Análisis de Riesgos
// Detecta problemas financieros antes de que ocurran
// ===========================================

import { getTransactionSummary } from './transactionService';
import { getSavingsGoals } from './savingsService';
import { getBudgets } from './budgetService';

// ==========================================
// TIPOS
// ==========================================

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type RiskType =
    | 'liquidity'       // Falta de liquidez
    | 'overspending'    // Gasto excesivo
    | 'budget_breach'   // Superando presupuesto
    | 'savings_stall'   // Meta de ahorro estancada
    | 'expense_spike'   // Pico de gastos inusual
    | 'recurring_risk'; // Pago recurrente en riesgo

export interface FinancialRisk {
    id: string;
    type: RiskType;
    level: RiskLevel;
    title: string;
    message: string;
    details: string;
    icon: string;
    suggestedAction: string;
    actionType: 'reduce_spending' | 'add_income' | 'adjust_budget' | 'postpone' | 'review';
    category?: string;
    amount?: number;
    daysUntilImpact?: number;
    createdAt: Date;
}

export interface RiskSummary {
    overallRisk: RiskLevel;
    risks: FinancialRisk[];
    healthScore: number; // 0-100
    liquidityDays: number; // Días de liquidez
}

// ==========================================
// FUNCIONES DE ANÁLISIS
// ==========================================

// Calcula días de liquidez (cuántos días puedes sobrevivir con tu balance actual)
const calculateLiquidityDays = (userId: string, currentBalance: number): number => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);

    const summary = getTransactionSummary(userId, thirtyDaysAgo, now);
    const dailyExpenseAvg = summary.totalExpenses / 30;

    if (dailyExpenseAvg <= 0) return 999; // Sin gastos registrados

    return Math.floor(currentBalance / dailyExpenseAvg);
};

// Detecta riesgo de liquidez
const detectLiquidityRisk = (userId: string, currentBalance: number): FinancialRisk | null => {
    const liquidityDays = calculateLiquidityDays(userId, currentBalance);

    if (liquidityDays < 7) {
        return {
            id: `liquidity-critical-${Date.now()}`,
            type: 'liquidity',
            level: 'critical',
            title: '⚠️ Alerta de Liquidez Crítica',
            message: `A este ritmo, te quedarás sin fondos en ${liquidityDays} días.`,
            details: `Tu balance actual (${currentBalance.toFixed(2)}€) no cubre ni una semana de gastos habituales.`,
            icon: '🚨',
            suggestedAction: 'Reduce gastos no esenciales inmediatamente o busca un ingreso adicional.',
            actionType: 'reduce_spending',
            daysUntilImpact: liquidityDays,
            createdAt: new Date()
        };
    }

    if (liquidityDays < 14) {
        return {
            id: `liquidity-high-${Date.now()}`,
            type: 'liquidity',
            level: 'high',
            title: 'Liquidez Baja',
            message: `Tu liquidez solo cubre ${liquidityDays} días de gastos.`,
            details: 'Considera reducir gastos variables esta semana.',
            icon: '⚡',
            suggestedAction: 'Revisa gastos en restaurantes, entretenimiento y compras no urgentes.',
            actionType: 'reduce_spending',
            daysUntilImpact: liquidityDays,
            createdAt: new Date()
        };
    }

    return null;
};

// Detecta categorías con gasto excesivo
const detectOverspending = (userId: string): FinancialRisk[] => {
    const risks: FinancialRisk[] = [];
    const now = new Date();

    // Mes actual
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentSummary = getTransactionSummary(userId, currentMonthStart, now);

    // Mes anterior completo
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevSummary = getTransactionSummary(userId, prevMonthStart, prevMonthEnd);

    // Día del mes actual
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthProgress = dayOfMonth / daysInMonth;

    // Analiza cada categoría
    Object.entries(currentSummary.byCategory).forEach(([category, currentAmount]) => {
        const prevAmount = prevSummary.byCategory[category] || 0;

        // Proyecta el gasto del mes completo
        const projectedAmount = currentAmount / monthProgress;

        // Si va a superar el mes anterior en más del 50%
        if (prevAmount > 0 && projectedAmount > prevAmount * 1.5) {
            const overagePercent = Math.round(((projectedAmount / prevAmount) - 1) * 100);

            risks.push({
                id: `overspending-${category}-${Date.now()}`,
                type: 'overspending',
                level: overagePercent > 100 ? 'high' : 'medium',
                title: `Gasto Excesivo en ${category}`,
                message: `Vas camino de gastar ${overagePercent}% más que el mes pasado.`,
                details: `Actual: ${currentAmount.toFixed(2)}€ (día ${dayOfMonth}) | Mes pasado: ${prevAmount.toFixed(2)}€`,
                icon: '📈',
                suggestedAction: `Intenta reducir gastos en ${category} un ${Math.round(overagePercent / 3)}% esta semana.`,
                actionType: 'reduce_spending',
                category,
                amount: projectedAmount - prevAmount,
                createdAt: new Date()
            });
        }
    });

    return risks.slice(0, 3); // Máximo 3 alertas de overspending
};

// Detecta presupuestos en riesgo
const detectBudgetRisks = (userId: string): FinancialRisk[] => {
    const risks: FinancialRisk[] = [];
    const budgets = getBudgets(userId);
    const now = new Date();

    budgets.forEach(budget => {
        const percentUsed = (budget.spent / budget.amount) * 100;

        // Ya superó el 80% y quedan más de 7 días
        const daysLeft = Math.ceil((new Date(budget.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (percentUsed >= 90 && daysLeft > 3) {
            risks.push({
                id: `budget-${budget.id}-${Date.now()}`,
                type: 'budget_breach',
                level: percentUsed >= 100 ? 'high' : 'medium',
                title: `Presupuesto "${budget.name}" al límite`,
                message: percentUsed >= 100
                    ? `Has superado tu presupuesto en ${(percentUsed - 100).toFixed(0)}%`
                    : `Has usado el ${percentUsed.toFixed(0)}% y quedan ${daysLeft} días`,
                details: `Gastado: ${budget.spent.toFixed(2)}€ de ${budget.amount.toFixed(2)}€`,
                icon: '🎯',
                suggestedAction: percentUsed >= 100
                    ? 'Evita gastos en esta categoría hasta el próximo periodo.'
                    : `Te quedan ${(budget.amount - budget.spent).toFixed(2)}€ para ${daysLeft} días.`,
                actionType: 'adjust_budget',
                category: budget.category,
                amount: budget.amount - budget.spent,
                daysUntilImpact: daysLeft,
                createdAt: new Date()
            });
        }
    });

    return risks;
};

// Detecta metas de ahorro estancadas
const detectSavingsStalls = (userId: string): FinancialRisk[] => {
    const risks: FinancialRisk[] = [];
    const goals = getSavingsGoals(userId);
    const now = new Date();

    goals.forEach(goal => {
        const deadline = new Date(goal.deadline);
        const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = goal.targetAmount - goal.currentAmount;
        const percentComplete = (goal.currentAmount / goal.targetAmount) * 100;

        // Si queda menos del 30% del tiempo pero menos del 70% ahorrado
        const totalDays = Math.ceil((deadline.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const timeProgress = 1 - (daysLeft / totalDays);

        if (timeProgress > 0.7 && percentComplete < 70) {
            const dailyNeeded = remaining / daysLeft;

            risks.push({
                id: `savings-${goal.id}-${Date.now()}`,
                type: 'savings_stall',
                level: daysLeft < 30 ? 'high' : 'medium',
                title: `Meta "${goal.name}" en riesgo`,
                message: `Solo has ahorrado el ${percentComplete.toFixed(0)}% y queda el ${((1 - timeProgress) * 100).toFixed(0)}% del tiempo.`,
                details: `Necesitas ahorrar ${dailyNeeded.toFixed(2)}€/día para llegar a tiempo.`,
                icon: '🎯',
                suggestedAction: `Añade ${(dailyNeeded * 7).toFixed(2)}€ esta semana para mantenerte en camino.`,
                actionType: 'add_income',
                amount: remaining,
                daysUntilImpact: daysLeft,
                createdAt: new Date()
            });
        }
    });

    return risks;
};

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

export const analyzeFinancialRisks = (userId: string, currentBalance: number = 0): RiskSummary => {
    const allRisks: FinancialRisk[] = [];

    // 1. Riesgo de liquidez
    const liquidityRisk = detectLiquidityRisk(userId, currentBalance);
    if (liquidityRisk) allRisks.push(liquidityRisk);

    // 2. Overspending por categoría
    allRisks.push(...detectOverspending(userId));

    // 3. Presupuestos en riesgo
    allRisks.push(...detectBudgetRisks(userId));

    // 4. Metas estancadas
    allRisks.push(...detectSavingsStalls(userId));

    // Ordena por nivel de riesgo
    const levelOrder: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    allRisks.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

    // Calcula nivel general
    let overallRisk: RiskLevel = 'low';
    if (allRisks.some(r => r.level === 'critical')) overallRisk = 'critical';
    else if (allRisks.some(r => r.level === 'high')) overallRisk = 'high';
    else if (allRisks.some(r => r.level === 'medium')) overallRisk = 'medium';

    // Calcula health score (100 - penalizaciones por riesgos)
    let healthScore = 100;
    allRisks.forEach(r => {
        switch (r.level) {
            case 'critical': healthScore -= 30; break;
            case 'high': healthScore -= 20; break;
            case 'medium': healthScore -= 10; break;
            case 'low': healthScore -= 5; break;
        }
    });
    healthScore = Math.max(0, healthScore);

    return {
        overallRisk,
        risks: allRisks,
        healthScore,
        liquidityDays: calculateLiquidityDays(userId, currentBalance)
    };
};

// Obtener solo los riesgos más urgentes
export const getUrgentRisks = (userId: string, currentBalance: number = 0): FinancialRisk[] => {
    const summary = analyzeFinancialRisks(userId, currentBalance);
    return summary.risks.filter(r => r.level === 'critical' || r.level === 'high');
};
