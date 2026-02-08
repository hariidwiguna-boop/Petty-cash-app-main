// ============================================
// DASHBOARD HEADER COMPONENT - evrdayplcs. Brand
// Red Gradient Header | White Glass Design
// ============================================

import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';

// Brand Colors - Red & White Only
const BRAND = {
    red: '#DC2626',
    redDark: '#991B1B',
    redGlass: 'rgba(220, 38, 38, 0.1)',
    white: '#FFFFFF',
    whiteGlass: 'rgba(255, 255, 255, 0.25)',
    textDark: '#1E293B',
    textGray: '#64748B',
};

interface DashboardHeaderProps {
    onSettingsPress: () => void;
    onAdminMenuPress: () => void;
    onLogoutPress: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    onSettingsPress,
    onAdminMenuPress,
    onLogoutPress,
}) => {
    const { profile, isAdmin } = useAuthStore();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    };

    return (
        <View style={styles.headerContainer}>
            <View style={styles.leftContainer}>
                {/* Logo Section (Wrapped in Card, Original Colors) */}
                <View style={styles.logoCard}>
                    <View style={styles.logoMini}>
                        <View style={styles.logoLeft}>
                            <View style={styles.logoBar} />
                            <View style={styles.logoBar} />
                            <View style={styles.logoBar} />
                        </View>
                        <View style={styles.logoRight}>
                            <View style={styles.logoRectangle} />
                            <View style={styles.logoCircle} />
                        </View>
                    </View>
                </View>

                {/* Vertical Divider */}
                <View style={styles.divider} />

                <View style={styles.userInfo}>
                    {/* Avatar Placeholder */}
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {profile?.nama?.charAt(0) || "U"}
                        </Text>
                    </View>

                    <View>
                        <Text style={styles.greetingText}>{getGreeting()},</Text>
                        <Text style={styles.userNameText}>{profile?.nama || "User"}</Text>
                    </View>
                </View>
            </View>

            {isAdmin ? (
                <TouchableOpacity
                    style={styles.headerAdminBtn}
                    onPress={onAdminMenuPress}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[BRAND.red, BRAND.redDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.adminBtnGradient}
                    >
                        <Text style={styles.headerAdminBtnText}>👑 Admin</Text>
                    </LinearGradient>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={onLogoutPress}
                    style={styles.logoutBtn}
                >
                    {/* Power/Exit Icon */}
                    <Text style={styles.logoutIcon}>⏻</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12, // Increased slightly
        marginBottom: 10,
        // No background, no card shadow - Pure clean header
    },
    leftContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    // Logo Card Style (Similar to Logout Button)
    logoCard: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.9)", // White glass background for contrast
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.5)",
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    // Logo Styles (Mini Version, Original Colors)
    logoMini: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        transform: [{ scale: 0.65 }], // Slightly smaller to fit in card
    },
    logoLeft: {
        flexDirection: 'column',
        gap: 4,
        justifyContent: 'space-between',
    },
    logoBar: {
        width: 20,
        height: 6,
        backgroundColor: '#0A0A0A', // Original Black
        borderRadius: 2,
    },
    logoRight: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 3,
        height: 26, // Adjusted for scale
    },
    logoRectangle: {
        width: 6,
        height: 26,
        borderWidth: 1.5,
        borderColor: '#0A0A0A', // Original Black
        borderRadius: 2,
        backgroundColor: 'transparent',
    },
    logoCircle: {
        width: 10,
        height: 10,
        backgroundColor: '#DC2626', // Original Red
        borderRadius: 5,
        marginTop: 0,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
    },
    userInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.3)",
    },
    avatarText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    greetingText: {
        fontSize: 11,
        color: "rgba(255, 255, 255, 0.8)",
        fontWeight: "600",
    },
    userNameText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    // Admin Button Styles
    headerAdminBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "rgba(0,0,0,0.2)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 3,
    },
    adminBtnGradient: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAdminBtnText: {
        fontSize: 12,
        fontWeight: "700",
        color: BRAND.white,
    },
    // Logout Button Styles
    logoutBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.15)", // Subtle translucent white
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
    },
    logoutIcon: {
        fontSize: 16,
        color: "#FFFFFF",
        fontWeight: 'bold',
    },
});