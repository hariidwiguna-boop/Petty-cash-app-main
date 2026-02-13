import React from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';

interface BrandLogoProps {
    size?: number;
    showText?: boolean;
    textColor?: string;
    variant?: 'light' | 'dark';
    style?: ViewStyle;
}

export default function BrandLogo({
    size = 100,
    showText = true,
    textColor = '#000000',
    variant = 'dark',
    style
}: BrandLogoProps) {
    const scale = size / 100;
    const barColor = variant === 'dark' ? '#000000' : '#FFFFFF';

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.logoContainer, { width: size, height: size * 0.7 }]}>
                {/* Horizontal Bars */}
                <View style={styles.leftBars}>
                    <View style={[styles.bar, { backgroundColor: barColor, height: 12 * scale, width: 50 * scale }]} />
                    <View style={[styles.bar, { backgroundColor: barColor, height: 12 * scale, width: 50 * scale, marginVertical: 6 * scale }]} />
                    <View style={[styles.bar, { backgroundColor: barColor, height: 12 * scale, width: 50 * scale }]} />
                </View>

                {/* Vertical Bar */}
                <View style={[styles.verticalBar, { borderColor: barColor, borderWidth: 2 * scale, width: 22 * scale, height: 50 * scale, marginLeft: 8 * scale }]}>
                    <View style={[styles.verticalBarFill, { backgroundColor: '#FFFFFF' }]} />
                </View>

                {/* Red Dot */}
                <View style={[styles.dot, { width: 26 * scale, height: 26 * scale, top: -5 * scale, right: -12 * scale }]} />
            </View>

            {showText && (
                <View style={styles.textContainer}>
                    <Text style={[styles.brandName, { color: textColor, fontSize: 24 * scale }]}>@evrdayplcs</Text>
                    <Text style={[styles.brandTagline, { color: textColor, fontSize: 14 * scale }]}>
                        your <Text style={{ color: '#E61E28', fontWeight: '900' }}>everyday</Text> places
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    leftBars: {
        justifyContent: 'center',
    },
    bar: {
        borderRadius: 1,
    },
    verticalBar: {
        borderRadius: 2,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    verticalBarFill: {
        width: '100%',
        height: '100%',
    },
    dot: {
        position: 'absolute',
        backgroundColor: '#FF0000',
        borderRadius: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    textContainer: {
        marginTop: 10,
        alignItems: 'center',
    },
    brandName: {
        fontWeight: '900',
        letterSpacing: -1,
    },
    brandTagline: {
        fontWeight: '500',
        marginTop: -2,
    },
});
