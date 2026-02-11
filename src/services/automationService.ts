// ===========================================
// Servicio de Automatización
// Reglas automáticas para ahorro e inversión
// ===========================================

import { getSavingsGoals, addContribution } from './savingsService';

// ==========================================
// TIPOS
// ==========================================

export type AutomationTrigger =
    | 'on_income'           // Al registrar un ingreso
    | 'on_expense'          // Al registrar un gasto
    | 'on_category_expense' // Al gastar en categoría específica
    | 'on_balance_threshold' // Cuando el balance supera umbral
    | 'scheduled';          // Programado (diario/semanal/mensual)

export type AutomationAction =
    | 'transfer_to_savings'  // Transferir a meta de ahorro
    | 'alert'               // Enviar alerta
    | 'add_tag';            // Añadir etiqueta

export interface AutomationRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    trigger: AutomationTrigger;
    triggerConfig: {
        category?: string;
        threshold?: number;
        percentage?: number;
        schedule?: 'daily' | 'weekly' | 'monthly';
    };
    action: AutomationAction;
    actionConfig: {
        targetGoalId?: string;
        amount?: number;
        percentage?: number;
        message?: string;
    };
    createdAt: Date;
    lastExecuted?: Date;
    executionCount: number;
}

// LocalStorage key
const RULES_KEY = 'financeflow_automation_rules';

// ==========================================
// GESTIÓN DE REGLAS
// ==========================================

export const getAutomationRules = (userId: string): AutomationRule[] => {
    const data = localStorage.getItem(`${RULES_KEY}_${userId}`);
    if (!data) return [];
    return JSON.parse(data).map((r: AutomationRule) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        lastExecuted: r.lastExecuted ? new Date(r.lastExecuted) : undefined
    }));
};

export const saveAutomationRules = (userId: string, rules: AutomationRule[]) => {
    localStorage.setItem(`${RULES_KEY}_${userId}`, JSON.stringify(rules));
};

export const createAutomationRule = (
    userId: string,
    rule: Omit<AutomationRule, 'id' | 'createdAt' | 'executionCount'>
): AutomationRule => {
    const rules = getAutomationRules(userId);

    const newRule: AutomationRule = {
        ...rule,
        id: `rule-${Date.now()}`,
        createdAt: new Date(),
        executionCount: 0
    };

    rules.push(newRule);
    saveAutomationRules(userId, rules);

    return newRule;
};

export const updateAutomationRule = (userId: string, ruleId: string, updates: Partial<AutomationRule>): void => {
    const rules = getAutomationRules(userId);
    const index = rules.findIndex(r => r.id === ruleId);

    if (index !== -1) {
        rules[index] = { ...rules[index], ...updates };
        saveAutomationRules(userId, rules);
    }
};

export const deleteAutomationRule = (userId: string, ruleId: string): void => {
    const rules = getAutomationRules(userId);
    const filtered = rules.filter(r => r.id !== ruleId);
    saveAutomationRules(userId, filtered);
};

export const toggleAutomationRule = (userId: string, ruleId: string): void => {
    const rules = getAutomationRules(userId);
    const rule = rules.find(r => r.id === ruleId);

    if (rule) {
        rule.enabled = !rule.enabled;
        saveAutomationRules(userId, rules);
    }
};

// ==========================================
// EJECUCIÓN DE REGLAS
// ==========================================

export interface ExecutionResult {
    ruleId: string;
    ruleName: string;
    success: boolean;
    message: string;
    amountTransferred?: number;
}

// Ejecuta reglas que coincidan con un trigger
export const executeRulesForTrigger = (
    userId: string,
    trigger: AutomationTrigger,
    context: {
        amount?: number;
        category?: string;
        currentBalance?: number;
    }
): ExecutionResult[] => {
    const rules = getAutomationRules(userId).filter(r => r.enabled && r.trigger === trigger);
    const results: ExecutionResult[] = [];

    rules.forEach(rule => {
        // Verificar condiciones específicas
        if (trigger === 'on_category_expense' && rule.triggerConfig.category !== context.category) {
            return;
        }

        if (trigger === 'on_balance_threshold' &&
            (context.currentBalance || 0) < (rule.triggerConfig.threshold || 0)) {
            return;
        }

        // Ejecutar acción
        const result = executeAction(userId, rule, context);
        results.push(result);

        // Actualizar estadísticas de la regla
        updateAutomationRule(userId, rule.id, {
            lastExecuted: new Date(),
            executionCount: rule.executionCount + 1
        });
    });

    return results;
};

const executeAction = (
    userId: string,
    rule: AutomationRule,
    context: { amount?: number }
): ExecutionResult => {
    switch (rule.action) {
        case 'transfer_to_savings': {
            if (!rule.actionConfig.targetGoalId) {
                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    success: false,
                    message: 'No hay meta de ahorro configurada'
                };
            }

            const goals = getSavingsGoals(userId);
            const goal = goals.find(g => g.id === rule.actionConfig.targetGoalId);

            if (!goal) {
                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    success: false,
                    message: 'Meta de ahorro no encontrada'
                };
            }

            // Calcular cantidad a transferir
            let transferAmount = rule.actionConfig.amount || 0;
            if (rule.actionConfig.percentage && context.amount) {
                transferAmount = context.amount * (rule.actionConfig.percentage / 100);
            }

            if (transferAmount <= 0) {
                return {
                    ruleId: rule.id,
                    ruleName: rule.name,
                    success: false,
                    message: 'Cantidad a transferir es 0'
                };
            }

            // Transferir a la meta
            addContribution(goal.id, transferAmount, `Automatico: ${rule.name}`);

            return {
                ruleId: rule.id,
                ruleName: rule.name,
                success: true,
                message: `Transferidos ${transferAmount.toFixed(2)}€ a "${goal.name}"`,
                amountTransferred: transferAmount
            };
        }

        case 'alert': {
            // En una app real, esto enviaría una notificación push
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                success: true,
                message: rule.actionConfig.message || 'Alerta enviada'
            };
        }

        default:
            return {
                ruleId: rule.id,
                ruleName: rule.name,
                success: false,
                message: 'Acción no implementada'
            };
    }
};

// ==========================================
// REGLAS PREDETERMINADAS
// ==========================================

export const createDefaultRules = (userId: string): void => {
    const existingRules = getAutomationRules(userId);
    if (existingRules.length > 0) return;

    const goals = getSavingsGoals(userId);
    const firstGoal = goals[0];

    if (firstGoal) {
        createAutomationRule(userId, {
            name: 'Ahorro automático 10%',
            description: 'Transfiere el 10% de cada ingreso a tu meta de ahorro',
            enabled: false, // El usuario debe activarla
            trigger: 'on_income',
            triggerConfig: { percentage: 10 },
            action: 'transfer_to_savings',
            actionConfig: {
                targetGoalId: firstGoal.id,
                percentage: 10
            }
        });
    }
};
