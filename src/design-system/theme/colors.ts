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

    // Background (Executive Dark Slate)
    background: {
        start: '#0F172A',      // Slate-900 (Deep)
        end: '#020617',        // Slate-950 (Absolute depth)
        alternative: {
            start: '#1E293B',  // Slate-800
            end: '#0F172A',
        },
        redGradient: {
            start: '#DC2626', // Brand Red
            end: '#7F1D1D',   // Dark Maroon
        },
    },

    // Glass Surface Colors (Executive Glass 2.0)
    surface: {
        white: '#FFFFFF',
        whiteGlass: 'rgba(255, 255, 255, 0.08)',
        whiteGlassLight: 'rgba(255, 255, 255, 0.04)',
        whiteGlassMedium: 'rgba(255, 255, 255, 0.12)',
        redGlass: 'rgba(220, 38, 38, 0.15)',
        redGlassMedium: 'rgba(220, 38, 38, 0.25)',
        redGlassStrong: 'rgba(220, 38, 38, 0.4)',
    },

    // Text Colors (Premium Contrast)
    text: {
        primary: '#F8FAFC',       // Slate-50 (Near White)
        secondary: '#94A3B8',     // Slate-400 (Gray)
        tertiary: '#64748B',      // Slate-500
        inverse: '#FFFFFF',       // Full White
        accent: '#FF3131',        // Neon Red Accent
        link: '#dc2626',          // Red
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


