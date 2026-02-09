
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Platform, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import AdminLayout from "../../../../components/admin/AdminLayout";
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from "../../../../stores/authStore";
import { formatDateToISO } from "../../../../lib/dateUtils";
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AdminHistory() {
    const router = useRouter();
    const { adminSelectedOutlet } = useAuthStore();

    // State
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [selectedDate, setSelectedDate] = useState<Date | null>(null); // Default: All Dates
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [filterOutlet, setFilterOutlet] = useState<any>(null); // Default: All Outlets

    // Outlet Modal
    const [showOutletModal, setShowOutletModal] = useState(false);
    const [outlets, setOutlets] = useState<any[]>([]);

    useEffect(() => {
        fetchOutlets();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [selectedDate, filterOutlet]);

    const fetchOutlets = async () => {
        const { data } = await supabase.from("outlets").select("*").order("nama_outlet");
        if (data) setOutlets(data);
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // Construct query
            let query = supabase
                .from("transactions")
                .select("*, outlets(nama_outlet)")
                .order("created_at", { ascending: false });

            // Date Filter
            if (selectedDate) {
                const dateStr = formatDateToISO(selectedDate);
                query = query.eq("tanggal", dateStr);
            }

            // Outlet Filter
            if (filterOutlet) {
                query = query.eq("outlet_id", filterOutlet.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setTransactions(data || []);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
    };

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
        }
    };

    const clearDateFilter = () => {
        setSelectedDate(null);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("id-ID", {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.outletBadge}>
                    <Text style={styles.outletText}>{item.outlets?.nama_outlet || "Unknown Outlet"}</Text>
                </View>
                <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : ""}</Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Tipe</Text>
                    <Text style={[
                        styles.value,
                        item.tipe === 'Kas Masuk' ? styles.textGreen : styles.textRed,
                        { fontWeight: 'bold' }
                    ]}>{item.tipe}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Kategori</Text>
                    <Text style={styles.value}>{item.kategori || "-"}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Keterangan</Text>
                    <Text style={styles.value} numberOfLines={2}>{item.deskripsi || "-"}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{formatCurrency(item.grand_total || 0)}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <AdminLayout
            title="📜 Riwayat Transaksi"
            subtitle="Pantau arus kas semua outlet"
            showBackButton={true}
        >
            {/* Filters */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {/* Date Picker Button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* Native/Web Date Picker Trigger */}
                        {Platform.OS === 'web' ? (
                            <View style={[styles.filterBtn, selectedDate && styles.filterBtnActive, { position: 'relative' }]}>
                                <Text style={styles.filterIcon}>📅</Text>
                                <Text style={[styles.filterText, selectedDate && styles.filterTextActive]}>
                                    {selectedDate ? formatDate(selectedDate) : "Semua Tanggal"}
                                </Text>
                                {/* Invisible date input overlay for Web */}
                                <input
                                    type="date"
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        opacity: 0,
                                        cursor: 'pointer'
                                    }}
                                    onChange={(e: any) => {
                                        if (e.target.value) {
                                            const parts = e.target.value.split('-');
                                            const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                                            setSelectedDate(d);
                                        } else {
                                            setSelectedDate(null);
                                        }
                                    }}
                                />
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.filterBtn, selectedDate && styles.filterBtnActive]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.filterIcon}>📅</Text>
                                <Text style={[styles.filterText, selectedDate && styles.filterTextActive]}>
                                    {selectedDate ? formatDate(selectedDate) : "Semua Tanggal"}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Clear Date Button */}
                        {selectedDate && (
                            <TouchableOpacity onPress={clearDateFilter} style={styles.clearBtn}>
                                <Text style={styles.clearBtnText}>✕</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Outlet Picker Button */}
                    <TouchableOpacity
                        style={[styles.filterBtn, filterOutlet && styles.filterBtnActive]}
                        onPress={() => setShowOutletModal(true)}
                    >
                        <Text style={styles.filterIcon}>🏪</Text>
                        <Text style={[styles.filterText, filterOutlet && styles.filterTextActive]}>
                            {filterOutlet ? filterOutlet.nama_outlet : "Semua Outlet"}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* List */}
            <FlatList
                data={transactions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>Tidak ada transaksi ditemukan</Text>
                        </View>
                    ) : null
                }
            />

            {/* Date Picker Modal (Native Only) */}
            {showDatePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}

            {/* Outlet Selection Modal */}
            <Modal visible={showOutletModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.outletModalCard}>
                        <View style={styles.outletModalHeader}>
                            <Text style={styles.outletModalTitle}>Filter Outlet</Text>
                            <TouchableOpacity onPress={() => setShowOutletModal(false)}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.outletList}>
                            <TouchableOpacity
                                style={styles.outletItem}
                                onPress={() => {
                                    setFilterOutlet(null);
                                    setShowOutletModal(false);
                                }}
                            >
                                <Text style={[
                                    styles.outletName,
                                    !filterOutlet && styles.selectedOutletText
                                ]}>Semua Outlet</Text>
                                {!filterOutlet && <Text style={styles.checkIcon}>✓</Text>}
                            </TouchableOpacity>
                            {outlets.map(outlet => (
                                <TouchableOpacity
                                    key={outlet.id}
                                    style={styles.outletItem}
                                    onPress={() => {
                                        setFilterOutlet(outlet);
                                        setShowOutletModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.outletName,
                                        filterOutlet?.id === outlet.id && styles.selectedOutletText
                                    ]}>{outlet.nama_outlet}</Text>
                                    {filterOutlet?.id === outlet.id && <Text style={styles.checkIcon}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    filterContainer: {
        marginBottom: 16,
    },
    filterScroll: {
        paddingHorizontal: 20,
        gap: 10,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        gap: 8,
    },
    filterBtnActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
    },
    filterIcon: {
        fontSize: 16,
    },
    filterText: {
        fontSize: 13,
        color: '#4b5563',
        fontWeight: '600',
    },
    filterTextActive: {
        color: '#2563eb',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 12,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#f3f4f6",
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f9fafb",
        paddingBottom: 8,
    },
    outletBadge: {
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    outletText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#4b5563",
    },
    dateText: {
        fontSize: 11,
        color: "#9ca3af",
    },
    cardBody: {
        gap: 8,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    label: {
        fontSize: 13,
        color: "#6b7280",
    },
    value: {
        fontSize: 13,
        color: "#1f2937",
        flex: 1,
        textAlign: "right",
    },
    textGreen: {
        color: "#059669",
    },
    textRed: {
        color: "#dc2626",
    },
    divider: {
        height: 1,
        backgroundColor: "#f3f4f6",
        marginVertical: 4,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    totalLabel: {
        fontWeight: "700",
        fontSize: 14,
        color: "#374151"
    },
    totalValue: {
        fontWeight: "800",
        fontSize: 16,
        color: "#111827"
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 14,
        color: "#9ca3af",
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
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
        color: "#2563eb",
        fontWeight: "700",
    },
    checkIcon: {
        color: "#2563eb",
        fontWeight: "bold",
    },
    clearBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fee2e2',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -4,
    },
    clearBtnText: {
        fontSize: 12,
        color: '#dc2626',
        fontWeight: 'bold',
    },
});
