// ===========================================
// Servicio de Gamificación - Pa' que mole ahorrar
// Badges, retos y niveles pa' motivarte
// ===========================================

import { getTransactions, getTransactionSummary } from './transactionService';
import { getSavingsGoals } from './savingsService';

// ==========================================
// TIPOS
// ==========================================

export type BadgeId =
    | 'first_savings'      // Primera meta de ahorro creada
    | 'savings_streak_7'   // 7 días seguidos ahorrando
    | 'savings_streak_30'  // 30 días seguidos ahorrando
    | 'budget_master'      // No superar presupuesto en un mes
    | 'frugal_week'        // Semana sin gastos extra
    | 'goal_crusher'       // Completar una meta de ahorro
    | 'investor'           // Primer ingreso por inversiones
    | 'saver_100'          // Ahorrar 100€
    | 'saver_500'          // Ahorrar 500€
    | 'saver_1000'         // Ahorrar 1000€
    | 'transaction_tracker' // 50 transacciones registradas
    | 'consistent'         // 30 días usando la app
    | 'early_bird'         // Registrar gasto antes de las 9am
    | 'category_master';   // Usar todas las categorías

export interface Badge {
    id: BadgeId;
    name: string;
    description: string;
    icon: string;
    color: string;
    unlockedAt?: Date;
    progress?: number; // 0-100
    requirement?: number;
}

export interface Challenge {
    id: string;
    name: string;
    description: string;
    icon: string;
    type: 'savings' | 'spending' | 'streak';
    goal: number;
    current: number;
    unit: string;
    startDate: Date;
    endDate: Date;
    reward: BadgeId;
    completed: boolean;
}

export interface UserLevel {
    level: number;
    name: string;
    xp: number;
    xpToNext: number;
    icon: string;
}

// ==========================================
// DEFINICIÓN DE BADGES
// ==========================================

export const BADGES: Record<BadgeId, Omit<Badge, 'unlockedAt' | 'progress'>> = {
    first_savings: {
        id: 'first_savings',
        name: 'Primer Paso',
        description: 'Creaste tu primera meta de ahorro',
        icon: '🌱',
        color: '#22C55E'
    },
    savings_streak_7: {
        id: 'savings_streak_7',
        name: 'Racha Semanal',
        description: '7 días seguidos ahorrando',
        icon: '🔥',
        color: '#F59E0B',
        requirement: 7
    },
    savings_streak_30: {
        id: 'savings_streak_30',
        name: 'Racha Mensual',
        description: '30 días seguidos ahorrando',
        icon: '💪',
        color: '#EF4444',
        requirement: 30
    },
    budget_master: {
        id: 'budget_master',
        name: 'Maestro del Presupuesto',
        description: 'No superaste el presupuesto en un mes',
        icon: '🎯',
        color: '#8B5CF6'
    },
    frugal_week: {
        id: 'frugal_week',
        name: 'Semana Frugal',
        description: 'Una semana sin gastos innecesarios',
        icon: '🧘',
        color: '#06B6D4'
    },
    goal_crusher: {
        id: 'goal_crusher',
        name: 'Aplasta Metas',
        description: 'Completaste una meta de ahorro',
        icon: '🏆',
        color: '#FBBF24'
    },
    investor: {
        id: 'investor',
        name: 'Inversor',
        description: 'Primer ingreso por inversiones',
        icon: '📈',
        color: '#10B981'
    },
    saver_100: {
        id: 'saver_100',
        name: 'Centenario',
        description: 'Ahorraste 100€ en total',
        icon: '💯',
        color: '#3B82F6',
        requirement: 100
    },
    saver_500: {
        id: 'saver_500',
        name: 'Medio K',
        description: 'Ahorraste 500€ en total',
        icon: '🌟',
        color: '#6366F1',
        requirement: 500
    },
    saver_1000: {
        id: 'saver_1000',
        name: 'Ahorrador Pro',
        description: 'Ahorraste 1000€ en total',
        icon: '👑',
        color: '#EC4899',
        requirement: 1000
    },
    transaction_tracker: {
        id: 'transaction_tracker',
        name: 'Registrador',
        description: '50 transacciones registradas',
        icon: '📝',
        color: '#14B8A6',
        requirement: 50
    },
    consistent: {
        id: 'consistent',
        name: 'Constante',
        description: '30 días usando la app',
        icon: '📆',
        color: '#64748B',
        requirement: 30
    },
    early_bird: {
        id: 'early_bird',
        name: 'Madrugador',
        description: 'Registraste un gasto antes de las 9am',
        icon: '🐦',
        color: '#F97316'
    },
    category_master: {
        id: 'category_master',
        name: 'Maestro de Categorías',
        description: 'Usaste al menos 10 categorías diferentes',
        icon: '🎨',
        color: '#A855F7',
        requirement: 10
    }
};

// ==========================================
// NIVELES
// ==========================================

const LEVELS: UserLevel[] = [
    { level: 1, name: 'Novato', xp: 0, xpToNext: 100, icon: '🌱' },
    { level: 2, name: 'Aprendiz', xp: 100, xpToNext: 250, icon: '📚' },
    { level: 3, name: 'Explorador', xp: 350, xpToNext: 500, icon: '🧭' },
    { level: 4, name: 'Ahorrador', xp: 850, xpToNext: 750, icon: '💰' },
    { level: 5, name: 'Experto', xp: 1600, xpToNext: 1000, icon: '🎓' },
    { level: 6, name: 'Maestro', xp: 2600, xpToNext: 1500, icon: '🏅' },
    { level: 7, name: 'Gurú', xp: 4100, xpToNext: 2000, icon: '🧙' },
    { level: 8, name: 'Leyenda', xp: 6100, xpToNext: 3000, icon: '👑' },
    { level: 9, name: 'Millonario', xp: 9100, xpToNext: 5000, icon: '💎' },
    { level: 10, name: 'GOAT', xp: 14100, xpToNext: 0, icon: '🐐' }
];

// LocalStorage keys
const BADGES_KEY = 'financeflow_badges';
const XP_KEY = 'financeflow_xp';
const CHALLENGES_KEY = 'financeflow_challenges';

// ==========================================
// FUNCIONES
// ==========================================

// Obtener badges desbloqueados del usuario
export const getUserBadges = (userId: string): Badge[] => {
    const data = localStorage.getItem(`${BADGES_KEY}_${userId}`);
    if (!data) return [];
    return JSON.parse(data);
};

// Guardar badges
const saveBadges = (userId: string, badges: Badge[]) => {
    localStorage.setItem(`${BADGES_KEY}_${userId}`, JSON.stringify(badges));
};

// Desbloquear un badge
export const unlockBadge = (userId: string, badgeId: BadgeId): boolean => {
    const currentBadges = getUserBadges(userId);

    // Si ya lo tiene, no hacer nada
    if (currentBadges.some(b => b.id === badgeId)) {
        return false;
    }

    const badgeTemplate = BADGES[badgeId];
    const newBadge: Badge = {
        ...badgeTemplate,
        unlockedAt: new Date(),
        progress: 100
    };

    currentBadges.push(newBadge);
    saveBadges(userId, currentBadges);

    // Dar XP por el badge
    addXP(userId, 50);

    return true;
};

// Obtener XP del usuario
export const getUserXP = (userId: string): number => {
    const data = localStorage.getItem(`${XP_KEY}_${userId}`);
    return data ? parseInt(data, 10) : 0;
};

// Añadir XP
export const addXP = (userId: string, amount: number): void => {
    const currentXP = getUserXP(userId);
    localStorage.setItem(`${XP_KEY}_${userId}`, String(currentXP + amount));
};

// Calcular nivel del usuario
export const getUserLevel = (userId: string): UserLevel => {
    const xp = getUserXP(userId);

    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].xp) {
            return {
                ...LEVELS[i],
                xp: xp,
                xpToNext: i < LEVELS.length - 1
                    ? LEVELS[i + 1].xp - xp
                    : 0
            };
        }
    }

    return LEVELS[0];
};

// Verificar y desbloquear badges según actividad
export const checkAndUnlockBadges = (userId: string): BadgeId[] => {
    const unlocked: BadgeId[] = [];

    // Verificar metas de ahorro
    const savingsGoals = getSavingsGoals(userId);
    if (savingsGoals.length > 0) {
        if (unlockBadge(userId, 'first_savings')) unlocked.push('first_savings');
    }

    // Verificar metas completadas
    const completedGoals = savingsGoals.filter(g => g.currentAmount >= g.targetAmount);
    if (completedGoals.length > 0) {
        if (unlockBadge(userId, 'goal_crusher')) unlocked.push('goal_crusher');
    }

    // Verificar total ahorrado
    const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    if (totalSaved >= 100 && unlockBadge(userId, 'saver_100')) unlocked.push('saver_100');
    if (totalSaved >= 500 && unlockBadge(userId, 'saver_500')) unlocked.push('saver_500');
    if (totalSaved >= 1000 && unlockBadge(userId, 'saver_1000')) unlocked.push('saver_1000');

    // Verificar transacciones
    const transactions = getTransactions(userId);
    if (transactions.length >= 50) {
        if (unlockBadge(userId, 'transaction_tracker')) unlocked.push('transaction_tracker');
    }

    // Verificar categorías únicas
    const uniqueCategories = new Set(transactions.map(t => t.category));
    if (uniqueCategories.size >= 10) {
        if (unlockBadge(userId, 'category_master')) unlocked.push('category_master');
    }

    // Verificar ingresos por inversiones
    const investmentIncome = transactions.filter(t => t.type === 'income' && t.category === 'investments');
    if (investmentIncome.length > 0) {
        if (unlockBadge(userId, 'investor')) unlocked.push('investor');
    }

    return unlocked;
};

// Obtener todos los badges con progreso
export const getAllBadgesWithProgress = (userId: string): Badge[] => {
    const unlockedBadges = getUserBadges(userId);
    const unlockedIds = new Set(unlockedBadges.map(b => b.id));

    // Calcular progreso para badges no desbloqueados
    const savingsGoals = getSavingsGoals(userId);
    const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const transactions = getTransactions(userId);
    const uniqueCategories = new Set(transactions.map(t => t.category));

    return Object.values(BADGES).map(badge => {
        if (unlockedIds.has(badge.id)) {
            return unlockedBadges.find(b => b.id === badge.id)!;
        }

        // Calcular progreso
        let progress = 0;
        switch (badge.id) {
            case 'saver_100':
                progress = Math.min(100, (totalSaved / 100) * 100);
                break;
            case 'saver_500':
                progress = Math.min(100, (totalSaved / 500) * 100);
                break;
            case 'saver_1000':
                progress = Math.min(100, (totalSaved / 1000) * 100);
                break;
            case 'transaction_tracker':
                progress = Math.min(100, (transactions.length / 50) * 100);
                break;
            case 'category_master':
                progress = Math.min(100, (uniqueCategories.size / 10) * 100);
                break;
            default:
                progress = 0;
        }

        return { ...badge, progress };
    });
};

// Obtener retos activos
export const getActiveChallenges = (userId: string): Challenge[] => {
    const data = localStorage.getItem(`${CHALLENGES_KEY}_${userId}`);
    if (!data) {
        // Crear retos iniciales
        return generateWeeklyChallenges(userId);
    }

    const challenges: Challenge[] = JSON.parse(data);
    const now = new Date();

    // Filtrar retos expirados y generar nuevos si es necesario
    const activeOnes = challenges.filter(c => new Date(c.endDate) > now);

    if (activeOnes.length === 0) {
        return generateWeeklyChallenges(userId);
    }

    return activeOnes;
};

// Generar retos semanales
const generateWeeklyChallenges = (userId: string): Challenge[] => {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const summary = getTransactionSummary(userId,
        new Date(now.getFullYear(), now.getMonth(), 1),
        now
    );

    // Reto basado en promedio de gastos
    const avgDailyExpense = summary.totalExpenses / now.getDate();
    const savingsTarget = Math.round(avgDailyExpense * 0.1 * 7); // 10% semanal

    const challenges: Challenge[] = [
        {
            id: `weekly-savings-${now.getTime()}`,
            name: 'Reto de Ahorro Semanal',
            description: `Ahorra ${savingsTarget}€ esta semana`,
            icon: '🎯',
            type: 'savings',
            goal: savingsTarget,
            current: 0,
            unit: '€',
            startDate: now,
            endDate: endOfWeek,
            reward: 'frugal_week',
            completed: false
        },
        {
            id: `no-delivery-${now.getTime()}`,
            name: 'Sin Delivery',
            description: 'Una semana sin pedir comida a domicilio',
            icon: '🏠',
            type: 'spending',
            goal: 0,
            current: 0,
            unit: 'pedidos',
            startDate: now,
            endDate: endOfWeek,
            reward: 'frugal_week',
            completed: false
        }
    ];

    saveChallenges(userId, challenges);
    return challenges;
};

// Guardar retos
const saveChallenges = (userId: string, challenges: Challenge[]) => {
    localStorage.setItem(`${CHALLENGES_KEY}_${userId}`, JSON.stringify(challenges));
};

// Actualizar progreso de reto
export const updateChallengeProgress = (
    userId: string,
    challengeId: string,
    newProgress: number
): Challenge | null => {
    const challenges = getActiveChallenges(userId);
    const index = challenges.findIndex(c => c.id === challengeId);

    if (index === -1) return null;

    challenges[index].current = newProgress;

    if (newProgress >= challenges[index].goal && !challenges[index].completed) {
        challenges[index].completed = true;
        unlockBadge(userId, challenges[index].reward);
        addXP(userId, 100);
    }

    saveChallenges(userId, challenges);
    return challenges[index];
};
