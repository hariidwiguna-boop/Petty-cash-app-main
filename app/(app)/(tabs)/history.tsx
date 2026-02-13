import { useEffect, useState, useCallback } from "react";
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
import { useRouter, useFocusEffect } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { supabase, Transaction } from "../../../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function HistoryScreen() {
    const { outlet, isAdmin, adminSelectedOutlet } = useAuthStore();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)));
    const [endDate, setEndDate] = useState(new Date());

    const fetchHistory = async () => {
        const activeOutlet = isAdmin ? (adminSelectedOutlet || outlet) : outlet;
        if (!activeOutlet) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("transactions")
                .select("*, transaction_items(*)")
                .eq("outlet_id", activeOutlet.id)
                .gte("tanggal", startDate.toISOString().split('T')[0])
                .lte("tanggal", endDate.toISOString().split('T')[0])
                .order("tanggal", { ascending: false });

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error("Fetch history error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [outlet, startDate, endDate])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchHistory();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return "Rp . " + amount.toLocaleString("id-ID").replace(/\s/g, '');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
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
                                <Text style={styles.headerTitle}>RIWAYAT TRANSAKSI</Text>
                                <Text style={styles.headerSubtitle}>Monitor semua arus kas keluar</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                                <Ionicons name="close" size={28} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Filter Summary */}
                        <View style={styles.filterSummary}>
                            <View style={styles.filterItem}>
                                <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                                <Text style={styles.filterText}>
                                    {startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.tuneBtn}>
                                <Ionicons name="options-outline" size={20} color="#FF0000" />
                            </TouchableOpacity>
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
                {isLoading && !refreshing ? (
                    <ActivityIndicator color="#FF0000" style={{ marginTop: 40 }} />
                ) : transactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color="#E2E8F0" />
                        <Text style={styles.emptyText}>Tidak ada transaksi ditemukan</Text>
                    </View>
                ) : (
                    transactions.map((tx) => (
                        <TouchableOpacity key={tx.id} style={styles.txCard}>
                            <View style={styles.cardLeft}>
                                <View style={styles.iconBox}>
                                    <Ionicons name="arrow-up-outline" size={20} color="#FF0000" />
                                </View>
                                <View style={styles.infoCol}>
                                    <Text style={styles.txTipe}>{tx.tipe || 'Kas Keluar'}</Text>
                                    <Text style={styles.txDate}>{formatDate(tx.tanggal)}</Text>
                                </View>
                            </View>
                            <View style={styles.cardRight}>
                                <Text style={styles.txAmount}>-{formatCurrency(tx.grand_total)}</Text>
                                <View style={[styles.statusBadge, tx.status_reimburse === 'Disetujui' && styles.statusApproved]}>
                                    <Text style={[styles.statusText, tx.status_reimburse === 'Disetujui' && { color: '#22C55E' }]}>
                                        {tx.status_reimburse?.toUpperCase() || 'TERCATAT'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
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
    filterSummary: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    filterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
    },
    tuneBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
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
    txCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoCol: {
        gap: 2,
    },
    txTipe: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    txDate: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
    },
    cardRight: {
        alignItems: 'flex-end',
        gap: 6,
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    statusBadge: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusApproved: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    statusText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 0.5,
    },
});
