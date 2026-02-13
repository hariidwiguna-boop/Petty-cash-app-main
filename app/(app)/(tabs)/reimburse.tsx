import { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    StyleSheet,
    Platform,
    KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../../lib/supabase";
import { formatDateToISO } from "../../../lib/dateUtils";
import * as Clipboard from "expo-clipboard";

export default function ReimburseScreen() {
    const { profile, outlet } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const [isCalculated, setIsCalculated] = useState(false);
    const [txList, setTxList] = useState<any[]>([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [previewText, setPreviewText] = useState("");

    const formatCurrency = (amount: number) => {
        return "Rp . " + amount.toLocaleString("id-ID").replace(/\s/g, '');
    };

    const handleCalculate = async () => {
        if (!outlet) return;
        setIsLoading(true);

        try {
            const startStr = formatDateToISO(startDate);
            const endStr = formatDateToISO(endDate);

            const { data, error } = await supabase
                .from("transactions")
                .select("*, transaction_items(*)")
                .eq("outlet_id", outlet.id)
                .eq("tipe", "Kas Keluar")
                .eq("status_reimburse", "Tercatat")
                .gte("tanggal", startStr)
                .lte("tanggal", endStr)
                .order("tanggal");

            if (error) throw error;

            setTxList(data || []);
            const total = (data || []).reduce((sum, tx) => sum + (Number(tx.grand_total) || 0), 0);
            setTotalAmount(total);
            setIsCalculated(true);

            // Simplified preview for now
            setPreviewText(`Pengajuan Reimburse\nOutlet: ${outlet.nama_outlet}\nTotal: ${formatCurrency(total)}`);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!isCalculated || !outlet || !profile) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("reimbursements")
                .insert({
                    outlet_id: outlet.id,
                    user_id: profile.id,
                    start_date: formatDateToISO(startDate),
                    end_date: formatDateToISO(endDate),
                    total_amount: totalAmount,
                    status: "Pending",
                    notes: previewText
                })
                .select()
                .single();

            if (error) throw error;

            // Update transactions
            await supabase
                .from("transactions")
                .update({ status_reimburse: "Diajukan", reimburse_id: data.id })
                .eq("outlet_id", outlet.id)
                .eq("status_reimburse", "Tercatat")
                .gte("tanggal", formatDateToISO(startDate))
                .lte("tanggal", formatDateToISO(endDate));

            router.back();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
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
                                <Text style={styles.headerTitle}>SUBMIT REQUEST</Text>
                                <Text style={styles.headerSubtitle}>Pengajuan reimburse kas kecil</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                                <Ionicons name="close" size={28} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Total Display */}
                        <View style={styles.totalBadge}>
                            <Text style={styles.totalLabel}>TOTAL PENGAJUAN</Text>
                            <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
                        </View>
                    </SafeAreaView>
                    <View style={styles.headerCurve} />
                </LinearGradient>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.formCard}>
                    {/* Period Pickers */}
                    <Text style={styles.fieldLabel}>Periode Transaksi</Text>
                    <View style={styles.dateRow}>
                        <TouchableOpacity style={styles.datePickerBtn}>
                            <Text style={styles.dateText}>{startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
                            <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                        <View style={styles.dateConnector} />
                        <TouchableOpacity style={styles.datePickerBtn}>
                            <Text style={styles.dateText}>{endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</Text>
                            <Ionicons name="calendar-outline" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.calculateBtn} onPress={handleCalculate}>
                        <LinearGradient colors={['#FF0000', '#D00000']} style={styles.calculateGradient}>
                            <Text style={styles.calculateBtnText}>Hitung Total Transaksi</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Transaction List */}
                    {isCalculated && (
                        <View style={styles.txListContainer}>
                            <Text style={styles.sectionTitle}>RINCIAN TRANSAKSI ({txList.length})</Text>
                            {txList.map((tx, idx) => (
                                <View key={tx.id || idx} style={styles.txItem}>
                                    <View style={styles.txIconBox}>
                                        <Ionicons name="receipt-outline" size={20} color="#FF0000" />
                                    </View>
                                    <View style={styles.txInfo}>
                                        <Text style={styles.txDesc} numberOfLines={1}>{tx.tipe || 'Kas Keluar'}</Text>
                                        <Text style={styles.txDate}>{new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</Text>
                                    </View>
                                    <Text style={styles.txAmount}>{formatCurrency(tx.grand_total)}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Submit Button */}
                    {isCalculated && (
                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
                            <LinearGradient colors={['#FF0000', '#D00000']} style={styles.submitGradient}>
                                {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Ajukan Reimbursement</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
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
        marginBottom: -5,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    datePickerBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    dateConnector: {
        width: 10,
        height: 2,
        backgroundColor: '#CBD5E1',
    },
    dateText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    calculateBtn: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    calculateGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    calculateBtnText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    txListContainer: {
        gap: 12,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    txItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    txIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 0, 0, 0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    txInfo: {
        flex: 1,
    },
    txDesc: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
    },
    txDate: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
        marginTop: 2,
    },
    txAmount: {
        fontSize: 15,
        fontWeight: '900',
        color: '#1E293B',
    },
    submitBtn: {
        borderRadius: 24,
        overflow: 'hidden',
        marginTop: 10,
        shadowColor: '#FF0000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    submitGradient: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
});
