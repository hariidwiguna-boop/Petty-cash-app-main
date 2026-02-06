import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { glassmorphism, glassBorderRadius } from '../../../design-system/tokens/glassmorphism';
import { springConfigs } from '../../../design-system/tokens/animations';
import ParticleEngine from '../animations/ParticleEngine';

// GlassCard props
interface GlassCardProps {
  children: React.ReactNode;
  elevation?: 'none' | 'light' | 'medium' | 'heavy' | 'extreme';
  blur?: 'none' | 'light' | 'medium' | 'heavy' | 'ultra';
  radius?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  floating?: boolean;
  reflection?: boolean;
  particles?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  elevation = 'medium',
  blur = 'ultra',
  radius = 'lg',
  floating = false,
  reflection = false,
  particles = false,
  style,
  onPress,
}) => {
  // Animation values
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Floating animation
  useEffect(() => {
    if (floating) {
      translateY.value = withRepeat(
        withSpring(-8, { damping: 0, stiffness: 50 }),
        -1,
        true
      );
    }
  }, [floating, translateY]);

  // Start reflection effect
  useEffect(() => {
    if (reflection) {
      setTimeout(() => {}, 3000);
    }
  }, [reflection]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: withSpring(translateY.value, springConfigs.smooth) },
      { scale: withSpring(scale.value, springConfigs.smooth) },
    ],
  }));

  // Calculate styles
  const elevationStyle = elevation === 'none' ? {} : glassmorphism.shadow[elevation];
  const radiusStyle = { borderRadius: glassBorderRadius[radius] };

  const baseStyle: ViewStyle = {
    backgroundColor: glassmorphism.surface.prominent,
    borderColor: glassmorphism.border.normal,
    borderWidth: 1,
    ...radiusStyle,
    ...elevationStyle,
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(32px)',
      WebkitBackdropFilter: 'blur(32px)',
    }),
  };

  const glassStyle = [
    styles.glassCard,
    baseStyle,
    animatedStyle,
    style,
  ];

  const handlePress = () => {
    if (onPress) {
      scale.value = withSpring(0.95, springConfigs.snappy);
      setTimeout(() => {
        scale.value = withSpring(1, springConfigs.smooth);
        onPress();
      }, 100);
    }
  };

  return (
    <Pressable onPress={onPress ? handlePress : undefined} style={glassStyle}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            ...StyleSheet.absoluteFillObject,
            borderRadius: glassBorderRadius[radius],
          },
        ]}
      />
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>

      {/* Particle effects */}
      {particles && (
        <ParticleEngine
          trigger="onMount"
          count={15}
          duration={1200}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  glassCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  content: {
    zIndex: 1,
    position: 'relative',
  },
});

export default GlassCard;