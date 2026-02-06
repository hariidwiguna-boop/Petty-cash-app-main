import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated as RNAnimated,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { glassmorphism } from '../../../design-system/tokens/glassmorphism';

// ReflectionOverlay props
interface ReflectionOverlayProps {
  intensity?: number;
  duration?: number;
  style?: any;
}

export const ReflectionOverlay: React.FC<ReflectionOverlayProps> = ({
  intensity = 0.6,
  duration = 2000,
  style,
}) => {
  const shimmerTranslateX = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Shimmer animation
    shimmerTranslateX.value = withRepeat(
      withTiming(100, { duration }),
      -1,
      true
    );
    
    // Fade in/out
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(intensity, { duration: 500 }),
        withTiming(intensity, { duration: 1000 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      false
    );
  }, [intensity, duration, shimmerTranslateX, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslateX.value }],
  }));

  return (
    <RNAnimated.View style={[styles.container, animatedStyle, style]}>
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
        start={{ x: -1, y: 0 }}
        end={{ x: 2, y: 0 }}
        style={[styles.gradient, shimmerStyle]}
      />
    </RNAnimated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    width: '200%',
  },
});

export default ReflectionOverlay;