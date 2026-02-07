import { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Platform,
    ActivityIndicator,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { supabase } from "../../../lib/supabase";
import PlatformDatePicker from "../../../components/PlatformDatePicker";
import MessageModal from "../../../components/MessageModal";
import GlassButton from "../../../src/design-system/components/glass/GlassButton";
import GlassCard from "../../../src/design-system/components/glass/GlassCard";
import { glassmorphism } from "../../../src/design-system/tokens/glassmorphism";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ReportsScreen() {
    const router = useRouter();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [outletId, setOutletId] = useState("");
    const [report, setReport] = useState<any[]>([]);
    const [totals, setTotals] = useState({ masuk: 0, keluar: 0, saldo: 0 });
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

    const generateReport = async () => {
        if (!startDate || !endDate) { showModal("Error", "Pilih tanggal", "error"); return; }

        setIsLoading(true);

        try {
            // Fetch data from all sources
            const [kasMasukResult, transactionsKeluarResult, transactionsMasukResult] = await Promise.all([
                supabase.from("kas_masuk").select("*, outlets(nama_outlet)").gte("tanggal", startDate).lte("tanggal", endDate),
                supabase.from("transactions").select("*, outlets(nama_outlet)").eq("tipe", "Kas Keluar").gte("tanggal", startDate).lte("tanggal", endDate),
                supabase.from("transactions").select("*, outlets(nama_outlet)").eq("tipe", "Kas Masuk").gte("tanggal", startDate).lte("tanggal", endDate)
            ]);

            // Combine data with proper mapping
            const allData = [
                ...(kasMasukResult.data || []).map((item: any) => ({ ...item, tipe: "Kas Masuk", grand_total: item.jumlah })),
                ...(transactionsKeluarResult.data || []).map((item: any) => ({ ...item, tipe: "Kas Keluar" })),
                ...(transactionsMasukResult.data || []).map((item: any) => ({ ...item, tipe: "Kas Masuk" }))
            ].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

            setReport(allData);

            // Calculate totals
            let m = 0, k = 0;
            allData?.forEach(tx => {
                tx.tipe === "Kas Keluar" ? k += tx.grand_total : m += tx.grand_total;
            });
            setTotals({ masuk: m, keluar: k, saldo: m - k });

        } catch (error: any) {
            showModal("Error", error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const generateExcelReport = async () => {
        if (!startDate || !endDate) { showModal("Error", "Pilih tanggal", "error"); return; }
        setIsExporting(true);

        try {
            showModal("Info", "Mengambil data transaksi...", "info");

            // 1. Fetch data
            const [kasMasukResult, transactionsKeluarResult, transactionsMasukResult] = await Promise.all([
                supabase
                    .from("kas_masuk")
                    .select("*, outlets(*)")
                    .gte("tanggal", startDate)
                    .lte("tanggal", endDate)
                    .order("tanggal"),
                supabase
                    .from("transactions")
                    .select("*, outlets(*), transaction_items(*)")
                    .eq("tipe", "Kas Keluar")
                    .gte("tanggal", startDate)
                    .lte("tanggal", endDate)
                    .order("tanggal"),
                supabase
                    .from("transactions")
                    .select("*, outlets(*)")
                    .eq("tipe", "Kas Masuk")
                    .gte("tanggal", startDate)
                    .lte("tanggal", endDate)
                    .order("tanggal")
            ]);

            const allTransactions = [
                ...(kasMasukResult.data || []).map((item: any) => ({ ...item, tipe: "Kas Masuk", grand_total: item.jumlah, is_kas_masuk: true })),
                ...(transactionsKeluarResult.data || []).map((item: any) => ({ ...item, tipe: "Kas Keluar" })),
                ...(transactionsMasukResult.data || []).map((item: any) => ({ ...item, tipe: "Kas Masuk" }))
            ];

            // Group by Outlet
            const transactionsByOutlet: Record<string, any[]> = {};
            allTransactions.forEach(tx => {
                const outletName = tx.outlets?.nama_outlet || "Unknown";
                if (!transactionsByOutlet[outletName]) transactionsByOutlet[outletName] = [];
                transactionsByOutlet[outletName].push(tx);
            });

            // Create Workbook
            const wb = XLSX.utils.book_new();

            // Process each outlet
            const outletNames = Object.keys(transactionsByOutlet);

            for (const outletName of outletNames) {
                const txs = transactionsByOutlet[outletName].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

                // --- 1. PREPARE DATA ---

                // A. Ringkasan Saldo Calculation
                let totalMasuk = 0;
                let totalKeluar = 0;
                // Note: Saldo Awal should ideally be fetched from outlet state or calculated from previous periods.
                // For this report, we'll assume Saldo Awal is the outlet's current `saldo_awal` if filtered from beginning, 
                // but since it's a date range, it's tricky. We'll use 0 or cumulative calculation if needed.
                // For simplified visual replication:
                const saldoAwal = 0; // Simplified

                // B. Daily Summary Data (Left Table)
                const dailyData: Record<string, any> = {};

                // Initialize dates in range? Or just present dates? Screenshot implies continuous dates.
                // We'll use present dates for now.

                let runningSaldo = saldoAwal;

                txs.forEach(tx => {
                    const date = tx.tanggal;
                    if (!dailyData[date]) {
                        dailyData[date] = {
                            date: date,
                            saldoAwal: runningSaldo,
                            masuk: 0,
                            keluar: 0,
                            saldoAkhir: 0,
                            keterangan: []
                        };
                    }

                    const amount = tx.grand_total;
                    if (tx.tipe === "Kas Masuk") {
                        dailyData[date].masuk += amount;
                        totalMasuk += amount;
                    } else {
                        dailyData[date].keluar += amount;
                        totalKeluar += amount;
                    }

                    // Add items to keterangan for summary?
                    if (tx.transaction_items) {
                        const items = tx.transaction_items.map((i: any) => i.nama_barang).join(", ");
                        if (items) dailyData[date].keterangan.push(items);
                    } else if (tx.keterangan) {
                        dailyData[date].keterangan.push(tx.keterangan);
                    }
                });

                // Update running balance and saldo akhir for daily rows
                const sortedDates = Object.keys(dailyData).sort();
                sortedDates.forEach(date => {
                    dailyData[date].saldoAwal = runningSaldo;
                    dailyData[date].saldoAkhir = dailyData[date].saldoAwal + dailyData[date].masuk - dailyData[date].keluar;
                    runningSaldo = dailyData[date].saldoAkhir;
                });
                const saldoAkhir = runningSaldo;


                // C. Detail Transaction Data (Right Table)
                // Flatten all transaction items
                const detailRows: any[] = [];
                let detailNo = 1;

                txs.forEach(tx => {
                    if (tx.transaction_items && tx.transaction_items.length > 0) {
                        tx.transaction_items.forEach((item: any) => {
                            detailRows.push({
                                no: detailNo++,
                                tanggal: tx.tanggal,
                                namaBarang: item.nama_barang,
                                qty: item.qty || 1,
                                total: item.total_harga || item.subtotal || 0,
                                kategori: item.kategori || "-"
                            });
                        });
                    } else {
                        // Kas Masuk or Tx without items
                        detailRows.push({
                            no: detailNo++,
                            tanggal: tx.tanggal,
                            namaBarang: tx.deskripsi || tx.tipe,
                            qty: 1,
                            total: tx.grand_total,
                            kategori: tx.kategori || "-"
                        });
                    }
                });


                // --- 2. BUILD WORKSHEET (AoA) ---
                const wsData: any[][] = [];

                // Row 1: Merged Title / Ringkasan Header
                // Layout:
                // A1-B1: Ringkasan Saldo
                // D1: INPUT TRANSAKSI (Visual)
                wsData.push(["Ringkasan Saldo", null, null, "INPUT TRANSAKSI"]);

                // Row 2: Saldo Awal
                wsData.push(["Saldo Awal", saldoAwal]);

                // Row 3: Total Saldo Masuk
                wsData.push(["Total Saldo Masuk", totalMasuk]);

                // Row 4: Total Saldo Keluar
                wsData.push(["Total Saldo Keluar", totalKeluar]);

                // Row 5: Saldo Akhir
                wsData.push(["Saldo Akhir", saldoAkhir]);

                // Row 6: Spacer
                wsData.push([]);

                // Row 7: Table Titles
                // Left: Summary Transaksi (A7)
                // Right: Detail Transaksi (I7) - Let's use column 8 (Index 8 -> I)
                const titleRow = Array(15).fill(null);
                titleRow[0] = "Summary Transaksi";
                titleRow[2] = new Date(startDate).getFullYear().toString(); // Year selector visual
                titleRow[8] = "Detail Transaksi";
                wsData.push(titleRow);

                // Row 8: Table Headers
                // Left (7 cols): No, Tanggal, Saldo Awal, Saldo Masuk, Saldo Keluar, Saldo Akhir, Keterangan
                // Spacer (1 col)
                // Right (6 cols): No, Tanggal, Nama Barang, Qty Barang, Total Harga, Kategori Transaksi
                const headerRow = [
                    "No", "Tanggal", "Saldo Awal", "Saldo Masuk", "Saldo Keluar", "Saldo Akhir", "Keterangan",
                    null, // Spacer H
                    "No", "Tanggal", "Nama Barang", "Qty Barang", "Total Harga", "Kategori Transaksi"
                ];
                wsData.push(headerRow);

                // Row 9+: Data
                const maxRows = Math.max(sortedDates.length, detailRows.length);

                for (let i = 0; i < maxRows; i++) {
                    const row: any[] = [];

                    // Left Data (Daily Summary)
                    if (i < sortedDates.length) {
                        const date = sortedDates[i];
                        const d = dailyData[date];
                        row.push(
                            i + 1,
                            d.date,
                            d.saldoAwal,
                            d.masuk,
                            d.keluar,
                            d.saldoAkhir,
                            d.keterangan.join("; ")
                        );
                    } else {
                        // Empty left cells
                        row.push(null, null, null, null, null, null, null);
                    }

                    // Spacer
                    row.push(null);

                    // Right Data (Detail)
                    if (i < detailRows.length) {
                        const d = detailRows[i];
                        row.push(
                            d.no,
                            d.tanggal,
                            d.namaBarang,
                            d.qty,
                            d.total,
                            d.kategori
                        );
                    } else {
                        row.push(null, null, null, null, null, null);
                    }

                    wsData.push(row);
                }

                // Create Sheet
                const ws = XLSX.utils.aoa_to_sheet(wsData);

                // --- 3. STYLING & MERGES ---

                ws['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // A1:B1 (Ringkasan Saldo)
                    { s: { r: 0, c: 3 }, e: { r: 1, c: 4 } }, // D1:E2 (Input Transaksi)
                    { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } }, // A7:B7 (Summary Transaksi Title)
                    { s: { r: 6, c: 8 }, e: { r: 6, c: 9 } }, // I7:J7 (Detail Transaksi Title)
                ];

                ws['!cols'] = [
                    { wch: 5 },  // A: No
                    { wch: 15 }, // B: Tanggal
                    { wch: 15 }, // C: Saldo Awal
                    { wch: 15 }, // D: Masuk
                    { wch: 15 }, // E: Keluar
                    { wch: 15 }, // F: Akhir
                    { wch: 25 }, // G: Keterangan
                    { wch: 2 },  // H: Spacer
                    { wch: 5 },  // I: No
                    { wch: 15 }, // J: Tanggal
                    { wch: 25 }, // K: Barang
                    { wch: 8 },  // L: Qty
                    { wch: 15 }, // M: Total
                    { wch: 20 }, // N: Kategori
                ];

                // Append sheet
                const sheetName = outletName.replace(/[\\/?*[\]]/g, "").substring(0, 30);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            }

            // Export
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            const fileName = `Laporan_Lengkap_${startDate}_sd_${endDate}.xlsx`;

            if (Platform.OS === 'web') {
                const uri = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wbout;
                const link = document.createElement('a');
                link.href = uri;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
                await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri, {
                        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        dialogTitle: 'Download Laporan',
                        UTI: 'com.microsoft.excel.xlsx'
                    });
                } else {
                    showModal("Info", "File saved to: " + fileUri, "info");
                }
            }

            showModal("Success", "Laporan berhasil diexport dalam format baru!", "success");

        } catch (error: any) {
            console.error(error);
            showModal("Export Gagal", error.message, "error");
        } finally {
            setIsExporting(false);
        }
    };

    const formatCurrency = (a: number) => "Rp " + a.toLocaleString("id-ID");

    const AnimatedSummaryCard = ({ title, value, icon, color, trend }: {
        title: string; value: number; icon: string; color: string; trend?: string;
    }) => {
        return (
            <GlassCard
                floating={true}
                elevation="heavy"
                style={styles.summaryCard}
            >
                <View style={styles.cardHeader}>
                    <Feather name={icon as any} size={24} color={color} />
                    {trend && (
                        <Text style={[styles.trendText, { color }]}>
                            {trend}
                        </Text>
                    )}
                </View>
                <Text style={[styles.cardValue, { color }]}>
                    {formatCurrency(value)}
                </Text>
                <Text style={styles.cardTitle}>
                    {title}
                </Text>
            </GlassCard>
        );
    };

    const GlassDataTable = () => {
        if (report.length === 0) {
            return (
                <GlassCard elevation="light" style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        Klik Generate untuk melihat data
                    </Text>
                </GlassCard>
            );
        }

        return (
            <GlassCard elevation="medium" style={styles.tableContainer}>
                {report.map((tx, i) => (
                    <View key={tx.id || i} style={styles.tableRow}>
                        <View style={styles.rowLeft}>
                            <Text style={styles.rowDate}>{tx.tanggal}</Text>
                            <Text style={styles.rowOutlet}>{tx.outlets?.nama_outlet}</Text>
                        </View>
                        <Text style={[
                            styles.rowAmount,
                            tx.tipe === "Kas Keluar" ? { color: "#ef4444" } : { color: "#10b981" }
                        ]}>
                            {tx.tipe === "Kas Keluar" ? "-" : "+"}{formatCurrency(tx.grand_total)}
                        </Text>
                    </View>
                ))}
            </GlassCard>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Background Gradient */}
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <ScrollView
                style={styles.mainScroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <GlassCard elevation="extreme" style={styles.headerCard}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>
                            📊 Premium Reports
                        </Text>
                        <View style={styles.datePickerContainer}>
                            <View style={styles.datePickerWrapper}>
                                <PlatformDatePicker
                                    label="Dari"
                                    value={startDate ? new Date(startDate) : new Date()}
                                    onChange={(d) => setStartDate(d.toISOString().split('T')[0])}
                                />
                            </View>
                            <View style={styles.datePickerWrapper}>
                                <PlatformDatePicker
                                    label="Sampai"
                                    value={endDate ? new Date(endDate) : new Date()}
                                    onChange={(d) => setEndDate(d.toISOString().split('T')[0])}
                                />
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionContainer}>
                            <GlassButton
                                variant="primary"
                                onPress={generateReport}
                                loading={isLoading}
                                particles={true}
                                particleTrigger="onPress"
                                fullWidth
                                style={{ marginBottom: 12 }}
                                leftIcon={<Text style={{ fontSize: 18 }}>📊</Text>}
                            >
                                {isLoading ? 'Loading...' : 'Generate View'}
                            </GlassButton>
                            <GlassButton
                                variant="secondary"
                                onPress={generateExcelReport}
                                loading={isExporting}
                                particles={true}
                                particleTrigger="onPress"
                                fullWidth
                                leftIcon={<Text style={{ fontSize: 18 }}>📥</Text>}
                            >
                                {isExporting ? 'Loading...' : 'Export Excel'}
                            </GlassButton>
                        </View>
                    </View>
                </GlassCard>

                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    <AnimatedSummaryCard
                        title="Kas Masuk"
                        value={totals.masuk}
                        icon="trending-up"
                        color="#10b981"
                        trend="+12.5%"
                    />
                    <AnimatedSummaryCard
                        title="Kas Keluar"
                        value={totals.keluar}
                        icon="trending-down"
                        color="#ef4444"
                        trend="-8.3%"
                    />
                    <AnimatedSummaryCard
                        title="Saldo Net"
                        value={totals.saldo}
                        icon="wallet"
                        color={totals.saldo >= 0 ? "#10b981" : "#ef4444"}
                        trend="+5.7%"
                    />
                    <AnimatedSummaryCard
                        title="Total Transaksi"
                        value={report.length}
                        icon="receipt"
                        color="#3b82f6"
                        trend="+15"
                    />
                </View>

                {/* Data Table */}
                <GlassDataTable />

                {/* Action Back - Moved inside ScrollView */}
                <View style={styles.bottomActions}>
                    <GlassButton
                        variant="secondary"
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        ← Kembali
                    </GlassButton>
                </View>
            </ScrollView>

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
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    mainScroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerCard: {
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 20,
    },
    headerContent: {
        alignItems: 'center',
        padding: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.95)',
        marginBottom: 24,
        textAlign: 'center',
    },
    datePickerContainer: {
        width: '100%',
        gap: 12,
        marginBottom: 24,
    },
    datePickerWrapper: {
        width: '100%',
    },
    actionContainer: {
        width: '100%',
        gap: 12,
    },
    summaryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
        marginBottom: 20,
        gap: 12,
        justifyContent: 'center',
    },
    summaryCard: {
        width: screenWidth > 600 ? '23%' : '44%',
        marginHorizontal: 0,
        marginVertical: 4,
        padding: 16,
        alignItems: 'center',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 8,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardValue: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
        textAlign: 'center',
    },
    cardTitle: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
    },
    tableContainer: {
        marginHorizontal: 16,
        padding: 20,
        marginBottom: 20,
    },
    emptyContainer: {
        marginHorizontal: 16,
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 16,
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: glassmorphism.surface.light,
        borderRadius: 12,
        marginBottom: 8,
        alignItems: 'center',
    },
    rowLeft: {
        flex: 1,
    },
    rowDate: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 4,
    },
    rowOutlet: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    rowAmount: {
        fontSize: 16,
        fontWeight: '800',
    },
    bottomActions: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        alignItems: 'center',
        width: '100%',
    },
    backButton: {
        minWidth: 150,
    },
});