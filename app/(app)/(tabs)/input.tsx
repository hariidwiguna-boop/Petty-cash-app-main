import { useState, useEffect, createElement } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { supabase } from "../../../lib/supabase";
import PlatformDatePicker from "../../../components/PlatformDatePicker";
import MessageModal from "../../../components/MessageModal";

interface ItemRow {
    id: string;
    deskripsi: string;
    qty: string;
    satuan: string;
    harga: string; // Raw numeric string
}

interface MasterItem {
    id: string;
    nama_bahan: string;
    satuan_default: string;
}

export default function InputScreen() {
    const { profile, outlet } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [tanggal, setTanggal] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [items, setItems] = useState<ItemRow[]>([
        { id: "1", deskripsi: "", qty: "", satuan: "", harga: "" },
    ]);

    // Master Data for Dropdown
    const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
    const [isItemModalVisible, setIsItemModalVisible] = useState(false);
    const [activeRowId, setActiveRowId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Message Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: "",
        message: "",
        type: "info" as "success" | "error" | "warning" | "info" | "confirm",
    });

    const showModal = (title: string, message: string, type: "success" | "error" | "warning" | "info" = "info") => {
        setModalConfig({ title, message, type });
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        if (modalConfig.type === 'success') {
            setItems([{ id: "1", deskripsi: "", qty: "", satuan: "", harga: "" }]);
            router.back();
        }
    };

    // Debug Data Loading
    useEffect(() => {
        fetchMasterItems();
    }, []);

    const fetchMasterItems = async () => {
        try {
            console.log("Fetching master items...");
            const { data, error } = await supabase
                .from("master_items")
                .select("id, nama_bahan, satuan_default")
                .order("nama_bahan", { ascending: true });

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }
            console.log("Master Items Loaded:", data?.length);
            setMasterItems(data || []);
        } catch (error: any) {
            console.error("Error fetching master items:", error);
            // Optional: Alert.alert("Error Loading Data", error.message);
        }
    };

    const addItem = () => {
        setItems([
            ...items,
            {
                id: Date.now().toString(),
                deskripsi: "",
                qty: "",
                satuan: "",
                harga: "",
            },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) return;
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: keyof ItemRow, value: string) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    // Currency Formatter for Display
    const formatCurrencyInput = (value: string) => {
        if (!value) return "";
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handlePriceChange = (id: string, text: string) => {
        // Remove non-numeric characters to store raw value
        const rawValue = text.replace(/[^0-9]/g, "");
        updateItem(id, "harga", rawValue);
    };

    const calculateTotal = () => {
        return items.reduce((total, item) => {
            // New logic: item.harga IS the total price for that row
            const harga = parseFloat(item.harga) || 0;
            return total + harga;
        }, 0);
    };

    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (event.type === "set" && selectedDate) {
            setTanggal(selectedDate);
        }
    };

    const openItemSelector = (rowId: string, currentVal: string) => {
        setActiveRowId(rowId);
        setSearchQuery(currentVal); // Pre-fill with existing value
        setIsItemModalVisible(true);
    };

    // Smart Selection Logic
    const selectItem = (item: MasterItem | string) => {
        if (activeRowId) {
            setItems(items.map(row => {
                if (row.id === activeRowId) {
                    if (typeof item === 'string') {
                        // Manual Input
                        return { ...row, deskripsi: item };
                    } else {
                        // Master Item Input
                        return {
                            ...row,
                            deskripsi: item.nama_bahan,
                            satuan: item.satuan_default || "Pcs"
                        };
                    }
                }
                return row;
            }));
        }
        setIsItemModalVisible(false);
        setActiveRowId(null);
    };

    const filteredMasterItems = masterItems.filter(item =>
        item.nama_bahan.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper to parse "1/4", "0,5", "1.5", "1 1/2"
    const parseQty = (qtyStr: string) => {
        if (!qtyStr) return 0;
        try {
            // Replace comma with dot and trim
            let cleanStr = qtyStr.trim().replace(",", ".");

            // Handle Mixed Fraction: "1 1/2" -> Split by space
            const parts = cleanStr.split(" ").filter(p => p.length > 0);

            if (parts.length === 2 && parts[1].includes("/")) {
                const whole = parseFloat(parts[0]);
                const [num, den] = parts[1].split("/");
                return whole + (Number(num) / Number(den));
            }

            // Handle Simple Fraction: "1/4"
            if (cleanStr.includes("/")) {
                const [num, den] = cleanStr.split("/");
                return Number(num) / Number(den);
            }

            return parseFloat(cleanStr);
        } catch (e) {
            return 0;
        }
    };

    const handleSubmit = async () => {
        const validItems = items.filter((item) => item.deskripsi && item.harga);
        if (validItems.length === 0) {
            showModal("Error", "Minimal 1 item harus diisi", "error");
            return;
        }

        if (!outlet || !profile) {
            showModal("Error", "Outlet atau profile tidak ditemukan", "error");
            return;
        }

        setIsLoading(true);

        try {
            const formattedDate = tanggal.toISOString().split("T")[0];

            const { data: transaction, error: txError } = await supabase
                .from("transactions")
                .insert({
                    tanggal: formattedDate,
                    outlet_id: outlet.id,
                    user_id: profile.id,
                    tipe: "Kas Keluar",
                    grand_total: calculateTotal(),
                    status_reimburse: "Tercatat",
                })
                .select()
                .single();

            if (txError) throw txError;

            const itemsToInsert = validItems.map((item) => {
                const qtyVal = parseQty(item.qty);
                // Save decimal string if valid number, else original string
                const finalQty = qtyVal && !isNaN(qtyVal) ? qtyVal.toString() : item.qty;

                return {
                    transaction_id: transaction.id,
                    deskripsi: item.deskripsi,
                    qty: finalQty,
                    satuan: item.satuan || "Pcs", // Default if empty
                    // New logic: item.harga IS the total_harga
                    total_harga: parseFloat(item.harga),
                };
            });

            const { error: itemsError } = await supabase
                .from("transaction_items")
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;

            if (itemsError) throw itemsError;

            showModal("Sukses", "Transaksi berhasil disimpan!", "success");

        } catch (error: any) {
            showModal("Error", error.message || "Gagal menyimpan transaksi", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Render picker items
    const renderPickerItem = ({ item }: { item: MasterItem }) => (
        <TouchableOpacity
            style={styles.pickerItem}
            onPress={() => selectItem(item)}
        >
            <View>
                <Text style={styles.pickerItemText}>{item.nama_bahan}</Text>
                <Text style={styles.pickerItemSub}>Stok/Satuan: {item.satuan_default}</Text>
            </View>
            <Text style={styles.arrowIcon}>→</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.keyboardView}
            >
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                        <Text style={styles.modalTitle}>Catat Transaksi</Text>
                        <Text style={styles.modalSubtitle}>Input pengeluaran kas kecil</Text>
                    </View>
                    <View style={styles.totalBadge}>
                        <Text style={styles.totalLabel}>TOTAL</Text>
                        <Text style={styles.totalValue}>{formatCurrency(calculateTotal())}</Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    {/* Date Input */}
                    <PlatformDatePicker
                        label="Tanggal Transaksi"
                        value={tanggal}
                        onChange={setTanggal}
                        maximumDate={new Date()}
                    />

                    {/* Items */}
                    {items.map((item, index) => (
                        <View key={item.id} style={styles.itemCard}>
                            <View style={styles.itemCardHeader}>
                                <Text style={styles.itemNumber}>Item {index + 1}</Text>
                                {items.length > 1 && (
                                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                                        <Text style={styles.removeBtn}>🗑️</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Smart Input for Deskripsi */}
                            <TouchableOpacity
                                style={[styles.formInput, styles.dropdownBtn]}
                                onPress={() => openItemSelector(item.id, item.deskripsi)}
                            >
                                <Text style={item.deskripsi ? styles.inputText : styles.placeholderText}>
                                    {item.deskripsi || "Cari / Ketik Nama Item..."}
                                </Text>
                                <Text>🔍</Text>
                            </TouchableOpacity>

                            <View style={styles.itemRow}>
                                <View style={styles.itemRowField}>
                                    <Text style={styles.itemFieldLabel}>Qty</Text>
                                    <TextInput
                                        style={styles.formInputSmall}
                                        placeholder=""
                                        keyboardType="default" // Changed to default to allow '/'
                                        value={item.qty}
                                        onChangeText={(v) => updateItem(item.id, "qty", v)}
                                    />
                                </View>
                                <View style={styles.itemRowField}>
                                    <Text style={styles.itemFieldLabel}>Satuan</Text>
                                    <TextInput
                                        style={styles.formInputSmall}
                                        placeholder="Pcs"
                                        value={item.satuan}
                                        onChangeText={(v) => updateItem(item.id, "satuan", v)}
                                    />
                                </View>
                                <View style={[styles.itemRowField, { flex: 1.5 }]}>
                                    <Text style={styles.itemFieldLabel}>Total Harga</Text>
                                    <TextInput
                                        style={styles.formInputSmall}
                                        placeholder="0"
                                        keyboardType="numeric"
                                        value={formatCurrencyInput(item.harga)}
                                        onChangeText={(v) => handlePriceChange(item.id, v)}
                                    />
                                </View>
                            </View>

                            {/* Optional: Show calculated unit price if qty exists */}
                            {item.qty && item.harga && parseQty(item.qty) > 0 && (
                                <Text style={styles.itemSubtotal}>
                                    (@ {formatCurrency(parseFloat(item.harga) / parseQty(item.qty))})
                                </Text>
                            )}
                        </View>
                    ))}

                    {/* Add Item Button */}
                    <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                        <Text style={styles.addItemIcon}>➕</Text>
                        <Text style={styles.addItemText}>Tambah Item</Text>
                    </TouchableOpacity>

                    {/* Bottom Padding for Scroll */}
                    <View style={{ height: 40 }} />
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.btnSecondaryText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.btnPrimaryText}>Simpan</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Smart Selection Modal */}
                <Modal
                    visible={isItemModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setIsItemModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <View style={styles.pickerHeader}>
                                <Text style={styles.pickerTitle}>Cari Barang</Text>
                                <TouchableOpacity onPress={() => setIsItemModalVisible(false)}>
                                    <Text style={styles.closeBtnText}>Tutup</Text>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.searchInput}
                                placeholder="Ketik nama barang..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />

                            <View style={{ flex: 1 }}>
                                {/* Manual Input Option - Always First */}
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.manualInputOption}
                                        onPress={() => selectItem(searchQuery)}
                                    >
                                        <Text style={styles.manualInputLabel}>Gunakan input manual:</Text>
                                        <Text style={styles.manualInputValue}>"{searchQuery}"</Text>
                                        <Text style={styles.manualInputHint}>→ Klik untuk pilih ini</Text>
                                    </TouchableOpacity>
                                )}

                                <Text style={styles.sectionTitleSmall}>Rekomendasi Item:</Text>

                                <FlatList
                                    data={filteredMasterItems}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderPickerItem}
                                    ListEmptyComponent={
                                        <Text style={styles.emptyList}>
                                            {searchQuery ? "Tidak ada item master yang cocok." : "Ketik untuk mencari..."}
                                        </Text>
                                    }
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>

            {/* Message Modal */}
            <MessageModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={handleModalClose}
            />
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f4d0",
    },
    keyboardView: {
        flex: 1,
        backgroundColor: "white",
        margin: 16,
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 40,
        elevation: 10,
    },
    // Modal Header
    modalHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        gap: 12,
    },
    modalHeaderLeft: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1a1a1a",
    },
    modalSubtitle: {
        fontSize: 13,
        color: "#666",
        marginTop: 2,
    },
    totalBadge: {
        backgroundColor: "#dbeafe",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignItems: "center",
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#3b82f6",
    },
    totalValue: {
        fontSize: 14,
        fontWeight: "800",
        color: "#1d4ed8",
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
    // Modal Content
    modalContent: {
        flex: 1,
        padding: 20,
    },
    formGroup: {
        marginBottom: 16,
    },
    itemLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    dateInputBtn: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    dateInputText: {
        fontSize: 15,
        color: "#1a1a1a",
    },
    formInput: {
        backgroundColor: "#f8f9fa",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: "#1a1a1a",
    },
    // Web only style
    dateInputWebWrapper: {
        width: '100%',
    },
    dropdownBtn: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    inputText: {
        fontSize: 15,
        color: "#1a1a1a",
        fontWeight: '600'
    },
    placeholderText: {
        fontSize: 15,
        color: "#9ca3af",
    },
    // Item Card
    itemCard: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },
    itemCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    itemNumber: {
        fontSize: 12,
        fontWeight: "700",
        color: "#6b7280",
    },
    removeBtn: {
        fontSize: 16,
    },
    itemRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 10,
    },
    itemRowField: {
        flex: 1,
    },
    itemFieldLabel: {
        fontSize: 11,
        color: "#9ca3af",
        marginBottom: 4,
    },
    formInputSmall: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: "#1a1a1a",
    },
    readOnlyInput: {
        backgroundColor: "#f3f4f6",
        color: "#6b7280",
    },
    itemSubtotal: {
        fontSize: 12,
        fontWeight: "700",
        color: "#3b82f6",
        textAlign: "right",
        marginTop: 10,
    },
    // Add Item Button
    addItemBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#e0f2fe",
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        borderWidth: 2,
        borderColor: "#bae6fd",
        borderStyle: "dashed",
    },
    addItemIcon: {
        fontSize: 16,
    },
    addItemText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#0284c7",
    },
    // Modal Footer
    modalFooter: {
        flexDirection: "row",
        padding: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        gap: 12,
    },
    btnSecondary: {
        flex: 1,
        backgroundColor: "#f1f5f9",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    btnSecondaryText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#64748b",
    },
    btnPrimary: {
        flex: 1,
        backgroundColor: "#C94C4C",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        shadowColor: "#C94C4C",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    btnPrimaryText: {
        fontSize: 15,
        fontWeight: "700",
        color: "white",
    },
    btnDisabled: {
        backgroundColor: "#d97979",
    },

    // Picker Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    pickerModal: {
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: "80%", // Taller for better search
        padding: 20,
    },
    pickerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    searchInput: {
        backgroundColor: "#f3f4f6",
        padding: 14,
        borderRadius: 12,
        fontSize: 16,
        marginBottom: 16,
        fontWeight: '500'
    },
    pickerItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    pickerItemText: {
        fontSize: 16,
        color: "#1a1a1a",
        fontWeight: '600'
    },
    pickerItemSub: {
        fontSize: 13,
        color: "#6b7280",
        marginTop: 2
    },
    arrowIcon: {
        color: '#ccc',
        fontSize: 20
    },
    emptyList: {
        textAlign: "center",
        color: "#9ca3af",
        marginTop: 20,
        fontStyle: 'italic'
    },
    sectionTitleSmall: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9ca3af',
        marginTop: 8,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    manualInputOption: {
        backgroundColor: '#e0f2fe',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#bae6fd'
    },
    manualInputLabel: {
        fontSize: 12,
        color: '#0284c7',
        fontWeight: '600',
        marginBottom: 2
    },
    manualInputValue: {
        fontSize: 16,
        color: '#0369a1',
        fontWeight: '700'
    },
    manualInputHint: {
        fontSize: 12,
        color: '#0284c7',
        alignSelf: 'flex-end',
        marginTop: 4
    }
});
