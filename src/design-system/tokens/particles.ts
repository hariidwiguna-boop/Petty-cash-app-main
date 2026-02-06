// Ultra-premium particle effect configurations
export const particleEffects = {
  // Success celebration particles
  successBurst: {
    particleCount: 75,                    // Abundant particles
    spreadRadius: 250,                    // Wide explosion
    duration: 2500,                       // Long celebration
    colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
    shapes: ['circle', 'star', 'heart', 'diamond'],
    gravity: 0.1,                          // Gentle fall
    fadeOut: true,
    scale: [1, 1.5, 0.8, 0],             // Scale animation
    rotation: [0, 360, 720],              // Spinning effect
    velocity: {
      x: [-150, 150],
      y: [-200, -50],
    },
  },
  
  // Download completion celebration
  downloadComplete: {
    particleCount: 100,                   // Maximum particles
    spreadRadius: 300,
    duration: 3000,                       // Extended celebration
    colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
    shapes: ['star', 'confetti', 'sparkle', 'diamond'],
    gravity: 0.05,
    fadeOut: true,
    scale: [0.5, 1.2, 1, 0.8],
    velocity: {
      x: [-200, 200],
      y: [-250, -100],
    },
    confetti: true,                         // Paper confetti effect
    fireworks: true,                        // Firework burst
    sparkleTrail: true,                      // Sparkle path
  },
  
  // Modal entrance sparkles
  modalSparkles: {
    particleCount: 50,
    spreadRadius: 200,
    duration: 2000,
    colors: ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)'],
    shapes: ['sparkle', 'circle'],
    gravity: -0.05,                         // Float upward
    fadeOut: true,
    scale: [0, 1, 0.5, 0],
    velocity: {
      x: [-100, 100],
      y: [-50, 50],
    },
    particlesAround: true,                    // Circle formation
    floatingOrbs: true,                      // Floating light orbs
  },
  
  // Button click particles
  buttonClick: {
    particleCount: 20,
    spreadRadius: 80,
    duration: 800,
    colors: ['#3b82f6', '#8b5cf6', '#ec4899'],
    shapes: ['circle', 'star'],
    gravity: 0.2,
    fadeOut: true,
    scale: [0.3, 1, 0],
    velocity: {
      x: [-60, 60],
      y: [-80, -20],
    },
    burst: true,                             // Instant burst
  },
  
  // Card hover particles
  cardHover: {
    particleCount: 15,
    spreadRadius: 120,
    duration: 1200,
    colors: ['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0.3)'],
    shapes: ['sparkle', 'circle'],
    gravity: -0.02,
    fadeOut: true,
    scale: [0, 0.8, 0.4, 0],
    velocity: {
      x: [-40, 40],
      y: [-30, 30],
    },
    gentle: true,                             // Subtle effect
  },
  
  // Loading particles
  loading: {
    particleCount: 8,
    spreadRadius: 60,
    duration: 1500,
    colors: ['rgba(59, 130, 246, 0.6)', 'rgba(139, 92, 246, 0.6)'],
    shapes: ['circle'],
    gravity: 0,
    fadeOut: false,
    scale: [0.5, 1, 0.5],
    rotation: [0, 180, 360],
    loop: true,                              // Continuous animation
    orbit: true,                              // Orbital movement
  },
  
  // Error particles
  errorShake: {
    particleCount: 25,
    spreadRadius: 150,
    duration: 1000,
    colors: ['#ef4444', '#dc2626', '#b91c1c'],
    shapes: ['triangle', 'x-shape'],
    gravity: 0.15,
    fadeOut: true,
    scale: [0.5, 1.2, 0.8, 0],
    velocity: {
      x: [-120, 120],
      y: [-150, -50],
    },
    shake: true,                             // Shaking effect
  },
  
  // Info particles
  infoGlow: {
    particleCount: 30,
    spreadRadius: 180,
    duration: 1800,
    colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
    shapes: ['circle', 'sparkle'],
    gravity: -0.08,
    fadeOut: true,
    scale: [0.2, 0.8, 0.6, 0],
    velocity: {
      x: [-80, 80],
      y: [-60, 60],
    },
    pulse: true,                              // Pulsing effect
  },
};

// Particle performance presets
export const particlePerformance = {
  ultra: {
    maxParticles: 200,
    quality: 'high',
    complexShapes: true,
    trails: true,
    glow: true,
  },
  high: {
    maxParticles: 100,
    quality: 'high',
    complexShapes: true,
    trails: false,
    glow: true,
  },
  medium: {
    maxParticles: 50,
    quality: 'medium',
    complexShapes: false,
    trails: false,
    glow: false,
  },
  low: {
    maxParticles: 20,
    quality: 'low',
    complexShapes: false,
    trails: false,
    glow: false,
  },
};

// Platform-specific particle adjustments
export const platformParticles = {
  web: {
    performance: 'high',
    enabled: true,
    fallback: 'canvas',
  },
  ios: {
    performance: 'medium',
    enabled: true,
    fallback: 'simple',
  },
  android: {
    performance: 'low',
    enabled: true,
    fallback: 'minimal',
  },
};