import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Image, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../../stores/authStore";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import AdminLayout from "../../../../components/admin/AdminLayout";
import AdminGlassCard from "../../../../components/admin/AdminGlassCard";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';



export default function AdminControlCenter() {
    const { profile, signOut, adminSelectedOutlet, setAdminSelectedOutlet } = useAuthStore();
    const router = useRouter();

    // Logout Modal State
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);

    // Outlet Selection State
    const [showOutletModal, setShowOutletModal] = useState(false);
    const [outlets, setOutlets] = useState<any[]>([]);

    // Dashboard Stats State
    const [dashboardStats, setDashboardStats] = useState({
        totalBalance: 0,
        criticalOutlets: 0,
        pendingApprovals: 0,
        totalOutlets: 0,
        recentActivity: [] as any[]
    });
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleSelectOutlet = (outlet: any) => {
        setAdminSelectedOutlet(outlet); // If outlet is null, it means "Semua Outlet"
        setShowOutletModal(false);
    };

    // Transaction Detail Modal State
    const [selectedTx, setSelectedTx] = useState<any>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    const openTransactionDetail = (tx: any) => {
        setSelectedTx(tx);
        setDetailModalVisible(true);
    };

    const fetchDashboardData = async () => {
        setIsLoadingStats(true);
        try {
            // 1. Fetch Outlets
            const { data: outletsData } = await supabase.from("outlets").select("*");
            const outletList = outletsData || [];

            // 2. Fetch All Transactions (Optimized: only needed fields)
            const { data: allTx } = await supabase
                .from("transactions")
                .select("outlet_id, tipe, grand_total, status_reimburse");

            // 3. Fetch All Kas Masuk (Capital)
            const { data: allKasMasuk } = await supabase
                .from("kas_masuk")
                .select("outlet_id, jumlah");

            // 4. Fetch Pending Approvals count (Reimbursements)
            const { count: pendingTxs } = await supabase
                .from("reimbursements")
                .select("*", { count: 'exact', head: true })
                .eq("status", "Pending");

            // 5. Fetch Recent Activity (With Items)
            const { data: recentTx } = await supabase
                .from("transactions") // Fixed table name
                .select(`
                    *,
                    items:transaction_items(*),
                    outlets(nama_outlet)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            let totalBal = 0;
            let criticalCount = 0;

            // Calculate Balance per Outlet
            const updatedOutlets = outletList.map((o: any) => {
                const outletTx = allTx?.filter(tx => tx.outlet_id === o.id) || [];
                const outletKas = allKasMasuk?.filter(k => k.outlet_id === o.id) || [];

                const totalKasMasuk = outletKas.reduce((sum, item) => sum + (item.jumlah || 0), 0);
                const totalTxKeluar = outletTx
                    .filter(tx => tx.tipe === 'Kas Keluar')
                    .reduce((sum, item) => sum + (item.grand_total || 0), 0);

                const currentSaldo = (o.saldo_awal || 0) + totalKasMasuk - totalTxKeluar;

                totalBal += currentSaldo;
                if (currentSaldo < 500000) criticalCount++;

                return { ...o, saldo: currentSaldo }; // Attach calculated saldo for display
            });

            setDashboardStats({
                totalBalance: totalBal,
                criticalOutlets: criticalCount,
                pendingApprovals: pendingTxs || 0,
                totalOutlets: outletList.length,
                recentActivity: recentTx || []
            });
            setOutlets(updatedOutlets);

        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleLogout = () => {
        setLogoutModalVisible(true);
    };

    const confirmLogout = async () => {
        setLogoutModalVisible(false);
        // Add small delay for modal animation
        setTimeout(async () => {
            await signOut();
            router.replace("/(auth)/login");
        }, 300);
    };

    // Helper for currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Format relative time (simple version)
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AdminLayout
            title="Admin Control Center"
            subtitle={`Halo, ${profile?.nama || 'Admin'}`}
            showBackButton={false}
            scrollable={false}
            rightAction={
                <TouchableOpacity
                    onPress={handleLogout}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons name="power" size={20} color="white" />
                </TouchableOpacity>
            }
        >
            <View style={styles.containerWrapper}>
                {/* Main Scrollable Content */}
                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                    {/* 1. HERO SECTION: Global Financial Overview */}
                    <View style={styles.sectionContainer}>
                        <AdminGlassCard style={styles.heroCard} intensity="heavy">
                            <View style={styles.heroContent}>
                                <View>
                                    <Text style={styles.heroLabel}>Total Saldo Perusahaan</Text>
                                    <Text style={styles.heroValue}>
                                        {isLoadingStats ? "..." : formatCurrency(dashboardStats.totalBalance)}
                                    </Text>
                                    <Text style={styles.heroSub}>
                                        Dari {dashboardStats.totalOutlets} Outlet Aktif
                                    </Text>
                                </View>
                                <View style={styles.heroIconCircle}>
                                    <Text style={styles.heroIcon}>💰</Text>
                                </View>
                            </View>
                        </AdminGlassCard>
                    </View>

                    {/* 2. ACTIONABLE INSIGHTS */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionLabel}>⚠️ STATUS & PERHATIAN</Text>
                        <View style={styles.statsGrid}>
                            {/* Critical Outlets */}
                            <AdminGlassCard
                                style={styles.glassStatCard}
                                onPress={() => router.push("/(app)/(tabs)/admin/outlets")}
                            >
                                <View style={styles.statHeader}>
                                    <Text style={styles.statIcon}>🔴</Text>
                                    <Text style={[styles.statCount, { color: "#dc2626" }]}>
                                        {dashboardStats.criticalOutlets}
                                    </Text>
                                </View>
                                <Text style={styles.glassStatLabel}>Outlet Kritis</Text>
                                <Text style={styles.glassStatSub}>Saldo &lt; 500rb</Text>
                            </AdminGlassCard>

                            {/* Pending Approvals */}
                            <AdminGlassCard
                                style={styles.glassStatCard}
                                onPress={() => router.push("/(app)/(tabs)/admin/approval")}
                            >
                                <View style={styles.statHeader}>
                                    <Text style={styles.statIcon}>🟠</Text>
                                    <Text style={[styles.statCount, { color: "#ea580c" }]}>
                                        {dashboardStats.pendingApprovals}
                                    </Text>
                                </View>
                                <Text style={styles.glassStatLabel}>Menunggu</Text>
                                <Text style={styles.glassStatSub}>Approval</Text>
                            </AdminGlassCard>

                            {/* Total Outlets (Info) */}
                            <AdminGlassCard
                                style={styles.glassStatCard}
                                onPress={() => router.push("/(app)/(tabs)/admin/outlets")}
                            >
                                <View style={styles.statHeader}>
                                    <Text style={styles.statIcon}>🔵</Text>
                                    <Text style={[styles.statCount, { color: "#2563eb" }]}>
                                        {dashboardStats.totalOutlets}
                                    </Text>
                                </View>
                                <Text style={styles.glassStatLabel}>Total Outlet</Text>
                                <Text style={styles.glassStatSub}>Aktif Beroperasi</Text>
                            </AdminGlassCard>
                        </View>
                    </View>

                    {/* 3. RECENT ACTIVITY (NEW) */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionLabel}>⏱️ AKTIVITAS TERBARU</Text>
                        <AdminGlassCard style={styles.recentActivityCard}>
                            {dashboardStats.recentActivity.length > 0 ? (
                                dashboardStats.recentActivity.map((tx, index) => (
                                    <TouchableOpacity
                                        key={tx.id}
                                        style={[
                                            styles.activityItem,
                                            index === dashboardStats.recentActivity.length - 1 && styles.lastActivityItem
                                        ]}
                                        onPress={() => openTransactionDetail(tx)}
                                    >
                                        <View style={styles.activityLeft}>
                                            <View style={styles.activityIconBg}>
                                                <Text style={{ fontSize: 16 }}>
                                                    {tx.tipe === 'Kas Keluar' ? '📤' : '📥'}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text style={styles.activityOutlet}>
                                                    {tx.outlets?.nama_outlet || 'Unknown'}
                                                </Text>
                                                <Text style={styles.activityTime}>
                                                    {formatTime(tx.created_at)} • {tx.items?.[0]?.deskripsi || 'Transaksi'} {tx.items?.length > 1 ? `+${tx.items.length - 1} lainnya` : ''}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[
                                                styles.activityAmount,
                                                tx.tipe === 'Kas Keluar' ? styles.textRed : styles.textGreen
                                            ]}>
                                                {tx.tipe === 'Kas Keluar' ? '-' : '+'}
                                                {formatCurrency(tx.grand_total)}
                                            </Text>
                                            <Text style={{ fontSize: 10, color: '#3b82f6', marginTop: 2 }}>Lihat Detail ›</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <View style={styles.emptyActivity}>
                                    <Text style={styles.emptyActivityText}>Belum ada aktivitas hari ini</Text>
                                </View>
                            )}
                        </AdminGlassCard>
                    </View>

                    {/* Padding for Footer */}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* 4. FIXED FOOTER: AKSES CEPAT */}
                <View style={styles.fixedFooter}>
                    <Text style={styles.footerLabel}>🚀 AKSES CEPAT</Text>
                    <View style={styles.footerGrid}>
                        {/* Row 1 */}
                        <TouchableOpacity style={styles.footerItem} onPress={() => router.push("/(app)/(tabs)/admin/approval")}>
                            <View style={[styles.footerIconBox, { backgroundColor: "#ecfdf5" }]}>
                                <Text style={styles.footerIcon}>✅</Text>
                            </View>
                            <Text style={styles.footerText}>Approval</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.footerItem} onPress={() => router.push("/(app)/(tabs)/admin/history" as any)}>
                            <View style={[styles.footerIconBox, { backgroundColor: "#fef3c7" }]}>
                                <Text style={styles.footerIcon}>📜</Text>
                            </View>
                            <Text style={styles.footerText}>Riwayat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.footerItem} onPress={() => router.push("/(app)/(tabs)/reports" as any)}>
                            <View style={[styles.footerIconBox, { backgroundColor: "#fdf2f8" }]}>
                                <Text style={styles.footerIcon}>📈</Text>
                            </View>
                            <Text style={styles.footerText}>Laporan</Text>
                        </TouchableOpacity>

                        {/* Row 2 */}
                        <TouchableOpacity style={styles.footerItem} onPress={() => router.push("/(app)/(tabs)/admin/settings")}>
                            <View style={[styles.footerIconBox, { backgroundColor: "#f0f9ff" }]}>
                                <Text style={styles.footerIcon}>⚙️</Text>
                            </View>
                            <Text style={styles.footerText}>Settings</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Logout Confirmation Modal */}
            <Modal visible={logoutModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.confirmModal}>
                        <Text style={styles.confirmTitle}>⚠️ Konfirmasi Keluar</Text>
                        <Text style={styles.confirmMessage}>Apakah Anda yakin ingin keluar dari aplikasi?</Text>
                        <View style={styles.confirmActions}>
                            <TouchableOpacity
                                style={[styles.confirmBtn, styles.cancelBtn]}
                                onPress={() => setLogoutModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmBtn, styles.logoutConfirmBtn]}
                                onPress={confirmLogout}
                            >
                                <Text style={styles.logoutConfirmText}>Ya, Keluar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Outlet Selection Modal */}
            <Modal visible={showOutletModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.outletModalCard}>
                        <View style={styles.outletModalHeader}>
                            <Text style={styles.outletModalTitle}>Pilih Outlet</Text>
                            <TouchableOpacity onPress={() => setShowOutletModal(false)}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.outletList}>
                            <TouchableOpacity
                                style={styles.outletItem}
                                onPress={() => handleSelectOutlet(null)}
                            >
                                <Text style={[
                                    styles.outletName,
                                    !adminSelectedOutlet && styles.selectedOutletText
                                ]}>Semua Outlet</Text>
                                {!adminSelectedOutlet && <Text style={styles.checkIcon}>✓</Text>}
                            </TouchableOpacity>
                            {outlets.map(outlet => (
                                <TouchableOpacity
                                    key={outlet.id}
                                    style={styles.outletItem}
                                    onPress={() => handleSelectOutlet(outlet)}
                                >
                                    <Text style={[
                                        styles.outletName,
                                        adminSelectedOutlet?.id === outlet.id && styles.selectedOutletText
                                    ]}>{outlet.nama_outlet}</Text>
                                    {adminSelectedOutlet?.id === outlet.id && <Text style={styles.checkIcon}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Transaction Detail Modal */}
            <Modal visible={detailModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.detailModalCard}>
                        <View style={styles.detailModalHeader}>
                            <View>
                                <Text style={styles.detailModalTitle}>Detail Transaksi</Text>
                                <Text style={styles.detailModalSub}>{selectedTx?.outlets?.nama_outlet}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeBtn}>
                                <Text style={styles.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.detailList}>
                            <View style={styles.detailInfo}>
                                <Text style={styles.detailLabel}>Tanggal</Text>
                                <Text style={styles.detailValue}>
                                    {selectedTx?.created_at ? new Date(selectedTx.created_at).toLocaleString('id-ID') : '-'}
                                </Text>
                            </View>
                            <View style={styles.detailInfo}>
                                <Text style={styles.detailLabel}>Tipe</Text>
                                <Text style={[
                                    styles.detailValue,
                                    { color: selectedTx?.tipe === 'Kas Keluar' ? '#dc2626' : '#16a34a', fontWeight: 'bold' }
                                ]}>
                                    {selectedTx?.tipe}
                                </Text>
                            </View>
                            <View style={styles.detailInfo}>
                                <Text style={styles.detailLabel}>Kategori</Text>
                                <Text style={styles.detailValue}>{selectedTx?.kategori || '-'}</Text>
                            </View>

                            <Text style={styles.itemsTitle}>Rincian Item:</Text>
                            {selectedTx?.items?.map((item: any, idx: number) => (
                                <View key={idx} style={styles.itemRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.itemName}>{item.deskripsi}</Text>
                                        <Text style={styles.itemSub}>{item.qty} {item.satuan} x {formatCurrency(item.total_harga / item.qty)}</Text>
                                    </View>
                                    <Text style={styles.itemTotal}>{formatCurrency(item.total_harga)}</Text>
                                </View>
                            ))}

                            <View style={styles.divider} />

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Grand Total</Text>
                                <Text style={styles.totalValue}>{formatCurrency(selectedTx?.grand_total || 0)}</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
        paddingTop: 20,
    },
    closeBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "rgba(0,0,0,0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    closeBtnText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "white",
        lineHeight: 18,
    },
    // Section
    sectionContainer: {
        marginBottom: 24,
        paddingHorizontal: 20,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: "700",
        color: "#6b7280",
        marginBottom: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    // HERO CARD
    heroCard: {
        padding: 20,
        borderRadius: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#DC2626",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    heroLabel: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        marginBottom: 8,
        fontWeight: "600",
    },
    heroValue: {
        fontSize: 28,
        fontWeight: "800",
        color: "white",
        marginBottom: 4,
    },
    heroSub: {
        fontSize: 12,
        color: "rgba(255,255,255,0.8)",
    },
    heroIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
    },
    heroIcon: {
        fontSize: 24,
    },
    // STATS GRID
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        minHeight: 100,
        justifyContent: "space-between"
    },
    statHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    statIcon: {
        fontSize: 16,
    },
    statCount: {
        fontSize: 20,
        fontWeight: "800",
    },
    statLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#374151",
    },
    statSub: {
        fontSize: 10,
        color: "#6b7280",
    },
    // Glass Styles
    heroContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    glassStatCard: {
        flex: 1,
        minHeight: 90,
    },
    glassStatLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1f2937",
    },
    glassStatSub: {
        fontSize: 10,
        color: "#6b7280",
    },
    glassLogoutText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#dc2626",
    },
    containerWrapper: {
        flex: 1,
        position: 'relative',
    },
    // Fixed Footer
    fixedFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
        paddingBottom: 20, // Extra padding for safe area logic if needed
    },
    footerLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#9ca3af",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 12,
        textAlign: "center",
    },
    footerGrid: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    footerItem: {
        width: "22%", // 4 items in single row
        alignItems: "center",
    },
    footerIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
    },
    footerIcon: {
        fontSize: 18,
    },
    footerText: {
        fontSize: 10,
        color: "#4b5563",
        fontWeight: "600",
    },
    // Outlet Card (Existing)
    outletCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(229, 231, 235, 0.5)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    outletLabel: {
        fontSize: 12,
        color: "#6b7280",
        marginBottom: 4,
    },
    outletValue: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1f2937",
    },
    changeOutletBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        borderRadius: 8,
    },
    changeOutletText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#2563eb",
    },

    // Logout
    logoutCard: {
        backgroundColor: "rgba(254, 226, 226, 0.7)", // Red tint
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(220, 38, 38, 0.2)",
        alignItems: "center",
    },
    logoutContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    logoutIcon: {
        fontSize: 20,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#dc2626",
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    confirmModal: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 24,
        width: "100%",
        maxWidth: 320,
        alignItems: "center",
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#ef4444", // Red
        marginBottom: 12,
    },
    confirmMessage: {
        fontSize: 15,
        color: "#4b5563",
        textAlign: "center",
        marginBottom: 24,
    },
    confirmActions: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelBtn: {
        backgroundColor: "#f3f4f6",
    },
    logoutConfirmBtn: {
        backgroundColor: "#ef4444",
    },
    cancelBtnText: {
        fontWeight: "700",
        color: "#4b5563",
    },
    logoutConfirmText: {
        fontWeight: "700",
        color: "white",
    },
    // Outlet Modal
    outletModalCard: { // Same as confirmModal but for outlet list
        backgroundColor: "white",
        borderRadius: 20,
        width: "100%",
        maxWidth: 340,
        maxHeight: "80%",
        overflow: "hidden",
    },
    outletModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    outletModalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1f2937",
    },
    closeIcon: {
        fontSize: 18,
        color: "#6b7280",
        padding: 4,
    },
    outletList: {
        padding: 8,
    },
    outletItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 14,
        borderRadius: 12,
        marginBottom: 4,
    },
    outletName: {
        fontSize: 15,
        color: "#374151",
        fontWeight: "500",
    },
    selectedOutletText: {
        color: "#10b981", // Emerald
        fontWeight: "700",
    },
    checkIcon: {
        color: "#10b981",
        fontWeight: "bold",
    },
    // Recent Activity Styles
    recentActivityCard: {
        padding: 0, // List needs full width
        borderRadius: 20,
        overflow: 'hidden'
    },
    activityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    lastActivityItem: {
        borderBottomWidth: 0,
    },
    activityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    activityIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activityOutlet: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
    },
    activityTime: {
        fontSize: 11,
        color: '#9ca3af',
        marginTop: 1,
    },
    activityAmount: {
        fontSize: 13,
        fontWeight: '700',
    },
    textRed: {
        color: '#dc2626',
    },
    textGreen: {
        color: '#16a34a',
    },
    emptyActivity: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyActivityText: {
        color: '#9ca3af',
        fontStyle: 'italic',
        fontSize: 13,
    },
    // Detail Modal Styles
    detailModalCard: {
        backgroundColor: "white",
        borderRadius: 20,
        width: "100%",
        maxWidth: 340,
        maxHeight: "80%",
        overflow: "hidden",
    },
    detailModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    detailModalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1f2937",
    },
    detailModalSub: {
        fontSize: 12,
        color: "#6b7280",
    },
    detailList: {
        padding: 16,
    },
    detailInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: "#6b7280",
    },
    detailValue: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1f2937",
    },
    itemsTitle: {
        marginTop: 12,
        marginBottom: 8,
        fontSize: 13,
        fontWeight: "700",
        color: "#374151",
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f9fafb",
    },
    itemName: {
        fontSize: 13,
        color: "#1f2937",
    },
    itemSub: {
        fontSize: 11,
        color: "#9ca3af",
    },
    itemTotal: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1f2937",
    },
    divider: {
        height: 1,
        backgroundColor: "#e5e7eb",
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "800",
        color: "#111827",
    },
});

