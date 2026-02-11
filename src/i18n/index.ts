import { es } from './es';
import { en } from './en';
import { fr } from './fr';

export type TranslationKey = keyof typeof es;

export const translations: Record<string, Record<TranslationKey, string>> = {
    es,
    en,
    fr,
};

export type Language = 'es' | 'en' | 'fr';
