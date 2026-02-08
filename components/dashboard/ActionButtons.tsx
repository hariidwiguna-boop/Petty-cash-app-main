// ============================================
// ACTION BUTTONS COMPONENT - evrdayplcs. Brand
// Red Accent | White Glass Design
// ============================================

import * as React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';

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

    return (
        <View style={styles.bottomNavContainer}>
            {/* Background Glass Layer */}
            <View style={styles.glassBackground} />

            {/* Left Items */}
            <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/reimburse")}>
                <View style={styles.iconContainer}>
                    <Text style={styles.navIcon}>📋</Text>
                </View>
                <Text style={styles.navLabel}>Request</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/status")}>
                <View style={styles.iconContainer}>
                    <Text style={styles.navIcon}>📊</Text>
                </View>
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
                <View style={styles.iconContainer}>
                    <Text style={styles.navIcon}>📜</Text>
                </View>
                <Text style={styles.navLabel}>Riwayat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/daily-report")}>
                <View style={styles.iconContainer}>
                    <Text style={styles.navIcon}>📈</Text>
                </View>
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
        paddingBottom: 20, // Safe area for bottom
        paddingTop: 12,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        height: 85,
    },
    glassBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255, 255, 255, 0.9)", // High opacity glass
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
        height: 50,
        zIndex: 10,
    },
    iconContainer: {
        marginBottom: 2,
    },
    navIcon: {
        fontSize: 22,
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
    },
    centerFabContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        zIndex: 20,
        top: -24, // Pull up to float
    },
    centerFab: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: BRAND.red,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: BRAND.red,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
        marginBottom: 4,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)', // Subtle inner ring
    },
    fabIcon: {
        fontSize: 28,
        color: 'white',
    },
    fabLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: BRAND.textDark,
        marginTop: 4,
        // Add text shadow for legibility if needed
    },
});