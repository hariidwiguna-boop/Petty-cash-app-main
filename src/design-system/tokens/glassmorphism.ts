import { Platform } from 'react-native';

// Ultra-premium glassmorphism tokens
export const glassmorphism = {
  // Very prominent glass surfaces (Executive 2.0)
  surface: {
    ultra: 'rgba(255, 255, 255, 0.03)',      // Whisper thin
    light: 'rgba(255, 255, 255, 0.06)',       // Light frost
    medium: 'rgba(255, 255, 255, 0.10)',      // Frost
    prominent: 'rgba(255, 255, 255, 0.15)',     // Clear frost
    visible: 'rgba(255, 255, 255, 0.20)',      // Semi-solid
    hover: 'rgba(255, 255, 255, 0.25)',        // Glow
    active: 'rgba(255, 255, 255, 0.35)',       // Intense
    solid: 'rgba(15, 23, 42, 0.98)',           // Slate-900 fallback
  },

  // Maximum blur effects (High Intensity)
  backdropBlur: {
    light: 'blur(16px)',
    medium: 'blur(32px)',
    heavy: 'blur(48px)',
    ultra: 'blur(64px)',
    intense: 'blur(80px)',
    extreme: 'blur(120px)',
  },

  // Premium glass borders (Light catchers)
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    normal: 'rgba(255, 255, 255, 0.15)',
    prominent: 'rgba(255, 255, 255, 0.25)',
    intense: 'rgba(255, 255, 255, 0.40)',
    glow: 'rgba(255, 255, 255, 0.15)',
  },

  // Premium shadows (3D Depth)
  shadow: {
    light: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 12,
    },
    heavy: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 24 },
      shadowOpacity: 0.5,
      shadowRadius: 40,
      elevation: 20,
    },
    extreme: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 48 },
      shadowOpacity: 0.6,
      shadowRadius: 64,
      elevation: 32,
    },
  },

  // Premium reflections & semantic accents
  semantic: {
    success: {
      background: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.4)',
      text: '#10B981',
      glow: 'rgba(16, 185, 129, 0.3)',
    },
    error: {
      background: 'rgba(220, 38, 38, 0.15)',
      border: 'rgba(220, 38, 38, 0.5)',
      text: '#FF3131',
      glow: 'rgba(220, 38, 38, 0.4)',
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
    // Brand red accent glass
    accent: {
      background: 'rgba(220, 38, 38, 0.12)',
      border: 'rgba(220, 38, 38, 0.35)',
      text: '#DC2626',
      glow: 'rgba(220, 38, 38, 0.25)',
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