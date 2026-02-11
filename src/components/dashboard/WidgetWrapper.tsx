import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Eye, EyeOff, LayoutGrid } from 'lucide-react';
import type { ReactNode } from 'react';
import type { WidgetSize } from '../../types';

interface WidgetWrapperProps {
    widgetId: string;
    children: ReactNode;
    isVisible: boolean;
    isEditMode: boolean;
    size: WidgetSize;
    className?: string;
    onMove: (id: string, direction: 'up' | 'down') => void;
    onToggleVisibility: (id: string) => void;
    onResize: (id: string) => void;
}

export default function WidgetWrapper({
    widgetId,
    children,
    isVisible,
    isEditMode,
    size,
    className = '',
    onMove,
    onToggleVisibility,
    onResize
}: WidgetWrapperProps) {
    if (!isVisible && !isEditMode) return null;

    const editControls = isEditMode && (
        <div className="absolute top-2 right-2 z-20 flex gap-1">
            <button
                onClick={(e) => { e.stopPropagation(); onResize(widgetId); }}
                className="p-1 px-1.5 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--primary)] text-[var(--text-muted)] hover:text-white transition-colors"
                title="Cambiar tamaño"
            >
                <LayoutGrid className="w-4 h-4" />
            </button>
            <button
                onClick={() => onMove(widgetId, 'up')}
                className="p-1 px-1.5 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--primary)] text-[var(--text-muted)] hover:text-white transition-colors"
                title="Mover arriba"
            >
                <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => onMove(widgetId, 'down')}
                className="p-1 px-1.5 rounded bg-[var(--bg-tertiary)] hover:bg-[var(--primary)] text-[var(--text-muted)] hover:text-white transition-colors"
                title="Mover abajo"
            >
                <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => onToggleVisibility(widgetId)}
                className={`p-1 px-1.5 rounded transition-colors ${isVisible ? 'bg-[var(--bg-tertiary)] hover:bg-[var(--danger)] text-[var(--text-muted)]' : 'bg-[var(--primary)] text-white'}`}
                title={isVisible ? 'Ocultar widget' : 'Mostrar widget'}
            >
                {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
        </div>
    );

    const sizeClasses = {
        small: 'col-span-1',
        medium: 'col-span-1 md:col-span-2',
        large: 'col-span-1 md:col-span-2 lg:col-span-3'
    };

    const wrapperClass = `relative ${!isVisible ? 'opacity-40 grayscale-[0.5]' : ''} ${isEditMode ? 'ring-2 ring-dashed ring-[var(--border)] rounded-2xl p-1' : ''} ${sizeClasses[size]} ${className}`;

    return (
        <motion.div layout id={`widget-${widgetId}`} className={wrapperClass}>
            {editControls}
            {children}
        </motion.div>
    );
}
