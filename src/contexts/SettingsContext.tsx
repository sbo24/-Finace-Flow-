// ===========================================
// Contexto de Configuración
// Gestiona tema, idioma y preferencias
// ===========================================

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from '../i18n';

// ==========================================
// TIPOS
// ==========================================

export type Theme = 'dark' | 'light' | 'midnight' | 'nature' | 'sunset';
export type { Language, TranslationKey };
export type Currency = 'EUR' | 'USD' | 'GBP' | 'MXN';

export interface AppSettings {
    theme: Theme;
    language: Language;
    currency: Currency;
    compactMode: boolean;
    showTips: boolean;
    animationsEnabled: boolean;
    weekStartDay: 'monday' | 'sunday';
    dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
}

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (updates: Partial<AppSettings>) => void;
    t: (key: TranslationKey) => string; // Translation function
}

const DEFAULT_SETTINGS: AppSettings = {
    theme: 'dark',
    language: 'es',
    currency: 'EUR',
    compactMode: false,
    showTips: true,
    animationsEnabled: true,
    weekStartDay: 'monday',
    dateFormat: 'dd/mm/yyyy'
};

const SETTINGS_KEY = 'financeflow_settings';

// ==========================================
// CONTEXTO
// ==========================================


const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(() => {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
        return DEFAULT_SETTINGS;
    });

    // Aplicar tema al documento
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', settings.theme);

        // Aplicar clase de animaciones
        if (!settings.animationsEnabled) {
            document.documentElement.classList.add('no-animations');
        } else {
            document.documentElement.classList.remove('no-animations');
        }

        // Modo compacto
        if (settings.compactMode) {
            document.documentElement.classList.add('compact-mode');
        } else {
            document.documentElement.classList.remove('compact-mode');
        }
    }, [settings.theme, settings.animationsEnabled, settings.compactMode]);

    // Guardar en localStorage
    useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (updates: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    };

    // Función de traducción
    const t = (key: TranslationKey): string => {
        return translations[settings.language][key] || translations['es'][key] || key;
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, t }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
}

// Formato de moneda
export function formatCurrency(amount: number, currency: Currency = 'EUR'): string {
    const locales: Record<Currency, string> = {
        EUR: 'es-ES',
        USD: 'en-US',
        GBP: 'en-GB',
        MXN: 'es-MX'
    };

    return new Intl.NumberFormat(locales[currency], {
        style: 'currency',
        currency
    }).format(amount);
}
