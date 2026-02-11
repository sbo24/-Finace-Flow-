// ===========================================
// Componente Tip del Día
// Muestra un consejo financiero diario
// ===========================================

import { useState, useEffect } from 'react';
import { getTipOfTheDay, getRandomTip, type FinancialTip } from '../data/tips';
import { Lightbulb, RefreshCw, X } from 'lucide-react';

interface TipOfTheDayProps {
    dismissible?: boolean;
    showRefresh?: boolean;
}

export default function TipOfTheDay({ dismissible = true, showRefresh = true }: TipOfTheDayProps) {
    const [tip, setTip] = useState<FinancialTip | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        setTip(getTipOfTheDay());
    }, []);

    const handleRefresh = () => {
        setTip(getRandomTip());
    };

    if (dismissed || !tip) return null;

    const categoryColors: Record<string, string> = {
        ahorro: 'var(--success)',
        inversion: 'var(--info)',
        gastos: 'var(--warning)',
        habitos: 'var(--accent)',
        deudas: 'var(--danger)'
    };

    const categoryLabels: Record<string, string> = {
        ahorro: 'Ahorro',
        inversion: 'Inversión',
        gastos: 'Gastos',
        habitos: 'Hábitos',
        deudas: 'Deudas'
    };

    return (
        <div
            className="glass-card p-4 border-l-4 relative"
            style={{ borderLeftColor: categoryColors[tip.category] }}
        >
            <div className="flex items-start gap-3">
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${categoryColors[tip.category]}20` }}
                >
                    {tip.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Lightbulb className="w-4 h-4 text-[var(--warning)]" />
                        <span
                            className="text-xs font-semibold uppercase"
                            style={{ color: categoryColors[tip.category] }}
                        >
                            {categoryLabels[tip.category]}
                        </span>
                    </div>
                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                        {tip.title}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                        {tip.content}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {showRefresh && (
                        <button
                            onClick={handleRefresh}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                            title="Otro tip"
                        >
                            <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" />
                        </button>
                    )}
                    {dismissible && (
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                            title="Cerrar"
                        >
                            <X className="w-4 h-4 text-[var(--text-muted)]" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
