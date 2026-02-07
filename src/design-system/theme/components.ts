/**
 * Reusable Component Styles
 * Based on the global theme system
 */

import { ViewStyle, TextStyle } from 'react-native';
import { colors } from './colors';
import { spacing, borderRadius, shadows } from './spacing';

export const componentStyles = {
    // Card Styles
    card: {
        base: {
            backgroundColor: colors.surface.glass,
            borderRadius: borderRadius.xl,
            padding: spacing['2xl'],
            borderWidth: 1,
            borderColor: colors.border.light,
            ...shadows.md,
        } as ViewStyle,

        elevated: {
            backgroundColor: colors.surface.glassDark,
            borderRadius: borderRadius.xl,
            padding: spacing['2xl'],
            borderWidth: 1,
            borderColor: colors.border.normal,
            ...shadows.lg,
        } as ViewStyle,

        flat: {
            backgroundColor: colors.surface.white,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border.light,
        } as ViewStyle,
    },

    // Input Field Styles
    input: {
        base: {
            backgroundColor: colors.surface.glassLight,
            borderWidth: 1,
            borderColor: colors.border.normal,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            fontSize: 16,
            color: colors.text.primary,
        } as ViewStyle & TextStyle,

        focused: {
            borderColor: colors.primary[500],
            borderWidth: 2,
        } as ViewStyle,

        error: {
            borderColor: colors.error.main,
            borderWidth: 2,
        } as ViewStyle,
    },

    // Button Styles
    button: {
        primary: {
            borderRadius: borderRadius.md,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing['2xl'],
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            ...shadows.md,
        } as ViewStyle,

        secondary: {
            borderRadius: borderRadius.md,
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing['2xl'],
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
            backgroundColor: colors.surface.glass,
            borderWidth: 1,
            borderColor: colors.border.normal,
        } as ViewStyle,

        text: {
            primary: {
                fontSize: 16,
                fontWeight: '700' as const,
                color: colors.text.inverse,
            } as TextStyle,

            secondary: {
                fontSize: 16,
                fontWeight: '600' as const,
                color: colors.text.primary,
            } as TextStyle,
        },
    },

    // Header Styles
    header: {
        title: {
            fontSize: 24,
            fontWeight: '800' as const,
            color: colors.text.primary,
        } as TextStyle,

        subtitle: {
            fontSize: 14,
            fontWeight: '500' as const,
            color: colors.text.secondary,
        } as TextStyle,
    },
};

export type ComponentStyles = typeof componentStyles;
