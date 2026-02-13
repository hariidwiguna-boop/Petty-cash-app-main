import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Linking,
    Platform,
    Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { supabase } from "../../../lib/supabase";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { formatDateToISO } from "../../../lib/dateUtils";

interface DailySummary {
    kasAwal: number;
    kasMasuk: number;
    kasKeluar: number;
    saldoAkhir: number;
    transactions: any[];
}

export default function DailyReportScreen() {
    const { outlet } = useAuthStore();
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

    const fetchDailySummary = async () => {
        if (!outlet) return;
        try {
            const dateStr = formatDateToISO(selectedDate);
            const { data: allTx } = await supabase.from("transactions").select("*, transaction_items(*)").eq("outlet_id", outlet.id);
            const { data: kasMasukData } = await supabase.from("kas_masuk").select("*").eq("outlet_id", outlet.id);

            let kasKeluarHariIni = 0;
            let kasMasukTxHariIni = 0;
            const todayTx: any[] = [];

            (allTx || []).forEach((tx) => {
                if (tx.tanggal === dateStr) {
                    if (tx.tipe === "Kas Keluar") {
                        kasKeluarHariIni += Number(tx.grand_total) || 0;
                        todayTx.push(tx);
                    } else if (tx.tipe === "Kas Masuk") {
                        kasMasukTxHariIni += Number(tx.grand_total) || 0;
                    }
                }
            });

            let kasMasukTableHariIni = 0;
            (kasMasukData || []).forEach((km) => {
                if (km.tanggal === dateStr) kasMasukTableHariIni += Number(km.jumlah) || 0;
            });

            let pastIn = 0;
            let pastOut = 0;
            (kasMasukData || []).forEach(km => { if (km.tanggal < dateStr) pastIn += (Number(km.jumlah) || 0); });
            (allTx || []).forEach(tx => {
                const amount = Number(tx.grand_total) || 0;
                if (tx.tanggal < dateStr) {
                    if (tx.tipe === "Kas Keluar") pastOut += amount;
                    else if (tx.tipe === "Kas Masuk") pastIn += amount;
                }
            });

            const kasAwalHariIni = (outlet.saldo_awal || 0) + pastIn - pastOut;
            const totalKasMasukHariIni = kasMasukTableHariIni + kasMasukTxHariIni;
            const saldoSekarang = kasAwalHariIni + totalKasMasukHariIni - kasKeluarHariIni;

            setSummary({
                kasAwal: kasAwalHariIni,
                kasMasuk: totalKasMasukHariIni,
                kasKeluar: kasKeluarHariIni,
                saldoAkhir: saldoSekarang,
                transactions: todayTx,
            });

            // Generate Preview Text (simplified for brevity)
            const displayDate = selectedDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
            const preview = `LAPORAN HARIAN\nOutlet: ${outlet.nama_outlet}\nTanggal: ${displayDate}\n\nKas Awal: ${formatCurrency(kasAwalHariIni)}\nKas Masuk: ${formatCurrency(totalKasMasukHariIni)}\nKas Keluar: ${formatCurrency(kasKeluarHariIni)}\nSaldo Akhir: ${formatCurrency(saldoSekarang)}`;
            setPreviewText(preview);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchDailySummary(); }, [selectedDate, outlet]);

    const formatCurrency = (amount: number) => {
        return "Rp . " + amount.toLocaleString("id-ID").replace(/\s/g, '');
    };

    const copyToClipboard = async () => {
        await Clipboard.setStringAsync(previewText);
    };

    const shareToWhatsApp = () => {
        const url = `whatsapp://send?text=${encodeURIComponent(previewText)}`;
        Linking.openURL(url).catch(() => Share.share({ message: previewText }));
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
                                <Text style={styles.headerTitle}>LAPORAN HARIAN</Text>
                                <Text style={styles.headerSubtitle}>Ringkasan kas harian outlet</Text>
                            </View>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                                <Ionicons name="close" size={28} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Date Selector */}
                        <TouchableOpacity style={styles.dateSelector}>
                            <Ionicons name="calendar-outline" size={20} color="#FF0000" />
                            <Text style={styles.dateText}>
                                {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                    <View style={styles.headerCurve} />
                </LinearGradient>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyScroll} showsVerticalScrollIndicator={false}>
                {/* KPI Cards */}
                <View style={styles.kpiGrid}>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>KAS AWAL</Text>
                        <Text style={styles.kpiValue}>{formatCurrency(summary.kasAwal)}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>KAS MASUK</Text>
                        <Text style={[styles.kpiValue, { color: '#22C55E' }]}>{formatCurrency(summary.kasMasuk)}</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiLabel}>KAS KELUAR</Text>
                        <Text style={[styles.kpiValue, { color: '#FF0000' }]}>{formatCurrency(summary.kasKeluar)}</Text>
                    </View>
                    <View style={[styles.kpiCard, styles.kpiActive]}>
                        <Text style={[styles.kpiLabel, { color: '#FFFFFF' }]}>SALDO AKHIR</Text>
                        <Text style={[styles.kpiValue, { color: '#FFFFFF', fontSize: 20 }]}>{formatCurrency(summary.saldoAkhir)}</Text>
                    </View>
                </View>

                {/* Preview Box */}
                <View style={styles.previewSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>PREVIEW LAPORAN</Text>
                        <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
                            <Ionicons name="copy-outline" size={18} color="#FF0000" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.previewBox}>
                        <Text style={styles.previewContent}>{previewText}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity style={styles.whatsappBtn} onPress={shareToWhatsApp}>
                    <LinearGradient colors={['#25D366', '#128C7E']} style={styles.whatsappGradient}>
                        <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
                        <Text style={styles.whatsappText}>Kirim via WhatsApp</Text>
                    </LinearGradient>
                </TouchableOpacity>
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
    dateSelector: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '800',
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
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 25,
    },
    kpiCard: {
        width: '48%',
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        gap: 4,
    },
    kpiActive: {
        backgroundColor: '#FF0000',
        borderColor: '#FF0000',
        width: '100%',
        alignItems: 'center',
    },
    kpiLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
    },
    kpiValue: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1E293B',
    },
    previewSection: {
        gap: 12,
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 1.5,
    },
    copyBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    previewContent: {
        fontSize: 13,
        color: '#1E293B',
        lineHeight: 20,
        fontWeight: '500',
    },
    whatsappBtn: {
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    whatsappGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 12,
    },
    whatsappText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});
