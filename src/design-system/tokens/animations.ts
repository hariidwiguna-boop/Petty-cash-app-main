import { Extrapolation, interpolate, withRepeat, withSpring, withTiming } from 'react-native-reanimated';

// Ultra-smooth animation presets
export const premiumAnimations = {
  // Modal animations - very prominent and smooth
  modalBounce: {
    duration: 800,
    delay: 0,
    easing: 'easeInOutCubic' as const,
    keyframes: {
      '0%': { scale: 0.6, opacity: 0, rotate: '8deg' },
      '50%': { scale: 1.1, opacity: 0.8, rotate: '-2deg' },
      '100%': { scale: 1, opacity: 1, rotate: '0deg' },
    },
  },
  
  modalSlideUp: {
    duration: 600,
    delay: 0,
    easing: 'easeOutCubic' as const,
    keyframes: {
      '0%': { translateY: 100, opacity: 0 },
      '100%': { translateY: 0, opacity: 1 },
    },
  },
  
  modalFadeIn: {
    duration: 400,
    delay: 0,
    easing: 'easeOutCubic' as const,
    keyframes: {
      '0%': { opacity: 0, scale: 0.9 },
      '100%': { opacity: 1, scale: 1 },
    },
  },
  
  // Button animations - magnetic and smooth
  buttonHover: {
    duration: 300,
    delay: 0,
    easing: 'easeOutCubic' as const,
    keyframes: {
      '0%': { scale: 1 },
      '100%': { scale: 1.08 },
    },
  },
  
  buttonPress: {
    duration: 150,
    delay: 0,
    easing: 'easeOutCubic' as const,
    keyframes: {
      '0%': { scale: 1 },
      '50%': { scale: 0.92 },
      '100%': { scale: 1 },
    },
  },
  
  magneticHover: {
    duration: 400,
    delay: 0,
    easing: 'easeOutCubic' as const,
    keyframes: {
      '0%': { scale: 1, translateX: 0, translateY: 0 },
      '100%': { scale: 1.05, translateX: 5, translateY: -2 },
    },
  },
  
  // Card animations - floating and gentle
  cardFloat: {
    duration: 2000,
    delay: 0,
    easing: 'easeInOutSine' as const,
    keyframes: {
      '0%': { translateY: 0 },
      '50%': { translateY: -8 },
      '100%': { translateY: 0 },
    },
  },
  
  cardTilt: {
    duration: 600,
    delay: 0,
    easing: 'easeOutCubic' as const,
    keyframes: {
      '0%': { rotateX: 0, rotateY: 0 },
      '100%': { rotateX: 5, rotateY: 5 },
    },
  },
  
  cardSlideIn: {
    duration: 800,
    delay: 0,
    easing: 'easeOutCubic' as const,
    keyframes: {
      '0%': { translateY: 40, opacity: 0 },
      '100%': { translateY: 0, opacity: 1 },
    },
  },
  
  // List animations - smooth stagger
  listSlideIn: {
    duration: 600,
    delay: 0,
    easing: 'easeOutCubic' as const,
    keyframes: {
      '0%': { translateX: -20, opacity: 0 },
      '100%': { translateX: 0, opacity: 1 },
    },
  },
  
  // Page transitions
  pageSlide: {
    duration: 700,
    delay: 0,
    easing: 'easeInOutQuart' as const,
    keyframes: {
      '0%': { translateX: 30, opacity: 0 },
      '100%': { translateX: 0, opacity: 1 },
    },
  },
  
  pageFadeIn: {
    duration: 500,
    delay: 0,
    easing: 'easeOutCubic' as const,
    keyframes: {
      '0%': { opacity: 0 },
      '100%': { opacity: 1 },
    },
  },
  
  // Loading animations - prominent shimmer
  shimmer: {
    duration: 1500,
    delay: 0,
    easing: 'linear' as const,
    keyframes: {
      '0%': { translateX: -100 },
      '100%': { translateX: 100 },
    },
  },
  
  skeleton: {
    duration: 2000,
    delay: 0,
    easing: 'easeInOutSine' as const,
    keyframes: {
      '0%': { opacity: 0.3 },
      '50%': { opacity: 0.7 },
      '100%': { opacity: 0.3 },
    },
  },
  
  // Success animations - celebratory
  successPulse: {
    duration: 1000,
    delay: 0,
    easing: 'easeInOutCubic' as const,
    keyframes: {
      '0%': { scale: 1 },
      '25%': { scale: 1.1 },
      '50%': { scale: 0.95 },
      '75%': { scale: 1.05 },
      '100%': { scale: 1 },
    },
  },
  
  successBounce: {
    duration: 1200,
    delay: 0,
    easing: 'easeInOutElastic' as const,
    keyframes: {
      '0%': { scale: 0, translateY: 20 },
      '50%': { scale: 1.2, translateY: -10 },
      '100%': { scale: 1, translateY: 0 },
    },
  },
};

// Stagger animation delays
export const staggerDelays = {
  fast: 50,
  normal: 100,
  slow: 150,
  verySlow: 200,
};

// Spring configurations
export const springConfigs = {
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 1,
  },
  smooth: {
    damping: 20,
    stiffness: 300,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 500,
    mass: 1,
  },
  gentle: {
    damping: 25,
    stiffness: 200,
    mass: 1,
  },
};

// Animation utilities
export const createStaggerAnimation = (
  delay: number,
  baseDelay: number = 100
) => ({
  delay: delay * baseDelay,
  duration: 600,
  easing: 'easeOutCubic' as const,
});

export const createPulseAnimation = (
  scale: number = 1.1,
  duration: number = 1000
) => ({
  scale: [1, scale, 1],
  duration,
  easing: 'easeInOutCubic' as const,
});

// Platform-specific animation adjustments
export const platformAnimations = {
  web: {
    enabled: true,
    performance: 'high',
    particleEffects: true,
    advancedTransitions: true,
  },
  ios: {
    enabled: true,
    performance: 'medium',
    particleEffects: true,
    advancedTransitions: true,
  },
  android: {
    enabled: true,
    performance: 'low',
    particleEffects: false,
    advancedTransitions: false,
  },
};