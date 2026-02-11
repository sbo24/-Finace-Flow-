// ===========================================
// Servicio de Insights - Mierdas de análisis financiero
// Aquí se generan las sugerencias y alertas
// ===========================================

import type { Transaction, SmartInsight } from '../types';
import { getTransactions, getTransactionSummary } from './transactionService';
import { DEFAULT_EXPENSE_CATEGORIES } from '../types';

// Tipos pa' las mierdas de insights
export interface SpendingAnalysis {
    category: string;
    currentMonth: number;
    previousMonth: number;
    change: number;
    changePercent: number;
}

export interface InsightRecommendation {
    id: string;
    type: 'warning' | 'tip' | 'achievement' | 'alert';
    priority: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    icon: string;
    category?: string;
    amount?: number;
    potentialSavings?: number;
}

// Analiza el gasto por categoría mes a mes
export const analyzeSpendingByCategory = (userId: string): SpendingAnalysis[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Mes actual
    const currentStart = new Date(currentYear, currentMonth, 1);
    const currentEnd = new Date(currentYear, currentMonth + 1, 0);

    // Mes anterior
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevStart = new Date(prevYear, prevMonth, 1);
    const prevEnd = new Date(prevYear, prevMonth + 1, 0);

    const currentSummary = getTransactionSummary(userId, currentStart, currentEnd);
    const prevSummary = getTransactionSummary(userId, prevStart, prevEnd);

    const analysis: SpendingAnalysis[] = [];

    // Combina las categorías de ambos meses
    const allCategories = new Set([
        ...Object.keys(currentSummary.byCategory),
        ...Object.keys(prevSummary.byCategory)
    ]);

    allCategories.forEach(category => {
        const current = currentSummary.byCategory[category] || 0;
        const prev = prevSummary.byCategory[category] || 0;
        const change = current - prev;
        const changePercent = prev > 0 ? (change / prev) * 100 : current > 0 ? 100 : 0;

        analysis.push({
            category,
            currentMonth: current,
            previousMonth: prev,
            change,
            changePercent
        });
    });

    // Ordena por cambio absoluto (de mayor a menor)
    return analysis.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
};

// Detecta gastos inusuales (más del doble del promedio)
export const detectUnusualExpenses = (userId: string): Transaction[] => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const transactions = getTransactions(userId, {
        startDate: threeMonthsAgo,
        type: 'expense'
    });

    // Calcula el promedio por categoría
    const categoryTotals: Record<string, { total: number; count: number }> = {};

    transactions.forEach(t => {
        if (!categoryTotals[t.category]) {
            categoryTotals[t.category] = { total: 0, count: 0 };
        }
        categoryTotals[t.category].total += t.amount;
        categoryTotals[t.category].count += 1;
    });

    const categoryAverages: Record<string, number> = {};
    Object.entries(categoryTotals).forEach(([cat, data]) => {
        categoryAverages[cat] = data.total / data.count;
    });

    // Encuentra transacciones que sean más del doble del promedio
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const recentTransactions = transactions.filter(t => t.date >= currentMonth);

    return recentTransactions.filter(t => {
        const avg = categoryAverages[t.category];
        return avg && t.amount > avg * 2;
    });
};

// Detecta posibles transacciones duplicadas
// (mismo importe y descripción similar en un rango de 7 días)
export const detectDuplicateTransactions = (userId: string): Transaction[][] => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const transactions = getTransactions(userId, {
        startDate: oneMonthAgo,
        type: 'expense'
    });

    const duplicates: Transaction[][] = [];
    const checked = new Set<string>();

    transactions.forEach((t, i) => {
        if (checked.has(t.id)) return;

        const group: Transaction[] = [t];

        for (let j = i + 1; j < transactions.length; j++) {
            const other = transactions[j];
            if (checked.has(other.id)) continue;

            // Mismo importe y descripción similar
            const sameAmount = Math.abs(t.amount - other.amount) < 0.01;
            const similarDesc = t.description.toLowerCase() === other.description.toLowerCase();

            // Dentro de 7 días
            const daysDiff = Math.abs(t.date.getTime() - other.date.getTime()) / (1000 * 60 * 60 * 24);
            const withinWindow = daysDiff <= 7;

            if (sameAmount && similarDesc && withinWindow) {
                group.push(other);
                checked.add(other.id);
            }
        }

        if (group.length > 1) {
            duplicates.push(group);
        }
        checked.add(t.id);
    });

    return duplicates;
};

// Genera recomendaciones de ahorro personalizadas
export const generateSavingRecommendations = (userId: string): InsightRecommendation[] => {
    const recommendations: InsightRecommendation[] = [];
    const analysis = analyzeSpendingByCategory(userId);
    const unusualExpenses = detectUnusualExpenses(userId);
    const duplicates = detectDuplicateTransactions(userId);

    // Recomendaciones basadas en cambios de gasto
    analysis.forEach((item, index) => {
        // Si ha aumentado más del 20%
        if (item.changePercent > 20 && item.change > 50) {
            const categoryInfo = DEFAULT_EXPENSE_CATEGORIES.find(c => c.id === item.category || c.name === item.category);
            recommendations.push({
                id: `spending-increase-${index}`,
                type: 'warning',
                priority: item.changePercent > 50 ? 'high' : 'medium',
                title: `Aumento en ${categoryInfo?.name || item.category}`,
                message: `Has gastado ${item.change.toFixed(0)}€ más que el mes pasado (${item.changePercent.toFixed(0)}% más). ¿Podrías reducirlo un 10%?`,
                icon: categoryInfo?.icon || '📊',
                category: item.category,
                amount: item.currentMonth,
                potentialSavings: item.change * 0.1
            });
        }

        // Si ha bajado significativamente - felicitación
        if (item.changePercent < -20 && item.previousMonth > 100) {
            const categoryInfo = DEFAULT_EXPENSE_CATEGORIES.find(c => c.id === item.category || c.name === item.category);
            recommendations.push({
                id: `spending-decrease-${index}`,
                type: 'achievement',
                priority: 'low',
                title: `¡Buen trabajo en ${categoryInfo?.name || item.category}!`,
                message: `Has reducido tu gasto un ${Math.abs(item.changePercent).toFixed(0)}% respecto al mes pasado. ¡Sigue así!`,
                icon: '🎉',
                category: item.category,
                amount: Math.abs(item.change)
            });
        }
    });

    // Alertas de gastos inusuales
    unusualExpenses.forEach((expense, index) => {
        recommendations.push({
            id: `unusual-${index}`,
            type: 'alert',
            priority: 'high',
            title: 'Gasto inusual detectado',
            message: `"${expense.description}" (${expense.amount.toFixed(2)}€) es significativamente mayor que tu gasto promedio en esta categoría.`,
            icon: '⚠️',
            category: expense.category,
            amount: expense.amount
        });
    });

    // Alertas de duplicados
    duplicates.forEach((group, index) => {
        const total = group.reduce((sum, t) => sum + t.amount, 0);
        recommendations.push({
            id: `duplicate-${index}`,
            type: 'warning',
            priority: 'medium',
            title: 'Posible cargo duplicado',
            message: `Encontramos ${group.length} transacciones similares de "${group[0].description}" (${group[0].amount.toFixed(2)}€ cada una). ¿Son correctas?`,
            icon: '🔄',
            amount: total
        });
    });

    // Ordena por prioridad
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
};

// Genera insights para el dashboard (versión simplificada)
export const generateSmartInsights = (userId: string): SmartInsight[] => {
    const recommendations = generateSavingRecommendations(userId);

    return recommendations.slice(0, 5).map(rec => ({
        id: rec.id,
        type: rec.type === 'alert' ? 'warning' : rec.type,
        title: rec.title,
        message: rec.message,
        icon: rec.icon,
        action: rec.category ? `/transactions?category=${rec.category}` : undefined,
        actionLabel: rec.category ? 'Ver transacciones' : undefined
    }));
};

// Calcula el ahorro potencial total
export const calculatePotentialSavings = (userId: string): number => {
    const recommendations = generateSavingRecommendations(userId);
    return recommendations
        .filter(r => r.potentialSavings)
        .reduce((total, r) => total + (r.potentialSavings || 0), 0);
};
