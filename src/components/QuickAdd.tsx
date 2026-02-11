// ===========================================
// Componente QuickAdd - Añadir transacción rápida
// Botón flotante pa' meter gastos en 2 taps
// ===========================================

import { useState } from 'react';
import { Plus, X, ShoppingCart, Coffee, Car, Home, Utensils, Smartphone, DollarSign, Briefcase, Gift, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import CustomDatePicker from './common/CustomDatePicker';
import { useAuth } from '../contexts/AuthContext';
import { createTransaction } from '../services/transactionService';
import type { TransactionFormData } from '../types';

interface QuickExpense {
    icon: React.ReactNode;
    name: string;
    category: string;
    defaultAmount?: number;
}

const QUICK_EXPENSES: QuickExpense[] = [
    { icon: <Coffee className="w-5 h-5" />, name: 'Café', category: 'restaurants', defaultAmount: 3 },
    { icon: <Utensils className="w-5 h-5" />, name: 'Comida', category: 'restaurants', defaultAmount: 12 },
    { icon: <ShoppingCart className="w-5 h-5" />, name: 'Super', category: 'groceries', defaultAmount: 30 },
    { icon: <Car className="w-5 h-5" />, name: 'Gasolina', category: 'fuel', defaultAmount: 50 },
    { icon: <Smartphone className="w-5 h-5" />, name: 'Suscripción', category: 'streaming', defaultAmount: 15 },
    { icon: <Home className="w-5 h-5" />, name: 'Hogar', category: 'utilities', defaultAmount: 0 },
];

const QUICK_INCOMES: QuickExpense[] = [
    { icon: <DollarSign className="w-5 h-5" />, name: 'Salario', category: 'salary', defaultAmount: 0 },
    { icon: <Briefcase className="w-5 h-5" />, name: 'Freelance', category: 'freelance', defaultAmount: 0 },
    { icon: <Gift className="w-5 h-5" />, name: 'Regalo', category: 'gifts_income', defaultAmount: 0 },
    { icon: <TrendingUp className="w-5 h-5" />, name: 'Inversión', category: 'investments', defaultAmount: 0 },
    { icon: <ShoppingCart className="w-5 h-5" />, name: 'Venta', category: 'sales', defaultAmount: 0 },
    { icon: <Plus className="w-5 h-5" />, name: 'Otro', category: 'other_income', defaultAmount: 0 },
];

export default function QuickAdd() {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [showAmountInput, setShowAmountInput] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<QuickExpense | null>(null);
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleQuickSelect = (expense: QuickExpense) => {
        setSelectedExpense(expense);
        if (expense.defaultAmount && expense.defaultAmount > 0) {
            setAmount(expense.defaultAmount.toString());
        }
        setShowAmountInput(true);
    };

    const handleSave = async () => {
        if (!currentUser || !selectedExpense || !amount) return;

        setSaving(true);
        try {
            const data: TransactionFormData = {
                accountId: '', // Will be auto-populated with default account
                type: type,
                amount: parseFloat(amount),
                category: selectedExpense.category,
                description: selectedExpense.name,
                date: date,
                paymentMethod: type === 'income' ? 'transfer' : 'debit',
                tags: ['quick-add']
            };

            createTransaction(currentUser.id, data);

            // Mostrar feedback
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setIsOpen(false);
                setShowAmountInput(false);
                setSelectedExpense(null);
                setAmount('');
                setDate(new Date().toISOString().split('T')[0]);
            }, 1500);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setShowAmountInput(false);
        setSelectedExpense(null);
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setType('expense');
    };

    return (
        <>
            {/* Botón flotante */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 lg:bottom-6 w-14 h-14 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 z-[110] flex items-center justify-center"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={handleClose}
                    ></div>

                    {/* Panel */}
                    <div className="relative w-full max-w-sm glass-card p-6 animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                {type === 'expense' ? 'Gasto Rápido' : 'Ingreso Rápido'}
                            </h3>
                            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
                                <X className="w-5 h-5 text-[var(--text-muted)]" />
                            </button>
                        </div>

                        {/* Type Toggle */}
                        {!showAmountInput && !showSuccess && (
                            <div className="flex gap-1 p-1 bg-[var(--bg-tertiary)] rounded-xl mb-6">
                                <button
                                    onClick={() => setType('expense')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${type === 'expense'
                                        ? 'bg-[var(--danger)] text-white shadow-md'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    <ArrowDownRight className="w-4 h-4" />
                                    Gasto
                                </button>
                                <button
                                    onClick={() => setType('income')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${type === 'income'
                                        ? 'bg-[var(--success)] text-white shadow-md'
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    <ArrowUpRight className="w-4 h-4" />
                                    Ingreso
                                </button>
                            </div>
                        )}

                        {showSuccess ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
                                    <span className="text-3xl">✓</span>
                                </div>
                                <p className="text-lg font-medium text-[var(--success)]">
                                    ¡Guardado!
                                </p>
                            </div>
                        ) : showAmountInput && selectedExpense ? (
                            /* Input de cantidad */
                            <div className="space-y-4">
                                <div className="text-center">
                                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${type === 'income' ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--danger)]/20 text-[var(--danger)]'}`}>
                                        {selectedExpense.icon}
                                    </div>
                                    <p className="font-medium text-[var(--text-primary)]">
                                        {selectedExpense.name}
                                    </p>
                                </div>

                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-[var(--text-muted)]">€</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="input text-center text-3xl font-bold py-4 pl-12"
                                        placeholder="0"
                                        autoFocus
                                    />
                                </div>

                                <CustomDatePicker
                                    value={date}
                                    onChange={(newDate) => setDate(newDate)}
                                />

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowAmountInput(false)}
                                        className="btn btn-secondary flex-1"
                                    >
                                        Atrás
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={!amount || saving}
                                        className={`btn flex-1 ${type === 'income' ? 'bg-[var(--success)] hover:bg-[var(--success)]/80 text-white' : 'btn-primary'}`}
                                    >
                                        {saving ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Grid de opciones rápidas */
                            <div className="grid grid-cols-3 gap-3">
                                {(type === 'expense' ? QUICK_EXPENSES : QUICK_INCOMES).map((expense, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleQuickSelect(expense)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--border)] transition-all ${type === 'income'
                                            ? 'hover:border-[var(--success)] hover:bg-[var(--success)]/5'
                                            : 'hover:border-[var(--danger)] hover:bg-[var(--danger)]/5'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'income' ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'}`}>
                                            {expense.icon}
                                        </div>
                                        <span className="text-sm font-medium text-[var(--text-primary)]">
                                            {expense.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
