import type { Subscription, SubscriptionFormData } from '../types';
import { generateId } from '../utils/uuid';

const SUBSCRIPTIONS_KEY = 'financeflow_subscriptions';

const getAllSubscriptions = (): Subscription[] => {
    const data = localStorage.getItem(SUBSCRIPTIONS_KEY);
    if (!data) return [];
    return JSON.parse(data).map((s: Subscription) => ({
        ...s,
        nextBillingDate: new Date(s.nextBillingDate),
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
    }));
};

const saveAllSubscriptions = (subscriptions: Subscription[]) => {
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
};

const normalizeNextDate = (raw: string, billingCycle: SubscriptionFormData['billingCycle']): Date => {
    const today = new Date();
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
        return today;
    }
    while (date < today) {
        if (billingCycle === 'monthly') {
            date.setMonth(date.getMonth() + 1);
        } else {
            date.setFullYear(date.getFullYear() + 1);
        }
    }
    return date;
};

export const createSubscription = (userId: string, data: SubscriptionFormData): Subscription => {
    const subscriptions = getAllSubscriptions();
    const now = new Date();
    const nextBillingDate = normalizeNextDate(data.nextBillingDate, data.billingCycle);

    const newSubscription: Subscription = {
        id: generateId(),
        userId,
        name: data.name,
        amount: data.amount,
        billingCycle: data.billingCycle,
        nextBillingDate,
        category: data.category,
        logoUrl: data.logoUrl,
        websiteUrl: data.websiteUrl,
        description: data.description,
        isActive: true,
        createdAt: now,
        updatedAt: now,
    };

    subscriptions.unshift(newSubscription);
    saveAllSubscriptions(subscriptions);
    return newSubscription;
};

export const updateSubscription = (subscriptionId: string, data: Partial<SubscriptionFormData>): void => {
    const subscriptions = getAllSubscriptions();
    const index = subscriptions.findIndex(s => s.id === subscriptionId);
    if (index === -1) return;

    const existing = subscriptions[index];
    const billingCycle = data.billingCycle ?? existing.billingCycle;
    const nextBillingDate = data.nextBillingDate
        ? normalizeNextDate(data.nextBillingDate, billingCycle)
        : existing.nextBillingDate;

    subscriptions[index] = {
        ...existing,
        ...data,
        billingCycle,
        nextBillingDate,
        updatedAt: new Date(),
    };
    saveAllSubscriptions(subscriptions);
};

export const deleteSubscription = (subscriptionId: string): void => {
    const subscriptions = getAllSubscriptions();
    saveAllSubscriptions(subscriptions.filter(s => s.id !== subscriptionId));
};

export const getSubscriptions = (userId: string): Subscription[] => {
    return getAllSubscriptions()
        .filter(s => s.userId === userId)
        .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime());
};

export const getUpcomingSubscription = (userId: string): Subscription | null => {
    const now = new Date();
    const subs = getSubscriptions(userId).filter(s => s.nextBillingDate >= now);
    return subs[0] || null;
};
