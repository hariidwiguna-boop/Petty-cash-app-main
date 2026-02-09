// ============================================
// ACTION BUTTONS COMPONENT - evrdayplcs. Brand
// Red Accent | White Glass Design
// ============================================

import * as React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useResponsive } from '../../src/hooks/useResponsive';

// Brand Colors - Red & White Only
const BRAND = {
    red: '#DC2626',
    redGlass: 'rgba(220, 38, 38, 0.08)',
    whiteGlass: 'rgba(255, 255, 255, 0.95)',
    white: '#FFFFFF',
    textDark: '#1E293B',
    textGray: '#64748B',
};

export const ActionButtons: React.FC = () => {
    const router = useRouter();
    const { fontScale, isTablet, getResponsiveValue } = useResponsive();

    return (
        <View style={styles.bottomNavContainer}>
            {/* Background Glass Layer */}
            <View style={styles.glassBackground} />

            {/* Left Items */}
            <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/reimburse")}>
                <Text style={styles.navIcon}>📋</Text>
                <Text style={styles.navLabel}>Request</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/status")}>
                <Text style={styles.navIcon}>📊</Text>
                <Text style={styles.navLabel}>Status</Text>
            </TouchableOpacity>

            {/* Center FAB - Catat Pengeluaran */}
            <View style={styles.centerFabContainer}>
                <TouchableOpacity
                    style={styles.centerFab}
                    onPress={() => router.push("/(app)/(tabs)/input")}
                    activeOpacity={0.8}
                >
                    <Text style={styles.fabIcon}>📝</Text>
                </TouchableOpacity>
                <Text style={styles.fabLabel}>Catat</Text>
            </View>

            {/* Right Items */}
            <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/history")}>
                <Text style={styles.navIcon}>📜</Text>
                <Text style={styles.navLabel}>Riwayat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/daily-report")}>
                <Text style={styles.navIcon}>📈</Text>
                <Text style={styles.navLabel}>Laporan</Text>
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
        paddingBottom: 20,
        paddingTop: 12,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    glassBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderTopWidth: 1.5,
        borderTopColor: "rgba(255, 255, 255, 0.8)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } : {}),
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 60,
        zIndex: 10,
    },
    navIcon: {
        fontSize: 22,
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        marginTop: 2,
    },
    centerFabContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 20,
        top: -30,
    },
    centerFab: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: BRAND.red,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: BRAND.red,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    fabIcon: {
        fontSize: 30,
        color: 'white',
    },
    fabLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: BRAND.textDark,
        marginTop: 6,
    },
});