import { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    StyleSheet,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { supabase } from "../../../lib/supabase";
import PlatformDatePicker from "../../../components/PlatformDatePicker";
import * as Clipboard from "expo-clipboard";
import MessageModal from "../../../components/MessageModal";
import { LinearGradient } from "expo-linear-gradient";

import { formatDateToISO } from "../../../lib/dateUtils";

export default function ReimburseScreen() {
    const { profile, outlet } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    // Data State
    const [calculatedTotal, setCalculatedTotal] = useState(0);
    const [manualTotalAmount, setManualTotalAmount] = useState("");
    const [txList, setTxList] = useState<any[]>([]);
    const [lastReimburse, setLastReimburse] = useState<any>(null);
    const [isCalculated, setIsCalculated] = useState(false);
    const [previewText, setPreviewText] = useState(
        "Silakan pilih tanggal dan klik 'Hitung Total' untuk melihat preview."
    );
    const [automatedResidual, setAutomatedResidual] = useState(0); // Auto-calculated residual
    const [periodInflows, setPeriodInflows] = useState<any[]>([]); // Store fetched inflows for re-render

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

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(previewText);
        showModal("Tersalin", "Teks berhasil disalin ke clipboard!", "success");
    };

    const calculateTotal = async () => {
        if (!startDate || !endDate) {
            showModal("Error", "Pilih tanggal awal dan akhir", "error");
            return;
        }
        if (!outlet) return;

        setIsLoading(true);

        try {
            const startStr = formatDateToISO(startDate);
            const endStr = formatDateToISO(endDate);

            // 1. Fetch Transactions + Items
            const { data: transactions, error } = await supabase
                .from("transactions")
                .select("*, transaction_items(*)")
                .eq("outlet_id", outlet.id)
                .eq("tipe", "Kas Keluar")
                .eq("status_reimburse", "Tercatat")
                .gte("tanggal", startStr)
                .lte("tanggal", endStr)
                .order("tanggal");

            if (error) throw error;

            // 2. Fetch Last Kas Masuk (Previous Modal)
            const { data: lastKasMasukData, error: kmError } = await supabase
                .from("kas_masuk")
                .select("*")
                .eq("outlet_id", outlet.id)
                .lte("tanggal", startStr)
                .order("tanggal", { ascending: false })
                .limit(1);

            // Fetch Current Period Inflows (for Daily Breakdown)
            const { data: currentInflows, error: ciError } = await supabase
                .from("kas_masuk")
                .select("*")
                .eq("outlet_id", outlet.id)
                .gte("tanggal", startStr)
                .lte("tanggal", endStr)
                .order("tanggal");

            if (ciError) throw ciError;

            // Get single record or null
            const validLastKasMasuk = lastKasMasukData?.[0] || null;

            // Check against Outlet Saldo Awal Date
            let anchorDate = validLastKasMasuk?.tanggal;
            let anchorAmount = Number(validLastKasMasuk?.jumlah || 0);
            let isSaldoAwalAnchor = false;

            const saldoDate: string | undefined = (outlet as any).saldo_date;
            if (saldoDate) {
                // If Saldo Date is NEWER than Last Kas Masuk (or no Kas Masuk)
                if (!anchorDate || new Date(saldoDate) > new Date(anchorDate)) {
                    anchorDate = saldoDate;
                    anchorAmount = Number(outlet.saldo_awal || 0);
                    isSaldoAwalAnchor = true;
                }
            }

            setLastReimburse(isSaldoAwalAnchor ? { tanggal: anchorDate, jumlah: anchorAmount, isSaldoAwal: true } : validLastKasMasuk);
            setTxList(transactions || []);
            const total = (transactions || []).reduce(
                (sum, tx) => sum + (Number(tx.grand_total) || 0),
                0
            );

            // 3. Calculate Historical Residual Balance (Automated Sisa Kas)
            // FIX: Calculate residual as of START DATE, not as of last Kas Masuk date.
            // This correctly accounts for all transactions between lastKasMasuk and startDate.
            let calculatedResidual = 0;

            // Cutoff = Start of selected period (we want balance BEFORE this date)
            const cutoffDate = startStr;

            // A. Sum ALL Kas Masuk BEFORE the start date
            const { data: allPastInflows } = await supabase
                .from("kas_masuk")
                .select("jumlah")
                .eq("outlet_id", outlet.id)
                .lt("tanggal", cutoffDate);

            const totalPastIn = (allPastInflows || []).reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);

            // B. Sum ALL Expenses BEFORE the start date
            const { data: allPastOutflows } = await supabase
                .from("transactions")
                .select("grand_total")
                .eq("outlet_id", outlet.id)
                .eq("tipe", "Kas Keluar")
                .lt("tanggal", cutoffDate);

            const totalPastOut = (allPastOutflows || []).reduce((sum, item) => sum + (Number(item.grand_total) || 0), 0);

            const initialBalance = Number(outlet.saldo_awal) || 0;

            // Residual = (Saldo Awal Outlet + All Past Kas Masuk) - All Past Expenses
            calculatedResidual = (initialBalance + totalPastIn) - totalPastOut;

            setAutomatedResidual(calculatedResidual);
            setCalculatedTotal(total);
            setManualTotalAmount(total.toString()); // Default to calculated
            setIsCalculated(true);

            // Generate Initial Preview
            generatePreviewText(transactions || [], validLastKasMasuk, total, calculatedResidual, currentInflows || []);
        } catch (error: any) {
            showModal("Error", error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const generatePreviewText = (transactions: any[], lastModal: any, totalRequest: number, residual: number, inflows: any[]) => {
        if (!outlet) return;

        // Save inflows to state for re-renders
        setPeriodInflows(inflows);

        // 1. Calculate Real Total Expenses (System)
        const realTotalExpense = (transactions || []).reduce(
            (sum, tx) => sum + (Number(tx.grand_total) || 0),
            0
        );

        const requestAmount = totalRequest; // Manual Input
        const previousAmount = lastModal ? Number(lastModal.jumlah) : 0;
        const previousDate = lastModal ? formatDate(lastModal.tanggal) : "-";
        const isSaldoAwal = lastModal?.isSaldoAwal;

        // Kas Awal (Period) = Previous Masuk + Residual
        const startBalancePeriod = previousAmount + residual;

        // Dynamic Greeting
        const hour = new Date().getHours();
        let greeting = "Selamat Malam";
        if (hour >= 4 && hour < 10) greeting = "Selamat Pagi";
        else if (hour >= 10 && hour < 15) greeting = "Selamat Siang";
        else if (hour >= 15 && hour < 19) greeting = "Selamat Sore";

        // Header
        let header = `*PENGAJUAN REIMBURSE KAS/MODAL*
*${greeting} Pak/Bu, berikut pengajuan Reimburse uang kas/modal*


 - Outlet : ${outlet.nama_outlet}
 - Total Pengajuan : ${formatCurrency(requestAmount)}
 - Tanggal Request : ${formatDateFull(new Date())}
 - Rekening : ${outlet.nama_bank || "BCA"} (${outlet.no_rekening || "-"})
 - Atas Nama : ${outlet.atas_nama || "-"}

-------------------
*${isSaldoAwal ? "SALDO AWAL (RESET)" : "SALDO MASUK SEBELUMNYA"}*
-------------------
 - Tanggal : ${previousDate}
 - Nominal : ${formatCurrency(previousAmount)}

-------------------
*SISA SALDO SEBELUMNYA*
-------------------
 - Tanggal : ${formatDateFull(startDate)}
 - Nominal : ${formatCurrency(residual)}

-------------------
*RINCIAN HARIAN*
-------------------
`;

        // Daily Breakdown with Running Balance
        let dailyText = "";
        // FIX: Start only with Residual (Sisa Saldo Sebelumnya), not previousAmount + residual.
        // Because previousAmount/Kas Masuk is now fetched from kas_masuk table and shown as dayInflowTotal in the loop.
        let currentBalance = residual;
        let totalRealExpense = 0;
        let totalInflowPeriod = 0; // Track total Kas Masuk in period for Summary

        // Group transactions by Date
        const groupedOut: Record<string, any[]> = {};
        const groupedIn: Record<string, any[]> = {}; // Group Inflows

        const dateRange = getDaysArray(startDate, endDate);

        // Group Expenses
        transactions.forEach(t => {
            const dStr = t.tanggal;
            if (!groupedOut[dStr]) groupedOut[dStr] = [];
            groupedOut[dStr].push(t);
        });

        // Group Inflows
        inflows.forEach(inf => {
            const dStr = inf.tanggal;
            if (!groupedIn[dStr]) groupedIn[dStr] = [];
            groupedIn[dStr].push(inf);
        });

        dateRange.forEach(d => {
            const dStr = formatDateToISO(d);
            const dayTxs = groupedOut[dStr] || [];
            const dayInflows = groupedIn[dStr] || [];
            const dayName = formatDateFull(d);

            // Calculate Day Totals
            const dayExpense = dayTxs.reduce((s, t) => s + (Number(t.grand_total) || 0), 0);
            const dayInflowTotal = dayInflows.reduce((s, t) => s + (Number(t.jumlah) || 0), 0);

            totalRealExpense += dayExpense;
            totalInflowPeriod += dayInflowTotal; // Accumulate total Kas Masuk

            const dayStart = currentBalance;
            const dayEnd = (dayStart + dayInflowTotal) - dayExpense;

            // Update Running Balance for next day
            currentBalance = dayEnd;

            if (dayTxs.length > 0 || dayInflowTotal > 0) {
                dailyText += ` *${dayName}*\n`;
                dailyText += ` - Kas Awal : ${formatCurrency(dayStart)}\n`;
                if (dayInflowTotal > 0) {
                    dailyText += ` - Kas Masuk : ${formatCurrency(dayInflowTotal)}\n`;
                }
                dailyText += ` - Kas Keluar : ${formatCurrency(dayExpense)}\n`;
                dailyText += ` - Kas Akhir : ${formatCurrency(dayEnd)}\n`;

                if (dayInflows.length > 0) {
                    dailyText += ` *Detail Masuk:*\n`;
                    dayInflows.forEach(inf => {
                        dailyText += ` • ${inf.keterangan || "Tambahan Modal"} : ${formatCurrency(Number(inf.jumlah))}\n`;
                    });
                }

                if (dayTxs.length > 0) {
                    dailyText += ` *Item:*\n`;
                    dayTxs.forEach(tx => {
                        const items = tx.transaction_items || [];
                        if (items.length > 0) {
                            items.forEach((item: any) => {
                                const qtyStr = item.qty ? `(${item.qty} ${item.satuan || ''})` : '';
                                dailyText += ` • ${item.deskripsi} ${qtyStr} : ${formatCurrency(Number(item.total_harga))}\n`;
                            });
                        } else {
                            dailyText += ` • ${tx.deskripsi || "Pengeluaran"} : ${formatCurrency(Number(tx.grand_total))}\n`;
                        }
                    });
                }
                dailyText += `\n`; // Spacer
            }
        });

        // User Request: Total Saldo Awal should include Kas Masuk combined
        // Format: Total Saldo Awal = residual + totalInflowPeriod (no separate Kas Masuk line)
        const combinedSaldoAwal = residual + totalInflowPeriod;

        const summaryParts = [
            `-------------------`,
            `*RINGKASAN AKHIR*`,
            `-------------------`,
            ` - Total Saldo Awal : ${formatCurrency(combinedSaldoAwal)}`,
            ` - Total Pengeluaran : ${formatCurrency(totalRealExpense)}`,
            ` *Sisa Saldo Fisik : ${formatCurrency(currentBalance)}*`,
            ``, // Separator
            `🙏 Mohon dicek dan diproses. Terima kasih.`
        ];

        const summary = summaryParts.join('\n');

        // Combine
        setPreviewText(header + dailyText + summary);
    };

    // Helper Date Formatter
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatDateFull = (date: Date) => {
        return date.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    // Helper for date range
    const getDaysArray = (start: Date, end: Date) => {
        for (var arr = [], dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
            arr.push(new Date(dt));
        }
        return arr;
    };

    // Update preview when manual amount changes
    useEffect(() => {
        if (isCalculated) {
            const manualAmt = Number(manualTotalAmount.replace(/[^0-9]/g, "")) || 0;
            // Use stored inflows from state
            generatePreviewText(txList, lastReimburse, manualAmt, automatedResidual, periodInflows);
        }
    }, [manualTotalAmount, automatedResidual]);

    // Success Modal State
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    const handleSuccessClose = () => {
        setManualTotalAmount("");
        setIsCalculated(false);
        setAutomatedResidual(0);
        router.back();
    };

    const submitReimburse = async () => {
        if (!isCalculated) {
            showModal("Error", "Hitung total terlebih dahulu", "error");
            return;
        }

        if (!outlet || !profile) {
            showModal("Error", "Data tidak lengkap", "error");
            return;
        }

        setIsLoading(true);

        try {
            const startStr = formatDateToISO(startDate);
            const endStr = formatDateToISO(endDate);
            const finalAmount = Number(manualTotalAmount.replace(/[^0-9]/g, "")) || 0;

            const { data: reimburseData, error: reimbError } = await supabase
                .from("reimbursements")
                .insert({
                    outlet_id: outlet.id,
                    user_id: profile.id,
                    start_date: startStr,
                    end_date: endStr,
                    total_amount: finalAmount, // Use manual amount
                    status: "Pending",
                    notes: previewText // Save the full text as notes/history
                })
                .select();

            if (reimbError) throw reimbError;

            const reimburse = reimburseData?.[0];

            if (!reimburse) throw new Error("Gagal menyimpan data reimburse");

            // Update transactions status
            const { error: updateError } = await supabase
                .from("transactions")
                .update({
                    status_reimburse: "Diajukan",
                    reimburse_id: reimburse.id,
                })
                .eq("outlet_id", outlet.id)
                .eq("tipe", "Kas Keluar")
                .eq("status_reimburse", "Tercatat")
                .gte("tanggal", startStr)
                .lte("tanggal", endStr);

            if (updateError) throw updateError;

            // Trigger Success Modal
            showModal("Berhasil!", "Pengajuan reimburse Anda telah berhasil dikirim ke Admin.", "success");

        } catch (error: any) {
            showModal("Error", error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    const handleManualChange = (text: string) => {
        // Allow only numbers
        const numeric = text.replace(/[^0-9]/g, "");
        setManualTotalAmount(numeric);
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
                            <Text style={styles.modalTitle}>Request Reimburse</Text>
                            <Text style={styles.modalSubtitle}>Pengajuan ke Finance Pusat</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                        {/* Date Range */}
                        <View style={styles.formGroup}>
                            <Text style={styles.itemLabel}>Periode Transaksi</Text>
                            <View style={styles.dateRow}>
                                <View style={styles.dateField}>
                                    <PlatformDatePicker
                                        label="Dari"
                                        value={startDate}
                                        onChange={(d) => { setStartDate(d); setIsCalculated(false); }}
                                        maximumDate={new Date()}
                                    />
                                </View>
                                <View style={styles.dateField}>
                                    <PlatformDatePicker
                                        label="Sampai"
                                        value={endDate}
                                        onChange={(d) => { setEndDate(d); setIsCalculated(false); }}
                                        maximumDate={new Date()}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.calculateBtn}
                                onPress={calculateTotal}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#4338ca" />
                                ) : (
                                    <>
                                        <Text style={styles.calculateIcon}>🧮</Text>
                                        <Text style={styles.calculateText}>Hitung Total</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Manual Total Amount & Residual */}
                        {isCalculated && (
                            <View>
                                <View style={[styles.totalCard, { backgroundColor: '#f0f9ff' }]}>
                                    <Text style={[styles.totalLabel, { color: '#0369a1' }]}>Sisa Saldo Sebelumnya (Otomatis)</Text>
                                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#0369a1' }}>
                                        {formatCurrency(automatedResidual)}
                                    </Text>
                                    <Text style={styles.totalHint}>
                                        Dihitung dari sisa uang fisik sebelum kas masuk terakhir.
                                    </Text>
                                </View>

                                <View style={[styles.totalCard, { backgroundColor: '#dcfce7' }]}>
                                    <Text style={[styles.totalLabel, { color: '#166534' }]}>Total Pengajuan (Bisa Diedit)</Text>
                                    <View style={[styles.manualInputContainer, { borderColor: '#86efac' }]}>
                                        <Text style={[styles.prefix, { color: '#15803d' }]}>Rp</Text>
                                        <TextInput
                                            style={[styles.manualInput, { color: '#15803d' }]}
                                            value={manualTotalAmount ? Number(manualTotalAmount).toLocaleString('id-ID') : "0"}
                                            onChangeText={handleManualChange}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Preview */}
                        <View style={styles.formGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={[styles.itemLabel, { marginBottom: 0 }]}>Preview Pesan WhatsApp</Text>
                                <TouchableOpacity onPress={copyToClipboard} style={{ backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={{ fontSize: 12 }}>📋</Text>
                                    <Text style={{ color: '#4338ca', fontSize: 11, fontWeight: '700' }}>Salin Text</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.previewCard}>
                                <TextInput
                                    style={[styles.previewText, { minHeight: 150 }]}
                                    value={previewText}
                                    multiline
                                    editable={false} // User edits via fields, not text directly for now to keep format
                                />
                            </View>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[
                                styles.btnPrimary,
                                (!isCalculated || manualTotalAmount === "") && styles.btnDisabled,
                            ]}
                            onPress={submitReimburse}
                            disabled={isLoading || !isCalculated || manualTotalAmount === ""}
                        >
                            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.btnPrimaryText}>Ajukan Request</Text>}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Message Modal */}
                <MessageModal
                    visible={modalVisible}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    onClose={() => {
                        setModalVisible(false);
                        // Only go back if it's a successful Submission (Title is "Berhasil!")
                        if (modalConfig.type === "success" && modalConfig.title === "Berhasil!") {
                            handleSuccessClose();
                        }
                    }}
                />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },
    container: {
        flex: 1,
        // backgroundColor: "#f0f4d0", // Removed for glass
    },
    glassCard: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.55)", // Glass Transparency
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
    // Modal Header
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
        color: "#1E293B", // Dark Slate
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
    // Content
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
    dateRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 10,
    },
    dateField: {
        flex: 1,
    },
    dateFieldLabel: {
        fontSize: 11,
        color: "#666",
        marginBottom: 4,
    },
    dateInput: {
        backgroundColor: "#f8f9fa",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    calculateBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#e0e7ff",
        borderRadius: 10,
        padding: 12,
    },
    calculateIcon: {
        fontSize: 16,
    },
    calculateText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#4338ca",
    },
    // Total Card
    totalCard: {
        backgroundColor: "#dbeafe",
        borderRadius: 14,
        padding: 16,
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 12,
        color: "#3b82f6",
        fontWeight: "600",
        marginBottom: 8,
    },
    manualInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 50,
        borderWidth: 1,
        borderColor: "#93c5fd",
    },
    prefix: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e40af",
        marginRight: 8,
    },
    manualInput: {
        flex: 1,
        fontSize: 20,
        fontWeight: "800",
        color: "#1e40af",
        height: "100%",
    },
    totalHint: {
        fontSize: 11,
        color: "#6b7280",
        marginTop: 6,
        fontStyle: "italic",
    },
    // Preview
    previewCard: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        maxHeight: 300,
    },
    previewText: {
        fontSize: 12,
        color: "#374151",
        lineHeight: 18,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    // Info Banner
    infoBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        backgroundColor: "#fffbeb",
        borderWidth: 1,
        borderColor: "#fef3c7",
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    infoIcon: {
        fontSize: 14,
    },
    infoText: {
        flex: 1,
        fontSize: 11,
        color: "#92400e",
        fontWeight: "600",
    },
    // Bank Card
    bankCard: {
        backgroundColor: "#f9fafb",
        borderRadius: 12,
        padding: 14,
    },
    bankTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#374151",
        marginBottom: 10,
    },
    bankInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    bankLabel: {
        fontSize: 12,
        color: "#6b7280",
    },
    bankValue: {
        fontSize: 12,
        fontWeight: "600",
        color: "#1a1a1a",
    },
    // Footer
    modalFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        backgroundColor: "white",
    },
    footerRow: {
        flexDirection: "row",
        gap: 8,
    },
    btnWhatsApp: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: "#25D366",
        borderRadius: 10,
        paddingVertical: 12,
    },
    btnWhatsAppIcon: {
        fontSize: 16,
    },
    btnWhatsAppText: {
        fontSize: 13,
        fontWeight: "700",
        color: "white",
    },
    btnPrimary: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: "#C94C4C",
        borderRadius: 10,
        paddingVertical: 16,
        elevation: 2,
    },
    btnIcon: {
        fontSize: 14,
    },
    btnPrimaryText: {
        fontSize: 16,
        fontWeight: "700",
        color: "white",
    },
    btnDisabled: {
        backgroundColor: "#d1d5db",
        elevation: 0,
    },
    btnSecondary: {
        backgroundColor: "#f1f5f9",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },
    btnSecondaryText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#64748b",
    },
});
