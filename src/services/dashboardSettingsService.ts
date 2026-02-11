import type { DashboardSettings } from '../types';

const DASHBOARD_SETTINGS_KEY = 'financeflow_dashboard_settings';

const DEFAULT_WIDGETS = [
    'balance',
    'income',
    'expenses',
    'smartAlerts',
    'cashflow',
    'recentTransactions',
    'topCategories',
    'healthScore',
    'quickActions',
    'quickGoals',
    'tipOfTheDay',
    'accounts'
];

const DEFAULT_SIZES: Record<string, 'small' | 'medium' | 'large'> = {
    balance: 'small',
    income: 'small',
    expenses: 'small',
    smartAlerts: 'medium',
    cashflow: 'large',
    recentTransactions: 'medium',
    topCategories: 'medium',
    healthScore: 'small',
    quickActions: 'small',
    quickGoals: 'medium',
    tipOfTheDay: 'small',
    accounts: 'large'
};

const getDefaultSettings = (): DashboardSettings => ({
    visibleWidgets: [...DEFAULT_WIDGETS],
    widgetOrder: [...DEFAULT_WIDGETS],
    widgetSizes: { ...DEFAULT_SIZES },
    defaultAccountFilter: null
});

// Get dashboard settings for a user
export const getDashboardSettings = (userId: string): DashboardSettings => {
    const data = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
    if (!data) return getDefaultSettings();

    try {
        const allSettings = JSON.parse(data);
        const userSettings = allSettings[userId];
        if (!userSettings) return getDefaultSettings();

        // Merge with defaults to ensure all keys exist (migration)
        return {
            ...getDefaultSettings(),
            ...userSettings
        };
    } catch {
        return getDefaultSettings();
    }
};

// Save dashboard settings for a user
export const saveDashboardSettings = (userId: string, settings: DashboardSettings): void => {
    const data = localStorage.getItem(DASHBOARD_SETTINGS_KEY);
    let allSettings: Record<string, DashboardSettings> = {};

    if (data) {
        try {
            allSettings = JSON.parse(data);
        } catch {
            // Ignore parse errors
        }
    }

    allSettings[userId] = settings;
    localStorage.setItem(DASHBOARD_SETTINGS_KEY, JSON.stringify(allSettings));
};

// Toggle widget visibility
export const toggleWidget = (userId: string, widgetId: string): DashboardSettings => {
    const settings = getDashboardSettings(userId);

    if (settings.visibleWidgets.includes(widgetId)) {
        settings.visibleWidgets = settings.visibleWidgets.filter(w => w !== widgetId);
    } else {
        settings.visibleWidgets.push(widgetId);
    }

    saveDashboardSettings(userId, settings);
    return settings;
};

// Set default account filter
export const setDefaultAccountFilter = (userId: string, accountId: string | null): DashboardSettings => {
    const settings = getDashboardSettings(userId);
    settings.defaultAccountFilter = accountId;
    saveDashboardSettings(userId, settings);
    return settings;
};

// Reset to default settings
export const resetDashboardSettings = (userId: string): DashboardSettings => {
    const settings = getDefaultSettings();
    saveDashboardSettings(userId, settings);
    return settings;
};

export { DEFAULT_WIDGETS, DEFAULT_SIZES };
