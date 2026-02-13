import { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { supabase } from "../../../lib/supabase";
import { formatDateToISO } from "../../../lib/dateUtils";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface ItemRow {
    id: string;
    deskripsi: string;
    qty: string;
    satuan: string;
    harga: string; // Total price for the row
}

export default function InputScreen() {
    const { profile, outlet } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [tanggal, setTanggal] = useState(new Date());

    const [items, setItems] = useState<ItemRow[]>([
        { id: "1", deskripsi: "", qty: "", satuan: "", harga: "" },
    ]);

    const addItem = () => {
        setItems([...items, { id: Date.now().toString(), deskripsi: "", qty: "", satuan: "", harga: "" }]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) return;
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: keyof ItemRow, value: string) => {
        setItems(items.map((item) => item.id === id ? { ...item, [field]: value } : item));
    };

    const calculateTotal = () => {
        return items.reduce((total, item) => total + (parseFloat(item.harga) || 0), 0);
    };

    const formatCurrency = (amount: number) => {
        return "Rp . " + amount.toLocaleString("id-ID").replace(/\s/g, '');
    };

    const handleSubmit = async () => {
        const validItems = items.filter((item) => item.deskripsi && item.harga);
        if (validItems.length === 0) return;

        if (!outlet || !profile) return;

        setIsLoading(true);
        try {
            const formattedDate = formatDateToISO(tanggal);
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

            const itemsToInsert = validItems.map((item) => ({
                transaction_id: transaction.id,
                deskripsi: item.deskripsi,
                qty: item.qty || "1",
                satuan: item.satuan || "Pcs",
                total_harga: parseFloat(item.harga),
            }));

            const { error: itemsError } = await supabase.from("transaction_items").insert(itemsToInsert);
            if (itemsError) throw itemsError;

            router.back();
        } catch (error: any) {
            console.error("Save error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Red Gradient Background */}
            <LinearGradient colors={['#FF0000', '#FFFFFF']} style={StyleSheet.absoluteFill} />

            {/* Header Curve Red Area */}
            <View style={styles.headerArea}>
                <LinearGradient colors={['#FF0000', '#FF3131']} style={styles.headerGradient}>
                    <SafeAreaView edges={['top']} style={styles.headerContent}>
                        <View style={styles.topRow}>
                            <View style={styles.titleCol}>
                                <Text style={styles.headerTitle}>CATAT TRANSAKSI</Text>
                                <Text style={styles.headerSubtitle}>Input pengeluaran kas kecil</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                                <Ionicons name="close" size={28} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Total Estimasi Badge */}
                        <View style={styles.totalBadge}>
                            <Text style={styles.totalLabel}>TOTAL ESTIMASI</Text>
                            <Text style={styles.totalValue}>{formatCurrency(calculateTotal())}</Text>
                        </View>
                    </SafeAreaView>
                    <View style={styles.headerCurve} />
                </LinearGradient>
            </View>

            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.bodyScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.formCard}>
                        {/* Tanggal Input */}
                        <Text style={styles.fieldLabel}>Tanggal Transaksi</Text>
                        <TouchableOpacity style={styles.datePickerBtn}>
                            <Text style={styles.dateText}>
                                {tanggal.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </Text>
                            <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
                        </TouchableOpacity>

                        {/* Item Rows */}
                        {items.map((item, index) => (
                            <View key={item.id} style={styles.itemRowWrapper}>
                                <View style={styles.itemHeader}>
                                    <View style={styles.itemIndicator}>
                                        <Text style={styles.itemLabel}>Item {index + 1}</Text>
                                    </View>
                                    {items.length > 1 && (
                                        <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.trashBtn}>
                                            <Ionicons name="trash-outline" size={18} color="#FF0000" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Cari / Ketik Nama Item..."
                                    placeholderTextColor="#94A3B8"
                                    value={item.deskripsi}
                                    onChangeText={(v) => updateItem(item.id, 'deskripsi', v)}
                                />

                                <View style={styles.rowInputs}>
                                    <View style={styles.qtyBox}>
                                        <Text style={styles.subLabel}>Qty</Text>
                                        <TextInput
                                            style={styles.smallInput}
                                            value={item.qty}
                                            onChangeText={(v) => updateItem(item.id, 'qty', v)}
                                            placeholder="0"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={styles.satuanBox}>
                                        <Text style={styles.subLabel}>Satuan</Text>
                                        <TextInput
                                            style={styles.smallInput}
                                            value={item.satuan}
                                            onChangeText={(v) => updateItem(item.id, 'satuan', v)}
                                            placeholder="Pcs"
                                        />
                                    </View>
                                    <View style={styles.hargaBox}>
                                        <Text style={styles.subLabel}>Total Harga</Text>
                                        <TextInput
                                            style={styles.smallInput}
                                            value={item.harga}
                                            onChangeText={(v) => updateItem(item.id, 'harga', v)}
                                            keyboardType="numeric"
                                            placeholder="0"
                                        />
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Tambah Item Btn */}
                        <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
                            <View style={styles.addItemIconInner}>
                                <Ionicons name="add" size={20} color="#FF0000" />
                            </View>
                            <Text style={styles.addItemText}>Tambah Item</Text>
                        </TouchableOpacity>

                        {/* Save Button */}
                        <View style={styles.footerAction}>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={isLoading}>
                                <LinearGradient colors={['#FF0000', '#D00000']} style={styles.saveGradient}>
                                    {isLoading ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <Text style={styles.saveBtnText}>Simpan Transaksi</Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
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
    totalBadge: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignSelf: 'center',
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 2,
        marginBottom: 4,
    },
    totalValue: {
        fontSize: 24,
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
    formCard: {
        gap: 20,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: -10,
    },
    datePickerBtn: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    dateText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    itemRowWrapper: {
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 12,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemIndicator: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    itemLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 1,
    },
    trashBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 10,
    },
    qtyBox: { flex: 0.7 },
    satuanBox: { flex: 1 },
    hargaBox: { flex: 2 },
    subLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        marginBottom: 6,
        marginLeft: 4,
    },
    smallInput: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    addItemBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 0, 0, 0.05)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderStyle: 'dashed',
        borderColor: 'rgba(255, 0, 0, 0.2)',
        gap: 10,
    },
    addItemIconInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addItemText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#FF0000',
    },
    footerAction: {
        marginTop: 10,
    },
    saveBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#FF0000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    saveGradient: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
