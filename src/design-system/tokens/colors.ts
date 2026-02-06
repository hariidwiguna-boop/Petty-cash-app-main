import { Platform } from 'react-native';

// Ultra-premium transparent color palette
export const transparentPalette = {
  // Glass surface colors
  background: {
    ultra: 'rgba(255, 255, 255, 0.05)',      // Almost invisible
    subtle: 'rgba(255, 255, 255, 0.08)',      // Very subtle
    light: 'rgba(255, 255, 255, 0.10)',       // Light glass
    medium: 'rgba(255, 255, 255, 0.12)',      // Medium glass
    prominent: 'rgba(255, 255, 255, 0.15)',    // Prominent
    visible: 'rgba(255, 255, 255, 0.18)',     // Clearly visible
    solid: 'rgba(255, 255, 255, 0.25)',       // Solid-ish
  },
  
  // Glass opacity levels
  glass: {
    minimal: 'rgba(255, 255, 255, 0.08)',      // Minimal glass
    light: 'rgba(255, 255, 255, 0.12)',        // Light glass
    medium: 'rgba(255, 255, 255, 0.18)',       // Medium glass
    heavy: 'rgba(255, 255, 255, 0.25)',        // Heavy glass
    solid: 'rgba(255, 255, 255, 0.35)',        // Solid glass
  },
  
  // Text colors for transparent backgrounds
  text: {
    primary: 'rgba(17, 24, 39, 0.95)',         // Almost black
    secondary: 'rgba(55, 65, 81, 0.9)',         // Dark gray
    tertiary: 'rgba(107, 114, 128, 0.85)',       // Medium gray
    subtle: 'rgba(156, 163, 175, 0.8)',        // Light gray
    muted: 'rgba(209, 213, 219, 0.7)',         // Very light gray
    ghost: 'rgba(243, 244, 246, 0.6)',        // Almost white
  },
  
  // Transparent gradients
  gradients: {
    glassToClear: {
      colors: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'],
      locations: [0, 1],
      angle: 135,
    },
    shimmer: {
      colors: ['transparent', 'rgba(255,255,255,0.4)', 'transparent'],
      locations: [0, 0.5, 1],
      angle: 45,
    },
    glow: {
      colors: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'],
      locations: [0, 0.5, 1],
      angle: 90,
    },
    aurora: {
      colors: [
        'rgba(147, 197, 253, 0.2)',    // Blue
        'rgba(167, 243, 208, 0.15)',    // Green
        'rgba(254, 240, 138, 0.15)',    // Yellow
        'rgba(252, 165, 165, 0.2)',     // Red
      ],
      locations: [0, 0.33, 0.66, 1],
      angle: 180,
    },
  },
  
  // Semantic colors with transparency
  semantic: {
    success: {
      background: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: 'rgba(16, 185, 129, 0.9)',
      glow: 'rgba(16, 185, 129, 0.2)',
    },
    error: {
      background: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: 'rgba(239, 68, 68, 0.9)',
      glow: 'rgba(239, 68, 68, 0.2)',
    },
    warning: {
      background: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: 'rgba(245, 158, 11, 0.9)',
      glow: 'rgba(245, 158, 11, 0.2)',
    },
    info: {
      background: 'rgba(59, 130, 246, 0.15)',
      border: 'rgba(59, 130, 246, 0.3)',
      text: 'rgba(59, 130, 246, 0.9)',
      glow: 'rgba(59, 130, 246, 0.2)',
    },
  },
  
  // Glass border variations
  borders: {
    subtle: 'rgba(255, 255, 255, 0.12)',
    normal: 'rgba(255, 255, 255, 0.2)',
    prominent: 'rgba(255, 255, 255, 0.3)',
    intense: 'rgba(255, 255, 255, 0.4)',
    glow: 'rgba(255, 255, 255, 0.25)',
    rainbow: 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(147,197,253,0.3), rgba(167,243,208,0.3), rgba(255,255,255,0.3))',
  },
  
  // Shadow colors with transparency
  shadows: {
    light: 'rgba(31, 38, 135, 0.1)',
    medium: 'rgba(31, 38, 135, 0.2)',
    heavy: 'rgba(31, 38, 135, 0.3)',
    extreme: 'rgba(31, 38, 135, 0.4)',
    colored: 'rgba(59, 130, 246, 0.2)',
    warm: 'rgba(245, 158, 11, 0.15)',
    cool: 'rgba(16, 185, 129, 0.15)',
  },
  
  // Platform-specific adjustments
  platform: {
    web: {
      background: 'rgba(255, 255, 255, 0.12)',
      border: 'rgba(255, 255, 255, 0.25)',
      shadow: 'rgba(31, 38, 135, 0.25)',
    },
    ios: {
      background: 'rgba(255, 255, 255, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)',
      shadow: 'rgba(31, 38, 135, 0.2)',
    },
    android: {
      background: 'rgba(255, 255, 255, 0.18)',
      border: 'rgba(255, 255, 255, 0.35)',
      shadow: 'rgba(31, 38, 135, 0.3)',
    },
  },
};