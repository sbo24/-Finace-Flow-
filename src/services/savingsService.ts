import type { SavingsGoal, SavingsGoalFormData, SavingsContribution } from '../types';
import { generateId } from '../utils/uuid';

const SAVINGS_KEY = 'financeflow_savings';

// Get all savings goals from localStorage
const getAllSavingsGoals = (): SavingsGoal[] => {
    const data = localStorage.getItem(SAVINGS_KEY);
    if (!data) return [];

    return JSON.parse(data).map((g: SavingsGoal) => ({
        ...g,
        deadline: new Date(g.deadline),
        contributions: g.contributions.map((c: SavingsContribution) => ({
            ...c,
            date: new Date(c.date),
        })),
        createdAt: new Date(g.createdAt),
        updatedAt: new Date(g.updatedAt),
    }));
};

// Save all savings goals to localStorage
const saveAllSavingsGoals = (goals: SavingsGoal[]) => {
    localStorage.setItem(SAVINGS_KEY, JSON.stringify(goals));
};

// Create a new savings goal
export const createSavingsGoal = (
    userId: string,
    data: SavingsGoalFormData
): SavingsGoal => {
    const goals = getAllSavingsGoals();
    const now = new Date();

    const newGoal: SavingsGoal = {
        id: generateId(),
        userId,
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: 0,
        deadline: new Date(data.deadline),
        category: data.category,
        icon: data.icon,
        color: data.color,
        contributions: [],
        createdAt: now,
        updatedAt: now,
    };

    goals.push(newGoal);
    saveAllSavingsGoals(goals);

    return newGoal;
};

// Update a savings goal
export const updateSavingsGoal = (
    goalId: string,
    data: Partial<SavingsGoalFormData>
): void => {
    const goals = getAllSavingsGoals();
    const index = goals.findIndex(g => g.id === goalId);

    if (index !== -1) {
        goals[index] = {
            ...goals[index],
            ...data,
            deadline: data.deadline ? new Date(data.deadline) : goals[index].deadline,
            updatedAt: new Date(),
        };
        saveAllSavingsGoals(goals);
    }
};

// Delete a savings goal
export const deleteSavingsGoal = (goalId: string): void => {
    const goals = getAllSavingsGoals();
    const filtered = goals.filter(g => g.id !== goalId);
    saveAllSavingsGoals(filtered);
};

// Get all savings goals for a user
export const getSavingsGoals = (userId: string): SavingsGoal[] => {
    return getAllSavingsGoals().filter(g => g.userId === userId);
};

// Get a single savings goal
export const getSavingsGoal = (goalId: string): SavingsGoal | null => {
    return getAllSavingsGoals().find(g => g.id === goalId) || null;
};

// Add contribution to a savings goal
export const addContribution = (
    goalId: string,
    amount: number,
    note?: string
): void => {
    const goals = getAllSavingsGoals();
    const index = goals.findIndex(g => g.id === goalId);

    if (index !== -1) {
        const contribution: SavingsContribution = {
            id: generateId(),
            amount,
            date: new Date(),
            note,
        };

        goals[index].currentAmount += amount;
        goals[index].contributions.push(contribution);
        goals[index].updatedAt = new Date();
        saveAllSavingsGoals(goals);
    }
};

// Withdraw from a savings goal
export const withdrawFromGoal = (
    goalId: string,
    amount: number,
    note?: string
): void => {
    const goals = getAllSavingsGoals();
    const index = goals.findIndex(g => g.id === goalId);

    if (index !== -1) {
        if (goals[index].currentAmount < amount) {
            throw new Error('Fondos insuficientes');
        }

        const contribution: SavingsContribution = {
            id: generateId(),
            amount: -amount,
            date: new Date(),
            note,
        };

        goals[index].currentAmount -= amount;
        goals[index].contributions.push(contribution);
        goals[index].updatedAt = new Date();
        saveAllSavingsGoals(goals);
    }
};

// Calculate savings suggestion based on spending patterns
export const calculateSavingsSuggestion = (
    monthlyIncome: number,
    monthlyExpenses: number,
    goal: SavingsGoal
): { suggestedMonthly: number; canAchieve: boolean; monthsNeeded: number } => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const deadline = goal.deadline;
    const now = new Date();

    const monthsUntilDeadline = Math.max(
        1,
        (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth())
    );

    const suggestedMonthly = remaining / monthsUntilDeadline;
    const availableToSave = monthlyIncome - monthlyExpenses;
    const canAchieve = availableToSave >= suggestedMonthly;
    const monthsNeeded = availableToSave > 0 ? Math.ceil(remaining / availableToSave) : Infinity;

    return { suggestedMonthly, canAchieve, monthsNeeded };
};

// Get active goals (not yet completed and not past deadline)
export const getActiveGoals = (userId: string): SavingsGoal[] => {
    const now = new Date();
    return getSavingsGoals(userId).filter(goal =>
        goal.currentAmount < goal.targetAmount && goal.deadline > now
    );
};

// Get completed goals
export const getCompletedGoals = (userId: string): SavingsGoal[] => {
    return getSavingsGoals(userId).filter(goal =>
        goal.currentAmount >= goal.targetAmount
    );
};
