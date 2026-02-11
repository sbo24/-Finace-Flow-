import type { FixedExpense, FixedExpenseFormData, FixedExpenseFrequency } from '../types';
import { generateId } from '../utils/uuid';

const FIXED_EXPENSES_KEY = 'financeflow_fixed_expenses';

const getAllFixedExpenses = (): FixedExpense[] => {
    const data = localStorage.getItem(FIXED_EXPENSES_KEY);
    if (!data) return [];
    return JSON.parse(data).map((e: FixedExpense) => ({
        ...e,
        nextDueDate: new Date(e.nextDueDate),
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
    }));
};

const saveAllFixedExpenses = (items: FixedExpense[]) => {
    localStorage.setItem(FIXED_EXPENSES_KEY, JSON.stringify(items));
};

const normalizeNextDate = (raw: string, frequency: FixedExpenseFrequency): Date => {
    const today = new Date();
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
        return today;
    }
    while (date < today) {
        if (frequency === 'monthly') {
            date.setMonth(date.getMonth() + 1);
        } else if (frequency === 'quarterly') {
            date.setMonth(date.getMonth() + 3);
        } else {
            date.setFullYear(date.getFullYear() + 1);
        }
    }
    return date;
};

export const createFixedExpense = (userId: string, data: FixedExpenseFormData): FixedExpense => {
    const items = getAllFixedExpenses();
    const now = new Date();
    const nextDueDate = normalizeNextDate(data.nextDueDate, data.frequency);

    const newItem: FixedExpense = {
        id: generateId(),
        userId,
        name: data.name,
        amount: data.amount,
        frequency: data.frequency,
        nextDueDate,
        category: data.category,
        provider: data.provider,
        notes: data.notes,
        isActive: true,
        autopay: data.autopay,
        createdAt: now,
        updatedAt: now,
    };

    items.unshift(newItem);
    saveAllFixedExpenses(items);
    return newItem;
};

export const updateFixedExpense = (id: string, data: Partial<FixedExpenseFormData>): void => {
    const items = getAllFixedExpenses();
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return;

    const existing = items[index];
    const frequency = data.frequency ?? existing.frequency;
    const nextDueDate = data.nextDueDate
        ? normalizeNextDate(data.nextDueDate, frequency)
        : existing.nextDueDate;

    items[index] = {
        ...existing,
        ...data,
        frequency,
        nextDueDate,
        isActive: data.isActive ?? existing.isActive,
        updatedAt: new Date(),
    };
    saveAllFixedExpenses(items);
};

export const deleteFixedExpense = (id: string): void => {
    const items = getAllFixedExpenses();
    saveAllFixedExpenses(items.filter(i => i.id !== id));
};

export const getFixedExpenses = (userId: string): FixedExpense[] => {
    return getAllFixedExpenses()
        .filter(i => i.userId === userId)
        .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
};

export const getUpcomingFixedExpense = (userId: string): FixedExpense | null => {
    const now = new Date();
    const items = getFixedExpenses(userId).filter(i => i.nextDueDate >= now);
    return items[0] || null;
};
