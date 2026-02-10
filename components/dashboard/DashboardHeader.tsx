import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/authStore';
import { useResponsive } from '../../src/hooks/useResponsive';
import { theme } from '../../src/design-system/theme';

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
    const { fontScale, horizontalScale, isTablet } = useResponsive();

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
                {/* Official Logo Integration */}
                <View style={styles.logoCard}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.logoImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Vertical Divider */}
                <View style={styles.divider} />

                <View style={styles.userInfo}>
                    {/* Avatar with ring glow */}
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {profile?.nama?.charAt(0) || "U"}
                        </Text>
                    </View>

                    <View>
                        <Text style={[styles.greetingText, { fontSize: fontScale(11) }]}>{getGreeting()},</Text>
                        <Text style={[styles.userNameText, { fontSize: fontScale(14) }]}>{profile?.nama || "User"}</Text>
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
                        colors={[theme.colors.brand.red, theme.colors.brand.redDark]}
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
        paddingVertical: 12,
        marginBottom: 10,
    },
    leftContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    logoCard: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    logoImage: {
        width: 32,
        height: 32,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
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
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "rgba(220, 38, 38, 0.4)", // Neon red ring
    },
    avatarText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#F8FAFC",
    },
    greetingText: {
        color: "#94A3B8",
        fontWeight: "600",
    },
    userNameText: {
        fontWeight: "700",
        color: "#F8FAFC",
        letterSpacing: 0.5,
    },
    headerAdminBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: "rgba(220, 38, 38, 0.4)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 6,
    },
    adminBtnGradient: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAdminBtnText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    logoutBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.15)",
    },
    logoutIcon: {
        fontSize: 18,
        color: "#FF3131", // Neon red exit
        fontWeight: 'bold',
    },
});