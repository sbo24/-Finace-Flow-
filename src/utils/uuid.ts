/**
 * Generates a unique UUID.
 * Uses crypto.randomUUID() if available (secure contexts).
 * Falls back to a manual implementation for non-secure contexts (HTTP via IP).
 */
export const generateId = (): string => {
    // Check if crypto.randomUUID is available
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // Fallback for non-secure contexts (HTTP)
    // Simple implementation of UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
