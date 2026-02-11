// ===========================================
// Servicio de Proyecciones - Mierdas del futuro
// Proyecta tu pasta a futuro y simula escenarios
// ===========================================

import { getTransactions, getTransactionSummary } from './transactionService';

// Tipos pa' las proyecciones
export interface BalanceProjection {
    month: string;
    projectedBalance: number;
    projectedIncome: number;
    projectedExpenses: number;
}

export interface ScenarioChange {
    type: 'income_increase' | 'income_decrease' | 'expense_increase' | 'expense_decrease';
    category?: string;
    amount: number;
    percentage?: number;
}

export interface ScenarioResult {
    originalBalance: number;
    modifiedBalance: number;
    difference: number;
    monthlyDifference: number;
    projection: BalanceProjection[];
}

// Calcula el promedio mensual de ingresos y gastos
const calculateMonthlyAverages = (userId: string): { avgIncome: number; avgExpenses: number } => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const summary = getTransactionSummary(userId, sixMonthsAgo, now);

    // Divide por 6 meses
    return {
        avgIncome: summary.totalIncome / 6,
        avgExpenses: summary.totalExpenses / 6
    };
};

// Proyecta el balance a X meses en el futuro
export const projectBalance = (
    userId: string,
    months: number,
    currentBalance: number = 0
): BalanceProjection[] => {
    const { avgIncome, avgExpenses } = calculateMonthlyAverages(userId);
    const projection: BalanceProjection[] = [];

    let runningBalance = currentBalance;
    const now = new Date();

    for (let i = 1; i <= months; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthName = targetDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

        runningBalance += avgIncome - avgExpenses;

        projection.push({
            month: monthName,
            projectedBalance: runningBalance,
            projectedIncome: avgIncome,
            projectedExpenses: avgExpenses
        });
    }

    return projection;
};

// Simula un escenario "qué pasa si..."
export const runScenario = (
    userId: string,
    changes: ScenarioChange[],
    months: number = 12,
    currentBalance: number = 0
): ScenarioResult => {
    const { avgIncome, avgExpenses } = calculateMonthlyAverages(userId);

    // Proyección original
    const originalProjection = projectBalance(userId, months, currentBalance);
    const originalFinalBalance = originalProjection[originalProjection.length - 1]?.projectedBalance || currentBalance;

    // Calcula cambios
    let modifiedIncome = avgIncome;
    let modifiedExpenses = avgExpenses;

    changes.forEach(change => {
        switch (change.type) {
            case 'income_increase':
                if (change.percentage) {
                    modifiedIncome += avgIncome * (change.percentage / 100);
                } else {
                    modifiedIncome += change.amount;
                }
                break;
            case 'income_decrease':
                if (change.percentage) {
                    modifiedIncome -= avgIncome * (change.percentage / 100);
                } else {
                    modifiedIncome -= change.amount;
                }
                break;
            case 'expense_increase':
                if (change.percentage) {
                    modifiedExpenses += avgExpenses * (change.percentage / 100);
                } else {
                    modifiedExpenses += change.amount;
                }
                break;
            case 'expense_decrease':
                if (change.percentage) {
                    modifiedExpenses -= avgExpenses * (change.percentage / 100);
                } else {
                    modifiedExpenses -= change.amount;
                }
                break;
        }
    });

    // Proyección modificada
    const modifiedProjection: BalanceProjection[] = [];
    let runningBalance = currentBalance;
    const now = new Date();

    for (let i = 1; i <= months; i++) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthName = targetDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

        runningBalance += modifiedIncome - modifiedExpenses;

        modifiedProjection.push({
            month: monthName,
            projectedBalance: runningBalance,
            projectedIncome: modifiedIncome,
            projectedExpenses: modifiedExpenses
        });
    }

    const modifiedFinalBalance = modifiedProjection[modifiedProjection.length - 1]?.projectedBalance || currentBalance;
    const monthlyDiff = (modifiedIncome - modifiedExpenses) - (avgIncome - avgExpenses);

    return {
        originalBalance: originalFinalBalance,
        modifiedBalance: modifiedFinalBalance,
        difference: modifiedFinalBalance - originalFinalBalance,
        monthlyDifference: monthlyDiff,
        projection: modifiedProjection
    };
};

// Obtiene transacciones recurrentes programadas (próximos pagos)
export const getUpcomingPayments = (userId: string): {
    name: string;
    amount: number;
    dueDate: Date;
    category: string;
}[] => {
    // Busca transacciones marcadas como recurrentes
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const recentTransactions = getTransactions(userId, {
        startDate: oneMonthAgo,
        type: 'expense'
    });

    // Encuentra las que son recurrentes
    const recurring = recentTransactions.filter(t => t.isRecurring);

    // Proyecta las fechas de próximo pago
    return recurring.map(t => {
        // Calcula próxima fecha basándose en la recurrencia
        let nextDate = new Date(t.date);

        while (nextDate <= now) {
            switch (t.recurrence) {
                case 'daily':
                    nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'weekly':
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case 'biweekly':
                    nextDate.setDate(nextDate.getDate() + 14);
                    break;
                case 'monthly':
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    break;
                case 'yearly':
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                    break;
                default:
                    nextDate = new Date(now.getFullYear() + 1, 0, 1); // Pa' no entrar en bucle infinito
            }
        }

        return {
            name: t.description,
            amount: t.amount,
            dueDate: nextDate,
            category: t.category
        };
    }).sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
};

// Calcula cuánto tiempo hasta llegar a un objetivo
export const timeToGoal = (
    userId: string,
    goalAmount: number,
    currentAmount: number = 0
): { months: number; reachDate: Date } | null => {
    const { avgIncome, avgExpenses } = calculateMonthlyAverages(userId);
    const monthlySavings = avgIncome - avgExpenses;

    if (monthlySavings <= 0) {
        return null; // No ahorra nada, nunca llegará
    }

    const remaining = goalAmount - currentAmount;
    const months = Math.ceil(remaining / monthlySavings);

    const reachDate = new Date();
    reachDate.setMonth(reachDate.getMonth() + months);

    return { months, reachDate };
};
