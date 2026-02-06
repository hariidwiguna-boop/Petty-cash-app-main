import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { glassmorphism } from '../../../design-system/tokens/glassmorphism';
import { springConfigs } from '../../../design-system/tokens/animations';
import { particleEffects } from '../../../design-system/tokens/particles';
import ParticleEngine from '../animations/ParticleEngine';

// GlassButton props interface
interface GlassButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  magnetic?: boolean;
  particles?: boolean;
  particleTrigger?: 'onPress' | 'onMount' | 'none';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onLongPress?: () => void;
}

// Size configurations
const sizeConfig = {
  xs: { padding: 8, fontSize: 12, borderRadius: 8, minHeight: 32 },
  sm: { padding: 12, fontSize: 14, borderRadius: 12, minHeight: 40 },
  md: { padding: 16, fontSize: 16, borderRadius: 16, minHeight: 48 },
  lg: { padding: 20, fontSize: 18, borderRadius: 20, minHeight: 56 },
  xl: { padding: 24, fontSize: 20, borderRadius: 24, minHeight: 64 },
};

// Variant configurations
const variantConfig = {
  primary: {
    background: glassmorphism.surface.prominent,
    border: glassmorphism.border.prominent,
    gradient: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.1)'],
    shadow: glassmorphism.shadow.heavy,
  },
  secondary: {
    background: glassmorphism.surface.visible,
    border: glassmorphism.border.normal,
    gradient: ['rgba(107, 114, 128, 0.2)', 'rgba(107, 114, 128, 0.08)'],
    shadow: glassmorphism.shadow.medium,
  },
  outline: {
    background: 'transparent',
    border: glassmorphism.border.prominent,
    gradient: ['transparent', 'transparent'],
    shadow: glassmorphism.shadow.light,
  },
  ghost: {
    background: glassmorphism.surface.light,
    border: 'transparent',
    gradient: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)'],
    shadow: glassmorphism.shadow.light,
  },
  danger: {
    background: glassmorphism.surface.prominent,
    border: glassmorphism.border.intense,
    gradient: ['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)'],
    shadow: glassmorphism.shadow.heavy,
  },
};

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  magnetic = true,
  particles = false,
  particleTrigger = 'onPress',
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  onLongPress,
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [showParticles, setShowParticles] = useState(false);

  const currentSize = sizeConfig[size];
  const currentVariant = variantConfig[variant];

  // Magnetic hover effect
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!disabled && !loading && magnetic) {
        translateX.value = event.translationX * 0.15;
        translateY.value = event.translationY * 0.15;
      }
    })
    .onEnd(() => {
      if (!disabled && !loading && magnetic) {
        translateX.value = withSpring(0, springConfigs.smooth);
        translateY.value = withSpring(0, springConfigs.smooth);
      }
    });

  // Press animation
  const handlePressIn = useCallback(() => {
    if (!disabled && !loading) {
      scale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1.05, { duration: 100 })
      );
    }
  }, [disabled, loading]);

  const handlePressOut = useCallback(() => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, springConfigs.bouncy);
    }
  }, [disabled, loading]);

  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      // Success animation
      scale.value = withSequence(
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 300 })
      );

      // Trigger particles
      if (particles && particleTrigger === 'onPress') {
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 2000);
      }

      onPress();
    }
  }, [disabled, loading, particles, particleTrigger, onPress]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(translateX.value, springConfigs.smooth) },
      { translateY: withSpring(translateY.value, springConfigs.smooth) },
      { scale: withSpring(scale.value, springConfigs.smooth) },
    ],
  }));

  const glassStyle = [
    styles.glassButton,
    {
      borderRadius: currentSize.borderRadius,
      minHeight: currentSize.minHeight,
      opacity: disabled || loading ? 0.6 : 1,
      ...currentVariant.shadow,
    },
    animatedStyle,
    fullWidth && { alignSelf: 'stretch' as const },
    style,
  ];

  const contentStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: currentSize.padding / 2,
  };

  const gradientStyle = {
    flex: 1,
    width: '100%',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: currentSize.padding,
    paddingVertical: currentSize.padding / 2,
    borderRadius: currentSize.borderRadius,
    backgroundColor: currentVariant.background,
    borderColor: currentVariant.border,
    borderWidth: 1,
  };

  const buttonTextStyle = [
    styles.buttonText,
    {
      fontSize: currentSize.fontSize,
      color: disabled || loading ?
        'rgba(255, 255, 255, 0.5)' :
        'rgba(255, 255, 255, 0.95)',
    },
    textStyle,
  ];

  return (
    <GestureDetector gesture={panGesture}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={onLongPress}
        disabled={disabled || loading}
        style={glassStyle}
      >
        <LinearGradient
          colors={currentVariant.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={gradientStyle}
        >
          <View style={contentStyle}>
            {leftIcon}
            <Text style={buttonTextStyle}>
              {loading ? 'Loading...' : children}
            </Text>
            {rightIcon}
          </View>
        </LinearGradient>

        {/* Particle effect overlay */}
        {showParticles && (
          <ParticleEngine
            trigger="custom"
            config={particleEffects.buttonClick}
            count={20}
          />
        )}
      </Pressable>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  glassButton: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    // Web blur support
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }),
  },
  gradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600' as const,
    textAlign: 'center' as const,
    ...(Platform.OS === 'web' && {
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    }),
  },
});

export default GlassButton;