import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Image, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../../stores/authStore";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import AdminLayout from "../../../../components/admin/AdminLayout";
import AdminGlassCard from "../../../../components/admin/AdminGlassCard";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from "../../../../src/hooks/useResponsive";
import { BlurView } from 'expo-blur';



export default function AdminControlCenter() {
    const { profile, signOut, adminSelectedOutlet, setAdminSelectedOutlet } = useAuthStore();
    const router = useRouter();
    const {
        isTablet,
        moderateScale,
        fontScale,
        getResponsiveValue,
        containerPadding,
        modalWidth
    } = useResponsive();

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

    const openTransactionDetail = async (tx: any) => {
        // Reset and set current tx
        setSelectedTx(tx);
        setDetailModalVisible(true);

        // Fetch items on-demand with explicit relationship name if possible
        try {
            console.log("Fetching items for ID:", tx.id);
            const { data, error } = await supabase
                .from("transaction_items")
                .select("*")
                .eq("transaction_id", tx.id);

            if (error) throw error;

            if (data) {
                console.log("Items fetched count:", data.length);
                setSelectedTx((prev: any) => ({
                    ...prev,
                    items: data,
                    _debugItemsCount: data.length // Add debug flag
                }));
            }
        } catch (error: any) {
            console.error("Error fetching items for detail:", error.message);
        }
    };

    const fetchDashboardData = async () => {
        setIsLoadingStats(true);
        try {
            // 1. Fetch Outlets
            const { data: outletsData } = await supabase.from("outlets").select("*");
            const outletList = outletsData || [];

            // 2. Fetch All Transactions (Optimized)
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

            // 5. Fetch Recent Activity (Minimalist - items fetched on demand)
            const { data: recentTx } = await supabase
                .from("transactions")
                .select(`
                    *,
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
                        <LinearGradient
                            colors={['#FF3131', '#991B1B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroCard}
                        >
                            <View style={styles.heroContent}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.heroLabel}>CORPORATE LIQUIDITY</Text>
                                    <Text style={styles.heroValue}>
                                        {isLoadingStats ? "Rp —" : formatCurrency(dashboardStats.totalBalance).replace('Rp', 'Rp ')}
                                    </Text>
                                    <View style={styles.heroSubContainer}>
                                        <Text style={styles.heroSub}>
                                            Monitoring {dashboardStats.totalOutlets} ACTIVE OUTLETS
                                        </Text>
                                        <View style={styles.activePulse} />
                                    </View>
                                </View>
                                <View style={styles.heroIconCircle}>
                                    <Ionicons name="briefcase" size={24} color="white" />
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* 2. ACTIONABLE INSIGHTS */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionLabel}>SYSTEM INSIGHTS</Text>
                        <View style={[
                            styles.statsGrid,
                            isTablet && { flexWrap: 'wrap', justifyContent: 'flex-start' }
                        ]}>
                            {/* Critical Outlets */}
                            <AdminGlassCard
                                style={[styles.glassStatCard, isTablet && { width: '31%', flex: 0 }]}
                                onPress={() => router.push("/(app)/(tabs)/admin/outlets")}
                            >
                                <View style={styles.statHeader}>
                                    <View style={[styles.miniIconBg, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                        <Ionicons name="alert-circle" size={16} color="#FF3131" />
                                    </View>
                                    <Text style={[styles.statCount, { color: "#FF3131", fontSize: fontScale(22) }]}>
                                        {dashboardStats.criticalOutlets}
                                    </Text>
                                </View>
                                <Text style={styles.glassStatLabel}>CRITICAL</Text>
                                <Text style={styles.glassStatSub}>LOW BALANCE</Text>
                            </AdminGlassCard>

                            {/* Pending Approvals */}
                            <AdminGlassCard
                                style={[styles.glassStatCard, isTablet && { width: '31%', flex: 0 }]}
                                onPress={() => router.push("/(app)/(tabs)/admin/approval")}
                            >
                                <View style={styles.statHeader}>
                                    <View style={[styles.miniIconBg, { backgroundColor: 'rgba(234, 88, 12, 0.1)' }]}>
                                        <Ionicons name="time" size={16} color="#EA580C" />
                                    </View>
                                    <Text style={[styles.statCount, { color: "#EA580C", fontSize: fontScale(22) }]}>
                                        {dashboardStats.pendingApprovals}
                                    </Text>
                                </View>
                                <Text style={styles.glassStatLabel}>PENDING</Text>
                                <Text style={styles.glassStatSub}>APPROVALS</Text>
                            </AdminGlassCard>

                            {/* Total Outlets */}
                            <AdminGlassCard
                                style={[styles.glassStatCard, isTablet && { width: '31%', flex: 0 }]}
                                onPress={() => router.push("/(app)/(tabs)/admin/outlets")}
                            >
                                <View style={styles.statHeader}>
                                    <View style={[styles.miniIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                        <Ionicons name="business" size={16} color="#3B82F6" />
                                    </View>
                                    <Text style={[styles.statCount, { color: "#3B82F6", fontSize: fontScale(22) }]}>
                                        {dashboardStats.totalOutlets}
                                    </Text>
                                </View>
                                <Text style={styles.glassStatLabel}>TOTAL</Text>
                                <Text style={styles.glassStatSub}>ACTIVE BRANCH</Text>
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
                                                    {formatTime(tx.created_at)} • {tx.kategori || 'Transaksi'} {tx.grand_total > 1000000 ? '(Penting)' : ''}
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
                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
                    <View style={styles.footerContent}>
                        <Text style={styles.footerLabel}>EXECUTIVE NAVIGATION</Text>
                        <View style={styles.footerGrid}>
                            <TouchableOpacity style={styles.footerItem} onPress={() => router.push("/(app)/(tabs)/admin/approval")}>
                                <View style={[styles.footerIconBox, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                                    <Ionicons name="checkbox" size={20} color="#10B981" />
                                </View>
                                <Text style={styles.footerText}>APPROVAL</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.footerItem} onPress={() => router.push("/(app)/(tabs)/admin/history" as any)}>
                                <View style={[styles.footerIconBox, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
                                    <Ionicons name="list" size={20} color="#F59E0B" />
                                </View>
                                <Text style={styles.footerText}>HISTORY</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.footerItem} onPress={() => router.push("/(app)/(tabs)/reports" as any)}>
                                <View style={[styles.footerIconBox, { backgroundColor: "rgba(236, 72, 153, 0.1)" }]}>
                                    <Ionicons name="stats-chart" size={20} color="#EC4899" />
                                </View>
                                <Text style={styles.footerText}>REPORTS</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.footerItem} onPress={() => router.push("/(app)/(tabs)/admin/settings" as any)}>
                                <View style={[styles.footerIconBox, { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}>
                                    <Ionicons name="settings" size={20} color="#3B82F6" />
                                </View>
                                <Text style={styles.footerText}>SETTINGS</Text>
                            </TouchableOpacity>
                        </View>
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
                            {selectedTx?.items && selectedTx.items.length > 0 ? (
                                selectedTx.items.map((item: any, idx: number) => {
                                    const qty = parseFloat(item.qty) || 0;
                                    const unitPrice = qty > 0 ? (item.total_harga / qty) : item.total_harga;
                                    return (
                                        <View key={idx} style={styles.itemRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.itemName}>{item.deskripsi}</Text>
                                                <Text style={styles.itemSub}>
                                                    {item.qty} {item.satuan} x {formatCurrency(unitPrice)}
                                                </Text>
                                            </View>
                                            <Text style={styles.itemTotal}>{formatCurrency(item.total_harga)}</Text>
                                        </View>
                                    );
                                })
                            ) : (
                                <View style={{ paddingVertical: 10 }}>
                                    <Text style={{ color: "#94a3b8", fontSize: 13, fontStyle: 'italic' }}>
                                        {selectedTx?._debugItemsCount === 0 ? "Tidak ada rincian item untuk transaksi ini." : "Sedang mengambil data item..."}
                                    </Text>
                                    <View style={{ marginTop: 20, padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8 }}>
                                        <Text style={{ fontSize: 9, color: '#94a3b8' }}>ID: {selectedTx?.id}</Text>
                                    </View>
                                </View>
                            )}

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
        padding: 24,
        borderRadius: 24,
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
        fontSize: 32,
        fontWeight: "800",
        color: "white",
        marginVertical: 4,
    },
    heroSubContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    heroSub: {
        fontSize: 11,
        color: "rgba(255,255,255,0.7)",
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    activePulse: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4ADE80',
    },
    heroIconCircle: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.15)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    heroIcon: {
        fontSize: 24,
    },
    // STATS GRID
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
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
        fontSize: 22,
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
        minHeight: 110,
        padding: 16,
    },
    miniIconBg: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glassStatLabel: {
        fontSize: 11,
        fontWeight: "900",
        color: "#F8FAFC",
        letterSpacing: 1,
        marginTop: 12,
    },
    glassStatSub: {
        fontSize: 9,
        color: "#64748B",
        fontWeight: '800',
        letterSpacing: 0.5,
        marginTop: 2,
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
    footerContent: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    footerLabel: {
        fontSize: 10,
        fontWeight: "900",
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: 2,
        marginBottom: 20,
        textAlign: "center",
    },
    footerGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    footerItem: {
        alignItems: "center",
        width: 70,
    },
    footerIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    footerText: {
        fontSize: 9,
        color: "#94A3B8",
        fontWeight: "900",
        letterSpacing: 0.5,
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
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    confirmModal: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderRadius: 32,
        padding: 32,
        width: "100%",
        maxWidth: 340,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 20,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(40px)' } : {}),
    },
    confirmTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "#FFFFFF",
        marginBottom: 8,
        letterSpacing: 1,
    },
    confirmMessage: {
        fontSize: 14,
        color: "#94A3B8",
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 20,
    },
    confirmActions: {
        flexDirection: "row",
        width: "100%",
        gap: 12,
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelBtn: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    logoutConfirmBtn: {
        backgroundColor: "#FF3131",
    },
    cancelBtnText: {
        fontWeight: "900",
        color: "#F8FAFC",
        letterSpacing: 1,
    },
    logoutConfirmText: {
        fontWeight: "900",
        color: "white",
        letterSpacing: 1,
    },
    // Outlet Modal
    outletModalCard: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderRadius: 32,
        width: "100%",
        maxWidth: 400,
        maxHeight: "80%",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(40px)' } : {}),
    },
    outletModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.05)",
    },
    outletModalTitle: {
        fontSize: 16,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 1,
    },
    closeIcon: {
        fontSize: 18,
        color: "#94A3B8",
        fontWeight: 'bold',
    },
    outletList: {
        padding: 12,
    },
    outletItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    outletName: {
        fontSize: 14,
        color: "#F1F5F9",
        fontWeight: "700",
    },
    selectedOutletText: {
        color: "#10B981",
        fontWeight: "900",
    },
    checkIcon: {
        color: "#10B981",
        fontSize: 18,
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
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    activityOutlet: {
        fontSize: 13,
        fontWeight: '800',
        color: '#F1F5F9',
        letterSpacing: 0.5,
    },
    activityTime: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    activityAmount: {
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    textRed: {
        color: '#FF4D4D',
    },
    textGreen: {
        color: '#4ADE80',
    },
    emptyActivity: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyActivityText: {
        color: '#64748B',
        fontStyle: 'italic',
        fontSize: 13,
        fontWeight: '600',
    },
    // Detail Modal Styles
    detailModalCard: {
        backgroundColor: "rgba(15, 23, 42, 0.98)",
        borderRadius: 32,
        width: "100%",
        maxWidth: 360,
        maxHeight: "85%",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.6,
        shadowRadius: 40,
        elevation: 25,
    },
    detailModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.05)",
    },
    detailModalTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 1,
    },
    detailModalSub: {
        fontSize: 12,
        color: "#94A3B8",
        fontWeight: '700',
        marginTop: 2,
    },
    detailList: {
        padding: 24,
    },
    detailInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: '700',
    },
    detailValue: {
        fontSize: 13,
        fontWeight: "800",
        color: "#F1F5F9",
    },
    itemsTitle: {
        marginTop: 20,
        marginBottom: 12,
        fontSize: 11,
        fontWeight: "900",
        color: "#475569",
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.03)",
    },
    itemName: {
        fontSize: 13,
        color: "#F1F5F9",
        fontWeight: '700',
    },
    itemSub: {
        fontSize: 11,
        color: "#64748B",
        marginTop: 2,
    },
    itemTotal: {
        fontSize: 13,
        fontWeight: "800",
        color: "#F8FAFC",
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        marginVertical: 16,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "900",
        color: "#94A3B8",
        letterSpacing: 1,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: "900",
        color: "#FFFFFF",
    },
});
