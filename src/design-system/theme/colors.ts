/**
 * Global Color Palette - Light Theme
 * Modern, soft colors with excellent readability
 */

export const colors = {
    // Primary Brand Colors
    primary: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#10b981', // Main emerald
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
    },

    // Background Gradients (Light but Vibrant)
    background: {
        start: '#c7d2fe',    // Vibrant indigo
        end: '#bfdbfe',      // Vibrant sky blue
        alternative: {
            start: '#fef3c7', // Soft amber
            end: '#fce7f3',   // Soft pink
        },
    },

    // Surface Colors (Cards, Modals)
    surface: {
        white: '#ffffff',
        glass: 'rgba(255, 255, 255, 0.85)',
        glassLight: 'rgba(255, 255, 255, 0.65)',
        glassDark: 'rgba(255, 255, 255, 0.95)',
    },

    // Text Colors
    text: {
        primary: '#1f2937',     // Dark gray
        secondary: '#6b7280',   // Medium gray
        tertiary: '#9ca3af',    // Light gray
        inverse: '#ffffff',     // White (for dark backgrounds)
        link: '#3b82f6',        // Blue
    },

    // Semantic Colors
    success: {
        light: '#d1fae5',
        main: '#10b981',
        dark: '#059669',
    },
    error: {
        light: '#fee2e2',
        main: '#ef4444',
        dark: '#dc2626',
    },
    warning: {
        light: '#fef3c7',
        main: '#f59e0b',
        dark: '#d97706',
    },
    info: {
        light: '#dbeafe',
        main: '#3b82f6',
        dark: '#2563eb',
    },

    // Border Colors
    border: {
        light: 'rgba(0, 0, 0, 0.06)',
        normal: 'rgba(0, 0, 0, 0.1)',
        strong: 'rgba(0, 0, 0, 0.15)',
    },

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.3)',
};

export type Colors = typeof colors;
