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
import PlatformDatePicker from "../../../components/PlatformDatePicker";
import MessageModal from "../../../components/MessageModal";

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
            const dateStr = selectedDate.toISOString().split("T")[0];

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
            const todayTx: any[] = [];

            // Calculate totals up to selected date
            (allTx || []).forEach((tx) => {
                const amount = Number(tx.grand_total) || 0;
                if (tx.tipe === "Kas Keluar") {
                    // Historical calculation logic for Kas Awal
                    if (tx.tanggal < dateStr) {
                        totalKeluar += amount;
                    } else if (tx.tanggal === dateStr) {
                        // Include in today's expenses BUT also need to count towards totalKeluar if we want "Saldo Akhir" right? 
                        // Wait, Saldo Akhir = Saldo Awal + Total Masuk - Total Keluar. 
                        // So yes, all history + today.
                        totalKeluar += amount;
                        kasKeluarHariIni += amount;
                        todayTx.push(tx);
                    } else {
                        // Future transactions (if any) shouldn't affect "Saldo Awal" of the selected day,
                        // nor "Saldo Akhir" of the selected day.
                        // So if tx.tanggal > dateStr, ignore.
                    }
                }
            });

            let totalMasuk = 0;
            let kasMasukHariIni = 0;
            (kasMasukData || []).forEach((km) => {
                const amount = Number(km.jumlah) || 0;

                if (km.tanggal < dateStr) {
                    totalMasuk += amount;
                } else if (km.tanggal === dateStr) {
                    totalMasuk += amount;
                    kasMasukHariIni += amount;
                }
            });

            // Recalculate Logic to be precise for "Viewed Date"
            // Saldo Awal Hari Ini = (Seed + Past Inflows) - (Past Outflows)
            // Past = < dateStr

            // Re-loop for precision
            let pastIn = 0;
            let pastOut = 0;

            (kasMasukData || []).forEach(km => {
                if (km.tanggal < dateStr) pastIn += (Number(km.jumlah) || 0);
            });

            (allTx || []).forEach(tx => {
                if (tx.tipe === "Kas Keluar" && tx.tanggal < dateStr) {
                    pastOut += (Number(tx.grand_total) || 0);
                }
            });

            const dbSaldoAwal = outlet.saldo_awal || 0;
            const kasAwalHariIni = dbSaldoAwal + pastIn - pastOut;
            const saldoSekarang = kasAwalHariIni + kasMasukHariIni - kasKeluarHariIni;

            setSummary({
                kasAwal: kasAwalHariIni,
                kasMasuk: kasMasukHariIni,
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
                        expenseDetails += `- ${item.deskripsi} ${item.qty} ${item.satuan} = ${formatCurrencyText(total)}\n`;
                    });
                } else {
                    expenseDetails += `- ${tx.deskripsi || "Pengeluaran"} = ${formatCurrencyText(Number(tx.grand_total))}\n`;
                }
            });

            if (!expenseDetails) expenseDetails = "- Tidak ada pengeluaran hari ini\n";

            const preview = `Selamat Malam Pak/Ibu
Berikut saya lampirkan arus kas harian

🏪 Outlet : ${outlet.nama_outlet}
📅 Hari/Tanggal : ${formattedDate}

═══════════════════════
RINCIAN KAS
═══════════════════════
Kas Awal : ${formatCurrencyText(kasAwalHariIni)}
Kas Masuk : ${formatCurrencyText(kasMasukHariIni)}
Kas Keluar : ${formatCurrencyText(kasKeluarHariIni)}

═══════════════════════
RINCIAN PENGELUARAN HARI INI
═══════════════════════
${expenseDetails}
═══════════════════════
Saldo Akhir : ${formatCurrencyText(saldoSekarang)}
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
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.modalCard}>
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
                        <View style={[styles.summaryCard, { backgroundColor: "#f0fdf4" }]}>
                            <Text style={[styles.summaryLabel, { color: "#166534" }]}>Kas Awal</Text>
                            <Text style={[styles.summaryValue, { color: "#166534" }]}>
                                {formatCurrency(summary.kasAwal)}
                            </Text>
                        </View>
                        <View style={[styles.summaryCard, { backgroundColor: "#eff6ff" }]}>
                            <Text style={[styles.summaryLabel, { color: "#1e40af" }]}>Kas Masuk</Text>
                            <Text style={[styles.summaryValue, { color: "#1e40af" }]}>
                                {formatCurrency(summary.kasMasuk)}
                            </Text>
                        </View>
                        <View style={[styles.summaryCard, { backgroundColor: "#fef2f2" }]}>
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
                        <Text style={styles.itemLabel}>Preview Laporan</Text>
                        <View style={styles.previewCard}>
                            <Text style={styles.previewText}>{previewText}</Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                    <View style={styles.footerRow}>
                        <TouchableOpacity style={styles.btnWhatsApp} onPress={sendToWhatsApp}>
                            <Text style={styles.btnWhatsAppText}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.footerRow}>
                        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()}>
                            <Text style={styles.btnSecondaryText}>Tutup</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnCopy} onPress={copyText}>
                            <Text style={styles.btnCopyText}>Salin Teks</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f0f4d0" },
    modalCard: {
        flex: 1,
        backgroundColor: "white",
        margin: 16,
        borderRadius: 20,
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    modalTitle: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },
    modalSubtitle: { fontSize: 13, color: "#666", marginTop: 2 },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
    },
    closeBtnText: { fontSize: 16, color: "#64748b" },
    modalContent: { flex: 1, padding: 20 },
    dateHeader: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        textAlign: "center",
        marginBottom: 16,
    },
    summaryGrid: { flexDirection: "row", gap: 8, marginBottom: 16 },
    summaryCard: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center" },
    summaryLabel: { fontSize: 11, fontWeight: "600" },
    summaryValue: { fontSize: 14, fontWeight: "700", marginTop: 4 },
    saldoAkhirCard: {
        backgroundColor: "#dbeafe",
        borderRadius: 14,
        padding: 16,
        alignItems: "center",
        marginBottom: 20,
    },
    saldoAkhirLabel: { fontSize: 12, color: "#3b82f6", fontWeight: "600" },
    saldoAkhirValue: { fontSize: 24, fontWeight: "900", color: "#1d4ed8", marginTop: 4 },
    formGroup: { marginTop: 8 },
    itemLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
    previewCard: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 14,
        maxHeight: 220,
    },
    previewText: {
        fontSize: 12,
        color: "#374151",
        lineHeight: 18,
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb", gap: 8 },
    footerRow: { flexDirection: "row", gap: 8 },
    btnWhatsApp: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#25D366",
        borderRadius: 10,
        paddingVertical: 12,
    },
    btnWhatsAppText: { fontSize: 13, fontWeight: "700", color: "white" },
    btnSecondary: {
        flex: 1,
        backgroundColor: "#f1f5f9",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },
    btnSecondaryText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
    btnCopy: {
        flex: 1,
        backgroundColor: "#6366f1",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },
    btnCopyText: { fontSize: 13, fontWeight: "600", color: "white" },
});
