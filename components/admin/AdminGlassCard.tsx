import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    StyleProp,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface AdminGlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    onPress?: () => void;
    floating?: boolean;
    intensity?: 'light' | 'medium' | 'heavy';
}

/**
 * AdminGlassCard - A transparent glass card with blur effect for admin pages
 * Features:
 * - Transparent/translucent background
 * - Blur effect (backdrop-filter on web, BlurView on native)
 * - Subtle gradient overlay
 * - Floating shadow effect
 */
export default function AdminGlassCard({
    children,
    style,
    onPress,
    floating = true,
    intensity = 'medium',
}: AdminGlassCardProps) {
    const intensityValues = {
        light: { blur: 10, opacity: 0.1 },
        medium: { blur: 20, opacity: 0.15 },
        heavy: { blur: 30, opacity: 0.2 },
    };

    const { blur, opacity } = intensityValues[intensity];

    const floatingStyle: ViewStyle = floating ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    } : {};

    const cardContent = (
        <View style={[styles.card, floatingStyle, style]}>
            {/* Blur Background - Native */}
            {Platform.OS !== 'web' && (
                <BlurView
                    intensity={blur}
                    tint="light"
                    style={StyleSheet.absoluteFillObject}
                />
            )}

            {/* Glass Gradient Overlay */}
            <LinearGradient
                colors={[
                    `rgba(255, 255, 255, ${opacity + 0.1})`,
                    `rgba(255, 255, 255, ${opacity - 0.05})`,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Border Highlight */}
            <View style={styles.borderHighlight} />

            {/* Content */}
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
                {cardContent}
            </TouchableOpacity>
        );
    }

    return cardContent;
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: Platform.OS === 'web'
            ? 'rgba(255, 255, 255, 0.25)'
            : 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        ...(Platform.OS === 'web' && {
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
        }),
    },
    borderHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    content: {
        padding: 16,
        position: 'relative',
        zIndex: 1,
    },
});
