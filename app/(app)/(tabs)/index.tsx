import * as React from "react";
import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StyleSheet,
    Modal,
    FlatList,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { supabase, Transaction } from "../../../lib/supabase";
import { DashboardHeader, KpiCards, DailySummary, ActionButtons, RecentTransactions } from "../../../components/dashboard";

export default function DashboardScreen() {
    const { profile, outlet, isAdmin, adminSelectedOutlet, setAdminSelectedOutlet } = useAuthStore();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    // Admin Outlet Filter State
    // Default to adminSelectedOutlet, fallback to user's outlet
    const selectedOutlet = isAdmin ? (adminSelectedOutlet || outlet) : outlet;

    const [outletsList, setOutletsList] = useState<any[]>([]);
    const [showOutletModal, setShowOutletModal] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // Custom Logout Modal State

    const [dashboardData, setDashboardData] = useState({
        saldoSekarang: 0,
        saldoAwal: 0,
        kasAwalHariIni: 0,
        kasMasukHariIni: 0,
        kasKeluarHariIni: 0,
        totalKeluar: 0,
        totalMasuk: 0,
        txCountToday: 0,
        biggestExpense: "-",
        recentTransactions: [] as Transaction[],
        todayTransactions: [] as (Transaction & { transaction_items: any[] })[],
    });

    useEffect(() => {
        // If admin and no selected outlet, try to select own outlet
        if (isAdmin && !adminSelectedOutlet && outlet) {
            setAdminSelectedOutlet(outlet);
        }
        if (isAdmin) {
            fetchOutlets();
        }
    }, [outlet, isAdmin, adminSelectedOutlet, setAdminSelectedOutlet]);

    const fetchOutlets = async () => {
        try {
            const { data, error } = await supabase
                .from("outlets")
                .select("*")
                .order("nama_outlet");
            if (!error && data) {
                setOutletsList(data);
            }
        } catch (error) {
            console.error("Fetch outlets error", error);
        }
    };

    const fetchDashboardData = async () => {
        const currentOutlet = selectedOutlet || outlet;
        if (!currentOutlet) return;

        try {
            // Fix: Use local date for 'today' instead of UTC to match user timezone (WIB)
            // Construct YYYY-MM-DD based on local time
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const today = `${year}-${month}-${day}`;

            const { data: transactions, error: txError } = await supabase
                .from("transactions")
                .select("*, transaction_items(*)")
                .eq("outlet_id", currentOutlet.id)
                .order("tanggal", { ascending: false });

            if (txError) throw txError;

            let totalKeluar = 0;
            // let totalMasuk = 0; // Unused
            let kasKeluarHariIni = 0;
            let txCountToday = 0;
            let biggestToday = 0;
            let biggestName = "-";
            const todayTxList: any[] = [];

            const allTx = transactions || [];
            allTx.forEach((tx) => {
                const amount = Number(tx.grand_total) || 0;
                if (tx.tipe === "Kas Keluar") {
                    totalKeluar += amount;
                    if (tx.tanggal === today) {
                        kasKeluarHariIni += amount;
                        txCountToday++;
                        todayTxList.push(tx); // Collect today's transactions
                        if (amount > biggestToday) {
                            biggestToday = amount;
                            biggestName = formatCurrency(amount);
                        }
                    }
                } else {
                    // totalMasuk += amount;
                }
            });

            const { data: kasMasuk } = await supabase
                .from("kas_masuk")
                .select("*")
                .eq("outlet_id", currentOutlet.id);

            let kasMasukTotal = 0;
            let kasMasukHariIni = 0;
            kasMasuk?.forEach((km) => {
                const amount = Number(km.jumlah) || 0;
                kasMasukTotal += amount;
                if (km.tanggal === today) {
                    kasMasukHariIni += amount;
                }
            });

            const saldoAwal = currentOutlet.saldo_awal || 0;
            const saldoSekarang = saldoAwal + kasMasukTotal - totalKeluar;
            const kasAwalHariIni = saldoSekarang + kasKeluarHariIni - kasMasukHariIni;

            setDashboardData({
                saldoSekarang,
                saldoAwal,
                kasAwalHariIni,
                kasMasukHariIni,
                kasKeluarHariIni,
                totalKeluar,
                totalMasuk: kasMasukTotal,
                txCountToday,
                biggestExpense: biggestName,
                recentTransactions: allTx.slice(0, 5),
                todayTransactions: todayTxList,
            });
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [selectedOutlet]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDashboardData();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    const saldoLimit = selectedOutlet?.saldo_limit || 200000;
    const isLowBalance = dashboardData.saldoSekarang <= saldoLimit;
    const usagePercent = Math.min(
        100,
        Math.round((dashboardData.kasKeluarHariIni / (saldoLimit || 1)) * 100)
    );

    const today = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const openSettings = () => {
        router.push("/(app)/(tabs)/profile");
    };

    const handleSelectOutlet = (item: any) => {
        setAdminSelectedOutlet(item);
        setShowOutletModal(false);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return "Selamat Pagi";
        if (hour < 15) return "Selamat Siang";
        if (hour < 18) return "Selamat Sore";
        return "Selamat Malam";
    };

    // confirmLogout replaced by direct modal state setter
    const handleLogoutPress = () => {
        setShowAdminMenu(false);
        setTimeout(() => setShowLogoutConfirm(true), 300);
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* Header Component */}
            <DashboardHeader
                onSettingsPress={openSettings}
                onAdminMenuPress={() => setShowAdminMenu(true)}
                onLogoutPress={handleLogoutPress}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* KPI Cards Component */}
                <KpiCards data={{
                    saldoSekarang: dashboardData.saldoSekarang,
                    kasAwalHariIni: dashboardData.kasAwalHariIni,
                    kasMasukHariIni: dashboardData.kasMasukHariIni,
                    kasKeluarHariIni: dashboardData.kasKeluarHariIni,
                }} />

                {/* Daily Summary Component */}
                <DailySummary 
                    data={{
                        todayTransactions: dashboardData.todayTransactions,
                        usagePercent,
                        saldoLimit,
                    }} 
                    today={today}
                />

                {/* Alert Banner */}
                {isLowBalance && (
                    <View style={styles.alertBanner}>
                        <Text style={styles.alertIcon}>⚠️</Text>
                        <Text style={styles.alertText}>
                            Saldo hampir habis! Segera ajukan reimbursement.
                        </Text>
                    </View>
                )}

                {/* Action Buttons Component */}
                <ActionButtons />

                {/* Recent Transactions Component */}
                <RecentTransactions transactions={dashboardData.recentTransactions} />

                {/* Footer */}
                <View style={styles.footer}>
                    <View style={styles.footerUser}>
                        <Text style={styles.footerUserIcon}>👤</Text>
                        <Text style={styles.footerUserName}>{profile?.nama || "User"}</Text>

                    </View>
                </View>
            </ScrollView>

            {/* Admin Menu Modal */}
            <Modal
                visible={showAdminMenu}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAdminMenu(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAdminMenu(false)}
                >
                    <View style={styles.adminMenuContent}>
                        <View style={styles.adminMenuHeader}>
                            <View>
                                <Text style={styles.adminMenuTitle}>👑 Admin Control Center</Text>
                                <Text style={styles.adminMenuSubtitle}>Pusat kendali & navigasi</Text>
                            </View>
                            <TouchableOpacity style={styles.closeCircleBtn} onPress={() => setShowAdminMenu(false)}>
                                <Text style={styles.closeCircleText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.adminMenuBody} showsVerticalScrollIndicator={false}>
                            {/* Outlet Selection */}
                            <View style={styles.menuSection}>
                                <Text style={styles.menuSectionTitle}>📍 Monitoring Outlet</Text>
                                <TouchableOpacity
                                    style={styles.outletSelectionCard}
                                    onPress={() => {
                                        setShowAdminMenu(false);
                                        setTimeout(() => setShowOutletModal(true), 300);
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.outletSelectionLabel}>Outlet Aktif:</Text>
                                        <Text style={styles.outletSelectionValue}>{selectedOutlet?.nama_outlet || "Semua Outlet"}</Text>
                                    </View>
                                    <Text style={styles.outletSelectionAction}>Ganti ›</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Shortcuts Grid */}
                            <View style={styles.menuSection}>
                                <Text style={styles.menuSectionTitle}>🚀 Akses Cepat</Text>
                                <View style={styles.adminGrid}>
                                    <TouchableOpacity style={styles.adminGridItem} onPress={() => { setShowAdminMenu(false); router.push("/(app)/(tabs)/admin" as any); }}>
                                        <View style={[styles.adminGridIconBg, { backgroundColor: '#fffbeb' }]}>
                                            <Text style={styles.adminGridIcon}>📊</Text>
                                        </View>
                                        <Text style={styles.adminGridLabel}>Dashboard</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.adminGridItem} onPress={() => { setShowAdminMenu(false); router.push("/(app)/(tabs)/admin/approval" as any); }}>
                                        <View style={[styles.adminGridIconBg, { backgroundColor: '#ecfdf5' }]}>
                                            <Text style={styles.adminGridIcon}>✅</Text>
                                        </View>
                                        <Text style={styles.adminGridLabel}>Approval</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.adminGridItem} onPress={() => { setShowAdminMenu(false); router.push("/(app)/(tabs)/admin/settings" as any); }}>
                                        <View style={[styles.adminGridIconBg, { backgroundColor: '#f0f9ff' }]}>
                                            <Text style={styles.adminGridIcon}>⚙️</Text>
                                        </View>
                                        <Text style={styles.adminGridLabel}>Settings</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.adminGridItem} onPress={() => { setShowAdminMenu(false); router.push("/(app)/(tabs)/admin/users" as any); }}>
                                        <View style={[styles.adminGridIconBg, { backgroundColor: '#f5f3ff' }]}>
                                            <Text style={styles.adminGridIcon}>👥</Text>
                                        </View>
                                        <Text style={styles.adminGridLabel}>Users</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Logout */}
                            <TouchableOpacity
                                style={styles.menuLogoutBtn}
                                onPress={() => {
                                    setShowAdminMenu(false);
                                    setTimeout(handleLogoutPress, 300);
                                }}
                            >
                                <Text style={styles.menuLogoutText}>🚪 Keluar Aplikasi</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Custom Logout Confirmation Modal */}
            <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, marginHorizontal: 20, width: '80%' }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center', color: '#ef4444' }}>
                            ⚠️ Konfirmasi Keluar
                        </Text>
                        <Text style={{ textAlign: 'center', marginBottom: 24, fontSize: 16, color: '#374151' }}>
                            Apakah Anda yakin ingin keluar dari aplikasi?
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                                onPress={() => setShowLogoutConfirm(false)}
                            >
                                <Text style={{ fontWeight: '700', color: '#64748b' }}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ flex: 1, backgroundColor: '#ef4444', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                                onPress={() => {
                                    setShowLogoutConfirm(false);
                                    setTimeout(() => useAuthStore.getState().signOut(), 300);
                                }}
                            >
                                <Text style={{ fontWeight: '700', color: 'white' }}>Ya, Keluar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Outlet Selector Modal */}
            <Modal
                visible={showOutletModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowOutletModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowOutletModal(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Pilih Outlet Monitoring</Text>
                            <TouchableOpacity onPress={() => setShowOutletModal(false)}>
                                <Text style={styles.closeText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={outletsList}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.outletItem,
                                        selectedOutlet?.id === item.id && styles.outletItemSelected
                                    ]}
                                    onPress={() => handleSelectOutlet(item)}
                                >
                                    <Text style={[
                                        styles.outletName,
                                        selectedOutlet?.id === item.id && styles.outletNameSelected
                                    ]}>{item.nama_outlet}</Text>
                                    {selectedOutlet?.id === item.id && <Text style={styles.checkIcon}>✓</Text>}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f4d0",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
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
    adminBadgeHeader: {
        backgroundColor: "#fcd34d",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 4,
        alignSelf: 'flex-end',
    },
    adminBadgeTextHeader: {
        fontSize: 10,
        fontWeight: "800",
        color: "#78350f",
    },
    outletSelector: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f9fafb",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        gap: 6,
    },
    outletNameHeader: {
        fontSize: 13,
        fontWeight: "700",
        color: "#374151",
        maxWidth: 120,
    },
    outletChangeIcon: {
        fontSize: 10,
        color: "#9ca3af",
    },
    // Admin Shortcuts
    adminShortcutContainer: {
        paddingTop: 0,
    },
    adminShortcutScroll: {
        paddingHorizontal: 20,
        gap: 8,
    },
    adminChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fffbeb',
        borderWidth: 1,
        borderColor: '#fcd34d',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 100,
    },
    adminChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#92400e',
    },
    kpiGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        padding: 20,
        paddingTop: 24, // Added padding since header is removed from scrollview
    },
    kpiCard: {
        width: "48%",
        backgroundColor: "white",
        borderRadius: 14,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    kpiSaldo: {},
    kpiKasAwal: {},
    kpiKasMasuk: {},
    kpiKasKeluar: {},
    kpiIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    kpiIconText: {
        fontSize: 24,
    },
    kpiInfo: {
        flex: 1,
    },
    kpiLabel: {
        fontSize: 10,
        color: "#666",
        fontWeight: "500",
        marginBottom: 2,
    },
    kpiValue: {
        fontSize: 14,
        fontWeight: "800",
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
    // Admin Menu Modal Styles
    adminMenuContent: {
        backgroundColor: "white",
        width: "90%",
        borderRadius: 24,
        alignSelf: "center",
        overflow: "hidden",
        marginTop: "auto",
        marginBottom: "auto",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
        maxHeight: "85%", // Limit height on small screens
    },
    adminMenuHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fffbeb",
        borderBottomWidth: 1,
        borderBottomColor: "#fcd34d",
    },
    adminMenuTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#92400e",
    },
    adminMenuSubtitle: {
        fontSize: 12,
        color: "#b45309",
    },
    closeCircleBtn: {
        width: 32,
        height: 32,
        backgroundColor: "white",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    closeCircleText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#92400e",
    },
    adminMenuBody: {
        padding: 20,
    },
    menuSection: {
        marginBottom: 24,
    },
    menuSectionTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#6b7280",
        marginBottom: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    outletSelectionCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 16,
        borderRadius: 16,
    },
    outletSelectionLabel: {
        fontSize: 12,
        color: "#6b7280",
    },
    outletSelectionValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1f2937",
    },
    outletSelectionAction: {
        fontSize: 14,
        fontWeight: "700",
        color: "#2563eb",
    },
    adminGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    adminGridItem: {
        width: "48%", // Approximately 2 columns
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        gap: 8,
    },
    adminGridIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    adminGridIcon: {
        fontSize: 24,
    },
    adminGridLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
    },
    menuLogoutBtn: {
        backgroundColor: "#fee2e2",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    menuLogoutText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#dc2626",
    },
    dailySummaryCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
    },
    dailyHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    dailyIcon: {
        fontSize: 20,
    },
    dailyTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    dailyDate: {
        fontSize: 12,
        color: "#666",
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        borderStyle: "dashed",
    },
    dailyStats: {
        marginBottom: 14,
        gap: 6,
    },
    dailyStatItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    dailyStatIcon: {
        fontSize: 16,
    },
    dailyStatText: {
        fontSize: 13,
        color: "#444",
    },
    dailyStatBold: {
        fontWeight: "700",
        color: "#1a1a1a",
    },
    progressContainer: {
        backgroundColor: "#f9fafb",
        borderRadius: 10,
        padding: 12,
    },
    progressLabel: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    progressLabelText: {
        fontSize: 12,
        color: "#666",
    },
    progressPercent: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    progressBar: {
        height: 8,
        backgroundColor: "#e5e7eb",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#22c55e",
        borderRadius: 4,
    },
    progressWarning: {
        backgroundColor: "#f59e0b",
    },
    progressDanger: {
        backgroundColor: "#ef4444",
    },
    progressHint: {
        fontSize: 11,
        color: "#9ca3af",
        marginTop: 6,
        textAlign: "right",
    },
    alertBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#fef3c7",
        borderWidth: 1,
        borderColor: "#fbbf24",
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    alertIcon: {
        fontSize: 20,
    },
    alertText: {
        flex: 1,
        fontSize: 13,
        fontWeight: "600",
        color: "#92400e",
    },
    mainActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: "#C94C4C",
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: "#C94C4C",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 25,
        elevation: 8,
    },
    mainActionIcon: {
        fontSize: 28,
    },
    mainActionText: {
        fontSize: 18,
        fontWeight: "800",
        color: "white",
    },
    actionGrid: {
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    actionCard: {
        flex: 1,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
        alignItems: "center",
        gap: 8,
    },
    actionIcon: {
        fontSize: 28,
    },
    actionLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#666",
        textAlign: "center",
        lineHeight: 14,
    },
    recentSection: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 12,
        color: "#1a1a1a",
    },
    txItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#f8fafc",
        borderRadius: 10,
        marginBottom: 8,
    },
    txItemInfo: {
        flex: 1,
    },
    txItemDesc: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1a1a1a",
    },
    txItemDate: {
        fontSize: 11,
        color: "#666",
    },
    txItemAmount: {
        fontSize: 14,
        fontWeight: "800",
        color: "#dc2626",
    },
    txEmpty: {
        textAlign: "center",
        color: "#999",
        fontSize: 13,
        padding: 24,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "white",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        marginTop: 20,
    },
    footerUser: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    footerUserIcon: {
        fontSize: 20,
    },
    footerUserName: {
        fontSize: 13,
        fontWeight: "600",
        color: "#666",
    },
    section: {
        backgroundColor: "white",
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    adminBadge: {
        backgroundColor: "#fef3c7",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    adminBadgeText: {
        fontSize: 10,
        fontWeight: "700",
        color: "#d97706",
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 20,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    closeText: {
        fontSize: 18,
        color: "#666",
    },
    outletItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#f9fafb",
    },
    outletItemSelected: {
        backgroundColor: "#eff6ff",
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    outletName: {
        fontSize: 15,
        color: "#374151",
    },
    outletNameSelected: {
        fontWeight: "700",
        color: "#2563eb",
    },
    checkIcon: {
        color: "#2563eb",
        fontWeight: "bold",
    },
});
