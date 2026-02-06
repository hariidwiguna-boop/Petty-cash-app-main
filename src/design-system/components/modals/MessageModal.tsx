import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import BaseGlassModal from './BaseGlassModal';
import { glassmorphism } from '../../../design-system/tokens/glassmorphism';

// MessageModal props
interface MessageModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  showConfirm?: boolean;
}

// Type configurations
const typeConfig = {
  success: {
    icon: 'check-circle' as keyof typeof Feather.glyphMap,
    color: '#10b981',
    background: glassmorphism.semantic.success.background,
    border: glassmorphism.semantic.success.border,
    glow: glassmorphism.semantic.success.glow,
  },
  error: {
    icon: 'x-circle' as keyof typeof Feather.glyphMap,
    color: '#ef4444',
    background: glassmorphism.semantic.error.background,
    border: glassmorphism.semantic.error.border,
    glow: glassmorphism.semantic.error.glow,
  },
  warning: {
    icon: 'alert-triangle' as keyof typeof Feather.glyphMap,
    color: '#f59e0b',
    background: glassmorphism.semantic.warning.background,
    border: glassmorphism.semantic.warning.border,
    glow: glassmorphism.semantic.warning.glow,
  },
  info: {
    icon: 'info' as keyof typeof Feather.glyphMap,
    color: '#3b82f6',
    background: glassmorphism.semantic.info.background,
    border: glassmorphism.semantic.info.border,
    glow: glassmorphism.semantic.info.glow,
  },
};

export const MessageModal: React.FC<MessageModalProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  showConfirm = false,
}) => {
  const currentType = typeConfig[type];

  return (
    <BaseGlassModal
      visible={visible}
      animationType="bounce"
      backdropBlur="intense"
      onClose={onClose}
    >
      <View style={styles.container}>
        {/* Icon Section */}
        <View style={[styles.iconContainer, { backgroundColor: currentType.background }]}>
          <Feather
            name={currentType.icon}
            size={48}
            color={currentType.color}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {title}
        </Text>

        {/* Message */}
        <Text style={styles.message}>
          {message}
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {showConfirm && (
            <View style={styles.buttonRow}>
              {/* Cancel Button */}
              <View style={[styles.button, styles.cancelButton]}>
                <Text style={[styles.buttonText, styles.cancelButtonText]}>
                  {cancelText}
                </Text>
              </View>

              {/* Confirm Button */}
              <View style={[styles.button, { borderColor: currentType.border }]}>
                <Text style={[styles.buttonText, { color: currentType.color }]}>
                  {confirmText}
                </Text>
              </View>
            </View>
          )}

          {!showConfirm && (
            <View style={[styles.button, { borderColor: currentType.border }]}>
              <Text style={[styles.buttonText, { color: currentType.color }]}>
                {confirmText}
              </Text>
            </View>
          )}
        </View>
      </View>
    </BaseGlassModal>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 32,
    minHeight: 200,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    color: 'rgba(17, 24, 39, 0.8)',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glassmorphism.surface.visible,
    borderColor: glassmorphism.border.normal,
  },
  cancelButton: {
    borderColor: glassmorphism.border.subtle,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(17, 24, 39, 0.9)',
  },
  cancelButtonText: {
    color: 'rgba(107, 114, 128, 0.9)',
  },
});

export default MessageModal;