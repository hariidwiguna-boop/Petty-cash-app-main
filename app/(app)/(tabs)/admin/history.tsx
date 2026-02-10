import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Platform, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import AdminLayout from "../../../../components/admin/AdminLayout";
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from "../../../../stores/authStore";
import { formatDateToISO } from "../../../../lib/dateUtils";
import DateTimePicker from '@react-native-community/datetimepicker';
import AdminGlassCard from "../../../../components/admin/AdminGlassCard";
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from "expo-blur";

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
        <AdminGlassCard style={styles.recordCard}>
            <View style={styles.cardHeader}>
                <View style={styles.outletBadge}>
                    <Text style={styles.outletText}>{item.outlets?.nama_outlet.toUpperCase() || "UNKNOWN OUTLET"}</Text>
                </View>
                <Text style={styles.dateText}>
                    {item.created_at ? new Date(item.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) : ""}
                </Text>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <View style={styles.tipeWrapper}>
                        <View style={[
                            styles.dot,
                            { backgroundColor: item.tipe === 'Kas Masuk' ? '#4ADE80' : '#FF4D4D' }
                        ]} />
                        <Text style={[
                            styles.value,
                            item.tipe === 'Kas Masuk' ? styles.textGreen : styles.textRed,
                            { fontWeight: '900', letterSpacing: 0.5 }
                        ]}>{item.tipe.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.categoryBadge}>{item.kategori || "TRANSAKSI"}</Text>
                </View>

                <Text style={styles.recordDesc} numberOfLines={2}>
                    {item.deskripsi || "No description provided."}
                </Text>

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>NET VALUE</Text>
                    <Text style={styles.totalValue}>{formatCurrency(item.grand_total || 0)}</Text>
                </View>
            </View>
        </AdminGlassCard>
    );

    return (
        <AdminLayout
            title="📜 Riwayat Transaksi"
            subtitle="Pantau arus kas semua outlet"
            showBackButton={true}
        >
            {/* Filters */}
            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {/* Date Picker Button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {Platform.OS === 'web' ? (
                            <AdminGlassCard intensity="light" style={[styles.filterBtn, selectedDate && styles.filterBtnActive]}>
                                <Ionicons name="calendar" size={16} color={selectedDate ? "#3B82F6" : "#475569"} />
                                <Text style={[styles.filterLabel, selectedDate && styles.filterLabelActive]}>
                                    {selectedDate ? formatDate(selectedDate).toUpperCase() : "DATE RANGE"}
                                </Text>
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
                            </AdminGlassCard>
                        ) : (
                            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                                <AdminGlassCard intensity="light" style={[styles.filterBtn, selectedDate && styles.filterBtnActive]}>
                                    <Ionicons name="calendar" size={16} color={selectedDate ? "#3B82F6" : "#475569"} />
                                    <Text style={[styles.filterLabel, selectedDate && styles.filterLabelActive]}>
                                        {selectedDate ? formatDate(selectedDate).toUpperCase() : "DATE RANGE"}
                                    </Text>
                                </AdminGlassCard>
                            </TouchableOpacity>
                        )}

                        {selectedDate && (
                            <TouchableOpacity onPress={clearDateFilter} style={styles.clearBtn}>
                                <Ionicons name="close-circle" size={18} color="#FF4D4D" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Outlet Picker Button */}
                    <TouchableOpacity onPress={() => setShowOutletModal(true)}>
                        <AdminGlassCard intensity="light" style={[styles.filterBtn, filterOutlet && styles.filterBtnActive]}>
                            <Ionicons name="business" size={16} color={filterOutlet ? "#3B82F6" : "#475569"} />
                            <Text style={[styles.filterLabel, filterOutlet && styles.filterLabelActive]}>
                                {filterOutlet ? filterOutlet.nama_outlet.toUpperCase() : "SELECT BRANCH"}
                            </Text>
                        </AdminGlassCard>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* List */}
            <FlatList
                data={transactions}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listArea}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF3131" />}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="documents-outline" size={64} color="rgba(255,255,255,0.05)" />
                            <Text style={styles.emptyText}>GENERATE AUDIT TRAIL</Text>
                            <Text style={styles.emptySub}>No transaction data matches your criteria.</Text>
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
                            <Text style={styles.outletModalTitle}>BRANCH SELECTOR</Text>
                            <TouchableOpacity onPress={() => setShowOutletModal(false)}>
                                <Ionicons name="close" size={20} color="#94A3B8" />
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
                                ]}>GLOBAL VIEW (ALL BRANCHES)</Text>
                                {!filterOutlet && <Ionicons name="checkmark-circle" size={18} color="#3B82F6" />}
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
                                    ]}>{outlet.nama_outlet.toUpperCase()}</Text>
                                    {filterOutlet?.id === outlet.id && <Ionicons name="checkmark-circle" size={18} color="#3B82F6" />}
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
    filterSection: {
        marginBottom: 20,
    },
    filterScroll: {
        paddingHorizontal: 20,
        gap: 12,
        alignItems: 'center',
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 10,
        minWidth: 100,
    },
    filterBtnActive: {
        borderColor: 'rgba(59, 130, 246, 0.4)',
    },
    filterLabel: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '900',
        letterSpacing: 1,
    },
    filterLabelActive: {
        color: '#3B82F6',
    },
    clearBtn: {
        marginLeft: -4,
    },
    listArea: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 16,
    },
    recordCard: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    outletBadge: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    outletText: {
        fontSize: 9,
        fontWeight: "900",
        color: "#94A3B8",
        letterSpacing: 1,
    },
    dateText: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: '700',
    },
    cardBody: {
        gap: 12,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center',
    },
    tipeWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    value: {
        fontSize: 13,
    },
    categoryBadge: {
        fontSize: 9,
        fontWeight: '900',
        color: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        letterSpacing: 0.5,
    },
    recordDesc: {
        fontSize: 13,
        color: "#94A3B8",
        lineHeight: 18,
    },
    textGreen: {
        color: "#4ADE80",
    },
    textRed: {
        color: "#FF4D4D",
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        marginVertical: 4,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    totalLabel: {
        fontWeight: "900",
        fontSize: 10,
        color: "#475569",
        letterSpacing: 1,
    },
    totalValue: {
        fontWeight: "900",
        fontSize: 18,
        color: "#FFFFFF"
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 80,
        gap: 16,
    },
    emptyText: {
        fontSize: 14,
        color: "#64748B",
        fontWeight: "900",
        letterSpacing: 2,
    },
    emptySub: {
        fontSize: 12,
        color: "#475569",
        textAlign: 'center',
        fontWeight: '600',
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
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
        fontSize: 14,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 2,
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
        fontSize: 13,
        color: "#F1F5F9",
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    selectedOutletText: {
        color: "#3B82F6",
        fontWeight: "900",
    },
});
