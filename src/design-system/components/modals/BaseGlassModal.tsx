import React, { useEffect } from 'react';
import {
  Modal as RNModal,
  View,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { glassmorphism } from '../../../design-system/tokens/glassmorphism';
import { springConfigs } from '../../../design-system/tokens/animations';
import ParticleEngine from '../animations/ParticleEngine';

// BaseModal props
interface BaseGlassModalProps {
  visible: boolean;
  children: React.ReactNode;
  animationType?: 'bounce' | 'slideUp' | 'fadeIn';
  backdropBlur?: 'light' | 'medium' | 'heavy' | 'ultra' | 'intense';
  onClose?: () => void;
  style?: any;
}

export const BaseGlassModal: React.FC<BaseGlassModalProps> = ({
  visible,
  children,
  animationType = 'bounce',
  backdropBlur = 'intense',
  onClose,
  style,
}) => {
  // Modal animation state
  const modalAnimation = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // Animation effects
  useEffect(() => {
    if (visible) {
      // Entrance animation
      modalAnimation.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
      backdropOpacity.value = withSpring(1, {
        duration: 300,
      });
    } else {
      // Exit animation
      modalAnimation.value = withSpring(0, {
        damping: 20,
        stiffness: 400,
      });
      backdropOpacity.value = withSpring(0, {
        duration: 200,
      });
    }
  }, [visible, modalAnimation, backdropOpacity]);

  // Modal animation style
  const modalStyle = useAnimatedStyle(() => {
    const baseTransform = {
      opacity: modalAnimation.value,
    };

    // Animation type specific transforms
    if (animationType === 'bounce') {
      return {
        ...baseTransform,
        transform: [
          {
            scale: modalAnimation.value < 0.5 
              ? modalAnimation.value * 0.6 + 0.4 
              : modalAnimation.value > 0.5 && modalAnimation.value < 0.8
              ? modalAnimation.value * 1.8 - 0.44
              : 1,
          },
          {
            rotate: `${modalAnimation.value < 0.5 
              ? modalAnimation.value * 20 
              : modalAnimation.value > 0.5 && modalAnimation.value < 0.8
              ? (1 - modalAnimation.value) * 10 - 2
              : 0}deg`,
          },
        ],
      };
    } else if (animationType === 'slideUp') {
      return {
        ...baseTransform,
        transform: [
          {
            translateY: (1 - modalAnimation.value) * 100,
          },
        ],
      };
    } else {
      return baseTransform;
    }
  });

  // Backdrop animation style
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Calculate backdrop blur based on platform and blur level
  const backdropBlurValue = Platform.select({
    web: backdropBlur === 'intense' ? 'blur(80px)' : 'blur(48px)',
    ios: backdropBlur === 'intense' ? 'ultra' : backdropBlur,
    android: 'blur(16px)', // Fallback for Android
  });

  const modalGlassStyle = [
    styles.modal,
    {
      backgroundColor: glassmorphism.surface.prominent,
      borderColor: glassmorphism.border.prominent,
      borderWidth: 1,
      ...glassmorphism.shadow.extreme,
      ...(Platform.OS === 'web' && {
        backdropFilter: backdropBlurValue,
        WebkitBackdropFilter: backdropBlurValue,
      }),
    },
    style,
  ];

  return (
    <RNModal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable 
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
        />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View style={[modalStyle, modalGlassStyle]}>
        <ParticleEngine
          trigger="onMount"
          count={30}
          duration={2000}
        />
        {children}
      </Animated.View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  modal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -200,
    marginLeft: -150,
    width: 300,
    minHeight: 400,
    borderRadius: 24,
    overflow: 'hidden',
    zIndex: 1001,
  },
  content: {
    flex: 1,
    padding: 24,
  },
});

export default BaseGlassModal;