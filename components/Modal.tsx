// ============================================
// REUSABLE MODAL COMPONENT
// ============================================

import React from 'react';
import {
    Modal as RNModal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

export interface ModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    animationType?: 'none' | 'slide' | 'fade';
    transparent?: boolean;
    size?: 'small' | 'medium' | 'large' | 'full';
    showCloseButton?: boolean;
    closeOnBackdropPress?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    visible,
    onClose,
    title,
    children,
    animationType = 'slide',
    transparent = true,
    size = 'medium',
    showCloseButton = true,
    closeOnBackdropPress = true,
}) => {
    const getModalSize = () => {
        switch (size) {
            case 'small':
                return {
                    width: '90%',
                    maxWidth: 340,
                    maxHeight: '50%',
                } as const;
            case 'medium':
                return {
                    width: '90%',
                    maxWidth: 400,
                    maxHeight: '70%',
                } as const;
            case 'large':
                return {
                    width: '95%',
                    maxWidth: 500,
                    maxHeight: '85%',
                } as const;
            case 'full':
                return {
                    width: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                } as const;
            default:
                return {
                    width: '90%',
                    maxWidth: 400,
                    maxHeight: '70%',
                } as const;
        }
    };

    const modalSize = getModalSize();

    return (
        <RNModal
            visible={visible}
            animationType={animationType}
            transparent={transparent}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={closeOnBackdropPress ? 1 : undefined}
                onPress={closeOnBackdropPress ? onClose : undefined}
                disabled={!closeOnBackdropPress}
            >
                <View
                    style={[
                        styles.modalContent,
                        {
                            width: modalSize.width,
                            maxWidth: modalSize.maxWidth,
                            maxHeight: modalSize.maxHeight,
                        },
                    ]}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <View style={styles.modalHeader}>
                            {title && (
                                <Text style={styles.modalTitle}>{title}</Text>
                            )}
                            {showCloseButton && (
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={onClose}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Text style={styles.closeButtonText}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Content */}
                    <View style={[styles.modalBody, !title && !showCloseButton && styles.modalBodyNoHeader]}>
                        {children}
                    </View>
                </View>
            </TouchableOpacity>
        </RNModal>
    );
};

// ============================================
// ALERT MODAL COMPONENT
// ============================================

export interface AlertModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    confirmText?: string;
    cancelText?: string;
    showCancelButton?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({
    visible,
    onClose,
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Batal',
    showCancelButton = false,
    onConfirm,
    onCancel,
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✅';
            case 'warning':
                return '⚠️';
            case 'error':
                return '❌';
            default:
                return 'ℹ️';
        }
    };

    const getIconStyle = () => {
        switch (type) {
            case 'success':
                return { backgroundColor: '#dcfce7', color: '#16a34a' };
            case 'warning':
                return { backgroundColor: '#fef3c7', color: '#d97706' };
            case 'error':
                return { backgroundColor: '#fee2e2', color: '#dc2626' };
            default:
                return { backgroundColor: '#dbeafe', color: '#2563eb' };
        }
    };

    const iconStyle = getIconStyle();

    const handleConfirm = () => {
        onConfirm?.();
        onClose();
    };

    const handleCancel = () => {
        onCancel?.();
        onClose();
    };

    return (
        <Modal
            visible={visible}
            onClose={onClose}
            size="small"
            animationType="fade"
        >
            <View style={styles.alertContent}>
                <View style={[styles.alertIcon, { backgroundColor: iconStyle.backgroundColor }]}>
                    <Text style={[styles.alertIconText, { color: iconStyle.color }]}>
                        {getIcon()}
                    </Text>
                </View>
                
                <Text style={styles.alertTitle}>{title}</Text>
                <Text style={styles.alertMessage}>{message}</Text>
                
                <View style={styles.alertButtons}>
                    {showCancelButton && (
                        <TouchableOpacity
                            style={[styles.alertButton, styles.alertButtonCancel]}
                            onPress={handleCancel}
                        >
                            <Text style={styles.alertButtonTextCancel}>{cancelText}</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                        style={[
                            styles.alertButton,
                            styles.alertButtonConfirm,
                            type === 'error' && styles.alertButtonConfirmError,
                        ]}
                        onPress={handleConfirm}
                    >
                        <Text style={styles.alertButtonTextConfirm}>{confirmText}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ============================================
// CONFIRM MODAL COMPONENT
// ============================================

export interface ConfirmModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    dangerous?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    visible,
    onClose,
    title,
    message,
    confirmText = 'Ya',
    cancelText = 'Tidak',
    onConfirm,
    onCancel,
    dangerous = false,
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleCancel = () => {
        onCancel?.();
        onClose();
    };

    return (
        <AlertModal
            visible={visible}
            onClose={onClose}
            title={title}
            message={message}
            type={dangerous ? 'warning' : 'info'}
            confirmText={confirmText}
            cancelText={cancelText}
            showCancelButton={true}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />
    );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a1a1a',
        flex: 1,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
    },
    modalBody: {
        padding: 20,
        paddingTop: 12,
    },
    modalBodyNoHeader: {
        paddingTop: 20,
    },
    // Alert Modal Styles
    alertContent: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    alertIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    alertIconText: {
        fontSize: 24,
    },
    alertTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 8,
    },
    alertMessage: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    alertButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    alertButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    alertButtonCancel: {
        backgroundColor: '#f1f5f9',
    },
    alertButtonConfirm: {
        backgroundColor: '#3b82f6',
    },
    alertButtonConfirmError: {
        backgroundColor: '#ef4444',
    },
    alertButtonTextCancel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    alertButtonTextConfirm: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },
});