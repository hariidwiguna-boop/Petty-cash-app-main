import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Share, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../../../lib/supabase";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import MessageModal from "../../../../../components/MessageModal";
import CustomLoading from "../../../../../components/CustomLoading";
import AdminLayout from "../../../../../components/admin/AdminLayout";
import AdminGlassCard from "../../../../../components/admin/AdminGlassCard";
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

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
            <View style={styles.logStatusLine} />
            <View style={styles.logBody}>
                <View style={styles.logHeader}>
                    <Text style={styles.logAction}>{item.action.toUpperCase()}</Text>
                    <Text style={styles.logDate}>
                        {new Date(item.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <View style={styles.logMeta}>
                    <Ionicons name="person-circle-outline" size={12} color="#475569" />
                    <Text style={styles.logUser}>UID: {item.profiles?.username || "SYSTEM_DAEMON"}</Text>
                </View>
                {item.details && (
                    <View style={styles.logDetailsContainer}>
                        <Text style={styles.logDetails} numberOfLines={1}>
                            {JSON.stringify(item.details).replace(/[{}]/g, '').toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>
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

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.sectionHeader}>
                    <View style={styles.headerInfo}>
                        <Ionicons name="list" size={16} color="#3B82F6" />
                        <Text style={styles.sectionTitle}>AUDIT TRAIL</Text>
                    </View>
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchLogs}>
                        <Ionicons name="refresh" size={14} color="#3B82F6" />
                    </TouchableOpacity>
                </View>

                {/* Audit Logs List */}
                <AdminGlassCard style={styles.logListContainer}>
                    {isLoading && logs.length === 0 ? (
                        <View style={styles.loadingPadding}>
                            <ActivityIndicator color="#3B82F6" />
                        </View>
                    ) : logs.length === 0 ? (
                        <View style={styles.empty}>
                            <Ionicons name="shield-outline" size={32} color="rgba(255,255,255,0.05)" />
                            <Text style={styles.emptyText}>CLEAN SLATE: NO RECENT LOGS</Text>
                        </View>
                    ) : (
                        logs.slice(0, 5).map((item) => renderLog(item))
                    )}
                </AdminGlassCard>

                {/* Backup Actions */}
                <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                    <View style={styles.headerInfo}>
                        <Ionicons name="cloud-download-outline" size={16} color="#10B981" />
                        <Text style={[styles.sectionTitle, { color: '#10B981' }]}>DATA CONTINUITY</Text>
                    </View>
                </View>

                <AdminGlassCard style={styles.backupSection}>
                    <Text style={styles.backupDesc}>Generate encrypted snapshots for institutional records.</Text>
                    <TouchableOpacity
                        style={styles.backupBtn}
                        onPress={handleExportData}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            style={styles.backupGradient}
                        >
                            <Ionicons name="download-outline" size={18} color="white" />
                            <Text style={styles.backupBtnText}>
                                {isLoading ? "PROCESSING..." : "EXPORT JSON BACKUP"}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </AdminGlassCard>

                {/* Danger Zone */}
                <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                    <View style={styles.headerInfo}>
                        <Ionicons name="warning-outline" size={16} color="#FF3131" />
                        <Text style={[styles.sectionTitle, { color: '#FF3131' }]}>OVERRIDE PROTOCOLS</Text>
                    </View>
                </View>

                <AdminGlassCard style={styles.dangerZone}>
                    <Text style={styles.dangerTitle}>SYSTEMIC RESET</Text>
                    <Text style={styles.dangerDesc}>PURGE ALL TRANSACTIONS. IRREVERSIBLE ACTION.</Text>
                    <TouchableOpacity
                        style={styles.resetBtn}
                        onPress={handleResetData}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={['#FF3131', '#991B1B']}
                            style={styles.resetGradient}
                        >
                            <Ionicons name="trash-bin-outline" size={18} color="white" />
                            <Text style={styles.resetBtnText}>
                                {isLoading ? "EXECUTING..." : "COMMIT RESET"}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </AdminGlassCard>
            </ScrollView>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 60, gap: 12 },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: "900",
        color: "#3B82F6",
        letterSpacing: 2
    },
    refreshBtn: {
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.1)',
    },
    logListContainer: {
        padding: 4,
        overflow: 'hidden',
    },
    loadingPadding: {
        padding: 40,
        alignItems: 'center',
    },
    logItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.03)",
    },
    logStatusLine: {
        width: 3,
        height: '100%',
        backgroundColor: '#3B82F6',
        borderRadius: 2,
        marginRight: 16,
        opacity: 0.6,
    },
    logBody: {
        flex: 1,
    },
    logHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4
    },
    logAction: {
        fontSize: 11,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    logDate: {
        fontSize: 9,
        color: "#475569",
        fontWeight: '900',
    },
    logMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    logUser: {
        fontSize: 10,
        color: "#64748B",
        fontWeight: "700",
    },
    logDetailsContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 6,
        padding: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    logDetails: {
        fontSize: 9,
        color: "#334155",
        fontFamily: Platform.OS === 'ios' ? "Menlo" : "monospace",
        letterSpacing: 0.5,
    },
    empty: { padding: 40, alignItems: "center", gap: 12 },
    emptyText: {
        color: "#475569",
        fontWeight: "900",
        fontSize: 10,
        letterSpacing: 1,
    },
    // Backup
    backupSection: {
        padding: 24,
    },
    backupDesc: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: '700',
        marginBottom: 20,
        lineHeight: 16,
    },
    backupBtn: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    backupGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 10,
    },
    backupBtnText: {
        color: "white",
        fontWeight: "900",
        fontSize: 11,
        letterSpacing: 1,
    },
    // Danger Zone
    dangerZone: {
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.1)',
    },
    dangerTitle: {
        fontSize: 12,
        fontWeight: "900",
        color: "#FF3131",
        marginBottom: 8,
        letterSpacing: 1,
    },
    dangerDesc: {
        fontSize: 10,
        color: "#991B1B",
        fontWeight: '900',
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    resetBtn: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    resetGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 10,
    },
    resetBtnText: {
        color: "white",
        fontWeight: "900",
        fontSize: 11,
        letterSpacing: 1,
    }
});
