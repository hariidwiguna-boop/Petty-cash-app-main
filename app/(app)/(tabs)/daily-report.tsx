
import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    StyleSheet,
    Linking,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { supabase } from "../../../lib/supabase";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import PlatformDatePicker from "../../../components/PlatformDatePicker";
import MessageModal from "../../../components/MessageModal";
import { formatDateToISO } from "../../../lib/dateUtils";

interface DailySummary {
    kasAwal: number;
    kasMasuk: number;
    kasKeluar: number;
    saldoAkhir: number;
    transactions: any[];
}

export default function DailyReportScreen() {
    const { profile, outlet } = useAuthStore();
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [summary, setSummary] = useState<DailySummary>({
        kasAwal: 0,
        kasMasuk: 0,
        kasKeluar: 0,
        saldoAkhir: 0,
        transactions: [],
    });
    const [previewText, setPreviewText] = useState("");

    // Message Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: "",
        message: "",
        type: "info" as "success" | "error" | "warning" | "info" | "confirm",
    });

    const showModal = (
        title: string,
        message: string,
        type: "success" | "error" | "warning" | "info" | "confirm" = "info"
    ) => {
        setModalConfig({ title, message, type });
        setModalVisible(true);
    };

    const fetchDailySummary = async () => {
        if (!outlet) return;

        try {
            // Usage 1
            const dateStr = formatDateToISO(selectedDate);

            // Fetch transactions for the selected date
            const { data: allTx } = await supabase
                .from("transactions")
                .select("*, transaction_items(*)")
                .eq("outlet_id", outlet.id);

            const { data: kasMasukData } = await supabase
                .from("kas_masuk")
                .select("*")
                .eq("outlet_id", outlet.id);

            let totalKeluar = 0;
            let kasKeluarHariIni = 0;
            // New: Track Kas Masuk from transactions table
            let kasMasukTxHariIni = 0;
            const todayTx: any[] = [];

            // Calculate totals up to selected date
            (allTx || []).forEach((tx) => {
                const amount = Number(tx.grand_total) || 0;

                // CASE 1: Kas Keluar
                if (tx.tipe === "Kas Keluar") {
                    if (tx.tanggal < dateStr) {
                        // Historical Outflow
                        // Handled in separate loop for clarity or keep here? 
                        // Let's rely on the separate re-loop below for "past" to be consistent.
                    } else if (tx.tanggal === dateStr) {
                        kasKeluarHariIni += amount;
                        todayTx.push(tx);
                    }
                }
                // CASE 2: Kas Masuk (Sales/Refunds etc in transactions table)
                else if (tx.tipe === "Kas Masuk") {
                    if (tx.tanggal === dateStr) {
                        kasMasukTxHariIni += amount;
                        // Note: We don't push Kas Masuk tx to `todayTx` if that list is strictly for "Pengeluaran" (Expenses).
                        // The UI says "RINCIAN PENGELUARAN HARI INI", so we exclude it from the list but count it for the total.
                    }
                }
            });

            // Kas Masuk from kas_masuk table (Top Up / Capital)
            let kasMasukTableHariIni = 0;
            (kasMasukData || []).forEach((km) => {
                const amount = Number(km.jumlah) || 0;
                if (km.tanggal === dateStr) {
                    kasMasukTableHariIni += amount;
                }
            });

            // Recalculate Logic to be precise for "Viewed Date"
            // Saldo Awal Hari Ini = (Seed + Past Inflows) - (Past Outflows)

            let pastIn = 0;
            let pastOut = 0;

            // 1. Past Inflows from kas_masuk table
            (kasMasukData || []).forEach(km => {
                if (km.tanggal < dateStr) pastIn += (Number(km.jumlah) || 0);
            });

            // 2. Process transactions table for Past Inflows AND Past Outflows
            (allTx || []).forEach(tx => {
                const amount = Number(tx.grand_total) || 0;
                if (tx.tanggal < dateStr) {
                    if (tx.tipe === "Kas Keluar") {
                        pastOut += amount;
                    } else if (tx.tipe === "Kas Masuk") {
                        pastIn += amount; // Add Past Sales/Income
                    }
                }
            });

            const dbSaldoAwal = outlet.saldo_awal || 0;
            const kasAwalHariIni = dbSaldoAwal + pastIn - pastOut;

            // Total Kas Masuk Hari Ini = Table Kas Masuk + Transaction Kas Masuk
            const totalKasMasukHariIni = kasMasukTableHariIni + kasMasukTxHariIni;

            const saldoSekarang = kasAwalHariIni + totalKasMasukHariIni - kasKeluarHariIni;

            setSummary({
                kasAwal: kasAwalHariIni,
                kasMasuk: totalKasMasukHariIni,
                kasKeluar: kasKeluarHariIni,
                saldoAkhir: saldoSekarang,
                transactions: todayTx,
            });

            const formattedDate = selectedDate.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            });

            const formatCurrencyText = (amount: number) => {
                return "Rp. " + amount.toLocaleString("id-ID") + ",-";
            };

            let expenseDetails = "";
            todayTx.forEach((tx) => {
                if (tx.transaction_items && tx.transaction_items.length > 0) {
                    tx.transaction_items.forEach((item: any) => {
                        const total = Number(item.total_harga);
                        expenseDetails += `- ${item.deskripsi} ${item.qty} ${item.satuan} = ${formatCurrencyText(total)} \n`;
                    });
                } else {
                    expenseDetails += `- ${tx.deskripsi || "Pengeluaran"} = ${formatCurrencyText(Number(tx.grand_total))} \n`;
                }
            });

            if (!expenseDetails) expenseDetails = "- Tidak ada pengeluaran hari ini\n";

            const preview = `Selamat Malam Pak / Ibu
Berikut saya lampirkan arus kas harian

🏪 Outlet: ${outlet.nama_outlet}
📅 Hari / Tanggal : ${formattedDate}

═══════════════════════
RINCIAN KAS
═══════════════════════
Kas Awal: ${formatCurrencyText(kasAwalHariIni)}
Kas Masuk: ${formatCurrencyText(kasMasukHariIni)}
Kas Keluar: ${formatCurrencyText(kasKeluarHariIni)}

═══════════════════════
RINCIAN PENGELUARAN HARI INI
═══════════════════════
${expenseDetails}
═══════════════════════
Saldo Akhir: ${formatCurrencyText(saldoSekarang)}
═══════════════════════`;

            setPreviewText(preview);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        fetchDailySummary();
    }, [outlet, selectedDate]);

    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    const sendToWhatsApp = async () => {
        const message = encodeURIComponent(previewText);
        const url = `whatsapp://send?text=${message}`;

        try {
            await Linking.openURL(url);
        } catch (error) {
            showModal("Error", "Tidak dapat membuka WhatsApp", "error");
        }
    };

    const copyText = async () => {
        await Clipboard.setStringAsync(previewText);
        showModal("Berhasil", "Teks berhasil disalin ke clipboard", "success");
    };

    const displayDate = selectedDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <LinearGradient
            colors={['#DC2626', '#DC2626', '#F8FAFC']}
            locations={[0, 0.35, 1]}
            style={styles.gradientBackground}
        >
            <SafeAreaView style={styles.container} edges={["top"]}>
                <View style={styles.glassCard}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>Laporan Harian</Text>
                            <Text style={styles.modalSubtitle}>Ringkasan arus kas per hari</Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                            <Text style={styles.closeBtnText}>X</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalContent}>
                        {/* Date Filter */}
                        <View style={{ marginBottom: 20 }}>
                            <Text style={styles.itemLabel}>Pilih Tanggal</Text>
                            <PlatformDatePicker
                                label="Tanggal Laporan"
                                value={selectedDate}
                                onChange={(d) => setSelectedDate(d)}
                                maximumDate={new Date()}
                            />
                        </View>

                        <Text style={styles.dateHeader}>{displayDate}</Text>

                        <View style={styles.summaryGrid}>
                            <View style={[styles.summaryCard, { backgroundColor: "rgba(240, 253, 244, 0.7)" }]}>
                                <Text style={[styles.summaryLabel, { color: "#166534" }]}>Kas Awal</Text>
                                <Text style={[styles.summaryValue, { color: "#166534" }]}>
                                    {formatCurrency(summary.kasAwal)}
                                </Text>
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: "rgba(239, 246, 255, 0.7)" }]}>
                                <Text style={[styles.summaryLabel, { color: "#1e40af" }]}>Kas Masuk</Text>
                                <Text style={[styles.summaryValue, { color: "#1e40af" }]}>
                                    {formatCurrency(summary.kasMasuk)}
                                </Text>
                            </View>
                            <View style={[styles.summaryCard, { backgroundColor: "rgba(254, 242, 242, 0.7)" }]}>
                                <Text style={[styles.summaryLabel, { color: "#991b1b" }]}>Kas Keluar</Text>
                                <Text style={[styles.summaryValue, { color: "#991b1b" }]}>
                                    {formatCurrency(summary.kasKeluar)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.saldoAkhirCard}>
                            <Text style={styles.saldoAkhirLabel}>Saldo Akhir</Text>
                            <Text style={styles.saldoAkhirValue}>
                                {formatCurrency(summary.saldoAkhir)}
                            </Text>
                        </View>

                        <View style={styles.formGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={[styles.itemLabel, { marginBottom: 0 }]}>Preview Laporan</Text>
                                <TouchableOpacity onPress={copyText} style={{ backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                    <Text style={{ fontSize: 12 }}>📋</Text>
                                    <Text style={{ color: '#4338ca', fontSize: 11, fontWeight: '700' }}>Salin Teks</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.previewCard}>
                                <Text style={styles.previewText}>{previewText}</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* Message Modal */}
                <MessageModal
                    visible={modalVisible}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    onClose={() => setModalVisible(false)}
                />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradientBackground: {
        flex: 1,
    },
    container: { flex: 1 },
    glassCard: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.55)",
        margin: 16,
        borderRadius: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.4)",
        ...Platform.select({
            web: {
                backdropFilter: "blur(12px)",
            },
        }),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 20,
        backgroundColor: "rgba(255,255,255,0.3)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    modalTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
    modalSubtitle: { fontSize: 13, color: "#64748b", marginTop: 2 },
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
    closeBtnText: { fontSize: 16, color: "#64748b", fontWeight: "700" },
    modalContent: { flex: 1, padding: 20 },
    dateHeader: {
        fontSize: 14,
        fontWeight: "600",
        color: "#475569",
        textAlign: "center",
        marginBottom: 16,
    },
    summaryGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
    summaryCard: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    summaryLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
    summaryValue: { fontSize: 13, fontWeight: "700" },
    saldoAkhirCard: {
        backgroundColor: "rgba(219, 234, 254, 0.7)", // light blue glass
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(59, 130, 246, 0.2)",
    },
    saldoAkhirLabel: { fontSize: 12, color: "#2563EB", fontWeight: "700" },
    saldoAkhirValue: { fontSize: 24, fontWeight: "900", color: "#1e3a8a", marginTop: 4 },
    formGroup: { marginTop: 8 },
    itemLabel: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 8 },
    previewCard: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderWidth: 1,
        borderColor: "rgba(226, 232, 240, 0.8)",
        borderRadius: 16,
        padding: 16,
        // maxHeight: 280, // Removed to allow dynamic height (Responsive)
        shadowColor: "#64748b",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    previewText: {
        fontSize: 13,
        color: "#1e293b", // Darker slate
        lineHeight: 20,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
});
