import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView, Modal } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";

export default function ProfileScreen() {
    const { profile, outlet, signOut, isAdmin } = useAuthStore();
    const router = useRouter();

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
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                    <View>
                        <Text style={styles.modalTitle}>Pengaturan</Text>
                        <Text style={styles.modalSubtitle}>Kelola akun Anda</Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                        <Text style={styles.closeBtnText}>X</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    {/* User Info Card */}
                    <View style={styles.userCard}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>👤</Text>
                        </View>
                        <Text style={styles.userName}>{profile?.nama || "User"}</Text>
                        <Text style={styles.userUsername}>@{profile?.username || "user"}</Text>
                        <View style={[styles.roleBadge, showAdminMenu && styles.adminRoleBadge]}>
                            <Text style={[styles.roleText, showAdminMenu && styles.adminRoleText]}>
                                {profile?.role || "User"}
                            </Text>
                        </View>
                    </View>

                    {/* Outlet Info */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>Outlet</Text>
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
                    <View style={styles.menuCard}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(app)/(tabs)/daily-report")}>
                            <Text style={styles.menuIcon}>📊</Text>
                            <Text style={styles.menuLabel}>Laporan Harian</Text>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(app)/(tabs)/status")}>
                            <Text style={styles.menuIcon}>📋</Text>
                            <Text style={styles.menuLabel}>Status Reimburse</Text>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Admin Menu - Show for admin users */}
                    {showAdminMenu && (
                        <View style={styles.adminCard}>
                            <View style={styles.adminHeader}>
                                <Text style={styles.adminTitle}>👑 Menu Admin</Text>
                            </View>
                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(app)/(tabs)/admin" as any)}>
                                <Text style={styles.menuIcon}>🏠</Text>
                                <Text style={styles.menuLabel}>Admin Dashboard</Text>
                                <Text style={styles.menuArrow}>›</Text>
                            </TouchableOpacity>
                            <View style={styles.menuDivider} />
                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(app)/(tabs)/admin/approval" as any)}>
                                <Text style={styles.menuIcon}>✅</Text>
                                <Text style={styles.menuLabel}>Approval Reimburse</Text>
                                <Text style={styles.menuArrow}>›</Text>
                            </TouchableOpacity>
                            <View style={styles.menuDivider} />
                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(app)/(tabs)/admin/users" as any)}>
                                <Text style={styles.menuIcon}>👥</Text>
                                <Text style={styles.menuLabel}>Kelola User</Text>
                                <Text style={styles.menuArrow}>›</Text>
                            </TouchableOpacity>
                            <View style={styles.menuDivider} />
                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(app)/(tabs)/admin/outlets" as any)}>
                                <Text style={styles.menuIcon}>🏪</Text>
                                <Text style={styles.menuLabel}>Kelola Outlet</Text>
                                <Text style={styles.menuArrow}>›</Text>
                            </TouchableOpacity>
                            <View style={styles.menuDivider} />
                            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/(app)/(tabs)/admin/reports" as any)}>
                                <Text style={styles.menuIcon}>📊</Text>
                                <Text style={styles.menuLabel}>Reports</Text>
                                <Text style={styles.menuArrow}>›</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>

                {/* Footer */}
                <View style={styles.modalFooter}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Keluar</Text>
                    </TouchableOpacity>
                    <Text style={styles.version}>Petty Cash App v1.0.0</Text>
                </View>
            </View>
            {/* Logout Confirmation Modal */}
            <Modal visible={logoutModalVisible} transparent animationType="fade">
                <View style={[styles.modalCard, { backgroundColor: 'rgba(0,0,0,0.5)', margin: 0, borderRadius: 0, justifyContent: 'center', padding: 20 }]}>
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, marginHorizontal: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center', color: '#ef4444' }}>
                            ⚠️ Konfirmasi Keluar
                        </Text>

                        <Text style={{ textAlign: 'center', marginBottom: 24, fontSize: 16, color: '#374151' }}>
                            Apakah Anda yakin ingin keluar dari aplikasi?
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                                onPress={() => setLogoutModalVisible(false)}
                            >
                                <Text style={{ fontWeight: '700', color: '#64748b' }}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                                onPress={confirmLogout}
                            >
                                <Text style={{ fontWeight: '700', color: 'white' }}>Ya, Keluar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f0f4d0" },
    modalCard: {
        flex: 1,
        backgroundColor: "white",
        margin: 16,
        borderRadius: 20,
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    modalTitle: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },
    modalSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
    },
    closeBtnText: { fontSize: 16, color: "#64748b" },
    modalContent: { flex: 1, padding: 20 },
    // User Card
    userCard: {
        alignItems: "center",
        padding: 20,
        backgroundColor: "#f9fafb",
        borderRadius: 16,
        marginBottom: 16,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#e0e7ff",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    avatarText: { fontSize: 32 },
    userName: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
    userUsername: { fontSize: 13, color: "#666", marginTop: 2 },
    roleBadge: {
        backgroundColor: "#dbeafe",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
    },
    adminRoleBadge: { backgroundColor: "#fef3c7" },
    roleText: { fontSize: 12, fontWeight: "600", color: "#1d4ed8" },
    adminRoleText: { color: "#d97706" },
    // Info Card
    infoCard: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },
    infoTitle: { fontSize: 11, color: "#9ca3af", fontWeight: "600", marginBottom: 4 },
    infoValue: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
    infoRow: {
        flexDirection: "row",
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
    },
    infoItem: { flex: 1 },
    infoLabel: { fontSize: 11, color: "#9ca3af" },
    infoAmount: { fontSize: 14, fontWeight: "700", color: "#374151", marginTop: 2 },
    // Menu Card
    menuCard: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 12,
    },
    menuItem: { flexDirection: "row", alignItems: "center", padding: 14 },
    menuIcon: { fontSize: 18, marginRight: 12 },
    menuLabel: { flex: 1, fontSize: 14, color: "#374151", fontWeight: "500" },
    menuArrow: { fontSize: 18, color: "#d1d5db" },
    menuDivider: { height: 1, backgroundColor: "#f3f4f6", marginLeft: 44 },
    // Admin Card
    adminCard: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#fbbf24",
        borderRadius: 14,
        overflow: "hidden",
    },
    adminHeader: {
        backgroundColor: "#fffbeb",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#fef3c7",
    },
    adminTitle: { fontSize: 12, fontWeight: "700", color: "#92400e" },
    // Footer
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        alignItems: "center",
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fee2e2",
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
        width: "100%",
        marginBottom: 12,
    },
    logoutText: { fontSize: 14, fontWeight: "700", color: "#dc2626" },
    version: { fontSize: 11, color: "#9ca3af" },
});
