import { useState, useEffect, useCallback } from 'react';
import { getTransactionSummary, getRecentTransactions, getTransactions, getAccountsTransactionSummary } from '../services/transactionService';
import { getAccounts } from '../services/accountService';
import { checkBudgetAlerts } from '../services/budgetService';
import { getDashboardSettings, saveDashboardSettings, DEFAULT_WIDGETS } from '../services/dashboardSettingsService';
import { type Transaction, type Account, type DashboardSettings, DEFAULT_EXPENSE_CATEGORIES } from '../types';

export function useDashboardData(currentUserId: string | undefined) {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        healthScore: 85,
        balanceChangePct: 0
    });
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [cashflowData, setCashflowData] = useState<{ name: string; balance: number; income: number; expenses: number }[]>([]);
    const [topCategories, setTopCategories] = useState<{ name: string; amount: number; color: string; icon: string }[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountsSummary, setAccountsSummary] = useState<Map<string, { totalIncome: number; totalExpenses: number }>>(new Map());
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings | null>(null);

    const loadData = useCallback((accountFilter: string | null = null) => {
        if (!currentUserId) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const summaryData = getTransactionSummary(currentUserId, startOfMonth, endOfMonth, accountFilter);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const lastSummaryData = getTransactionSummary(currentUserId, lastMonthStart, lastMonthEnd, accountFilter);

        const allAccounts = getAccounts(currentUserId);
        setAccounts(allAccounts);

        let currentRealBalance = 0;
        if (accountFilter) {
            const acc = allAccounts.find(a => a.id === accountFilter);
            currentRealBalance = acc ? acc.balance : 0;
        } else {
            currentRealBalance = allAccounts.reduce((sum, a) => sum + a.balance, 0);
        }

        let score = 50;
        if (summaryData.totalIncome > 0) {
            const savingsRate = (summaryData.totalIncome - summaryData.totalExpenses) / summaryData.totalIncome;
            score = Math.min(100, Math.max(0, Math.round(savingsRate * 100) + 50));
        }

        const currentPeriodBalance = summaryData.totalIncome - summaryData.totalExpenses;
        const lastPeriodBalance = lastSummaryData.totalIncome - lastSummaryData.totalExpenses;
        const balanceChangePct = lastPeriodBalance === 0
            ? 0
            : Math.round(((currentPeriodBalance - lastPeriodBalance) / Math.abs(lastPeriodBalance)) * 1000) / 10;

        setSummary({
            totalBalance: currentRealBalance,
            totalIncome: summaryData.totalIncome,
            totalExpenses: summaryData.totalExpenses,
            healthScore: score,
            balanceChangePct
        });

        setRecentTransactions(getRecentTransactions(currentUserId, 5, accountFilter));

        const accSummaries = getAccountsTransactionSummary(currentUserId, startOfMonth, endOfMonth);
        const summaryMap = new Map<string, { totalIncome: number; totalExpenses: number }>();
        accSummaries.forEach(s => {
            summaryMap.set(s.accountId, { totalIncome: s.totalIncome, totalExpenses: s.totalExpenses });
        });
        setAccountsSummary(summaryMap);

        let monthlyTransactions = getTransactions(currentUserId, { startDate: startOfMonth, endDate: endOfMonth });
        const dailyStats = new Map<string, { income: number; expenses: number; delta: number }>();

        monthlyTransactions.forEach(tx => {
            const dtx = new Date(tx.date);
            const dateKey = `${dtx.getFullYear()}-${String(dtx.getMonth() + 1).padStart(2, '0')}-${String(dtx.getDate()).padStart(2, '0')}`;
            const stats = dailyStats.get(dateKey) || { income: 0, expenses: 0, delta: 0 };

            let txDelta = 0;
            if (accountFilter) {
                if (tx.accountId === accountFilter) {
                    if (tx.type === 'expense' || tx.type === 'transfer') {
                        stats.expenses += tx.amount;
                        txDelta = -tx.amount;
                    } else if (tx.type === 'income') {
                        stats.income += tx.amount;
                        txDelta = tx.amount;
                    }
                } else if (tx.type === 'transfer' && tx.toAccountId === accountFilter) {
                    stats.income += tx.amount;
                    txDelta = tx.amount;
                } else {
                    return;
                }
            } else {
                if (tx.type === 'income') {
                    stats.income += tx.amount;
                    txDelta = tx.amount;
                } else if (tx.type === 'expense') {
                    stats.expenses += tx.amount;
                    txDelta = -tx.amount;
                }
            }
            stats.delta += txDelta;
            dailyStats.set(dateKey, stats);
        });

        const totalDeltaThisMonth = Array.from(dailyStats.values()).reduce((sum, s) => sum + s.delta, 0);
        let runningBalance = currentRealBalance - totalDeltaThisMonth;
        const daysInCurrentMonthCount = now.getDate();
        const fullChartData = [];

        for (let i = 1; i <= daysInCurrentMonthCount; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const stats = dailyStats.get(key) || { income: 0, expenses: 0, delta: 0 };
            runningBalance += stats.delta;
            fullChartData.push({
                name: String(i),
                balance: Math.round(runningBalance * 100) / 100,
                income: Math.round(stats.income * 100) / 100,
                expenses: Math.round(stats.expenses * 100) / 100
            });
        }
        setCashflowData(fullChartData);

        const categoryMeta = new Map(DEFAULT_EXPENSE_CATEGORIES.map(c => [c.id, c]));
        const top = Object.entries(summaryData.byCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([id, amount]) => {
                const meta = categoryMeta.get(id);
                return {
                    name: meta?.name || id,
                    amount,
                    color: meta?.color || '#64748B',
                    icon: meta?.icon || '📦'
                };
            });
        setTopCategories(top);

        checkBudgetAlerts(currentUserId);
        setLoading(false);
    }, [currentUserId]);

    useEffect(() => {
        if (currentUserId) {
            const savedSettings = getDashboardSettings(currentUserId);
            if (!savedSettings.widgetOrder) {
                savedSettings.widgetOrder = [...DEFAULT_WIDGETS];
            }
            setDashboardSettings(savedSettings);
            setSelectedAccountId(savedSettings.defaultAccountFilter);
            loadData(savedSettings.defaultAccountFilter);
        }
    }, [currentUserId, loadData]);

    const handleAccountFilterChange = (accountId: string) => {
        const newAccountId = accountId === 'all' ? null : accountId;
        setSelectedAccountId(newAccountId);
        if (currentUserId && dashboardSettings) {
            const newSettings = { ...dashboardSettings, defaultAccountFilter: newAccountId };
            saveDashboardSettings(currentUserId, newSettings);
            setDashboardSettings(newSettings);
        }
        loadData(newAccountId);
    };

    const refreshData = () => loadData(selectedAccountId);

    return {
        loading,
        summary,
        recentTransactions,
        cashflowData,
        topCategories,
        accounts,
        accountsSummary,
        selectedAccountId,
        dashboardSettings,
        setDashboardSettings,
        handleAccountFilterChange,
        refreshData
    };
}
