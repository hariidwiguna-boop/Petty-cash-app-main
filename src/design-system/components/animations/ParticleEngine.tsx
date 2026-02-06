import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

// Particle interface
interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  scale: number;
  rotation: number;
  velocity: { x: number; y: number };
}

// ParticleEngine props
interface ParticleEngineProps {
  trigger?: 'onPress' | 'onMount' | 'none' | 'custom';
  config?: any;
  count?: number;
  duration?: number;
  position?: 'center' | 'top' | 'bottom';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ParticleEngine: React.FC<ParticleEngineProps> = ({
  trigger = 'none',
  config,
  count = 30,
  duration = 2000,
  position = 'center',
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const animationProgress = useSharedValue(0);
  const containerRef = useRef<View>(null);

  // Generate particles
  const generateParticles = React.useCallback(() => {
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count;
      const velocity = Math.random() * 150 + 50;
      
      return {
        id: `particle-${Date.now()}-${i}`,
        x: position === 'center' ? screenWidth / 2 : Math.random() * screenWidth,
        y: position === 'center' ? screenHeight / 2 : position === 'top' ? 100 : screenHeight - 100,
        size: Math.random() * 8 + 4,
        color: config?.colors?.[Math.floor(Math.random() * config.colors.length)] || '#ffffff',
        opacity: 1,
        scale: 1,
        rotation: 0,
        velocity: {
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity - (position === 'top' ? 100 : position === 'bottom' ? -100 : 0),
        },
      };
    });
    
    setParticles(newParticles);
    return newParticles;
  }, [count, config, position]);

  // Handle triggers
  useEffect(() => {
    if (trigger === 'onMount') {
      setTimeout(() => generateParticles(), 100);
    }
  }, [trigger, generateParticles]);

  // Animation progress
  useEffect(() => {
    if (particles.length > 0) {
      animationProgress.value = withRepeat(
        withTiming(1, { duration: duration }),
        1,
        false
      );
      
      // Clean up particles after animation
      setTimeout(() => {
        runOnJS(() => setParticles([]))();
      }, duration);
    }
  }, [particles.length, duration, animationProgress]);

  // Individual particle animation
  const getParticleStyle = (particle: Particle, index: number) => {
    const delay = index * 50; // Stagger effect
    
    return useAnimatedStyle(() => {
      const progress = Math.max(0, Math.min(1, (animationProgress.value - delay / duration) / (1 - delay / duration)));
      
      return {
        position: 'absolute',
        left: particle.x + particle.velocity.x * progress,
        top: particle.y + particle.velocity.y * progress + (config?.gravity || 0.1) * progress * progress * 100,
        width: particle.size,
        height: particle.size,
        backgroundColor: particle.color,
        borderRadius: particle.size / 2,
        opacity: particle.opacity * (1 - progress),
        transform: [
          {
            scale: withTiming(
              interpolate(progress, [0, 0.5, 1], [0, 1.2, 0.8]),
              { duration: duration }
            )
          },
          {
            rotate: `${particle.rotation + progress * 360}deg`
          }
        ],
      };
    });
  };

  if (particles.length === 0) return null;

  return (
    <View 
      ref={containerRef}
      style={[styles.container, position === 'center' && styles.centered]}
      pointerEvents="none"
    >
      {particles.map((particle, index) => (
        <Animated.View
          key={particle.id}
          style={getParticleStyle(particle, index)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ParticleEngine;