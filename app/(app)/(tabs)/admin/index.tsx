import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StyleSheet,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../../stores/authStore";
import { supabase } from "../../../../lib/supabase";

export default function AdminDashboard() {
    const { profile } = useAuthStore();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        pendingCount: 0,
        totalKas: 0,
        outletCount: 0,
        txCount: 0,
    });
    const [outlets, setOutlets] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

    const fetchAdminData = async () => {
        try {
            // Get pending reimbursements
            const { data: pending } = await supabase
                .from("reimbursements")
                .select("*, outlets(nama_outlet)")
                .eq("status", "Pending")
                .order("created_at", { ascending: false })
                .limit(5);

            setPendingRequests(pending || []);
            setStats((prev) => ({ ...prev, pendingCount: pending?.length || 0 }));

            // Get all outlets with balance
            const { data: outletData } = await supabase
                .from("outlets")
                .select("*")
                .order("nama_outlet");

            setOutlets(outletData || []);
            setStats((prev) => ({ ...prev, outletCount: outletData?.length || 0 }));

            // Calculate total kas & per outlet balance
            let totalKas = 0;
            const enrichedOutlets = await Promise.all((outletData || []).map(async (outlet) => {
                const { data: txData } = await supabase
                    .from("transactions")
                    .select("grand_total, tipe")
                    .eq("outlet_id", outlet.id);

                const { data: kmData } = await supabase
                    .from("kas_masuk")
                    .select("jumlah")
                    .eq("outlet_id", outlet.id);

                let saldo = outlet.saldo_awal || 0;
                txData?.forEach((tx) => {
                    if (tx.tipe === "Kas Keluar") saldo -= tx.grand_total;
                    else saldo += tx.grand_total;
                });
                kmData?.forEach((km) => (saldo += km.jumlah));

                totalKas += saldo;
                return { ...outlet, current_saldo: saldo };
            }));

            // Sort by balance (highest first) or name? Let's keep name for now but maybe filtered 
            setOutlets(enrichedOutlets);
            setStats((prev) => ({ ...prev, totalKas }));

            // Get this month's transactions count
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            const { count } = await supabase
                .from("transactions")
                .select("*", { count: "exact", head: true })
                .gte("tanggal", startOfMonth.toISOString().split("T")[0]);

            setStats((prev) => ({ ...prev, txCount: count || 0 }));
        } catch (error) {
            console.error("Admin data fetch error:", error);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAdminData();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    if (profile?.role !== "Admin") {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.accessDenied}>
                    <Text style={styles.accessDeniedIcon}>🚫</Text>
                    <Text style={styles.accessDeniedText}>Akses Ditolak</Text>
                    <Text style={styles.accessDeniedHint}>Anda bukan Admin</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerBrand}>
                        <Image
                            source={require("../../../../assets/logo.png")}
                            style={styles.brandLogo}
                            resizeMode="contain"
                        />
                        <Text style={styles.brandName}>Admin Panel</Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}>
                        <Text style={styles.statIcon}>📋</Text>
                        <View style={styles.statInfo}>
                            <Text style={[styles.statValue, { color: "#d97706" }]}>
                                {stats.pendingCount}
                            </Text>
                            <Text style={styles.statLabel}>Pending Approval</Text>
                        </View>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: "#dcfce7" }]}>
                        <Text style={styles.statIcon}>💰</Text>
                        <View style={styles.statInfo}>
                            <Text style={[styles.statValue, { color: "#16a34a" }]}>
                                {formatCurrency(stats.totalKas)}
                            </Text>
                            <Text style={styles.statLabel}>Total Kas Beredar</Text>
                        </View>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: "#e0f2fe" }]}>
                        <Text style={styles.statIcon}>🏪</Text>
                        <View style={styles.statInfo}>
                            <Text style={[styles.statValue, { color: "#0284c7" }]}>
                                {stats.outletCount}
                            </Text>
                            <Text style={styles.statLabel}>Active Outlets</Text>
                        </View>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: "#f3e8ff" }]}>
                        <Text style={styles.statIcon}>📊</Text>
                        <View style={styles.statInfo}>
                            <Text style={[styles.statValue, { color: "#9333ea" }]}>
                                {stats.txCount}
                            </Text>
                            <Text style={styles.statLabel}>Transaksi Bulan Ini</Text>
                        </View>
                    </View>
                </View>

                {/* Outlet Health */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏪 Status Outlet</Text>
                    {outlets.slice(0, 5).map((outlet) => (
                        <View key={outlet.id} style={styles.outletHealthItem}>
                            <Text style={styles.outletName}>{outlet.nama_outlet}</Text>
                            <Text style={styles.outletSaldo}>
                                {formatCurrency(outlet.current_saldo || 0)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Pending Requests */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⏳ Request Terbaru</Text>
                    {pendingRequests.length === 0 ? (
                        <Text style={styles.emptyText}>Tidak ada request pending</Text>
                    ) : (
                        pendingRequests.map((req) => (
                            <View key={req.id} style={styles.pendingItem}>
                                <View style={styles.pendingInfo}>
                                    <Text style={styles.pendingOutlet}>
                                        {req.outlets?.nama_outlet || "Outlet"}
                                    </Text>
                                    <Text style={styles.pendingDate}>
                                        {new Date(req.created_at).toLocaleDateString("id-ID")}
                                    </Text>
                                </View>
                                <Text style={styles.pendingAmount}>
                                    {formatCurrency(req.total_amount)}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push("/(app)/(tabs)/admin/approval")}
                    >
                        <Text style={styles.actionIcon}>✅</Text>
                        <Text style={styles.actionLabel}>Approval</Text>
                        {stats.pendingCount > 0 && (
                            <View style={styles.actionBadge}>
                                <Text style={styles.actionBadgeText}>{stats.pendingCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push("/(app)/(tabs)/admin/users")}
                    >
                        <Text style={styles.actionIcon}>👥</Text>
                        <Text style={styles.actionLabel}>Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push("/(app)/(tabs)/admin/outlets")}
                    >
                        <Text style={styles.actionIcon}>🏪</Text>
                        <Text style={styles.actionLabel}>Outlets</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push("/(app)/(tabs)/admin/reports")}
                    >
                        <Text style={styles.actionIcon}>📊</Text>
                        <Text style={styles.actionLabel}>Reports</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push("/(app)/(tabs)/admin/settings")}
                    >
                        <Text style={styles.actionIcon}>⚙️</Text>
                        <Text style={styles.actionLabel}>Settings</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
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
    accessDenied: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    accessDeniedIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    accessDeniedText: {
        fontSize: 20,
        fontWeight: "800",
        color: "#dc2626",
    },
    accessDeniedHint: {
        fontSize: 14,
        color: "#666",
        marginTop: 8,
    },
    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    headerBrand: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    brandLogo: {
        width: 32,
        height: 32,
        borderRadius: 6,
    },
    brandName: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1a1a1a",
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
    },
    closeBtnText: {
        fontSize: 16,
        color: "#64748b",
    },
    // Stats Grid
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        padding: 20,
    },
    statCard: {
        width: "48%",
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 14,
    },
    statIcon: {
        fontSize: 24,
    },
    statInfo: {},
    statValue: {
        fontSize: 16,
        fontWeight: "900",
    },
    statLabel: {
        fontSize: 10,
        color: "#666",
    },
    // Section
    section: {
        backgroundColor: "white",
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 12,
        color: "#1a1a1a",
    },
    emptyText: {
        fontSize: 13,
        color: "#999",
        textAlign: "center",
        padding: 20,
    },
    // Outlet Health
    outletHealthItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    outletName: {
        fontSize: 14,
        fontWeight: "600",
    },
    outletSaldo: {
        fontSize: 14,
        fontWeight: "700",
        color: "#16a34a",
    },
    // Pending
    pendingItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    pendingInfo: {},
    pendingOutlet: {
        fontSize: 14,
        fontWeight: "700",
    },
    pendingDate: {
        fontSize: 11,
        color: "#666",
    },
    pendingAmount: {
        fontSize: 15,
        fontWeight: "800",
        color: "#1d4ed8",
    },
    // Action Grid
    actionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    actionBtn: {
        width: "48%",
        backgroundColor: "white",
        borderRadius: 14,
        padding: 20,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        position: "relative",
    },
    actionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
    },
    actionBadge: {
        position: "absolute",
        top: 10,
        right: 10,
        backgroundColor: "#dc2626",
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    actionBadgeText: {
        fontSize: 11,
        fontWeight: "800",
        color: "white",
    },
});
