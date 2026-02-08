
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Share, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../../../lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import MessageModal from "../../../../../components/MessageModal"; // Import Custom Modal
import CustomLoading from "../../../../../components/CustomLoading";

import AdminLayout from "../../../../../components/admin/AdminLayout";

// ... imports

export default function SecurityScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);

    // Message Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: "",
        message: "",
        type: "info" as "success" | "error" | "warning" | "info" | "confirm",
        onConfirm: undefined as undefined | (() => void),
    });

    const showMessage = (
        title: string,
        message: string,
        type: "success" | "error" | "warning" | "info" | "confirm" = "info",
        onConfirm?: () => void
    ) => {
        setModalConfig({ title, message, type, onConfirm });
        // Small delay to ensure state update before showing (optional but safe)
        setTimeout(() => setModalVisible(true), 0);
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        // Note: logs table might be empty initially
        const { data } = await supabase
            .from("audit_logs")
            .select("*, profiles(username)")
            .order("created_at", { ascending: false })
            .limit(50);
        setLogs(data || []);
        setIsLoading(false);
    };

    const handleExportData = async () => {
        setIsLoading(true);
        try {
            // Fetch all critical data
            const [txs, users, outlets] = await Promise.all([
                supabase.from("transactions").select("*"),
                supabase.from("profiles").select("*"),
                supabase.from("outlets").select("*")
            ]);

            const fullData = {
                timestamp: new Date().toISOString(),
                transactions: txs.data,
                users: users.data,
                outlets: outlets.data
            };

            const jsonString = JSON.stringify(fullData, null, 2);
            const fileName = `backup_pettycash_${new Date().getTime()}.json`;

            if (Platform.OS === 'web') {
                // Web Download Logic
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                // Native Download Logic
                // @ts-ignore
                const fileUri = (FileSystem.documentDirectory || "") + fileName;
                // @ts-ignore
                await FileSystem.writeAsStringAsync(fileUri, jsonString, { encoding: FileSystem.EncodingType.UTF8 });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                } else {
                    showMessage("Error", "Fitur sharing tidak tersedia di device ini.", "error");
                }
            }
        } catch (error: any) {
            console.error(error);
            showMessage("Export Gagal", error.message || "Terjadi kesalahan saat backup.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetData = () => {
        showMessage(
            "⚠️ PERINGATAN KERAS",
            "Anda akan menghapus SEMUA data transaksi, reimburse, dan kas masuk. \n\nData Outlet dan User TIDAK akan dihapus.\n\nTindakan ini tidak bisa dibatalkan.",
            "confirm",
            () => {
                // Double confirm logic
                // Since MessageModal is single-instance, we need to close it first then show another,
                // or just trust one bold confirm.
                // Note: MessageModal usually closes on confirm.
                // Let's do a second modal after a short delay to simulate double confirm safely.
                setTimeout(() => {
                    showMessage(
                        "Yakin 100%?",
                        "Ini kesempatan terakhir. Data akan hilang selamanya.",
                        "confirm",
                        executeReset
                    );
                }, 500);
            }
        );
    };

    const executeReset = async () => {
        setIsLoading(true);
        try {
            // Try calling RPC first
            const { error } = await supabase.rpc('reset_all_data');

            if (error) {
                console.log("RPC Error, attempting manual delete:", error);
                // Fallback manual delete (Sequence matters!)
                await supabase.from("transaction_items").delete().neq('id', 0);
                await supabase.from("transactions").delete().neq('id', '00000000-0000-0000-0000-000000000000');
                await supabase.from("kas_masuk").delete().neq('id', 0);
                await supabase.from("reimbursements").delete().neq('id', '00000000-0000-0000-0000-000000000000');
                await supabase.from("audit_logs").delete().neq('id', 0);
            }

            showMessage("Sukses", "System Reset Successful. All transactional data has been cleared.", "success");
            fetchLogs(); // Log list will be empty
        } catch (e: any) {
            showMessage("Reset Failed", e.message, "error");
        } finally {
            setIsLoading(false);
        }
    };



    // Changed renderLog to be used in map
    const renderLog = (item: any) => (
        <View key={item.id} style={styles.logItem}>
            <View style={styles.logHeader}>
                <Text style={styles.logAction}>{item.action}</Text>
                <Text style={styles.logDate}>
                    {new Date(item.created_at).toLocaleString("id-ID")}
                </Text>
            </View>
            <Text style={styles.logUser}>User: {item.profiles?.username || "System"}</Text>
            {item.details && (
                <Text style={styles.logDetails} numberOfLines={2}>
                    {JSON.stringify(item.details)}
                </Text>
            )}
        </View>
    );

    return (
        <AdminLayout
            title="🛡️ Security & Logs"
            subtitle="Audit trail & Backup data"
            showBackButton={true}
        >
            <CustomLoading visible={isLoading} text="Memproses Data..." />

            <MessageModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={() => {
                    if (modalConfig.onConfirm) modalConfig.onConfirm();
                    setModalVisible(false);
                }}
                onClose={() => setModalVisible(false)}
            />

            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Audit Trail</Text>
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchLogs}>
                        <Text style={styles.refreshText}>🔄 Refresh</Text>
                    </TouchableOpacity>
                </View>

                {/* Audit Logs List */}
                <View style={styles.logListContainer}>
                    {isLoading && logs.length === 0 ? (
                        <ActivityIndicator color="#C94C4C" />
                    ) : logs.length === 0 ? (
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>Tidak ada log aktivitas.</Text>
                            <Text style={styles.emptySub}>Aktivitas penting akan muncul di sini.</Text>
                        </View>
                    ) : (
                        logs.map((item) => renderLog(item))
                    )}
                </View>

                {/* Backup Actions */}
                <View style={styles.backupSection}>
                    <Text style={styles.sectionTitle}>Backup Data</Text>
                    <Text style={styles.backupDesc}>Download seluruh data aplikasi untuk cadangan offline.</Text>
                    <TouchableOpacity
                        style={styles.backupBtn}
                        onPress={handleExportData}
                        disabled={isLoading}
                    >
                        <Text style={styles.backupBtnText}>
                            {isLoading ? "Exporting..." : "📥 Download Full Backup (JSON)"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Danger Zone */}
                <View style={styles.dangerZone}>
                    <Text style={styles.dangerTitle}>Danger Zone</Text>
                    <Text style={styles.dangerDesc}>Reset Data akan menghapus semua Transaksi & Laporan. User & Outlet tetap aman.</Text>
                    <TouchableOpacity
                        style={styles.resetBtn}
                        onPress={handleResetData}
                        disabled={isLoading}
                    >
                        <Text style={styles.resetBtnText}>
                            {isLoading ? "Deleting..." : "💣 RESET DATABASE"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    content: { flex: 1, padding: 20, gap: 20 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
    refreshBtn: { backgroundColor: "#e0f2fe", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    refreshText: { fontSize: 12, color: "#0284c7", fontWeight: "700" },
    logListContainer: {
        flex: 1,
        backgroundColor: "white",
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb"
    },
    logItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6"
    },
    logHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    logAction: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
    logDate: { fontSize: 11, color: "#999" },
    logUser: { fontSize: 12, color: "#666", fontWeight: "600", marginBottom: 2 },
    logDetails: { fontSize: 11, color: "#9ca3af", fontFamily: "monospace" },
    empty: { padding: 40, alignItems: "center" },
    emptyText: { color: "#666", fontWeight: "600" },
    emptySub: { color: "#9ca3af", fontSize: 12, marginTop: 4 },
    // Backup
    backupSection: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb"
    },
    backupDesc: { fontSize: 13, color: "#666", marginTop: 4, marginBottom: 16 },
    backupBtn: {
        backgroundColor: "#1a1a1a",
        padding: 16,
        borderRadius: 12,
        alignItems: "center"
    },
    backupBtnText: { color: "white", fontWeight: "700", fontSize: 15 },
    // Danger Zone
    dangerZone: {
        backgroundColor: "#fee2e2",
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#fca5a5",
        marginTop: 20,
    },
    dangerTitle: { fontSize: 16, fontWeight: "800", color: "#b91c1c", marginBottom: 4 },
    dangerDesc: { fontSize: 13, color: "#7f1d1d", marginBottom: 16 },
    resetBtn: {
        backgroundColor: "#b91c1c",
        padding: 16,
        borderRadius: 12,
        alignItems: "center"
    },
    resetBtnText: { color: "white", fontWeight: "700", fontSize: 15 }
});
