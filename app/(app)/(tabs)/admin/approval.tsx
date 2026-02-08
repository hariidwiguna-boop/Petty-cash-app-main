import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Alert,
    Modal,
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../../lib/supabase";
import { useAuthStore } from "../../../../stores/authStore";
import MessageModal from "../../../../components/MessageModal";
import AdminLayout from "../../../../components/admin/AdminLayout";

interface ReimburseRequest {
    id: string;
    created_at: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: string;
    outlet_id: string;
    user_id: string;
    outlets?: { nama_outlet: string };
}

export default function ApprovalScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [requests, setRequests] = useState<ReimburseRequest[]>([]);
    const [filterStatus, setFilterStatus] = useState("Pending");
    const [filterOutlet, setFilterOutlet] = useState("");
    const [outlets, setOutlets] = useState<any[]>([]);

    // Action modal
    const [actionModal, setActionModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<ReimburseRequest | null>(null);
    const [catatan, setCatatan] = useState("");

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

    const fetchRequests = async () => {
        try {
            let query = supabase
                .from("reimbursements")
                .select("*, outlets(nama_outlet)")
                .order("created_at", { ascending: false });

            if (filterStatus) {
                query = query.eq("status", filterStatus);
            }
            if (filterOutlet) {
                query = query.eq("outlet_id", filterOutlet);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    const fetchOutlets = async () => {
        const { data } = await supabase.from("outlets").select("id, nama_outlet");
        setOutlets(data || []);
    };

    useEffect(() => {
        fetchRequests();
        fetchOutlets();
    }, [filterStatus, filterOutlet]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRequests();
        setRefreshing(false);
    };

    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const openActionModal = (request: ReimburseRequest) => {
        setSelectedRequest(request);
        setCatatan("");
        setActionModal(true);
    };

    const { session } = useAuthStore();

    const handleApprove = async () => {
        if (!selectedRequest || !session?.user) return;

        try {
            // 1. Update Reimbursement Status
            const { error } = await supabase
                .from("reimbursements")
                .update({
                    status: "Approved",
                    notes: catatan,
                    approved_at: new Date().toISOString(),
                    approved_by: session.user.id
                })
                .eq("id", selectedRequest.id);

            if (error) throw error;

            // 2. Update Transactions Status
            await supabase
                .from("transactions")
                .update({ status_reimburse: "Disetujui" })
                .eq("reimburse_id", selectedRequest.id);

            // 3. Auto-Add to Kas Masuk (Increase Balance)
            const { error: kasError } = await supabase
                .from("kas_masuk")
                .insert({
                    outlet_id: selectedRequest.outlet_id,
                    user_id: selectedRequest.user_id, // The user who requested (Kasir)
                    reimburse_id: selectedRequest.id,
                    tanggal: new Date().toISOString().split('T')[0], // Back to Today (Approval Date)
                    jumlah: selectedRequest.total_amount,
                    keterangan: "Dana Reimburse Disetujui"
                });

            if (kasError) {
                console.error("Failed to auto-add balance:", kasError);
                showModal("Warning", "Status update sukses, tapi gagal update saldo otomatis.", "warning");
            }

            showModal("Sukses", "Request disetujui & Saldo otomatis bertambah!", "success");
            setActionModal(false);
            fetchRequests();
        } catch (error: any) {
            showModal("Error", error.message, "error");
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;

        try {
            const { error } = await supabase
                .from("reimbursements")
                .update({
                    status: "Rejected",
                    notes: catatan,
                })
                .eq("id", selectedRequest.id);

            if (error) throw error;

            // Update transactions back to Tercatat
            await supabase
                .from("transactions")
                .update({ status_reimburse: "Tercatat", reimburse_id: null })
                .eq("reimburse_id", selectedRequest.id);

            showModal("Sukses", "Request ditolak", "success");
            setActionModal(false);
            fetchRequests();
        } catch (error: any) {
            showModal("Error", error.message, "error");
        }
    };

    return (
        <AdminLayout
            title="✅ Approval"
            subtitle="Kelola pengajuan reimburse"
            showBackButton={true}
        >
            <View style={styles.modalCard}>
                {/* Filters */}
                <View style={styles.filterBar}>
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            filterStatus === "Pending" && styles.filterChipActive,
                        ]}
                        onPress={() => setFilterStatus("Pending")}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                filterStatus === "Pending" && styles.filterChipTextActive,
                            ]}
                        >
                            Pending
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            filterStatus === "Disetujui" && styles.filterChipActive,
                        ]}
                        onPress={() => setFilterStatus("Disetujui")}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                filterStatus === "Disetujui" && styles.filterChipTextActive,
                            ]}
                        >
                            Disetujui
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            filterStatus === "Ditolak" && styles.filterChipActive,
                        ]}
                        onPress={() => setFilterStatus("Ditolak")}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                filterStatus === "Ditolak" && styles.filterChipTextActive,
                            ]}
                        >
                            Ditolak
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchRequests}>
                        <Text>🔄</Text>
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
                            <Text style={styles.emptyText}>Tidak ada pengajuan</Text>
                        </View>
                    ) : (
                        requests.map((req) => (
                            <View key={req.id} style={styles.requestCard}>
                                <View style={styles.requestHeader}>
                                    <Text style={styles.requestOutlet}>
                                        {req.outlets?.nama_outlet || "Outlet"}
                                    </Text>
                                    <Text style={styles.requestId}>ID: {req.id.slice(0, 8)}</Text>
                                </View>
                                <Text style={styles.requestAmount}>
                                    {formatCurrency(req.total_amount)}
                                </Text>
                                <Text style={styles.requestDate}>
                                    {formatDate(req.start_date)} - {formatDate(req.end_date)}
                                </Text>

                                {filterStatus === "Pending" && (
                                    <View style={styles.requestActions}>
                                        <TouchableOpacity
                                            style={styles.approveBtn}
                                            onPress={() => openActionModal(req)}
                                        >
                                            <Text style={styles.approveBtnText}>✅ Setujui</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.rejectBtn}
                                            onPress={() => openActionModal(req)}
                                        >
                                            <Text style={styles.rejectBtnText}>❌ Tolak</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))
                    )}
                </ScrollView>

            </View>

            {/* Action Modal */}
            <Modal visible={actionModal} animationType="fade" transparent>
                <View style={styles.actionModalOverlay}>
                    <View style={styles.actionModalCard}>
                        <Text style={styles.actionModalTitle}>Proses Request</Text>
                        <Text style={styles.actionModalAmount}>
                            {selectedRequest && formatCurrency(selectedRequest.total_amount)}
                        </Text>
                        <TextInput
                            style={styles.catatanInput}
                            placeholder="Catatan (opsional)"
                            value={catatan}
                            onChangeText={setCatatan}
                            multiline
                        />
                        <View style={styles.actionModalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setActionModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalRejectBtn}
                                onPress={handleReject}
                            >
                                <Text style={styles.modalRejectText}>Tolak</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalApproveBtn}
                                onPress={handleApprove}
                            >
                                <Text style={styles.modalApproveText}>Setujui</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Message Modal */}
            <MessageModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={() => setModalVisible(false)}
            />
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f0f4d0" },
    modalCard: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        margin: 16,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.4)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    modalTitle: { fontSize: 20, fontWeight: "800" },
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
    // Filters
    filterBar: {
        flexDirection: "row",
        padding: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: "#f3f4f6",
    },
    filterChipActive: { backgroundColor: "#DC2626" },
    filterChipText: { fontSize: 12, fontWeight: "600", color: "#666" },
    filterChipTextActive: { color: "white" },
    refreshBtn: {
        marginLeft: "auto",
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    // Content
    modalContent: { flex: 1, padding: 16 },
    emptyState: { alignItems: "center", paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 14, color: "#999" },
    // Request Card
    requestCard: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
    },
    requestHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    requestOutlet: { fontSize: 15, fontWeight: "800" },
    requestId: { fontSize: 11, color: "#999" },
    requestAmount: {
        fontSize: 22,
        fontWeight: "900",
        color: "#1d4ed8",
        marginBottom: 4,
    },
    requestDate: { fontSize: 12, color: "#666", marginBottom: 12 },
    requestActions: { flexDirection: "row", gap: 10 },
    approveBtn: {
        flex: 1,
        backgroundColor: "#22c55e",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    approveBtnText: { color: "white", fontWeight: "700", fontSize: 13 },
    rejectBtn: {
        flex: 1,
        backgroundColor: "#fee2e2",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    rejectBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 13 },
    // Footer
    modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
    btnSecondary: {
        backgroundColor: "#f1f5f9",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    btnSecondaryText: { fontSize: 15, fontWeight: "700", color: "#64748b" },
    // Action Modal
    actionModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        padding: 20,
    },
    actionModalCard: {
        backgroundColor: "white",
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
    },
    actionModalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
    actionModalAmount: {
        fontSize: 28,
        fontWeight: "900",
        color: "#1d4ed8",
        marginBottom: 16,
    },
    catatanInput: {
        width: "100%",
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: "top",
        marginBottom: 16,
    },
    actionModalButtons: { flexDirection: "row", gap: 8, width: "100%" },
    modalCancelBtn: {
        flex: 1,
        backgroundColor: "#f1f5f9",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    modalCancelText: { fontWeight: "700", color: "#64748b" },
    modalRejectBtn: {
        flex: 1,
        backgroundColor: "#dc2626",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    modalRejectText: { fontWeight: "700", color: "white" },
    modalApproveBtn: {
        flex: 1,
        backgroundColor: "#22c55e",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    modalApproveText: { fontWeight: "700", color: "white" },
});
