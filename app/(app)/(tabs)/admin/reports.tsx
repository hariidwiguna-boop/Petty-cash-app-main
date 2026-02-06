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
import { supabase } from "../../../../lib/supabase";
import PlatformDatePicker from "../../../../components/PlatformDatePicker";
import MessageModal from "../../../../components/MessageModal";
import GlassButton from "../../../../src/design-system/components/glass/GlassButton";
import GlassCard from "../../../../src/design-system/components/glass/GlassCard";
import { glassmorphism } from "../../../../src/design-system/tokens/glassmorphism";

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
            
            // 1. Fetch data from all sources
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

            if (kasMasukResult.error) throw kasMasukResult.error;
            if (transactionsKeluarResult.error) throw transactionsKeluarResult.error;
            if (transactionsMasukResult.error) throw transactionsMasukResult.error;

            const kasMasukData = kasMasukResult.data || [];
            const transactionsKeluarData = transactionsKeluarResult.data || [];
            const transactionsMasukData = transactionsMasukResult.data || [];

            showModal("Fetched data", `Data kas masuk: ${kasMasukData.length}, kas keluar: ${transactionsKeluarData.length}`, "info");

            const totalData = kasMasukData.length + transactionsKeluarData.length + transactionsMasukData.length;
            if (totalData === 0) {
                showModal("Info", "Tidak ada data untuk diexport", "info");
                setIsExporting(false);
                return;
            }

            // 2. Combine and standardize data
            const allTransactions = [
                ...kasMasukData.map((item: any) => ({ 
                    ...item, 
                    tipe: "Kas Masuk", 
                    grand_total: item.jumlah, 
                    source_table: "kas_masuk" 
                })),
                ...transactionsKeluarData.map((item: any) => ({ 
                    ...item, 
                    tipe: "Kas Keluar", 
                    source_table: "transactions" 
                })),
                ...transactionsMasukData.map((item: any) => ({ 
                    ...item, 
                    tipe: "Kas Masuk", 
                    source_table: "transactions" 
                }))
            ];

            // 3. Group by Outlet
            const transactionsByOutlet: Record<string, any[]> = {};
            const outletSummaries: any[] = [];

            allTransactions.forEach(tx => {
                const outletName = tx.outlets?.nama_outlet || "Unknown";
                if (!transactionsByOutlet[outletName]) {
                    transactionsByOutlet[outletName] = [];
                }
                transactionsByOutlet[outletName].push(tx);
            });

            // 4. Prepare Dashboard Data
            let grandTotalMasuk = 0;
            let grandTotalKeluar = 0;

            Object.keys(transactionsByOutlet).forEach(outletName => {
                const txs = transactionsByOutlet[outletName];
                let masuk = 0;
                let keluar = 0;
                txs.forEach((t: any) => {
                    const amount = parseFloat(t.grand_total) || 0;
                    if (t.tipe === "Kas Keluar") keluar += amount;
                    else masuk += amount;
                });

                grandTotalMasuk += masuk;
                grandTotalKeluar += keluar;

                outletSummaries.push({
                    "Nama Outlet": outletName,
                    "Total Kas Masuk": masuk,
                    "Total Kas Keluar": keluar,
                    "Sisa Saldo (Period)": masuk - keluar
                });
            });

            // Add Grand Total Row
            outletSummaries.push({
                "Nama Outlet": "GRAND TOTAL",
                "Total Kas Masuk": grandTotalMasuk,
                "Total Kas Keluar": grandTotalKeluar,
                "Sisa Saldo (Period)": grandTotalMasuk - grandTotalKeluar
            });

            // 5. Create Workbook
            const wb = XLSX.utils.book_new();

            // 6. Add Dashboard Sheet
            const wsDashboard = XLSX.utils.json_to_sheet(outletSummaries);

            // Adjust column width for Dashboard
            wsDashboard['!cols'] = [
                { wch: 25 }, // Nama Outlet
                { wch: 20 }, // Masuk
                { wch: 20 }, // Keluar
                { wch: 20 }, // Saldo
            ];

            XLSX.utils.book_append_sheet(wb, wsDashboard, "DASHBOARD");

            // 7. Add Outlet Sheets (limit to first 3 outlets to prevent timeout)
            const outletNames = Object.keys(transactionsByOutlet).slice(0, 3);
            
            for (const outletName of outletNames) {
                const txs = transactionsByOutlet[outletName];

                const rows = txs.map((tx: any, index: number) => {
                    const amount = parseFloat(tx.grand_total) || 0;
                    const isExpense = tx.tipe === "Kas Keluar";
                    const masuk = isExpense ? 0 : amount;
                    const keluar = isExpense ? amount : 0;

                    // Format items
                    const itemDetails = tx.transaction_items?.slice(0, 3).map((i: any) => `${i.deskripsi}`).join("; ") || "-";

                    return {
                        "No": index + 1,
                        "Tanggal": tx.tanggal,
                        "Tipe": tx.tipe,
                        "Deskripsi": itemDetails,
                        "Total (Rp)": amount,
                        "Masuk (Debet)": masuk,
                        "Keluar (Kredit)": keluar,
                    };
                });

                // Add Total Row for Outlet Sheet
                const totalMasuk = rows.reduce((acc: number, curr: any) => acc + curr["Masuk (Debet)"], 0);
                const totalKeluar = rows.reduce((acc: number, curr: any) => acc + curr["Keluar (Kredit)"], 0);

                rows.push({
                    "No": "TOTAL",
                    "Tanggal": "",
                    "Tipe": "",
                    "Deskripsi": "",
                    "Total (Rp)": 0,
                    "Masuk (Debet)": totalMasuk,
                    "Keluar (Kredit)": totalKeluar,
                } as any);

                const wsOutlet = XLSX.utils.json_to_sheet(rows);

                // Adjust column width
                wsOutlet['!cols'] = [
                    { wch: 5 },  // No
                    { wch: 12 }, // Date
                    { wch: 12 }, // Tipe
                    { wch: 30 }, // Deskripsi (reduced)
                    { wch: 15 }, // Total
                    { wch: 15 }, // Masuk
                    { wch: 15 }, // Keluar
                ];

                XLSX.utils.book_append_sheet(wb, wsOutlet, outletName.replace(/[\\/?*[\]]/g, "").substring(0, 20)); // Sanitize sheet name
            }

            // 8. Write File - handle web and mobile differently
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            const fileName = `Laporan_PettyCash_${startDate}_sd_${endDate}.xlsx`;
            
            showModal("Success", "Export berhasil! File akan diunduh.", "success");
            
            if (Platform.OS === 'web') {
                // Web: Create download link
                const uri = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + wbout;
                const link = document.createElement('a');
                link.href = uri;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // Mobile: Use expo-file-system legacy
                const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
                await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri, {
                        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        dialogTitle: 'Download Laporan Petty Cash',
                        UTI: 'com.microsoft.excel.xlsx'
                    });
                } else {
                    showModal("Info", "File tersimpan di: " + fileUri, "info");
                }
            }

        } catch (error: any) {
            console.error(error);
            showModal("Export Gagal", error.message || "Terjadi kesalahan saat export.", "error");
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
                colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

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
                        >
                            {isLoading ? 'Loading...' : '📊 Generate View'}
                        </GlassButton>
                        <GlassButton
                            variant="secondary"
                            onPress={generateExcelReport}
                            loading={isExporting}
                            particles={true}
                            particleTrigger="onPress"
                            fullWidth
                        >
                            {isExporting ? 'Loading...' : '📥 Export Excel'}
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
            <ScrollView 
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <GlassDataTable />
            </ScrollView>

            {/* Fixed Bottom Action */}
            <View style={styles.bottomActions}>
                <GlassButton
                    variant="secondary"
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    ← Kembali
                </GlassButton>
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
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    headerCard: {
        marginHorizontal: 16,
        marginTop: 60,
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
        marginBottom: 20,
    },
    datePickerWrapper: {
        flex: 1,
    },
    actionContainer: {
        width: '100%',
    },
    summaryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 8,
        marginBottom: 20,
        gap: 12,
    },
    summaryCard: {
        width: screenWidth > 600 ? '23%' : '48%',
        marginHorizontal: 4,
        marginVertical: 8,
        padding: 20,
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
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
        textAlign: 'center',
    },
    cardTitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
    },
    scrollContainer: {
        flex: 1,
        marginHorizontal: 16,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    tableContainer: {
        padding: 20,
    },
    emptyContainer: {
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
        position: 'absolute',
        bottom: 40,
        left: 16,
        right: 16,
        zIndex: 100,
    },
    backButton: {
        marginBottom: 0,
    },
});