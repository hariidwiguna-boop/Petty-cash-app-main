import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { supabase } from "../../../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface ReimburseRequest {
    id: string;
    created_at: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: string;
    notes?: string;
    approved_at?: string;
}

export default function StatusScreen() {
    const { outlet, isAdmin, adminSelectedOutlet } = useAuthStore();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [requests, setRequests] = useState<ReimburseRequest[]>([]);

    const fetchRequests = async () => {
        const activeOutlet = isAdmin ? (adminSelectedOutlet || outlet) : outlet;
        if (!isAdmin && !activeOutlet) return;

        try {
            let query = supabase
                .from("reimbursements")
                .select("*, outlets(nama_outlet)")
                .order("created_at", { ascending: false });

            if (activeOutlet) {
                query = query.eq("outlet_id", activeOutlet.id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error("Fetch requests error:", error);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [outlet]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRequests();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return "Rp . " + amount.toLocaleString("id-ID").replace(/\s/g, '');
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "Disetujui":
            case "Approved":
                return { color: "#22C55E", label: "APPROVED", icon: "checkmark-circle" };
            case "Ditolak":
            case "Rejected":
                return { color: "#FF0000", label: "REJECTED", icon: "close-circle" };
            default:
                return { color: "#F59E0B", label: "PENDING", icon: "time" };
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#FF0000', '#FFFFFF']} style={StyleSheet.absoluteFill} />

            {/* Header Area */}
            <View style={styles.headerArea}>
                <LinearGradient colors={['#FF0000', '#FF3131']} style={styles.headerGradient}>
                    <SafeAreaView edges={['top']} style={styles.headerContent}>
                        <View style={styles.topRow}>
                            <View style={styles.titleCol}>
                                <Text style={styles.headerTitle}>STATUS REQUEST</Text>
                                <Text style={styles.headerSubtitle}>Pantau status pengajuan reimburse</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                                <Ionicons name="close" size={28} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Summary Box */}
                        <View style={styles.summaryBox}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>TOTAL REQUEST</Text>
                                <Text style={styles.summaryValue}>{requests.length}</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>PENDING</Text>
                                <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                                    {requests.filter(r => r.status === 'Pending' || r.status === 'Diajukan').length}
                                </Text>
                            </View>
                        </View>
                    </SafeAreaView>
                    <View style={styles.headerCurve} />
                </LinearGradient>
            </View>

            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyScroll}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF0000" />}
            >
                {requests.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="documents-outline" size={64} color="#E2E8F0" />
                        <Text style={styles.emptyText}>Belum ada riwayat pengajuan</Text>
                    </View>
                ) : (
                    requests.map((req) => {
                        const info = getStatusInfo(req.status);
                        return (
                            <TouchableOpacity key={req.id} style={styles.requestCard}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.statusBadge, { backgroundColor: info.color + '15' }]}>
                                        <Ionicons name={info.icon as any} size={14} color={info.color} />
                                        <Text style={[styles.statusText, { color: info.color }]}>{info.label}</Text>
                                    </View>
                                    <Text style={styles.requestDate}>{formatDate(req.created_at)}</Text>
                                </View>

                                <View style={styles.cardBody}>
                                    <View style={styles.amountBox}>
                                        <Text style={styles.amountLabel}>Total Reimburse</Text>
                                        <Text style={styles.amountValue}>{formatCurrency(req.total_amount)}</Text>
                                    </View>
                                    <View style={styles.periodBox}>
                                        <Text style={styles.periodLabel}>Periode</Text>
                                        <Text style={styles.periodValue}>
                                            {formatDate(req.start_date)} - {formatDate(req.end_date)}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.cardFooter}>
                                    <Text style={styles.viewDetailText}>Lihat Detail Transaksi</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    headerArea: {
        height: 240,
        zIndex: 10,
    },
    headerGradient: {
        flex: 1,
        paddingHorizontal: 25,
    },
    headerContent: {
        flex: 1,
        paddingTop: 10,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleCol: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '600',
        marginTop: 4,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 15,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryDivider: {
        width: 1,
        height: '60%',
        backgroundColor: '#F1F5F9',
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    headerCurve: {
        position: 'absolute',
        bottom: -40,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    },
    body: {
        flex: 1,
        marginTop: -30,
    },
    bodyScroll: {
        paddingHorizontal: 25,
        paddingBottom: 100,
    },
    emptyState: {
        paddingTop: 60,
        alignItems: 'center',
        gap: 15,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#94A3B8',
    },
    requestCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        padding: 20,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    requestDate: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 15,
        marginBottom: 12,
    },
    amountBox: {
        gap: 4,
    },
    amountLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
    },
    amountValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
    },
    periodBox: {
        alignItems: 'flex-end',
        gap: 4,
    },
    periodLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
    },
    periodValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E293B',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    viewDetailText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
    },
});
