/**
 * Global Color Palette - evrdayplcs. Brand Theme
 * Red Glass | White Glass Design System (No Black)
 */

export const colors = {
    // Brand Colors (Mockup 100% Fidelity)
    brand: {
        red: '#FF0000',           // Pure Vibrant Red
        redDeep: '#D00000',       // Button Shadow/Shadow Red
        redSoft: '#FF3131',       // Light Red Accent
        blue: '#2563EB',          // Saldo Blue
        green: '#22C55E',         // Success/Masuk Green
        white: '#FFFFFF',
        black: '#000000',
        gray: '#475569',
        grayLight: '#94A3B8',
        grayGlass: 'rgba(0, 0, 0, 0.4)', // Login Input Glass
    },

    // Gradient Master
    gradients: {
        background: ['#FF0000', '#FFFFFF'], // Vertical Red to White
        submitButton: ['#FF0000', '#D00000'],
        cancelButton: ['#9A9A9A', '#7A7A7A'],
        green: ['#22C55E', '#166534'],
    },

    // UI Surface Levels
    surface: {
        glassLight: 'rgba(255, 255, 255, 0.7)',
        glassMedium: 'rgba(255, 255, 255, 0.4)',
        glassDark: 'rgba(0, 0, 0, 0.4)',
        border: 'rgba(255, 255, 255, 0.5)',
    },

    // Text Colors
    text: {
        primary: '#000000',
        secondary: '#475569',
        inverse: '#FFFFFF',
        brand: '#FF0000',
        blue: '#2563EB',
        green: '#22C55E',
        red: '#EF4444',
    },
};

export type Colors = typeof colors;


