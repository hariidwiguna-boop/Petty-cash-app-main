/**
 * Global Color Palette - evrdayplcs. Brand Theme
 * Red Glass | White Glass Design System (No Black)
 */

export const colors = {
    // Brand Colors
    brand: {
        red: '#DC2626',
        redLight: '#EF4444',
        redDark: '#B91C1C',
        redGradientStart: '#DC2626',
        redGradientEnd: '#991B1B',
        white: '#FFFFFF',
        whiteSoft: '#F8FAFC',
        whiteWarm: '#FEF2F2',
        gray: '#64748B',
        grayLight: '#94A3B8',
    },

    // Primary (Red accent)
    primary: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#DC2626', // Main Red
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
    },

    // Background (White/Light)
    background: {
        start: '#F8FAFC',     // Soft White
        end: '#FFFFFF',       // Pure White
        alternative: {
            start: '#FEF2F2', // Light Red Tint
            end: '#FFFFFF',
        },
        redGradient: {
            start: '#DC2626', // Red header
            end: '#991B1B',   // Dark Red
        },
    },

    // Glass Surface Colors
    surface: {
        white: '#FFFFFF',
        whiteGlass: 'rgba(255, 255, 255, 0.95)',
        whiteGlassLight: 'rgba(255, 255, 255, 0.85)',
        whiteGlassMedium: 'rgba(255, 255, 255, 0.75)',
        redGlass: 'rgba(220, 38, 38, 0.08)',
        redGlassMedium: 'rgba(220, 38, 38, 0.12)',
        redGlassStrong: 'rgba(220, 38, 38, 0.18)',
    },

    // Text Colors
    text: {
        primary: '#1E293B',       // Dark Slate
        secondary: '#64748B',     // Gray
        tertiary: '#94A3B8',      // Light Gray
        inverse: '#FFFFFF',       // White (for red backgrounds)
        accent: '#DC2626',        // Red
        link: '#DC2626',          // Red
    },

    // Semantic Colors
    success: {
        light: '#d1fae5',
        main: '#10b981',
        dark: '#059669',
    },
    error: {
        light: '#fee2e2',
        main: '#DC2626',
        dark: '#B91C1C',
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
        light: 'rgba(0, 0, 0, 0.05)',
        normal: 'rgba(0, 0, 0, 0.08)',
        strong: 'rgba(0, 0, 0, 0.12)',
        red: 'rgba(220, 38, 38, 0.2)',
        redStrong: 'rgba(220, 38, 38, 0.35)',
    },

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.3)',
    overlayRed: 'rgba(220, 38, 38, 0.1)',
};

export type Colors = typeof colors;


