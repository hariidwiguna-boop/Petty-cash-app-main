// ============================================
// DASHBOARD HEADER COMPONENT
// ============================================

import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../stores/authStore';

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
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={onSettingsPress} activeOpacity={0.7}>
                    <Text style={styles.greetingText}>{getGreeting()},</Text>
                    <Text style={styles.userNameText}>{profile?.nama || "User"}</Text>
                    <Text style={styles.subGreeting}>Semoga hari ini menyenangkan ✨</Text>
                </TouchableOpacity>

                <View style={{ alignItems: 'flex-end' }}>
                    {isAdmin ? (
                        <TouchableOpacity
                            style={styles.headerAdminBtn}
                            onPress={onAdminMenuPress}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.headerAdminBtnText}>👑 Menu Admin</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={onLogoutPress}
                            style={{ padding: 8 }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: '700', color: '#dc2626' }}>Keluar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: "white",
        paddingVertical: 16,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
        zIndex: 10
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    greetingText: {
        fontSize: 16,
        color: "#6b7280",
        fontWeight: "600",
    },
    userNameText: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1a1a1a",
        marginBottom: 2,
    },
    subGreeting: {
        fontSize: 12,
        color: "#9ca3af",
        fontStyle: "italic",
    },
    headerAdminBtn: {
        backgroundColor: "#fcd34d",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowColor: "#d97706",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    headerAdminBtnText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#78350f"
    },
});