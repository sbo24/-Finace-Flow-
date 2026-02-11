import type { Transaction, TransactionFormData, TransactionFilters } from '../types';
import { updateAccountBalance, initializeDefaultAccount } from './accountService';
import { generateId } from '../utils/uuid';

const TRANSACTIONS_KEY = 'financeflow_transactions';

// Get all transactions from localStorage
const getAllTransactions = (): Transaction[] => {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    if (!data) return [];

    return JSON.parse(data).map((t: Transaction) => ({
        ...t,
        date: new Date(t.date),
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
    }));
};

// Save all transactions to localStorage
const saveAllTransactions = (transactions: Transaction[]) => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

// Create a new transaction
export const createTransaction = (
    userId: string,
    data: TransactionFormData
): Transaction => {
    const transactions = getAllTransactions();
    const now = new Date();

    // Ensure we have an account ID. If not provided or empty, find/create default.
    let accountId = data.accountId;
    if (!accountId) {
        const defaultAccount = initializeDefaultAccount(userId);
        accountId = defaultAccount.id;
    }

    const newTransaction: Transaction = {
        id: generateId(),
        userId,
        accountId, // Now required
        toAccountId: data.toAccountId,
        type: data.type,
        amount: data.amount,
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        date: new Date(data.date),
        paymentMethod: data.paymentMethod,
        tags: data.tags,
        createdAt: now,
        updatedAt: now,
    };

    transactions.unshift(newTransaction);
    saveAllTransactions(transactions);

    // Update Account Balances
    if (data.type === 'income') {
        updateAccountBalance(accountId, data.amount);
    } else if (data.type === 'expense') {
        updateAccountBalance(accountId, -data.amount);
    } else if (data.type === 'transfer' && data.toAccountId) {
        updateAccountBalance(accountId, -data.amount);
        updateAccountBalance(data.toAccountId, data.amount);
    }

    return newTransaction;
};

// Update an existing transaction
export const updateTransaction = (
    transactionId: string,
    data: Partial<TransactionFormData>
): void => {
    const transactions = getAllTransactions();
    const index = transactions.findIndex(t => t.id === transactionId);

    if (index !== -1) {
        const oldTransaction = transactions[index];
        // Revert balance change from old transaction
        if (oldTransaction.type === 'income') {
            updateAccountBalance(oldTransaction.accountId, -oldTransaction.amount);
        } else if (oldTransaction.type === 'expense') {
            updateAccountBalance(oldTransaction.accountId, oldTransaction.amount);
        } else if (oldTransaction.type === 'transfer' && oldTransaction.toAccountId) {
            updateAccountBalance(oldTransaction.accountId, oldTransaction.amount);
            updateAccountBalance(oldTransaction.toAccountId, -oldTransaction.amount);
        }

        // Prepare new data, keeping existing values if not provided
        const updatedTransaction = {
            ...transactions[index],
            ...data,
            date: data.date ? new Date(data.date) : transactions[index].date,
            updatedAt: new Date(),
        };

        transactions[index] = updatedTransaction;
        saveAllTransactions(transactions);

        // Apply new balance change
        if (updatedTransaction.type === 'income') {
            updateAccountBalance(updatedTransaction.accountId, updatedTransaction.amount);
        } else if (updatedTransaction.type === 'expense') {
            updateAccountBalance(updatedTransaction.accountId, -updatedTransaction.amount);
        } else if (updatedTransaction.type === 'transfer' && updatedTransaction.toAccountId) {
            updateAccountBalance(updatedTransaction.accountId, -updatedTransaction.amount);
            updateAccountBalance(updatedTransaction.toAccountId, updatedTransaction.amount);
        }
    }
};

// Delete a transaction
export const deleteTransaction = (transactionId: string): void => {
    const transactions = getAllTransactions();
    const transaction = transactions.find(t => t.id === transactionId);

    if (transaction) {
        // Revert balance change
        if (transaction.type === 'income') {
            updateAccountBalance(transaction.accountId, -transaction.amount);
        } else if (transaction.type === 'expense') {
            updateAccountBalance(transaction.accountId, transaction.amount);
        } else if (transaction.type === 'transfer' && transaction.toAccountId) {
            updateAccountBalance(transaction.accountId, transaction.amount);
            updateAccountBalance(transaction.toAccountId, -transaction.amount);
        }

        const filtered = transactions.filter(t => t.id !== transactionId);
        saveAllTransactions(filtered);
    }
};

// Get a single transaction
export const getTransaction = (transactionId: string): Transaction | null => {
    const transactions = getAllTransactions();
    return transactions.find(t => t.id === transactionId) || null;
};

// Get all transactions for a user with optional filters
export const getTransactions = (
    userId: string,
    filters?: TransactionFilters
): Transaction[] => {
    let transactions = getAllTransactions().filter(t => t.userId === userId);

    // Apply filters
    if (filters?.type) {
        transactions = transactions.filter(t => t.type === filters.type);
    }

    if (filters?.startDate) {
        transactions = transactions.filter(t => t.date >= filters.startDate!);
    }

    if (filters?.endDate) {
        transactions = transactions.filter(t => t.date <= filters.endDate!);
    }

    if (filters?.categories && filters.categories.length > 0) {
        transactions = transactions.filter(t => filters.categories!.includes(t.category));
    }

    if (filters?.minAmount !== undefined) {
        transactions = transactions.filter(t => t.amount >= filters.minAmount!);
    }

    if (filters?.maxAmount !== undefined) {
        transactions = transactions.filter(t => t.amount <= filters.maxAmount!);
    }

    if (filters?.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        transactions = transactions.filter(t =>
            t.description.toLowerCase().includes(searchLower) ||
            t.category.toLowerCase().includes(searchLower) ||
            (t.merchant?.toLowerCase().includes(searchLower)) ||
            (t.notes?.toLowerCase().includes(searchLower))
        );
    }

    if (filters?.paymentMethods && filters.paymentMethods.length > 0) {
        transactions = transactions.filter(t => filters.paymentMethods!.includes(t.paymentMethod));
    }

    // Sort by date descending
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

// Get transactions for a specific month
export const getMonthlyTransactions = (
    userId: string,
    year: number,
    month: number
): Transaction[] => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    return getTransactions(userId, { startDate, endDate });
};

// Get transaction summary for dashboard (with optional account filter)
export const getTransactionSummary = (
    userId: string,
    startDate: Date,
    endDate: Date,
    accountId?: string | null
): { totalIncome: number; totalExpenses: number; byCategory: Record<string, number> } => {
    let transactions = getTransactions(userId, { startDate, endDate });

    // Filter by account if specified
    if (accountId) {
        transactions = transactions.filter(t => t.accountId === accountId);
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    const byCategory: Record<string, number> = {};

    transactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else if (t.type === 'expense') {
            totalExpenses += t.amount;
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
        }
    });

    return { totalIncome, totalExpenses, byCategory };
};

// Get recent transactions (with optional account filter)
export const getRecentTransactions = (
    userId: string,
    count: number = 5,
    accountId?: string | null
): Transaction[] => {
    let transactions = getTransactions(userId);

    if (accountId) {
        transactions = transactions.filter(t => t.accountId === accountId);
    }

    return transactions.slice(0, count);
};

// Get transaction summary per account (for dashboard account cards)
export const getAccountsTransactionSummary = (
    userId: string,
    startDate: Date,
    endDate: Date
): { accountId: string; totalIncome: number; totalExpenses: number }[] => {
    const transactions = getTransactions(userId, { startDate, endDate });

    const summaryMap = new Map<string, { totalIncome: number; totalExpenses: number }>();

    transactions.forEach(t => {
        const current = summaryMap.get(t.accountId) || { totalIncome: 0, totalExpenses: 0 };

        if (t.type === 'income') {
            current.totalIncome += t.amount;
        } else if (t.type === 'expense') {
            current.totalExpenses += t.amount;
        }

        summaryMap.set(t.accountId, current);
    });

    return Array.from(summaryMap.entries()).map(([accountId, summary]) => ({
        accountId,
        ...summary
    }));
};
