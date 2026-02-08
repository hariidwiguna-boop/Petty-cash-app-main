import { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Platform,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { supabase } from "../../../lib/supabase";
import { formatDateToISO } from "../../../lib/dateUtils";
import PlatformDatePicker from "../../../components/PlatformDatePicker";
import MessageModal from "../../../components/MessageModal";
import GlassButton from "../../../src/design-system/components/glass/GlassButton";
import GlassCard from "../../../src/design-system/components/glass/GlassCard";
import { glassmorphism } from "../../../src/design-system/tokens/glassmorphism";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ReportsScreen() {
    const router = useRouter();
    const [startDate, setStartDate] = useState(formatDateToISO(new Date()));
    const [endDate, setEndDate] = useState(formatDateToISO(new Date()));
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
                ...(kasMasukResult.data || []).map((item: any) => ({ ...item, tipe: "Kas Masuk", grand_total: Number(item.jumlah || 0) })),
                ...(transactionsKeluarResult.data || []).map((item: any) => ({ ...item, tipe: "Kas Keluar", grand_total: Number(item.grand_total || 0) })),
                ...(transactionsMasukResult.data || []).map((item: any) => ({ ...item, tipe: "Kas Masuk", grand_total: Number(item.grand_total || 0) }))
            ].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

            setReport(allData);

            // Calculate totals
            let m = 0, k = 0;
            allData?.forEach(tx => {
                const amount = Number(tx.grand_total || 0);
                tx.tipe === "Kas Keluar" ? k += amount : m += amount;
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
                ...(kasMasukResult.data || []).map((item: any) => ({ ...item, tipe: "Kas Masuk", grand_total: Number(item.jumlah || 0), is_kas_masuk: true })),
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

                    const amount = Number(tx.grand_total || 0);
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
                                total: Number(item.total_harga || item.subtotal || 0),
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
                            total: Number(tx.grand_total || 0),
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

                // Row 5: Total Sisa Saldo (Akhir)
                wsData.push(["Total Sisa Saldo", saldoAkhir]);

                wsData.push([]); // Empty row
                wsData.push([]); // Empty row


                // Table Headers
                // Left Table (Daily) + Right Table (Detail)
                // A-D (Daily) | F-N (Detail)
                // Note: Column E is Spacer
                wsData.push([
                    "NO", "TANGGAL", "KETERANGAN", "MASUK", "KELUAR", "SALDO", // Daily
                    null, // Spacer
                    "NO", "TANGGAL", "NAMA BARANG", "QTY", "TOTAL", "KATEGORI" // Detail
                ]);

                // Merge Logic later for headers? No need for simple array.
                // Just filling data.

                const maxRows = Math.max(sortedDates.length, detailRows.length);

                for (let i = 0; i < maxRows; i++) {
                    const dailyDate = sortedDates[i];
                    const daily = dailyData[dailyDate];

                    const detail = detailRows[i];

                    const row = [
                        daily ? i + 1 : null,
                        daily ? daily.date : null,
                        daily ? daily.keterangan.join("; ") : null,
                        daily ? daily.masuk : null,
                        daily ? daily.keluar : null,
                        daily ? daily.saldoAkhir : null,
                        null, // Spacer
                        detail ? detail.no : null,
                        detail ? detail.tanggal : null,
                        detail ? detail.namaBarang : null,
                        detail ? detail.qty : null,
                        detail ? detail.total : null,
                        detail ? detail.kategori : null
                    ];
                    wsData.push(row);
                }

                // Create Sheet
                const ws = XLSX.utils.aoa_to_sheet(wsData);

                // Styling (Widths)
                ws['!cols'] = [
                    { wch: 5 },  // A: No
                    { wch: 12 }, // B: Tanggal
                    { wch: 25 }, // C: Keterangan
                    { wch: 15 }, // D: Masuk
                    { wch: 15 }, // E: Keluar
                    { wch: 15 }, // F: Saldo
                    { wch: 5 },  // G: Spacer
                    { wch: 5 },  // H: No
                    { wch: 12 }, // I: Tanggal
                    { wch: 25 }, // J: Nama Barang
                    { wch: 8 },  // K: Qty
                    { wch: 15 }, // L: Total
                    { wch: 20 }, // M: Kategori
                ];

                // Append sheet
                const sheetName = outletName.replace(/[\\/?*[\]]/g, "").substring(0, 30);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            }

            // Export
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            const fileName = `Laporan_Lengkap_${startDate}_sd_${endDate}.xlsx`;

            if (Platform.OS === 'web') {
                // Determine content type safely
                const contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

                // Convert base64 to Blob
                const byteCharacters = atob(wbout);
                const byteArrays = [];
                for (let i = 0; i < byteCharacters.length; i += 512) {
                    const slice = byteCharacters.slice(i, i + 512);
                    const byteNumbers = new Array(slice.length);
                    for (let n = 0; n < slice.length; n++) {
                        byteNumbers[n] = slice.charCodeAt(n);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    byteArrays.push(byteArray);
                }
                const blob = new Blob(byteArrays, { type: contentType });

                // Use URL.createObjectURL
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();

                // Cleanup
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
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

    const SummaryCard = ({ title, value, icon, color }: {
        title: string; value: number; icon: string; color: string;
    }) => {
        return (
            <View style={styles.summaryCard}>
                <View style={styles.cardLeft}>
                    <Feather name={icon as any} size={20} color={color} />
                    <Text style={styles.cardTitle}>{title}</Text>
                </View>
                <Text style={[styles.cardValue, { color }]}>
                    {formatCurrency(value)}
                </Text>
            </View>
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
            {/* Background Gradient - Red to White */}
            <LinearGradient
                colors={['#991B1B', '#DC2626', '#FEE2E2', '#FFFFFF']}
                locations={[0, 0.15, 0.4, 1]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />

            <ScrollView
                style={styles.mainScroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section - Simplified */}
                <View style={styles.headerCard}>
                    {/* Back Button + Title Row */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Text style={styles.backBtnText}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>📊 Laporan Transaksi</Text>
                    </View>

                    <View style={styles.datePickerContainer}>
                        <View style={styles.datePickerWrapper}>
                            <PlatformDatePicker
                                label="Dari"
                                value={startDate ? new Date(startDate) : new Date()}
                                onChange={(d) => setStartDate(formatDateToISO(d))}
                            />
                        </View>
                        <View style={styles.datePickerWrapper}>
                            <PlatformDatePicker
                                label="Sampai"
                                value={endDate ? new Date(endDate) : new Date()}
                                onChange={(d) => setEndDate(formatDateToISO(d))}
                            />
                        </View>
                    </View>

                    {/* Simple Text Buttons */}
                    <View style={styles.actionContainer}>
                        <TouchableOpacity style={styles.textButton} onPress={generateReport} disabled={isLoading}>
                            <Text style={styles.textButtonLabel}>📊 {isLoading ? 'Loading...' : 'Generate View'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.textButton} onPress={generateExcelReport} disabled={isExporting}>
                            <Text style={styles.textButtonLabel}>📥 {isExporting ? 'Loading...' : 'Export Excel'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Summary Cards - Vertical Stack */}
                <View style={styles.summaryContainer}>
                    <SummaryCard title="Kas Masuk" value={totals.masuk} icon="trending-up" color="#10b981" />
                    <SummaryCard title="Kas Keluar" value={totals.keluar} icon="trending-down" color="#ef4444" />
                    <SummaryCard title="Saldo Net" value={totals.saldo} icon="wallet" color={totals.saldo >= 0 ? "#10b981" : "#ef4444"} />
                    <SummaryCard title="Total Transaksi" value={report.length} icon="file-text" color="#000000" />
                </View>

                {/* Data Table */}
                <GlassDataTable />
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
        marginTop: 12,
        marginBottom: 12,
    },
    headerContent: {
        alignItems: 'center',
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    backBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.95)',
    },
    datePickerContainer: {
        width: '100%',
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    datePickerWrapper: {
        flex: 1,
    },
    actionContainer: {
        width: '100%',
        flexDirection: 'row',
        gap: 8,
    },
    summaryContainer: {
        paddingHorizontal: 16,
        marginBottom: 12,
        gap: 8,
    },
    summaryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
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
        fontSize: 15,
        fontWeight: '800',
        color: '#1f2937',
    },
    cardTitle: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '600',
    },
    textButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
    },
    textButtonLabel: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    },
    tableContainer: {
        marginHorizontal: 16,
        padding: 12,
        marginBottom: 12,
    },
    emptyContainer: {
        marginHorizontal: 16,
        padding: 24,
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: glassmorphism.surface.light,
        borderRadius: 10,
        marginBottom: 6,
        alignItems: 'center',
    },
    rowLeft: {
        flex: 1,
    },
    rowDate: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 2,
    },
    rowOutlet: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    rowAmount: {
        fontSize: 13,
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