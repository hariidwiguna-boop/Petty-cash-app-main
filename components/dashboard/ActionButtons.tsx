import * as React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useResponsive } from '../../src/hooks/useResponsive';
import { theme } from '../../src/design-system/theme';

export const ActionButtons: React.FC = () => {
    const router = useRouter();
    const { fontScale, isTablet, getResponsiveValue } = useResponsive();

    return (
        <View style={styles.bottomNavContainer}>
            {/* Background Glass Layer (Executive Dark Glass) */}
            <View style={styles.glassBackground} />

            {/* Left Items */}
            <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/reimburse")}>
                <Text style={styles.navIcon}>📤</Text>
                <Text style={styles.navLabel}>Request</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/status")}>
                <Text style={styles.navIcon}>⚡</Text>
                <Text style={styles.navLabel}>Status</Text>
            </TouchableOpacity>

            {/* Center FAB - Premium Red Action */}
            <View style={styles.centerFabContainer}>
                <TouchableOpacity
                    style={styles.centerFab}
                    onPress={() => router.push("/(app)/(tabs)/input")}
                    activeOpacity={0.8}
                >
                    <Text style={styles.fabIcon}>+</Text>
                </TouchableOpacity>
                <Text style={styles.fabLabel}>LOG</Text>
            </View>

            {/* Right Items */}
            <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/history")}>
                <Text style={styles.navIcon}>🕒</Text>
                <Text style={styles.navLabel}>History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/daily-report")}>
                <Text style={styles.navIcon}>📑</Text>
                <Text style={styles.navLabel}>Report</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNavContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 16,
        paddingTop: 12,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    glassBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(15, 23, 42, 0.9)", // Deep slate glass
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 20,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(40px)' } : {}),
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        zIndex: 10,
    },
    navIcon: {
        fontSize: 20,
        color: '#F8FAFC',
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        marginTop: 4,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    centerFabContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 20,
        top: -24,
    },
    centerFab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#DC2626',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF3131',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    fabIcon: {
        fontSize: 32,
        color: 'white',
        fontWeight: 'bold',
    },
    fabLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: '#F8FAFC',
        marginTop: 6,
        letterSpacing: 2,
    },
});