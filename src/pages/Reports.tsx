import { useState, useEffect, useMemo } from 'react';
import { Download, TrendingUp, TrendingDown, Target, Lightbulb, Search } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Area,
    AreaChart
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { getTransactions } from '../services/transactionService';
import {
    type Transaction,
    DEFAULT_EXPENSE_CATEGORIES,
    type FinancialHealthScore,
    type SmartInsight,
    type Account
} from '../types';
import { getAccounts } from '../services/accountService';
import { type TranslationKey } from '../contexts/SettingsContext';

// Financial Health Calculator
const calculateFinancialHealth = (
    totalIncome: number,
    totalExpenses: number,
    language: string
): FinancialHealthScore => {
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // Savings Rate Score (0-25 points) - 20% savings rate is ideal
    const savingsScore = Math.min(25, (savingsRate / 20) * 25);

    // Budget Adherence Score (0-25 points) - simulated
    const budgetScore = 20; // Would calculate from actual budget data

    // Emergency Fund Score (0-25 points) - need 3 months expenses
    const monthlyExpenses = totalExpenses / 12;
    const emergencyFundTarget = Math.max(1, monthlyExpenses * 3);
    const emergencyScore = Math.min(25, (Math.max(0, savings) / emergencyFundTarget) * 25);

    // Expense Ratio Score (0-25 points) - expenses < 70% income is good
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;
    const debtScore = Math.min(25, (Math.max(0, 100 - expenseRatio) / 30) * 25);

    const overall = Math.round(savingsScore + budgetScore + emergencyScore + debtScore);

    const tips: string[] = [];
    if (savingsRate < 10) tips.push(language === 'es' ? 'Intenta ahorrar al menos el 10% de tus ingresos' : language === 'fr' ? 'Essayez d\'épargner au moins 10% de vos revenus' : 'Try to save at least 10% of your income');
    if (expenseRatio > 80) tips.push(language === 'es' ? 'Tus gastos superan el 80% de tus ingresos' : language === 'fr' ? 'Vos dépenses dépassent 80% de vos revenus' : 'Your expenses exceed 80% of your income');
    if (savingsRate > 20) tips.push(language === 'es' ? '¡Excelente tasa de ahorro! Considera invertir' : language === 'fr' ? 'Excellent taux d\'épargne ! Pensez à investir' : 'Excellent savings rate! Consider investing');

    return {
        overall,
        savingsRate: Math.round(savingsRate),
        budgetAdherence: 80,
        emergencyFund: Math.round((Math.max(0, savings) / emergencyFundTarget) * 100),
        debtRatio: Math.round(Math.max(0, 100 - expenseRatio)),
        tips
    };
};

// Generate Smart Insights
const generateInsights = (
    transactions: Transaction[],
    totalIncome: number,
    totalExpenses: number,
    categoryBreakdown: { name: string; value: number; color: string }[],
    language: string
): SmartInsight[] => {
    const insights: SmartInsight[] = [];

    // Top spending category warning
    if (categoryBreakdown.length > 0) {
        const topCategory = categoryBreakdown[0];
        const percentage = totalExpenses > 0 ? (topCategory.value / totalExpenses) * 100 : 0;
        if (percentage > 30) {
            insights.push({
                id: '1',
                type: 'warning',
                title: (language === 'es' ? 'Alto gasto en ' : language === 'fr' ? 'Dépenses élevées en ' : 'High spending in ') + topCategory.name,
                message: language === 'es' ? `El ${percentage.toFixed(0)}% de tus gastos van a ${topCategory.name}. Considera reducir este gasto.` :
                    language === 'fr' ? `${percentage.toFixed(0)}% de vos dépenses vont à ${topCategory.name}. Envisagez de réduire cette dépense.` :
                        `${percentage.toFixed(0)}% of your expenses go to ${topCategory.name}. Consider reducing this spending.`,
                icon: '⚠️'
            });
        }
    }

    // Savings achievement
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    if (savingsRate > 20) {
        insights.push({
            id: '2',
            type: 'achievement',
            title: language === 'es' ? '¡Gran ahorro!' : language === 'fr' ? 'Grande épargne !' : 'Great saving!',
            message: language === 'es' ? `Estás ahorrando el ${savingsRate.toFixed(0)}% de tus ingresos. ¡Sigue así!` :
                language === 'fr' ? `Vous épargnez ${savingsRate.toFixed(0)}% de vos revenus. Continuez comme ça !` :
                    `You are saving ${savingsRate.toFixed(0)}% of your income. Keep it up!`,
            icon: '🏆'
        });
    }

    // Suggestions
    if (transactions.length < 5) {
        insights.push({
            id: '3',
            type: 'tip',
            title: language === 'es' ? 'Registra más transacciones' : language === 'fr' ? 'Enregistrez plus de transactions' : 'Register more transactions',
            message: language === 'es' ? 'Añade todas tus transacciones para obtener análisis más precisos.' :
                language === 'fr' ? 'Ajoutez toutes vos transactions pour obtenir des analyses plus précises.' :
                    'Add all your transactions to get more accurate analyses.',
            icon: '💡'
        });
    }

    // Monthly trend
    if (totalExpenses > totalIncome) {
        insights.push({
            id: '4',
            type: 'warning',
            title: language === 'es' ? 'Gastos superan ingresos' : language === 'fr' ? 'Dépenses supérieures aux revenus' : 'Expenses exceed income',
            message: language === 'es' ? 'Este período has gastado más de lo que has ingresado. Revisa tu presupuesto.' :
                language === 'fr' ? 'Cette période, vous avez dépensé plus que vous n\'avez gagné. Révisez votre budget.' :
                    'This period you have spent more than you have earned. Review your budget.',
            icon: '📉'
        });
    }

    return insights;
};

export default function Reports() {
    const { currentUser } = useAuth();
    const { t, settings } = useSettings();
    const [dateRange, setDateRange] = useState('year');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [categorySearch, setCategorySearch] = useState('');

    const formatCurrencyLocal = (amount: number) => {
        return new Intl.NumberFormat(settings.language === 'es' ? 'es-ES' : settings.language === 'fr' ? 'fr-FR' : 'en-US', {
            style: 'currency',
            currency: settings.currency
        }).format(amount);
    };

    useEffect(() => {
        if (currentUser) {
            setTransactions(getTransactions(currentUser.id));
            setAccounts(getAccounts(currentUser.id));
        }
    }, [currentUser]);

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        let startDate: Date | null = null;
        if (dateRange === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (dateRange === 'quarter') {
            const startMonth = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), startMonth, 1);
        } else if (dateRange === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
        }

        return transactions.filter(tr => {
            const matchesDate = startDate ? new Date(tr.date) >= startDate : true;
            const matchesSearch = searchTerm
                ? `${tr.description} ${tr.category} ${tr.merchant || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
                : true;
            const matchesAccount = selectedAccountId === 'all' || tr.accountId === selectedAccountId;
            return matchesDate && matchesSearch && matchesAccount;
        });
    }, [transactions, dateRange, searchTerm, selectedAccountId]);

    // Calculate real data from transactions
    const { monthlyData, categoryData, totalIncome, totalExpenses, totalSavings } = useMemo(() => {
        const months = settings.language === 'es' ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] :
            settings.language === 'fr' ? ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jui', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'] :
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const monthlyMap: Record<string, { income: number; expenses: number }> = {};
        const categoryMap: Record<string, number> = {};

        months.forEach(m => {
            monthlyMap[m] = { income: 0, expenses: 0 };
        });

        let income = 0;
        let expenses = 0;

        filteredTransactions.forEach(tr => {
            const date = new Date(tr.date);
            const monthIndex = date.getMonth();
            const monthName = months[monthIndex];

            if (tr.type === 'income') {
                income += tr.amount;
                if (monthlyMap[monthName]) monthlyMap[monthName].income += tr.amount;
            } else {
                expenses += tr.amount;
                if (monthlyMap[monthName]) monthlyMap[monthName].expenses += tr.amount;
                categoryMap[tr.category] = (categoryMap[tr.category] || 0) + tr.amount;
            }
        });

        const monthly = months.map(m => ({
            month: m,
            income: monthlyMap[m].income,
            expenses: monthlyMap[m].expenses,
            savings: monthlyMap[m].income - monthlyMap[m].expenses
        }));

        const category = Object.entries(categoryMap)
            .map(([id, value]) => {
                const catInfo = DEFAULT_EXPENSE_CATEGORIES.find(c => c.id === id);
                return {
                    name: t(`cat.${id}` as TranslationKey) || id,
                    value,
                    color: catInfo?.color || '#64748B',
                    icon: catInfo?.icon || '📦'
                };
            })
            .sort((a, b) => b.value - a.value);

        return {
            monthlyData: monthly,
            categoryData: category,
            totalIncome: income,
            totalExpenses: expenses,
            totalSavings: income - expenses
        };
    }, [filteredTransactions, settings.language, t]);

    const financialHealth = useMemo(() =>
        calculateFinancialHealth(totalIncome, totalExpenses, settings.language),
        [totalIncome, totalExpenses, settings.language]
    );

    const insights = useMemo(() =>
        generateInsights(filteredTransactions, totalIncome, totalExpenses, categoryData, settings.language),
        [filteredTransactions, totalIncome, totalExpenses, categoryData, settings.language]
    );

    const handleExportCSV = () => {
        let csv = settings.language === 'es' ? 'Fecha,Tipo,Categoría,Descripción,Monto,Método de Pago\n' :
            settings.language === 'fr' ? 'Date,Type,Catégorie,Description,Montant,Méthode de Paiement\n' :
                'Date,Type,Category,Description,Amount,Payment Method\n';

        filteredTransactions.forEach(tr => {
            csv += `${new Date(tr.date).toLocaleDateString()},${tr.type},${tr.category},"${tr.description}",${tr.amount},${tr.paymentMethod}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `financeflow_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Health Score Color
    const getHealthColor = (score: number) => {
        if (score >= 75) return 'var(--success)';
        if (score >= 50) return 'var(--warning)';
        return 'var(--danger)';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
                    <p className="text-[var(--text-secondary)]">{t('reports.subtitle')}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                            className="input search-field search-input"
                            placeholder={settings.language === 'es' ? 'Buscar en reportes...' : settings.language === 'fr' ? 'Rechercher dans les rapports...' : 'Search reports...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="input w-auto"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="month">{settings.language === 'es' ? 'Este Mes' : settings.language === 'fr' ? 'Ce Mois' : 'This Month'}</option>
                        <option value="quarter">{settings.language === 'es' ? 'Trimestre' : settings.language === 'fr' ? 'Trimestre' : 'Quarter'}</option>
                        <option value="year">{settings.language === 'es' ? 'Este Año' : settings.language === 'fr' ? 'Cette Année' : 'This Year'}</option>
                        <option value="all">{settings.language === 'es' ? 'Todo' : settings.language === 'fr' ? 'Tout' : 'All'}</option>
                    </select>

                    <select
                        className="input w-auto"
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                    >
                        <option value="all">
                            {settings.language === 'es' ? 'Todas las Cuentas' : settings.language === 'fr' ? 'Tous les Comptes' : 'All Accounts'}
                        </option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.icon} {acc.name}
                            </option>
                        ))}
                    </select>

                    <button onClick={handleExportCSV} className="btn btn-primary">
                        <Download className="w-4 h-4" />
                        {t('reports.export')}
                    </button>
                </div>
            </div>

            {/* Financial Health Score */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center">
                            <Target className="w-6 h-6 text-[var(--primary)]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">{t('reports.health_score')}</h2>
                            <p className="text-sm text-[var(--text-muted)]">{t('reports.health_desc')}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div
                            className="text-4xl font-bold"
                            style={{ color: getHealthColor(financialHealth.overall) }}
                        >
                            {financialHealth.overall}
                        </div>
                        <p className="text-sm text-[var(--text-muted)]">{t('reports.of_100')}</p>
                    </div>
                </div>

                {/* Health Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
                        <p className="text-sm text-[var(--text-muted)]">{t('reports.savings_rate')}</p>
                        <p className="text-xl font-bold" style={{ color: financialHealth.savingsRate >= 20 ? 'var(--success)' : 'var(--warning)' }}>
                            {financialHealth.savingsRate}%
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
                        <p className="text-sm text-[var(--text-muted)]">{t('reports.budget_adherence')}</p>
                        <p className="text-xl font-bold text-[var(--secondary)]">{financialHealth.budgetAdherence}%</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
                        <p className="text-sm text-[var(--text-muted)]">{t('reports.emergency_fund')}</p>
                        <p className="text-xl font-bold" style={{ color: financialHealth.emergencyFund >= 100 ? 'var(--success)' : 'var(--warning)' }}>
                            {Math.min(100, financialHealth.emergencyFund)}%
                        </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--bg-tertiary)]">
                        <p className="text-sm text-[var(--text-muted)]">{t('reports.debt_ratio')}</p>
                        <p className="text-xl font-bold text-[var(--accent)]">{financialHealth.debtRatio}%</p>
                    </div>
                </div>
            </div>

            {/* Smart Insights */}
            {insights.length > 0 && (
                <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-5 h-5 text-[var(--warning)]" />
                        <h3 className="font-semibold">{t('reports.insights')}</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {insights.map(insight => (
                            <div
                                key={insight.id}
                                className={`p-4 rounded-xl border ${insight.type === 'warning' ? 'border-[var(--warning)]/30 bg-[var(--warning)]/5' :
                                    insight.type === 'achievement' ? 'border-[var(--success)]/30 bg-[var(--success)]/5' :
                                        'border-[var(--border)] bg-[var(--bg-tertiary)]'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{insight.icon}</span>
                                    <div>
                                        <p className="font-medium">{insight.title}</p>
                                        <p className="text-sm text-[var(--text-muted)]">{insight.message}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-[var(--success)]" />
                        <p className="text-[var(--text-muted)] text-sm">{settings.language === 'es' ? 'Ingresos' : settings.language === 'fr' ? 'Revenus' : 'Income'}</p>
                    </div>
                    <p className="text-2xl font-bold text-[var(--success)]">{formatCurrencyLocal(totalIncome)}</p>
                </div>
                <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-5 h-5 text-[var(--danger)]" />
                        <p className="text-[var(--text-muted)] text-sm">{settings.language === 'es' ? 'Gastos' : settings.language === 'fr' ? 'Dépenses' : 'Expenses'}</p>
                    </div>
                    <p className="text-2xl font-bold text-[var(--danger)]">{formatCurrencyLocal(totalExpenses)}</p>
                </div>
                <div className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-[var(--primary)]" />
                        <p className="text-[var(--text-muted)] text-sm">{settings.language === 'es' ? 'Ahorro Neto' : settings.language === 'fr' ? 'Épargne Nette' : 'Net Savings'}</p>
                    </div>
                    <p className={`text-2xl font-bold ${totalSavings >= 0 ? 'text-[var(--primary)]' : 'text-[var(--danger)]'}`}>
                        {formatCurrencyLocal(totalSavings)}
                    </p>
                </div>
                <div className="glass-card p-5">
                    <p className="text-[var(--text-muted)] text-sm mb-2">{settings.language === 'es' ? 'Transacciones' : 'Transactions'}</p>
                    <p className="text-2xl font-bold">{filteredTransactions.length}</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income vs Expenses Trend */}
                <div className="glass-card p-5">
                    <h3 className="font-semibold text-lg mb-4">{t('reports.monthly_trend')}</h3>
                    {filteredTransactions.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '12px'
                                    }}
                                    formatter={(value: number | undefined) => formatCurrencyLocal(value ?? 0)}
                                />
                                <Area type="monotone" dataKey="income" stroke="#22C55E" fillOpacity={1} fill="url(#colorIncome)" name={settings.language === 'es' ? 'Ingresos' : settings.language === 'fr' ? 'Revenus' : 'Income'} />
                                <Area type="monotone" dataKey="expenses" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpenses)" name={settings.language === 'es' ? 'Gastos' : settings.language === 'fr' ? 'Dépenses' : 'Expenses'} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-[var(--text-muted)]">
                            {t('reports.no_data_chart')}
                        </div>
                    )}
                </div>

                {/* Category Breakdown */}
                <div className="glass-card p-5">
                    <h3 className="font-semibold text-lg mb-4">{t('reports.category_breakdown')}</h3>
                    <div className="mb-4">
                        <input
                            className="input search-field search-input"
                            placeholder={settings.language === 'es' ? 'Filtrar categorías...' : settings.language === 'fr' ? 'Filtrer les catégories...' : 'Filter categories...'}
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                        />
                    </div>
                    {categoryData.length > 0 ? (
                        <div className="flex items-center gap-4">
                            <ResponsiveContainer width="50%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={categoryData.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {categoryData
                                            .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                                            .map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number | undefined) => formatCurrencyLocal(value ?? 0)} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-2 overflow-y-auto max-h-[250px]">
                                {categoryData
                                    .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                                    .slice(0, 6)
                                    .map((cat, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: cat.color }}
                                                />
                                                <span className="text-sm">{cat.name}</span>
                                            </div>
                                            <span className="text-sm font-medium">{formatCurrencyLocal(cat.value)}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[250px] flex items-center justify-center text-[var(--text-muted)]">
                            {t('reports.no_data_category')}
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Comparison */}
            <div className="glass-card p-5">
                <h3 className="font-semibold text-lg mb-4">{t('reports.comparison')}</h3>
                {filteredTransactions.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px'
                                }}
                                formatter={(value: number | undefined) => formatCurrencyLocal(value ?? 0)}
                            />
                            <Bar dataKey="income" name={settings.language === 'es' ? 'Ingresos' : settings.language === 'fr' ? 'Revenus' : 'Income'} fill="#22C55E" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" name={settings.language === 'es' ? 'Gastos' : settings.language === 'fr' ? 'Dépenses' : 'Expenses'} fill="#EF4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-[var(--text-muted)]">
                        {t('reports.no_data_chart')}
                    </div>
                )}
            </div>
        </div>
    );
}
