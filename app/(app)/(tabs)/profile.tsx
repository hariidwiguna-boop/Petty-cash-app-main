import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView, Modal, Platform } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { LinearGradient } from "expo-linear-gradient";
import GlassCard from "../../../src/design-system/components/glass/GlassCard";
import { Ionicons } from "@expo/vector-icons";
import { useResponsive } from "../../../src/hooks/useResponsive";

export default function ProfileScreen() {
    const { profile, outlet, signOut, isAdmin } = useAuthStore();
    const router = useRouter();
    const { fontScale } = useResponsive();

    // Debug
    console.log("Profile:", profile);
    console.log("Is Admin:", isAdmin, "Role:", profile?.role);

    // Logout Modal State
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);

    const handleLogout = () => {
        setLogoutModalVisible(true);
    };

    const confirmLogout = () => {
        setLogoutModalVisible(false);
        setTimeout(() => {
            signOut();
        }, 300); // Small delay for animation
    };

    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    // Check if admin - accept both 'Admin' and 'admin' 
    const showAdminMenu = isAdmin || profile?.role?.toLowerCase() === 'admin';

    return (
        <LinearGradient
            colors={['#E61E28', '#FFFFFF']} // Brand Red to White
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradientBackground}
        >
            <SafeAreaView style={styles.container} edges={["top"]}>
                <GlassCard
                    elevation="extreme"
                    radius="2xl"
                    style={styles.mainCard}
                    reflection={true}
                >
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={[styles.modalTitle, { fontSize: fontScale(22) }]}>Pengaturan</Text>
                            <Text style={[styles.modalSubtitle, { fontSize: fontScale(13) }]}>Kelola akun Anda</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                            <Ionicons name="close" size={24} color="rgba(0,0,0,0.5)" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {/* User Info Card */}
                        <View style={styles.userCard}>
                            <LinearGradient
                                colors={['#FEE2E2', '#FEF2F2']}
                                style={styles.avatarContainer}
                            >
                                <Ionicons name="person" size={32} color="#DC2626" />
                            </LinearGradient>
                            <Text style={[styles.userName, { fontSize: fontScale(20) }]}>{profile?.nama || "User"}</Text>
                            <Text style={styles.userUsername}>@{profile?.username || "user"}</Text>
                            <View style={[styles.roleBadge, showAdminMenu && styles.adminRoleBadge]}>
                                <Text style={[styles.roleText, showAdminMenu && styles.adminRoleText]}>
                                    {profile?.role || "User"}
                                </Text>
                            </View>
                        </View>

                        {/* Outlet Info */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoSectionTitle}>STORE INFORMATION</Text>
                            <Text style={styles.infoValue}>{outlet?.nama_outlet || "Tidak terdaftar"}</Text>
                            {outlet && (
                                <View style={styles.infoRow}>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Saldo Awal</Text>
                                        <Text style={styles.infoAmount}>{formatCurrency(outlet.saldo_awal || 0)}</Text>
                                    </View>
                                    <View style={styles.infoItem}>
                                        <Text style={styles.infoLabel}>Limit Alert</Text>
                                        <Text style={styles.infoAmount}>{formatCurrency(outlet.saldo_limit || 0)}</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Menu Items */}
                        <View style={styles.menuContainer}>
                            <Text style={styles.menuSectionTitle}>APP MENU</Text>
                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(app)/(tabs)/daily-report")}>
                                <View style={styles.menuItemLeft}>
                                    <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                        <Ionicons name="bar-chart" size={18} color="#3B82F6" />
                                    </View>
                                    <Text style={styles.menuLabel}>Laporan Harian</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.2)" />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(app)/(tabs)/status")}>
                                <View style={styles.menuItemLeft}>
                                    <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                        <Ionicons name="list" size={18} color="#10B981" />
                                    </View>
                                    <Text style={styles.menuLabel}>Status Reimburse</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.2)" />
                            </TouchableOpacity>
                        </View>

                        {/* Admin Menu - Show for admin users */}
                        {showAdminMenu && (
                            <View style={[styles.menuContainer, { marginTop: 20 }]}>
                                <Text style={[styles.menuSectionTitle, { color: '#D97706' }]}>ADMIN SUITE</Text>
                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(app)/(tabs)/admin" as any)}>
                                    <View style={styles.menuItemLeft}>
                                        <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
                                            <Ionicons name="shield-checkmark" size={18} color="#D97706" />
                                        </View>
                                        <Text style={styles.menuLabel}>Admin Dashboard</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.2)" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(app)/(tabs)/admin/approval" as any)}>
                                    <View style={styles.menuItemLeft}>
                                        <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
                                            <Ionicons name="checkmark-circle" size={18} color="#D97706" />
                                        </View>
                                        <Text style={styles.menuLabel}>Approval Reimburse</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="rgba(0,0,0,0.2)" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                            <Text style={styles.logoutText}>Keluar Sesi</Text>
                        </TouchableOpacity>
                        <Text style={styles.version}>Petty Cash App v1.0.0</Text>
                    </View>
                </GlassCard>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },
    container: { flex: 1 },
    mainCard: {
        flex: 1,
        margin: 16,
        alignSelf: 'center',
        width: '94%',
        maxWidth: 1000,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.03)",
    },
    modalTitle: {
        fontWeight: "900",
        color: "black",
        letterSpacing: -0.5,
    },
    modalSubtitle: {
        color: "rgba(0, 0, 0, 0.4)",
        fontWeight: '600',
        marginTop: 2,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.03)",
        alignItems: "center",
        justifyContent: "center",
    },
    modalContent: { flex: 1, padding: 24 },
    // User Card
    userCard: {
        alignItems: "center",
        padding: 24,
        backgroundColor: "rgba(0,0,0,0.02)",
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        shadowColor: "#DC2626",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    userName: { fontWeight: "900", color: "black", letterSpacing: -0.5 },
    userUsername: { fontSize: 13, color: "rgba(0, 0, 0, 0.4)", fontWeight: '600', marginTop: 4 },
    roleBadge: {
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 12,
    },
    adminRoleBadge: { backgroundColor: "rgba(217, 119, 6, 0.1)" },
    roleText: { fontSize: 11, fontWeight: "800", color: "#3B82F6", textTransform: 'uppercase', letterSpacing: 0.5 },
    adminRoleText: { color: "#D97706" },
    // Info Card
    infoCard: {
        backgroundColor: "rgba(0,0,0,0.02)",
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    infoSectionTitle: { fontSize: 10, fontWeight: "800", color: "rgba(0,0,0,0.3)", letterSpacing: 1, marginBottom: 12 },
    infoValue: { fontSize: 18, fontWeight: "900", color: "black", letterSpacing: -0.5 },
    infoRow: {
        flexDirection: "row",
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.03)",
        gap: 20,
    },
    infoItem: { flex: 1 },
    infoLabel: { fontSize: 11, color: "rgba(0,0,0,0.4)", fontWeight: '600' },
    infoAmount: { fontSize: 14, fontWeight: "800", color: "black", marginTop: 4 },
    // Menu
    menuContainer: {
        gap: 8,
    },
    menuSectionTitle: { fontSize: 10, fontWeight: "800", color: "rgba(0,0,0,0.3)", letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: 'space-between',
        padding: 14,
        backgroundColor: "rgba(0,0,0,0.02)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.04)",
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: { fontSize: 14, color: "black", fontWeight: "700" },
    // Footer
    modalFooter: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.03)",
        alignItems: "center",
        gap: 12,
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(220, 38, 38, 0.05)",
        paddingVertical: 14,
        borderRadius: 14,
        width: "100%",
        gap: 8,
    },
    logoutText: { fontSize: 14, fontWeight: "800", color: "#DC2626" },
    version: { fontSize: 11, color: "rgba(0, 0, 0, 0.2)", fontWeight: '600' },
});
