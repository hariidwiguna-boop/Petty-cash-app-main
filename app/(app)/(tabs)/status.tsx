import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../stores/authStore";
import { supabase } from "../../../lib/supabase";

interface ReimburseRequest {
    id: string;
    created_at: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: string;
    notes?: string;
    approved_at?: string;
}

export default function StatusScreen() {
    const { outlet, isAdmin, adminSelectedOutlet } = useAuthStore();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [requests, setRequests] = useState<ReimburseRequest[]>([]);

    const fetchRequests = async () => {
        const activeOutlet = isAdmin ? (adminSelectedOutlet || outlet) : outlet;

        // Regular user must have outlet
        if (!isAdmin && !activeOutlet) return;

        try {
            let query = supabase
                .from("reimbursements")
                .select("*, outlets(nama_outlet)")
                .order("created_at", { ascending: false });

            if (activeOutlet) {
                query = query.eq("outlet_id", activeOutlet.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error("Fetch requests error:", error);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [outlet]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRequests();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Disetujui":
            case "Approved":
                return { bg: "#dcfce7", text: "#16a34a", icon: "✅", label: "Approved" };
            case "Ditolak":
            case "Rejected":
                return { bg: "#fee2e2", text: "#dc2626", icon: "❌", label: "Rejected" };
            case "Diajukan":
            case "Pending":
            default:
                return { bg: "#fef3c7", text: "#d97706", icon: "⏳", label: "Pending" };
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.modalCard}>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                    <View>
                        <Text style={styles.modalTitle}>📊 Status Reimburse</Text>
                        <Text style={styles.modalSubtitle}>
                            Tracking pengajuan reimburse
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                        <Text style={styles.closeBtnText}>✕</Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.modalContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {requests.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📭</Text>
                            <Text style={styles.emptyText}>Belum ada pengajuan reimburse</Text>
                        </View>
                    ) : (
                        requests.map((req) => {
                            const statusStyle = getStatusStyle(req.status);
                            return (
                                <View key={req.id} style={styles.requestCard}>
                                    <View style={styles.requestHeader}>
                                        <View style={styles.requestInfo}>
                                            <Text style={styles.requestPeriod}>
                                                {formatDate(req.start_date)} - {formatDate(req.end_date)}
                                            </Text>
                                            <Text style={styles.requestDate}>
                                                Diajukan: {formatDate(req.created_at)}
                                            </Text>
                                            {(req.status === "Approved" || req.status === "Disetujui") && req.approved_at && (
                                                <Text style={[styles.requestDate, { color: "#16a34a", fontWeight: "600" }]}>
                                                    Disetujui: {formatDate(req.approved_at)}
                                                </Text>
                                            )}
                                        </View>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: statusStyle.bg },
                                            ]}
                                        >
                                            <Text style={styles.statusIcon}>{statusStyle.icon}</Text>
                                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                                {statusStyle.label}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.requestBody}>
                                        <Text style={styles.requestAmount}>
                                            {formatCurrency(req.total_amount)}
                                        </Text>
                                        {req.notes && (
                                            <View style={styles.catatanBox}>
                                                <Text style={styles.catatanLabel}>Catatan:</Text>
                                                <Text style={styles.catatanText}>{req.notes}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>

                {/* Footer */}
                <View style={styles.modalFooter}>
                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.btnSecondaryText}>Tutup</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f4d0",
    },
    modalCard: {
        flex: 1,
        backgroundColor: "white",
        margin: 16,
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 40,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1a1a1a",
    },
    modalSubtitle: {
        fontSize: 13,
        color: "#666",
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center",
    },
    closeBtnText: {
        fontSize: 16,
        color: "#64748b",
    },
    modalContent: {
        flex: 1,
        padding: 16,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 14,
        color: "#999",
    },
    // Request Card
    requestCard: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 14,
        marginBottom: 12,
        overflow: "hidden",
    },
    requestHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 14,
        backgroundColor: "#f9fafb",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    requestInfo: {},
    requestPeriod: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    requestDate: {
        fontSize: 11,
        color: "#666",
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusIcon: {
        fontSize: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "700",
    },
    requestBody: {
        padding: 14,
    },
    requestAmount: {
        fontSize: 22,
        fontWeight: "900",
        color: "#1d4ed8",
    },
    catatanBox: {
        backgroundColor: "#fef3c7",
        borderRadius: 8,
        padding: 10,
        marginTop: 10,
    },
    catatanLabel: {
        fontSize: 11,
        color: "#92400e",
        fontWeight: "600",
    },
    catatanText: {
        fontSize: 12,
        color: "#78350f",
        marginTop: 2,
    },
    // Footer
    modalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    btnSecondary: {
        backgroundColor: "#f1f5f9",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    btnSecondaryText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#64748b",
    },
});
