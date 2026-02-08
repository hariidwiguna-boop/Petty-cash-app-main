import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AdminGlassModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
}

/**
 * AdminGlassModal - A transparent glass modal with blur effect for admin pages
 * Features:
 * - Blurred backdrop
 * - Transparent/translucent modal container
 * - Floating effect with shadow
 * - Close button
 */
export default function AdminGlassModal({
    visible,
    onClose,
    title,
    children,
    size = 'medium',
}: AdminGlassModalProps) {
    const sizeStyles = {
        small: { width: screenWidth * 0.8, maxWidth: 300 },
        medium: { width: screenWidth * 0.9, maxWidth: 400 },
        large: { width: screenWidth * 0.95, maxWidth: 500 },
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            {/* Blurred Backdrop */}
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={onClose}
            >
                {Platform.OS !== 'web' && (
                    <BlurView
                        intensity={40}
                        tint="dark"
                        style={StyleSheet.absoluteFillObject}
                    />
                )}
            </TouchableOpacity>

            {/* Modal Container */}
            <View style={styles.centeredView}>
                <View style={[styles.modalCard, sizeStyles[size]]}>
                    {/* Blur Background - Native */}
                    {Platform.OS !== 'web' && (
                        <BlurView
                            intensity={30}
                            tint="light"
                            style={StyleSheet.absoluteFillObject}
                        />
                    )}

                    {/* Glass Gradient Overlay */}
                    <LinearGradient
                        colors={[
                            'rgba(255, 255, 255, 0.35)',
                            'rgba(255, 255, 255, 0.15)',
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                    />

                    {/* Header */}
                    <View style={styles.header}>
                        {title && <Text style={styles.title}>{title}</Text>}
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        {children}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Platform.OS === 'web'
            ? 'rgba(0, 0, 0, 0.5)'
            : 'rgba(0, 0, 0, 0.3)',
        ...(Platform.OS === 'web' && {
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
        }),
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalCard: {
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: Platform.OS === 'web'
            ? 'rgba(255, 255, 255, 0.3)'
            : 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 12,
        ...(Platform.OS === 'web' && {
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: {
        fontSize: 14,
        color: '#6b7280',
        fontWeight: '600',
    },
    content: {
        padding: 20,
    },
});
