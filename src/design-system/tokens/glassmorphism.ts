import { Platform } from 'react-native';

// Ultra-premium glassmorphism tokens
export const glassmorphism = {
  // Very prominent glass surfaces
  surface: {
    ultra: 'rgba(255, 255, 255, 0.08)',      // Ultra transparent
    light: 'rgba(255, 255, 255, 0.10)',       // Light glass
    medium: 'rgba(255, 255, 255, 0.12)',      // Medium glass
    prominent: 'rgba(255, 255, 255, 0.15)',     // Prominent
    visible: 'rgba(255, 255, 255, 0.18)',      // More visible
    hover: 'rgba(255, 255, 255, 0.22)',        // On hover
    active: 'rgba(255, 255, 255, 0.28)',       // Active state
    solid: 'rgba(255, 255, 255, 0.95)',        // Solid background
  },
  
  // Maximum blur effects
  backdropBlur: {
    light: 'blur(12px)',
    medium: 'blur(24px)',
    heavy: 'blur(32px)',
    ultra: 'blur(48px)',
    intense: 'blur(64px)',
    extreme: 'blur(80px)',
  },
  
  // Premium glass borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.15)',
    normal: 'rgba(255, 255, 255, 0.25)',
    prominent: 'rgba(255, 255, 255, 0.35)',
    intense: 'rgba(255, 255, 255, 0.45)',
    glow: 'rgba(255, 255, 255, 0.2)',
  },
  
  // Premium shadows
  shadow: {
    light: {
      shadowColor: 'rgba(31, 38, 135, 0.1)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 8,
    },
    medium: {
      shadowColor: 'rgba(31, 38, 135, 0.15)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 12,
    },
    heavy: {
      shadowColor: 'rgba(31, 38, 135, 0.25)',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 1,
      shadowRadius: 32,
      elevation: 20,
    },
    extreme: {
      shadowColor: 'rgba(31, 38, 135, 0.37)',
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 1,
      shadowRadius: 48,
      elevation: 32,
    },
  },
  
  // Premium reflections
  reflection: {
    intensity: 0.9,
    shimmerSpeed: 1800,
    shimmerWidth: 100,
    opacity: 0.7,
    gradient: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%, rgba(255,255,255,0.6) 100%)',
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

  // Platform-specific optimizations
  platform: {
    web: {
      backdropFilter: true,
      blurIntensity: 'ultra',
      particlePerformance: 'high',
    },
    ios: {
      backdropFilter: true,
      blurIntensity: 'extreme',
      particlePerformance: 'medium',
    },
    android: {
      backdropFilter: false,
      blurIntensity: 'medium',
      particlePerformance: 'low',
    },
  },
};

// Glass gradients
export const glassGradients = {
  primary: {
    start: 'rgba(255, 255, 255, 0.25)',
    end: 'rgba(255, 255, 255, 0.05)',
    angle: 135,
  },
  subtle: {
    start: 'rgba(255, 255, 255, 0.15)',
    end: 'rgba(255, 255, 255, 0.03)',
    angle: 90,
  },
  prominent: {
    start: 'rgba(255, 255, 255, 0.35)',
    end: 'rgba(255, 255, 255, 0.08)',
    angle: 145,
  },
  shimmer: {
    colors: ['transparent', 'rgba(255,255,255,0.4)', 'transparent'],
    locations: [0, 0.5, 1],
  },
};

// Glass border radius
export const glassBorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  full: 9999,
};