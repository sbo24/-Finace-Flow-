import type { Account, AccountFormData } from '../types';
import { generateId } from '../utils/uuid';

const ACCOUNTS_KEY = 'financeflow_accounts';

// Get all accounts
export const getAccounts = (userId: string): Account[] => {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    if (!data) return [];

    const accounts = JSON.parse(data).map((a: Account) => ({
        ...a,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
    }));

    return accounts.filter((a: Account) => a.userId === userId);
};

// Save accounts
const saveAccounts = (accounts: Account[]) => {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

// Initialize default account if none exist
export const initializeDefaultAccount = (userId: string): Account => {
    const accounts = getAccounts(userId);
    if (accounts.length > 0) return accounts[0];

    const defaultAccount: Account = {
        id: generateId(),
        userId,
        name: 'Efectivo / General',
        type: 'cash',
        balance: 0,
        currency: 'EUR',
        color: '#22C55E',
        icon: '💵',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    saveAccounts([defaultAccount]);
    return defaultAccount;
};

// Create account
export const createAccount = (userId: string, data: AccountFormData): Account => {
    const accounts = getAllAccounts(); // Get ALL accounts to append correctly

    const newAccount: Account = {
        id: generateId(),
        userId,
        name: data.name,
        type: data.type,
        balance: data.initialBalance,
        currency: 'EUR',
        color: data.color,
        icon: data.icon,
        isDefault: data.isDefault || false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // If this is default, unset others for this user
    if (newAccount.isDefault) {
        accounts.forEach(a => {
            if (a.userId === userId) a.isDefault = false;
        });
    }

    accounts.push(newAccount);
    saveAccounts(accounts);
    return newAccount;
};

// Update account
export const updateAccount = (userId: string, accountId: string, data: Partial<AccountFormData>): void => {
    const accounts = getAllAccounts();
    const index = accounts.findIndex(a => a.id === accountId);

    if (index !== -1) {
        if (data.isDefault) {
            accounts.forEach(a => {
                if (a.userId === userId) a.isDefault = false;
            });
        }

        accounts[index] = {
            ...accounts[index],
            ...data,
            balance: data.initialBalance !== undefined ? data.initialBalance : accounts[index].balance,
            updatedAt: new Date(),
        };
        saveAccounts(accounts);
    }
};

// Delete account
export const deleteAccount = (accountId: string): void => {
    const accounts = getAllAccounts();
    const filtered = accounts.filter(a => a.id !== accountId);
    saveAccounts(filtered);
};

// Update account balance
export const updateAccountBalance = (accountId: string, amountChange: number): void => {
    const accounts = getAllAccounts();
    const index = accounts.findIndex(a => a.id === accountId);

    if (index !== -1) {
        accounts[index].balance += amountChange;
        accounts[index].updatedAt = new Date();
        saveAccounts(accounts);
    }
};

// Helper: Get ALL accounts (internal use)
const getAllAccounts = (): Account[] => {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    if (!data) return [];
    return JSON.parse(data).map((a: Account) => ({
        ...a,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
    }));
};

export const getAccount = (accountId: string): Account | null => {
    const accounts = getAllAccounts();
    return accounts.find(a => a.id === accountId) || null;
};
