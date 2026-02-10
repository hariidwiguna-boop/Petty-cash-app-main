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
    Platform, // Import Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { supabase, Transaction } from "../../../lib/supabase";
import { DashboardHeader, KpiCards, DailySummary, ActionButtons, RecentTransactions } from "../../../components/dashboard";
import { theme } from "../../../src/design-system/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback } from "react";

export default function DashboardScreen() {
    const { profile, outlet, isAdmin, adminSelectedOutlet, setAdminSelectedOutlet } = useAuthStore();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    // Redirect Admin to Admin Dashboard
    useFocusEffect(
        useCallback(() => {
            if (isAdmin) {
                router.replace("/(app)/(tabs)/admin");
            }
        }, [isAdmin])
    );

    // If admin, don't render anything while redirecting
    if (isAdmin) return null;

    // Admin Outlet Filter State
    // Default to adminSelectedOutlet, fallback to user's outlet
    const selectedOutlet = outlet;

    const [outletsList, setOutletsList] = useState<any[]>([]);
    const [showOutletModal, setShowOutletModal] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // Custom Logout Modal State
    const [isLowBalanceDismissed, setIsLowBalanceDismissed] = useState(false); // Custom Low Balance Popup State

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
        // Fetch logic only for non-admin (since admin is redirected)
        // ... existing logic but since we return null above, this effect might not be needed for admin
        // keeping specific dependency logic safe
    }, [outlet]);

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

    // Auto-refresh when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchDashboardData();
        }, [selectedOutlet])
    );

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
        <LinearGradient
            colors={['#0F172A', '#020617']} // Slate-900 to Slate-950
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={styles.container} edges={["top"]}>
                {/* Fixed Header Component */}
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

                    {/* Spacing for bottom scrolling to clear fixed footer */}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* Custom Big Box Low Balance Popup */}
                {isLowBalance && !isLowBalanceDismissed && (
                    <View style={styles.bigPopupOverlay}>
                        <View style={styles.bigPopupBackdrop} />
                        <View style={styles.bigPopupCard}>
                            <TouchableOpacity
                                style={styles.bigPopupCloseBtn}
                                onPress={() => setIsLowBalanceDismissed(true)}
                            >
                                <Text style={styles.bigPopupCloseText}>✕</Text>
                            </TouchableOpacity>

                            <View style={styles.bigPopupIconContainer}>
                                <Text style={styles.bigPopupIcon}>⚠️</Text>
                            </View>

                            <Text style={styles.bigPopupTitle}>LOW BALANCE ALERT</Text>
                            <Text style={styles.bigPopupMessage}>
                                Your current balance is <Text style={{ fontWeight: 'bold', color: '#F8FAFC' }}>{formatCurrency(dashboardData.saldoSekarang)}</Text>.{'\n'}
                                Please request reimbursement to ensure operational continuity.
                            </Text>

                            <TouchableOpacity
                                style={styles.bigPopupActionBtn}
                                onPress={() => {
                                    setIsLowBalanceDismissed(true);
                                    router.push("/(app)/(tabs)/reimburse");
                                }}
                            >
                                <LinearGradient
                                    colors={['#DC2626', '#991B1B']}
                                    style={styles.bigPopupActionGradient}
                                >
                                    <Text style={styles.bigPopupActionText}>SUBMIT REQUEST</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}



                {/* Fixed Bottom Navigation */}
                <ActionButtons />

                {/* Admin Menu Modal - Fullscreen */}
                <Modal
                    visible={showAdminMenu}
                    animationType="slide"
                    transparent={false}
                    onRequestClose={() => setShowAdminMenu(false)}
                >
                    <View style={styles.adminMenuFullscreen}>
                        {/* Header with Emerald Gradient */}
                        <LinearGradient
                            colors={['#FF3131', '#991B1B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.adminMenuHeader}
                        >
                            <View>
                                <Text style={styles.adminMenuTitle}>EXECUTIVE CONTROL</Text>
                                <Text style={styles.adminMenuSubtitle}>System Authority & Navigation</Text>
                            </View>
                            <TouchableOpacity style={styles.closeCircleBtn} onPress={() => setShowAdminMenu(false)}>
                                <Text style={styles.closeCircleText}>✕</Text>
                            </TouchableOpacity>
                        </LinearGradient>

                        <ScrollView style={styles.adminMenuBody} showsVerticalScrollIndicator={false}>
                            {/* Outlet Selection */}
                            <View style={styles.menuSection}>
                                <Text style={styles.menuSectionTitle}>📍 MONITORING OUTLET</Text>
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
                                <Text style={styles.menuSectionTitle}>🚀 AKSES CEPAT</Text>
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
            </SafeAreaView>
        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    // Removal of legacy styles block
    // Admin Fullscreen Menu
    adminMenuFullscreen: {
        flex: 1,
        backgroundColor: "#020617",
    },
    adminMenuHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    adminMenuTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 2,
    },
    adminMenuSubtitle: {
        fontSize: 11,
        color: "#94A3B8",
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 4,
    },
    closeCircleBtn: {
        width: 40,
        height: 40,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    closeCircleText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF",
    },
    adminMenuBody: {
        flex: 1,
        padding: 24,
    },
    menuSection: {
        marginBottom: 32,
    },
    menuSectionTitle: {
        fontSize: 11,
        fontWeight: "900",
        color: "#475569",
        marginBottom: 16,
        letterSpacing: 2,
    },
    outletSelectionCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        padding: 20,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(30px)' } : {}),
    },
    outletSelectionLabel: {
        fontSize: 10,
        color: "#64748B",
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    outletSelectionValue: {
        fontSize: 16,
        fontWeight: "900",
        color: "#F8FAFC",
        letterSpacing: 0.5,
    },
    outletSelectionAction: {
        fontSize: 12,
        fontWeight: "900",
        color: "#FF3131",
        letterSpacing: 1,
    },
    adminGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    adminGridItem: {
        width: "48%",
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        borderRadius: 24,
        padding: 20,
        alignItems: "center",
        gap: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(30px)' } : {}),
    },
    adminGridIconBg: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    adminGridIcon: {
        fontSize: 22,
    },
    adminGridLabel: {
        fontSize: 12,
        fontWeight: "900",
        color: "#F8FAFC",
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    menuLogoutBtn: {
        backgroundColor: "rgba(220, 38, 38, 0.05)",
        padding: 18,
        borderRadius: 20,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
        borderWidth: 1,
        borderColor: "rgba(220, 38, 38, 0.2)",
    },
    menuLogoutText: {
        fontSize: 14,
        fontWeight: "900",
        color: "#FF3131",
        letterSpacing: 1.5,
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
    },
    // Big Box Custom Popup (Low Balance)
    bigPopupOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
        paddingHorizontal: 24,
    },
    bigPopupBackdrop: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
    },
    bigPopupCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 31, 31, 0.3)',
        shadowColor: "#FF3131",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 40,
        elevation: 15,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(30px)' } : {}),
    },
    bigPopupCloseBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bigPopupCloseText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#94A3B8',
    },
    bigPopupIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(220, 38, 38, 0.3)',
    },
    bigPopupIcon: {
        fontSize: 36,
    },
    bigPopupTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FF3131',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 2,
    },
    bigPopupMessage: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        fontWeight: '500',
    },
    bigPopupActionBtn: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    bigPopupActionGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bigPopupActionText: {
        fontSize: 14,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 1.5,
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
    // Removal of legacy content styles
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
    // Outlet Selector Modal
    modalContent: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderRadius: 32,
        padding: 24,
        maxHeight: "80%",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 20,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(40px)' } : {}),
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
