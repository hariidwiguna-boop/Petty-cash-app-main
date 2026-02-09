import { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    StyleSheet,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { supabase, Transaction, TransactionItem } from "../../../lib/supabase";
import PlatformDatePicker from "../../../components/PlatformDatePicker";
import MessageModal from "../../../components/MessageModal";
import { PaginationService, PaginatedResult, usePagination } from "../../../lib/pagination";
import { LinearGradient } from "expo-linear-gradient";

interface TransactionWithItems extends Transaction {
    items: TransactionItem[];
}

export default function HistoryScreen() {
    const { outlet, isAdmin, adminSelectedOutlet } = useAuthStore();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Filter state
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Edit modal state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingTx, setEditingTx] = useState<TransactionWithItems | null>(null);
    const [editDate, setEditDate] = useState("");
    const [editItems, setEditItems] = useState<any[]>([]);

    // Message Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: "",
        message: "",
        type: "info" as "success" | "error" | "warning" | "info" | "confirm",
        onConfirm: undefined as undefined | (() => void),
    });

    const showModal = (
        title: string,
        message: string,
        type: "success" | "error" | "warning" | "info" | "confirm" = "info",
        onConfirm?: () => void
    ) => {
        setModalConfig({ title, message, type, onConfirm });
        setModalVisible(true);
    };

    const fetchHistory = async (page: number = 1, limit: number = 20) => {
        const activeOutlet = isAdmin ? (adminSelectedOutlet || outlet) : outlet;

        // If not admin and no outlet, return empty result
        if (!isAdmin && !activeOutlet) {
            return Promise.resolve({
                data: [],
                pagination: {
                    currentPage: 1,
                    totalPages: 0,
                    totalCount: 0,
                    hasNextPage: false,
                    hasPreviousPage: false,
                    limit,
                },
            });
        }

        try {
            let query = supabase
                .from("transactions")
                .select(`
                    *,
                    transaction_items (*),
                    outlets (nama_outlet)
                `);

            // Apply outlet filter if active
            if (activeOutlet) {
                query = query.eq("outlet_id", activeOutlet.id);
            }

            // Apply date filters and pagination
            return await PaginationService.fetchWithDateRange(
                supabase,
                "transactions",
                query,
                "tanggal",
                startDate,
                endDate,
                page,
                limit
            );
        } catch (error) {
            console.error("History fetch error:", error);
            throw error;
        }
    };

    // Transform paginated data to the expected format
    const transformData = (result: PaginatedResult<any>): TransactionWithItems[] => {
        return result.data.map((tx: any) => ({
            ...tx,
            items: tx.transaction_items || []
        }));
    };

    // Use pagination hook
    const paginationState = usePagination<TransactionWithItems>(
        async (page: number, limit: number) => {
            const result = await fetchHistory(page, limit);
            return {
                ...result,
                data: transformData(result),
            };
        },
        { initialPage: 1, limit: 20 }
    );

    useEffect(() => {
        paginationState.fetchData(1);
    }, [outlet, isAdmin, adminSelectedOutlet]);

    useFocusEffect(
        useCallback(() => {
            paginationState.fetchData(1);
        }, [outlet, isAdmin, adminSelectedOutlet])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await paginationState.refresh();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Edit functions
    const openEditModal = (tx: TransactionWithItems) => {
        if (tx.status_reimburse === "Disetujui") {
            showModal("Akses Ditolak", "Transaksi yang sudah disetujui tidak dapat diedit.", "warning");
            return;
        }
        setEditingTx(tx);
        setEditDate(tx.tanggal);
        setEditItems(tx.items.map(item => ({
            id: item.id,
            deskripsi: item.deskripsi,
            qty: String(item.qty),
            satuan: item.satuan,
            harga: String(item.total_harga / Number(item.qty)),
        })));
        setEditModalVisible(true);
    };

    const updateEditItem = (index: number, field: string, value: string) => {
        const updated = [...editItems];
        updated[index] = { ...updated[index], [field]: value };
        setEditItems(updated);
    };

    const addEditItem = () => {
        setEditItems([...editItems, { id: null, deskripsi: "", qty: "1", satuan: "Pcs", harga: "" }]);
    };

    const removeEditItem = (index: number) => {
        if (editItems.length === 1) return;
        setEditItems(editItems.filter((_, i) => i !== index));
    };

    const calculateEditTotal = () => {
        return editItems.reduce((total, item) => {
            return total + (parseFloat(item.qty) || 0) * (parseFloat(item.harga) || 0);
        }, 0);
    };

    const saveEdit = async () => {
        if (!editingTx) return;

        try {
            // Update transaction
            const { error: txError } = await supabase
                .from("transactions")
                .update({
                    tanggal: editDate,
                    grand_total: calculateEditTotal(),
                })
                .eq("id", editingTx.id);

            if (txError) throw txError;

            // Delete old items
            await supabase
                .from("transaction_items")
                .delete()
                .eq("transaction_id", editingTx.id);

            // Insert new items
            const newItems = editItems.map(item => ({
                transaction_id: editingTx.id,
                deskripsi: item.deskripsi,
                qty: item.qty,
                satuan: item.satuan,
                total_harga: parseFloat(item.qty) * parseFloat(item.harga),
            }));

            const { error: itemsError } = await supabase
                .from("transaction_items")
                .insert(newItems);

            if (itemsError) throw itemsError;

            showModal("Sukses", "Transaksi berhasil diupdate", "success");
            setEditModalVisible(false);
            fetchHistory();
        } catch (error: any) {
            showModal("Error", error.message, "error");
        }
    };

    // Delete functions
    const executeDelete = async (id: string) => {
        try {
            // Delete items first
            await supabase
                .from("transaction_items")
                .delete()
                .eq("transaction_id", id);

            // Delete transaction
            const { error } = await supabase
                .from("transactions")
                .delete()
                .eq("id", id);

            if (error) throw error;

            showModal("Sukses", "Transaksi berhasil dihapus", "success");
            fetchHistory();
        } catch (error: any) {
            showModal("Error", error.message, "error");
        }
    };

    const handleDeletePress = (tx: TransactionWithItems) => {
        if (tx.status_reimburse === "Disetujui") {
            showModal("Akses Ditolak", "Transaksi yang sudah disetujui tidak dapat dihapus.", "warning");
            return;
        }
        showModal(
            "Hapus Transaksi?",
            "Transaksi ini akan dihapus permanen.",
            "confirm",
            () => executeDelete(tx.id)
        );
    };

    return (
        <LinearGradient
            colors={['#991B1B', '#DC2626', '#FFFFFF', '#FFFFFF']}
            locations={[0, 0.3, 0.8, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradientBackground}
        >
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.glassCard}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>📜 Riwayat Transaksi</Text>
                            <Text style={styles.modalSubtitle}>Semua pengeluaran kas Anda</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Filter Section */}
                    <View style={styles.filterSection}>
                        <View style={{ flex: 1 }}>
                            <PlatformDatePicker
                                value={startDate ? new Date(startDate) : new Date()}
                                onChange={(d) => setStartDate(d.toISOString().split('T')[0])}
                                label="Dari"
                            />
                        </View>
                        <View style={{ width: 10 }} />
                        <View style={{ flex: 1 }}>
                            <PlatformDatePicker
                                value={endDate ? new Date(endDate) : new Date()}
                                onChange={(d) => setEndDate(d.toISOString().split('T')[0])}
                                label="Sampai"
                            />
                        </View>
                        <TouchableOpacity style={styles.filterBtn} onPress={() => paginationState.fetchData(1)}>
                            <Text style={styles.filterBtnIcon}>🔍</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.modalContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    >
                        {paginationState.data.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>📭</Text>
                                <Text style={styles.emptyText}>Belum ada transaksi</Text>
                            </View>
                        ) : (
                            paginationState.data.map((tx) => (
                                <View key={tx.id} style={styles.txItem}>
                                    {/* Transaction Header */}
                                    <TouchableOpacity
                                        style={styles.txHeader}
                                        onPress={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.txInfo}>
                                            <View
                                                style={[
                                                    styles.txIcon,
                                                    tx.tipe === "Kas Keluar"
                                                        ? styles.txIconOut
                                                        : styles.txIconIn,
                                                ]}
                                            >
                                                <Text>{tx.tipe === "Kas Keluar" ? "📤" : "📥"}</Text>
                                            </View>
                                            <View style={styles.txDetails}>
                                                <Text style={styles.txType}>{tx.tipe}</Text>
                                                <Text style={styles.txDate}>{formatDate(tx.tanggal)}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.txRight}>
                                            <Text
                                                style={[
                                                    styles.txAmount,
                                                    tx.tipe === "Kas Keluar"
                                                        ? styles.txAmountOut
                                                        : styles.txAmountIn,
                                                ]}
                                            >
                                                {tx.tipe === "Kas Keluar" ? "-" : "+"}
                                                {formatCurrency(tx.grand_total)}
                                            </Text>
                                            <View
                                                style={[
                                                    styles.statusBadge,
                                                    tx.status_reimburse === "Disetujui" && styles.statusApproved,
                                                    tx.status_reimburse === "Diajukan" && styles.statusPending,
                                                ]}
                                            >
                                                <Text style={styles.statusText}>{tx.status_reimburse}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>

                                    {/* Expanded Items */}
                                    {expandedId === tx.id && (
                                        <View style={styles.txExpanded}>
                                            <Text style={styles.txExpandedTitle}>Detail Item:</Text>
                                            {tx.items.map((item: TransactionItem, idx: number) => (
                                                <View key={item.id || idx} style={styles.txExpandedItem}>
                                                    <Text style={styles.txExpandedDesc}>{item.deskripsi}</Text>
                                                    <Text style={styles.txExpandedQty}>
                                                        {item.qty} {item.satuan}
                                                    </Text>
                                                    <Text style={styles.txExpandedAmount}>
                                                        {formatCurrency(item.total_harga)}
                                                    </Text>
                                                </View>
                                            ))}

                                            {/* Action Buttons */}
                                            <View style={styles.txActions}>
                                                <TouchableOpacity
                                                    style={styles.editBtn}
                                                    onPress={() => openEditModal(tx)}
                                                >
                                                    <Text style={styles.editBtnText}>✏️ Edit</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.deleteBtn}
                                                    onPress={() => handleDeletePress(tx)}
                                                >
                                                    <Text style={styles.deleteBtnText}>🗑️ Hapus</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            ))
                        )}

                        {/* Pagination Controls */}
                        {paginationState.pagination.totalPages > 1 && (
                            <View style={styles.paginationContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.paginationBtn,
                                        !paginationState.pagination.hasPreviousPage && styles.paginationBtnDisabled
                                    ]}
                                    onPress={paginationState.previousPage}
                                    disabled={!paginationState.pagination.hasPreviousPage}
                                >
                                    <Text style={styles.paginationBtnText}>← Sebelumnya</Text>
                                </TouchableOpacity>

                                <View style={styles.paginationInfo}>
                                    <Text style={styles.paginationText}>
                                        Halaman {paginationState.pagination.currentPage} dari {paginationState.pagination.totalPages}
                                    </Text>
                                    <Text style={styles.paginationSubText}>
                                        Total {paginationState.pagination.totalCount} transaksi
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.paginationBtn,
                                        !paginationState.pagination.hasNextPage && styles.paginationBtnDisabled
                                    ]}
                                    onPress={paginationState.nextPage}
                                    disabled={!paginationState.pagination.hasNextPage}
                                >
                                    <Text style={styles.paginationBtnText}>Selanjutnya →</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={styles.btnSecondary}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.btnSecondaryText}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Edit Modal */}
                <Modal visible={editModalVisible} animationType="slide" transparent>
                    <View style={styles.editModalOverlay}>
                        <View style={styles.editModalCard}>
                            <View style={styles.editModalHeader}>
                                <Text style={styles.editModalTitle}>Edit Transaksi</Text>
                                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                    <Text style={styles.editModalClose}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.editModalContent}>
                                <PlatformDatePicker
                                    label="Tanggal"
                                    value={editDate ? new Date(editDate) : new Date()}
                                    onChange={(d) => setEditDate(d.toISOString().split('T')[0])}
                                    maximumDate={new Date()}
                                />

                                {editItems.map((item, index) => (
                                    <View key={index} style={styles.editItemCard}>
                                        <View style={styles.editItemHeader}>
                                            <Text style={styles.editItemNumber}>Item {index + 1}</Text>
                                            {editItems.length > 1 && (
                                                <TouchableOpacity onPress={() => removeEditItem(index)}>
                                                    <Text>🗑️</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <TextInput
                                            style={styles.editInput}
                                            placeholder="Deskripsi"
                                            value={item.deskripsi}
                                            onChangeText={(v) => updateEditItem(index, "deskripsi", v)}
                                        />
                                        <View style={styles.editItemRow}>
                                            <TextInput
                                                style={[styles.editInput, { flex: 1 }]}
                                                placeholder="Qty"
                                                keyboardType="numeric"
                                                value={item.qty}
                                                onChangeText={(v) => updateEditItem(index, "qty", v)}
                                            />
                                            <TextInput
                                                style={[styles.editInput, { flex: 1 }]}
                                                placeholder="Satuan"
                                                value={item.satuan}
                                                onChangeText={(v) => updateEditItem(index, "satuan", v)}
                                            />
                                            <TextInput
                                                style={[styles.editInput, { flex: 1 }]}
                                                placeholder="Harga"
                                                keyboardType="numeric"
                                                value={item.harga}
                                                onChangeText={(v) => updateEditItem(index, "harga", v)}
                                            />
                                        </View>
                                    </View>
                                ))}

                                <TouchableOpacity style={styles.addItemBtn} onPress={addEditItem}>
                                    <Text style={styles.addItemText}>➕ Tambah Item</Text>
                                </TouchableOpacity>

                                <View style={styles.editTotalCard}>
                                    <Text style={styles.editTotalLabel}>TOTAL</Text>
                                    <Text style={styles.editTotalValue}>{formatCurrency(calculateEditTotal())}</Text>
                                </View>
                            </ScrollView>

                            <View style={styles.editModalFooter}>
                                <TouchableOpacity
                                    style={styles.editCancelBtn}
                                    onPress={() => setEditModalVisible(false)}
                                >
                                    <Text style={styles.editCancelText}>Batal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.editSaveBtn} onPress={saveEdit}>
                                    <Text style={styles.editSaveText}>Simpan</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>



                {/* Message Modal */}
                <MessageModal
                    visible={modalVisible}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    onConfirm={() => {
                        if (modalConfig.onConfirm) modalConfig.onConfirm();
                        setModalVisible(false);
                    }}
                    onClose={() => setModalVisible(false)}
                />
            </SafeAreaView >
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    glassCard: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.55)", // Transparent White
        margin: 16,
        borderRadius: 24,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.6)",
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } : {}),
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1E293B",
    },
    modalSubtitle: {
        fontSize: 13,
        color: "#475569",
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.5)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    closeBtnText: {
        fontSize: 16,
        color: "#64748b",
    },
    // Filter
    filterSection: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
        gap: 8,
    },
    filterInput: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.6)",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 13,
    },
    filterDash: {
        color: "#9ca3af",
    },
    filterBtn: {
        width: 40,
        height: 40,
        backgroundColor: "#2563EB",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    filterBtnIcon: {
        fontSize: 18,
        color: 'white',
    },
    // Content
    modalContent: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 14,
        color: "#64748b",
    },
    // Transaction Item
    txItem: {
        backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi transparent
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.9)",
        borderRadius: 14,
        marginBottom: 12,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    txHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 14,
    },
    txInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    txIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    txIconOut: {
        backgroundColor: "#fee2e2",
    },
    txIconIn: {
        backgroundColor: "#dcfce7",
    },
    txDetails: {},
    txType: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1E293B",
    },
    txDate: {
        fontSize: 12,
        color: "#64748b",
    },
    txRight: {
        alignItems: "flex-end",
    },
    txAmount: {
        fontSize: 15,
        fontWeight: "800",
    },
    txAmountOut: {
        color: "#dc2626",
    },
    txAmountIn: {
        color: "#16a34a",
    },
    statusBadge: {
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginTop: 4,
    },
    statusApproved: {
        backgroundColor: "#dcfce7",
    },
    statusPending: {
        backgroundColor: "#fef3c7",
    },
    statusText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#64748b",
    },
    // Expanded
    txExpanded: {
        backgroundColor: "rgba(249, 250, 251, 0.6)",
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
        padding: 14,
    },
    txExpandedTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: "#6b7280",
        marginBottom: 8,
    },
    txExpandedItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 4,
    },
    txExpandedDesc: {
        flex: 1,
        fontSize: 13,
        color: "#374151",
    },
    txExpandedQty: {
        fontSize: 12,
        color: "#9ca3af",
        marginHorizontal: 12,
    },
    txExpandedAmount: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1a1a1a",
    },
    // Action Buttons
    txActions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
    },
    editBtn: {
        flex: 1,
        backgroundColor: "#dbeafe",
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
    },
    editBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#1d4ed8",
    },
    deleteBtn: {
        flex: 1,
        backgroundColor: "#fee2e2",
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
    },
    deleteBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#dc2626",
    },
    // Footer
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
    },
    btnSecondary: {
        backgroundColor: "rgba(255,255,255,0.6)",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    btnSecondaryText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#64748b",
    },
    // Edit Modal
    editModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },
    editModalCard: {
        backgroundColor: "rgba(255, 255, 255, 0.95)", // High opacity for form readability
        borderRadius: 24,
        maxHeight: "80%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    editModalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    editModalTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1E293B",
    },
    editModalClose: {
        fontSize: 20,
        color: "#64748b",
    },
    editModalContent: {
        padding: 20,
    },
    editLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#475569",
        marginBottom: 6,
    },
    editInput: {
        backgroundColor: "rgba(255,255,255,0.6)",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 10,
        color: "#1E293B",
    },
    editItemCard: {
        backgroundColor: "rgba(241, 245, 249, 0.5)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    editItemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    editItemNumber: {
        fontSize: 12,
        fontWeight: "700",
        color: "#64748b",
    },
    editItemRow: {
        flexDirection: "row",
        gap: 8,
    },
    addItemBtn: {
        backgroundColor: "#e0f2fe",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 16,
    },
    addItemText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0284c7",
    },
    editTotalCard: {
        backgroundColor: "#dbeafe",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    editTotalLabel: {
        fontSize: 12,
        color: "#3b82f6",
        fontWeight: "600",
    },
    editTotalValue: {
        fontSize: 24,
        fontWeight: "900",
        color: "#1d4ed8",
    },
    editModalFooter: {
        flexDirection: "row",
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
    },
    editCancelBtn: {
        flex: 1,
        backgroundColor: "#f1f5f9",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    editCancelText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#64748b",
    },
    editSaveBtn: {
        flex: 1,
        backgroundColor: "#DC2626",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    editSaveText: {
        fontSize: 14,
        fontWeight: "700",
        color: "white",
    },
    // Delete Modal
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    deleteModalCard: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 24,
        padding: 32,
        alignItems: "center",
        width: "100%",
        maxWidth: 340,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    deleteModalIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    deleteModalTitle: {
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 8,
        color: "#1E293B",
    },
    deleteModalText: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
        marginBottom: 24,
    },
    deleteModalActions: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
    },
    deleteCancelBtn: {
        flex: 1,
        backgroundColor: "#f1f5f9",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    deleteCancelText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#64748b",
    },
    deleteConfirmBtn: {
        flex: 1,
        backgroundColor: "#dc2626",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    deleteConfirmText: {
        fontSize: 14,
        fontWeight: "700",
        color: "white",
    },
    // Pagination Styles
    paginationContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(0,0,0,0.05)",
        backgroundColor: "rgba(255,255,255,0.4)",
    },
    paginationBtn: {
        backgroundColor: "#2563EB",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 100,
        alignItems: "center",
    },
    paginationBtnDisabled: {
        backgroundColor: "#cbd5e1",
    },
    paginationBtnText: {
        fontSize: 12,
        fontWeight: "600",
        color: "white",
    },
    paginationInfo: {
        alignItems: "center",
        flex: 1,
    },
    paginationText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1E293B",
        textAlign: "center",
    },
    paginationSubText: {
        fontSize: 11,
        color: "#64748b",
        textAlign: "center",
        marginTop: 2,
    },
});
