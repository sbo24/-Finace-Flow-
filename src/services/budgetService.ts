import type { Budget, BudgetFormData } from '../types';
import { generateId } from '../utils/uuid';

const BUDGETS_KEY = 'financeflow_budgets';

// Get all budgets from localStorage
const getAllBudgets = (): Budget[] => {
    const data = localStorage.getItem(BUDGETS_KEY);
    if (!data) return [];

    return JSON.parse(data).map((b: Budget) => ({
        ...b,
        startDate: new Date(b.startDate),
        endDate: new Date(b.endDate),
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
    }));
};

// Save all budgets to localStorage
const saveAllBudgets = (budgets: Budget[]) => {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
};

// Calculate period dates
const calculatePeriodDates = (period: 'daily' | 'weekly' | 'monthly'): { startDate: Date; endDate: Date } => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
        case 'daily':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            break;
        case 'weekly':
            const dayOfWeek = now.getDay();
            const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
            endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
            endDate.setHours(23, 59, 59);
            break;
        case 'monthly':
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            break;
    }

    return { startDate, endDate };
};

// Create a new budget
export const createBudget = (
    userId: string,
    data: BudgetFormData
): Budget => {
    const budgets = getAllBudgets();
    const now = new Date();
    const { startDate, endDate } = calculatePeriodDates(data.period);

    const newBudget: Budget = {
        id: generateId(),
        userId,
        name: data.name,
        category: data.category,
        amount: data.amount,
        spent: 0,
        period: data.period,
        startDate,
        endDate,
        alertThreshold: data.alertThreshold,
        createdAt: now,
        updatedAt: now,
    };

    budgets.push(newBudget);
    saveAllBudgets(budgets);

    return newBudget;
};

// Update a budget
export const updateBudget = (
    budgetId: string,
    data: Partial<BudgetFormData>
): void => {
    const budgets = getAllBudgets();
    const index = budgets.findIndex(b => b.id === budgetId);

    if (index !== -1) {
        budgets[index] = {
            ...budgets[index],
            ...data,
            updatedAt: new Date(),
        };
        saveAllBudgets(budgets);
    }
};

// Update budget spent amount
export const updateBudgetSpent = (
    budgetId: string,
    spent: number
): void => {
    const budgets = getAllBudgets();
    const index = budgets.findIndex(b => b.id === budgetId);

    if (index !== -1) {
        budgets[index].spent = spent;
        budgets[index].updatedAt = new Date();
        saveAllBudgets(budgets);
    }
};

// Delete a budget
export const deleteBudget = (budgetId: string): void => {
    const budgets = getAllBudgets();
    const filtered = budgets.filter(b => b.id !== budgetId);
    saveAllBudgets(filtered);
};

// Get all budgets for a user
export const getBudgets = (userId: string): Budget[] => {
    return getAllBudgets().filter(b => b.userId === userId);
};

// Get active budgets (within current period)
export const getActiveBudgets = (userId: string): Budget[] => {
    const now = new Date();
    return getBudgets(userId).filter(budget =>
        budget.startDate <= now && budget.endDate >= now
    );
};

// Check if budget exceeds threshold
export const checkBudgetAlerts = (userId: string): Budget[] => {
    return getActiveBudgets(userId).filter(budget => {
        const percentage = (budget.spent / budget.amount) * 100;
        return percentage >= budget.alertThreshold;
    });
};

// Get budget by category
export const getBudgetByCategory = (
    userId: string,
    category: string
): Budget | null => {
    return getActiveBudgets(userId).find(b => b.category === category) || null;
};
