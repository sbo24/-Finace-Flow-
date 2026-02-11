// ===========================================
// Servicio de Notificaciones Inteligentes
// Alertas proactivas: gastos inusuales, facturas
// próximas, resumen diario y microahorros
// ===========================================

import { getTransactions, getTransactionSummary } from './transactionService';
import { getActiveBudgets } from './budgetService';
import { getActiveGoals } from './savingsService';
import { getUpcomingPayments } from './projectionService';

// ==========================================
// TIPOS
// ==========================================

export interface SmartAlert {
    id: string;
    type: 'unusual_spending' | 'bill_reminder' | 'budget_warning' | 'savings_reminder' | 'daily_summary' | 'micro_saving';
    severity: 'info' | 'warning' | 'critical' | 'positive';
    title: string;
    message: string;
    icon: string;
    amount?: number;
    actionLabel?: string;
    actionData?: Record<string, unknown>;
    timestamp: Date;
}

export interface MicroSavingSuggestion {
    id: string;
    category: string;
    categoryIcon: string;
    currentSpending: number;
    suggestedReduction: number;
    monthlySavings: number;
    yearlySavings: number;
    targetGoal?: { id: string; name: string; remaining: number };
    message: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface DailyBriefing {
    todayExpenses: number;
    todayIncome: number;
    budgetsAtRisk: { name: string; spent: number; limit: number; percent: number }[];
    upcomingBills: { name: string; amount: number; daysUntil: number }[];
    goalProgress: { name: string; percent: number; remaining: number }[];
    alerts: SmartAlert[];
}

// ==========================================
// DETECCIÓN DE GASTOS INUSUALES
// ==========================================

export const detectUnusualSpending = (userId: string): SmartAlert[] => {
    const alerts: SmartAlert[] = [];
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Obtener transacciones históricas y de hoy
    const historicTransactions = getTransactions(userId, {
        startDate: threeMonthsAgo,
        type: 'expense'
    });

    const todayTransactions = getTransactions(userId, {
        startDate: todayStart,
        type: 'expense'
    });

    // Calcular promedios por categoría
    const categoryStats: Record<string, { total: number; count: number; avg: number; max: number }> = {};

    historicTransactions.forEach(t => {
        if (!categoryStats[t.category]) {
            categoryStats[t.category] = { total: 0, count: 0, avg: 0, max: 0 };
        }
        categoryStats[t.category].total += t.amount;
        categoryStats[t.category].count += 1;
        categoryStats[t.category].max = Math.max(categoryStats[t.category].max, t.amount);
    });

    Object.keys(categoryStats).forEach(cat => {
        const s = categoryStats[cat];
        s.avg = s.count > 0 ? s.total / s.count : 0;
    });

    // Detectar transacciones de hoy que superen 2x el promedio
    todayTransactions.forEach(t => {
        const stats = categoryStats[t.category];
        if (stats && stats.avg > 0 && t.amount > stats.avg * 2) {
            alerts.push({
                id: `unusual-${t.id}`,
                type: 'unusual_spending',
                severity: t.amount > stats.avg * 3 ? 'critical' : 'warning',
                title: '⚡ Gasto inusual detectado',
                message: `"${t.description}" (${t.amount.toFixed(2)}€) es ${(t.amount / stats.avg).toFixed(1)}x mayor que tu gasto promedio en esta categoría (${stats.avg.toFixed(2)}€).`,
                icon: '⚡',
                amount: t.amount,
                timestamp: new Date()
            });
        }
    });

    return alerts;
};

// ==========================================
// RECORDATORIOS DE FACTURAS
// ==========================================

export const checkUpcomingBills = (userId: string): SmartAlert[] => {
    const alerts: SmartAlert[] = [];
    const payments = getUpcomingPayments(userId);
    const now = new Date();

    payments.forEach(payment => {
        const daysUntil = Math.ceil((payment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil <= 3 && daysUntil >= 0) {
            alerts.push({
                id: `bill-${payment.name}-${payment.dueDate.toISOString()}`,
                type: 'bill_reminder',
                severity: daysUntil === 0 ? 'critical' : 'warning',
                title: daysUntil === 0 ? '🔔 Pago hoy' : `📅 Pago en ${daysUntil} día${daysUntil > 1 ? 's' : ''}`,
                message: `"${payment.name}" - ${payment.amount.toFixed(2)}€ ${daysUntil === 0 ? 'vence hoy' : `vence el ${payment.dueDate.toLocaleDateString('es-ES')}`}.`,
                icon: daysUntil === 0 ? '🔔' : '📅',
                amount: payment.amount,
                timestamp: new Date()
            });
        }
    });

    return alerts;
};

// ==========================================
// ALERTAS DE PRESUPUESTO
// ==========================================

export const checkBudgetWarnings = (userId: string): SmartAlert[] => {
    const alerts: SmartAlert[] = [];
    const budgets = getActiveBudgets(userId);
    const now = new Date();

    budgets.forEach(budget => {
        const percent = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
        const daysInPeriod = Math.ceil((budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysElapsed = Math.ceil((now.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const expectedPercent = (daysElapsed / daysInPeriod) * 100;

        // Presupuesto ya superado
        if (percent >= 100) {
            alerts.push({
                id: `budget-over-${budget.id}`,
                type: 'budget_warning',
                severity: 'critical',
                title: '🚨 Presupuesto superado',
                message: `"${budget.name}" ha alcanzado ${percent.toFixed(0)}% (${budget.spent.toFixed(2)}€ de ${budget.amount.toFixed(2)}€).`,
                icon: '🚨',
                amount: budget.spent - budget.amount,
                timestamp: new Date()
            });
        }
        // Va por delante del ritmo esperado
        else if (percent > expectedPercent * 1.2 && percent >= 60) {
            const daysRemaining = daysInPeriod - daysElapsed;
            const remainingBudget = budget.amount - budget.spent;
            const dailyBudget = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

            alerts.push({
                id: `budget-pace-${budget.id}`,
                type: 'budget_warning',
                severity: 'warning',
                title: '⚠️ Presupuesto en riesgo',
                message: `"${budget.name}" al ${percent.toFixed(0)}% con ${daysRemaining} días restantes. Te quedan ${remainingBudget.toFixed(2)}€ (${dailyBudget.toFixed(2)}€/día).`,
                icon: '⚠️',
                amount: remainingBudget,
                timestamp: new Date()
            });
        }
    });

    return alerts;
};

// ==========================================
// SUGERENCIAS DE MICROAHORRO
// ==========================================

export const generateMicroSavingSuggestions = (userId: string): MicroSavingSuggestion[] => {
    const suggestions: MicroSavingSuggestion[] = [];
    const now = new Date();

    // Datos del mes actual y anterior
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentSummary = getTransactionSummary(userId, currentMonthStart, now);
    const prevSummary = getTransactionSummary(userId, prevMonthStart, prevMonthEnd);

    // Meta de ahorro activa más próxima
    const activeGoals = getActiveGoals(userId);
    const primaryGoal = activeGoals.length > 0
        ? activeGoals.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())[0]
        : undefined;

    // Categorías con gasto en ambos meses
    const categoryIcons: Record<string, string> = {
        food: '🍔', transport: '🚗', entertainment: '🎬', shopping: '🛍️',
        dining: '🍽️', subscriptions: '📺', coffee: '☕', utilities: '💡',
        health: '💊', education: '📚', personal: '💆', gifts: '🎁',
        clothing: '👕', electronics: '📱', home: '🏠', travel: '✈️'
    };

    const allCategories = new Set([
        ...Object.keys(currentSummary.byCategory),
        ...Object.keys(prevSummary.byCategory)
    ]);

    let idCounter = 0;

    allCategories.forEach(category => {
        const current = currentSummary.byCategory[category] || 0;
        const prev = prevSummary.byCategory[category] || 0;
        const avgMonthly = (current + prev) / 2;

        if (avgMonthly < 20) return; // Ignorar categorías pequeñas

        // Sugerir reducción del 10-20% en categorías con gasto notable
        const reductionPercent = avgMonthly > 200 ? 0.1 : 0.15;
        const suggestedReduction = avgMonthly * reductionPercent;
        const monthlySavings = suggestedReduction;
        const yearlySavings = monthlySavings * 12;

        let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
        if (['entertainment', 'dining', 'coffee', 'shopping'].includes(category)) difficulty = 'easy';
        if (['utilities', 'transport', 'health'].includes(category)) difficulty = 'hard';

        let message = '';
        if (difficulty === 'easy') {
            message = `Reducir un ${(reductionPercent * 100).toFixed(0)}% en ${category} te ahorra ${monthlySavings.toFixed(0)}€/mes (${yearlySavings.toFixed(0)}€/año).`;
        } else if (difficulty === 'hard') {
            message = `Es más difícil, pero reducir ${category} un ${(reductionPercent * 100).toFixed(0)}% te ahorra ${monthlySavings.toFixed(0)}€/mes.`;
        } else {
            message = `Un pequeño ajuste en ${category}: ahorra ${monthlySavings.toFixed(0)}€/mes recortando un ${(reductionPercent * 100).toFixed(0)}%.`;
        }

        suggestions.push({
            id: `micro-${idCounter++}`,
            category,
            categoryIcon: categoryIcons[category] || '💰',
            currentSpending: avgMonthly,
            suggestedReduction,
            monthlySavings,
            yearlySavings,
            targetGoal: primaryGoal ? {
                id: primaryGoal.id,
                name: primaryGoal.name,
                remaining: primaryGoal.targetAmount - primaryGoal.currentAmount
            } : undefined,
            message,
            difficulty
        });
    });

    // Ordenar: fáciles primero, luego por ahorro potencial
    return suggestions.sort((a, b) => {
        const diffOrder = { easy: 0, medium: 1, hard: 2 };
        if (diffOrder[a.difficulty] !== diffOrder[b.difficulty]) {
            return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        }
        return b.monthlySavings - a.monthlySavings;
    });
};

// ==========================================
// RESUMEN DIARIO (BRIEFING)
// ==========================================

export const generateDailyBriefing = (userId: string): DailyBriefing => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Transacciones de hoy
    const todayTransactions = getTransactions(userId, { startDate: todayStart });
    const todayExpenses = todayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    const todayIncome = todayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    // Presupuestos en riesgo
    const budgets = getActiveBudgets(userId);
    const budgetsAtRisk = budgets
        .map(b => ({
            name: b.name,
            spent: b.spent,
            limit: b.amount,
            percent: b.amount > 0 ? (b.spent / b.amount) * 100 : 0
        }))
        .filter(b => b.percent >= 70)
        .sort((a, b) => b.percent - a.percent);

    // Facturas próximas (3 días)
    const payments = getUpcomingPayments(userId);
    const upcomingBills = payments
        .map(p => ({
            name: p.name,
            amount: p.amount,
            daysUntil: Math.ceil((p.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        }))
        .filter(p => p.daysUntil <= 3 && p.daysUntil >= 0);

    // Progreso de metas
    const goals = getActiveGoals(userId);
    const goalProgress = goals.map(g => ({
        name: g.name,
        percent: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
        remaining: g.targetAmount - g.currentAmount
    }));

    // Recopilar alertas
    const alerts = [
        ...detectUnusualSpending(userId),
        ...checkUpcomingBills(userId),
        ...checkBudgetWarnings(userId)
    ];

    return {
        todayExpenses,
        todayIncome,
        budgetsAtRisk,
        upcomingBills,
        goalProgress,
        alerts
    };
};

// ==========================================
// CALCULAR DINERO NO ASIGNADO
// ==========================================

export const calculateUnallocatedMoney = (userId: string): number => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const summary = getTransactionSummary(userId, monthStart, now);

    const totalAllocatedToGoals = getActiveGoals(userId)
        .reduce((sum, g) => {
            // Contribuciones este mes
            const thisMonthContributions = g.contributions
                .filter(c => new Date(c.date) >= monthStart)
                .reduce((s, c) => s + c.amount, 0);
            return sum + thisMonthContributions;
        }, 0);

    const available = summary.totalIncome - summary.totalExpenses;
    const unallocated = available - totalAllocatedToGoals;

    return Math.max(0, unallocated);
};
