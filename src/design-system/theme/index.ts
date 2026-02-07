/**
 * Central Theme Export
 * Import this file to access all theme tokens
 */

export * from './colors';
export * from './spacing';
export * from './components';

import { colors } from './colors';
import { spacing, borderRadius, typography, shadows } from './spacing';
import { componentStyles } from './components';

export const theme = {
    colors,
    spacing,
    borderRadius,
    typography,
    shadows,
    components: componentStyles,
};

export type Theme = typeof theme;
