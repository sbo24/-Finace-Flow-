// User Types
export interface User {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
    createdAt: Date;
}

// Account Types
export type AccountType = 'checking' | 'savings' | 'cash' | 'credit' | 'investment' | 'other';

export interface Account {
    id: string;
    userId: string;
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
    color: string;
    icon: string;
    isDefault?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AccountFormData {
    name: string;
    type: AccountType;
    initialBalance: number;
    color: string;
    icon: string;
    isDefault?: boolean;
}

// Transaction Types
export type TransactionType = 'income' | 'expense' | 'transfer';
export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer' | 'bizum' | 'paypal' | 'crypto' | 'other';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Transaction {
    id: string;
    userId: string;
    accountId: string;
    toAccountId?: string; // For transfers
    type: TransactionType;
    amount: number;
    category: string;
    subcategory?: string;
    description: string;
    date: Date;
    paymentMethod: PaymentMethod;
    tags: string[];
    merchant?: string;
    location?: string;
    notes?: string;
    isRecurring?: boolean;
    recurrence?: RecurrenceType;
    createdAt: Date;
    updatedAt: Date;
}

export interface TransactionFormData {
    accountId: string;
    toAccountId?: string;
    type: TransactionType;
    amount: number;
    category: string;
    subcategory?: string;
    description: string;
    date: string;
    paymentMethod: PaymentMethod;
    tags: string[];
    merchant?: string;
    location?: string;
    notes?: string;
    isRecurring?: boolean;
    recurrence?: RecurrenceType;
}

// Category Types
export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: TransactionType;
    subcategories?: string[];
}

// EXPANDED EXPENSE CATEGORIES (20+)
export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
    // Alimentación
    { id: 'groceries', name: 'Supermercado', icon: '🛒', color: '#22C55E', type: 'expense', subcategories: ['Frutas/Verduras', 'Carnes', 'Lácteos', 'Limpieza'] },
    { id: 'restaurants', name: 'Restaurantes', icon: '🍽️', color: '#F59E0B', type: 'expense', subcategories: ['Comida rápida', 'Restaurante', 'Cafetería', 'Bar'] },
    { id: 'delivery', name: 'Delivery', icon: '🛵', color: '#EF4444', type: 'expense', subcategories: ['Glovo', 'Uber Eats', 'Just Eat'] },

    // Transporte
    { id: 'fuel', name: 'Gasolina', icon: '⛽', color: '#3B82F6', type: 'expense' },
    { id: 'public_transport', name: 'Transporte Público', icon: '🚇', color: '#6366F1', type: 'expense', subcategories: ['Metro', 'Autobús', 'Tren', 'Abono'] },
    { id: 'taxi', name: 'Taxi/VTC', icon: '🚕', color: '#8B5CF6', type: 'expense', subcategories: ['Uber', 'Cabify', 'Taxi'] },
    { id: 'parking', name: 'Parking', icon: '🅿️', color: '#0EA5E9', type: 'expense' },
    { id: 'car_maintenance', name: 'Mantenimiento Auto', icon: '🔧', color: '#64748B', type: 'expense', subcategories: ['Taller', 'ITV', 'Seguro', 'Multas'] },

    // Hogar
    { id: 'rent', name: 'Alquiler/Hipoteca', icon: '🏠', color: '#14B8A6', type: 'expense' },
    { id: 'utilities', name: 'Servicios', icon: '💡', color: '#FBBF24', type: 'expense', subcategories: ['Luz', 'Agua', 'Gas', 'Internet', 'Teléfono'] },
    { id: 'home_maintenance', name: 'Hogar', icon: '🛋️', color: '#A855F7', type: 'expense', subcategories: ['Muebles', 'Decoración', 'Reparaciones'] },

    // Entretenimiento
    { id: 'streaming', name: 'Streaming', icon: '📺', color: '#E11D48', type: 'expense', subcategories: ['Netflix', 'Spotify', 'HBO', 'Disney+', 'YouTube'] },
    { id: 'gaming', name: 'Videojuegos', icon: '🎮', color: '#7C3AED', type: 'expense', subcategories: ['Juegos', 'Suscripciones', 'Consolas'] },
    { id: 'events', name: 'Eventos', icon: '🎟️', color: '#EC4899', type: 'expense', subcategories: ['Conciertos', 'Cine', 'Teatro', 'Deportes'] },
    { id: 'hobbies', name: 'Hobbies', icon: '🎨', color: '#F97316', type: 'expense', subcategories: ['Deportes', 'Música', 'Fotografía', 'Lectura'] },

    // Salud y Bienestar
    { id: 'pharmacy', name: 'Farmacia', icon: '💊', color: '#EF4444', type: 'expense' },
    { id: 'doctor', name: 'Médico', icon: '🏥', color: '#DC2626', type: 'expense', subcategories: ['Consulta', 'Especialista', 'Dentista', 'Oculista'] },
    { id: 'gym', name: 'Gimnasio', icon: '💪', color: '#10B981', type: 'expense' },
    { id: 'beauty', name: 'Belleza', icon: '💅', color: '#F472B6', type: 'expense', subcategories: ['Peluquería', 'Cosmética', 'Spa'] },

    // Compras
    { id: 'clothing', name: 'Ropa', icon: '👕', color: '#6366F1', type: 'expense', subcategories: ['Casual', 'Formal', 'Deportiva', 'Calzado'] },
    { id: 'electronics', name: 'Electrónica', icon: '📱', color: '#0891B2', type: 'expense', subcategories: ['Móvil', 'Ordenador', 'Accesorios'] },
    { id: 'gifts', name: 'Regalos', icon: '🎁', color: '#F43F5E', type: 'expense' },

    // Educación
    { id: 'courses', name: 'Cursos', icon: '🎓', color: '#0D9488', type: 'expense', subcategories: ['Online', 'Presencial', 'Certificaciones'] },
    { id: 'books', name: 'Libros', icon: '📚', color: '#84CC16', type: 'expense' },

    // Otros
    { id: 'travel', name: 'Viajes', icon: '✈️', color: '#0EA5E9', type: 'expense', subcategories: ['Vuelos', 'Hotel', 'Actividades'] },
    { id: 'pets', name: 'Mascotas', icon: '🐕', color: '#A3A3A3', type: 'expense', subcategories: ['Comida', 'Veterinario', 'Accesorios'] },
    { id: 'insurance', name: 'Seguros', icon: '🛡️', color: '#475569', type: 'expense', subcategories: ['Vida', 'Hogar', 'Coche', 'Salud'] },
    { id: 'taxes', name: 'Impuestos', icon: '📋', color: '#78716C', type: 'expense' },
    { id: 'donations', name: 'Donaciones', icon: '❤️', color: '#F87171', type: 'expense' },
    { id: 'other_expense', name: 'Otros Gastos', icon: '📦', color: '#64748B', type: 'expense' },
];

// EXPANDED INCOME CATEGORIES (10+)
export const DEFAULT_INCOME_CATEGORIES: Category[] = [
    { id: 'salary', name: 'Salario', icon: '💰', color: '#22C55E', type: 'income', subcategories: ['Base', 'Bonus', 'Comisiones'] },
    { id: 'extra_pay', name: 'Pagas Extra', icon: '💵', color: '#16A34A', type: 'income' },
    { id: 'freelance', name: 'Freelance', icon: '💻', color: '#3B82F6', type: 'income' },
    { id: 'business', name: 'Negocio', icon: '🏢', color: '#6366F1', type: 'income' },
    { id: 'investments', name: 'Inversiones', icon: '📈', color: '#8B5CF6', type: 'income', subcategories: ['Dividendos', 'Intereses', 'Cripto', 'Acciones'] },
    { id: 'rental', name: 'Alquileres', icon: '🏘️', color: '#14B8A6', type: 'income' },
    { id: 'refunds', name: 'Reembolsos', icon: '↩️', color: '#0EA5E9', type: 'income' },
    { id: 'sales', name: 'Ventas', icon: '🏷️', color: '#F59E0B', type: 'income', subcategories: ['Segunda mano', 'Productos', 'Servicios'] },
    { id: 'gifts_income', name: 'Regalos', icon: '🎁', color: '#EC4899', type: 'income' },
    { id: 'lottery', name: 'Premios/Lotería', icon: '🎰', color: '#FBBF24', type: 'income' },
    { id: 'pension', name: 'Pensión', icon: '👴', color: '#78716C', type: 'income' },
    { id: 'other_income', name: 'Otros Ingresos', icon: '💸', color: '#64748B', type: 'income' },
];

// Payment Method Labels
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    cash: 'Efectivo',
    debit: 'Tarjeta Débito',
    credit: 'Tarjeta Crédito',
    transfer: 'Transferencia',
    bizum: 'Bizum',
    paypal: 'PayPal',
    crypto: 'Criptomonedas',
    other: 'Otro',
};

// Budget Types
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly';

export interface Budget {
    id: string;
    userId: string;
    name: string;
    category: string;
    amount: number;
    spent: number;
    period: BudgetPeriod;
    startDate: Date;
    endDate: Date;
    alertThreshold: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface BudgetFormData {
    name: string;
    category: string;
    amount: number;
    period: BudgetPeriod;
    alertThreshold: number;
}

// Savings Goal Types
export type SavingsCategory = 'vacation' | 'emergency' | 'investment' | 'purchase' | 'retirement' | 'education' | 'wedding' | 'car' | 'home' | 'other';

export interface SavingsGoal {
    id: string;
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
    category: SavingsCategory;
    icon: string;
    color: string;
    contributions: SavingsContribution[];
    createdAt: Date;
    updatedAt: Date;
}

export interface SavingsContribution {
    id: string;
    amount: number;
    date: Date;
    note?: string;
}

export interface SavingsGoalFormData {
    name: string;
    targetAmount: number;
    deadline: string;
    category: SavingsCategory;
    icon: string;
    color: string;
}

// Financial Health Score
export interface FinancialHealthScore {
    overall: number; // 0-100
    savingsRate: number;
    budgetAdherence: number;
    emergencyFund: number;
    debtRatio: number;
    tips: string[];
}

// Smart Insight
export interface SmartInsight {
    id: string;
    type: 'tip' | 'warning' | 'achievement' | 'suggestion';
    title: string;
    message: string;
    icon: string;
    action?: string;
    actionLabel?: string;
}

// Dashboard Types
export interface DashboardSummary {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    incomeChange: number;
    expenseChange: number;
    topCategories: CategorySummary[];
}

export interface CategorySummary {
    category: string;
    amount: number;
    percentage: number;
    color: string;
    icon: string;
}

// Chart Data Types
export interface ChartDataPoint {
    name: string;
    value: number;
    color?: string;
}

export interface MonthlyData {
    month: string;
    income: number;
    expenses: number;
}

// Filter Types
export interface TransactionFilters {
    startDate?: Date;
    endDate?: Date;
    type?: TransactionType;
    categories?: string[];
    minAmount?: number;
    maxAmount?: number;
    searchTerm?: string;
    paymentMethods?: PaymentMethod[];
}

// Alert Types
export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface Alert {
    id: string;
    type: AlertType;
    title: string;
    message: string;
    budgetId?: string;
    read: boolean;
    createdAt: Date;
}

// Bill Reminder Types
export interface BillReminder {
    id: string;
    userId: string;
    name: string;
    amount: number;
    dueDay: number; // 1-31
    category: string;
    isPaid: boolean;
    lastPaidDate?: Date;
    createdAt: Date;
}

// Subscription Types
export type BillingCycle = 'monthly' | 'yearly';

export interface Subscription {
    id: string;
    userId: string;
    name: string;
    amount: number;
    billingCycle: BillingCycle;
    nextBillingDate: Date;
    category: string;
    logoUrl?: string;
    websiteUrl?: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface SubscriptionFormData {
    name: string;
    amount: number;
    billingCycle: BillingCycle;
    nextBillingDate: string;
    category: string;
    logoUrl?: string;
    websiteUrl?: string;
    description?: string;
}

// Fixed Expenses
export type FixedExpenseFrequency = 'monthly' | 'quarterly' | 'yearly';

export interface FixedExpense {
    id: string;
    userId: string;
    name: string;
    amount: number;
    frequency: FixedExpenseFrequency;
    nextDueDate: Date;
    category: string;
    provider?: string;
    notes?: string;
    isActive: boolean;
    autopay: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface FixedExpenseFormData {
    name: string;
    amount: number;
    frequency: FixedExpenseFrequency;
    nextDueDate: string;
    category: string;
    provider?: string;
    notes?: string;
    autopay: boolean;
    isActive?: boolean;
}

// Dashboard Types
export type WidgetSize = 'small' | 'medium' | 'large';

export interface DashboardSettings {
    visibleWidgets: string[];
    widgetOrder: string[];
    widgetSizes: Record<string, WidgetSize>;
    defaultAccountFilter: string | null;
}

// Account Transaction Summary
export interface AccountTransactionSummary {
    accountId: string;
    accountName: string;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
}

