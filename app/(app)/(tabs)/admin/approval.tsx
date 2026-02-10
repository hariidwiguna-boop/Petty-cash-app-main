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
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../../lib/supabase";
import { useAuthStore } from "../../../../stores/authStore";
import MessageModal from "../../../../components/MessageModal";
import AdminLayout from "../../../../components/admin/AdminLayout";
import AdminGlassCard from "../../../../components/admin/AdminGlassCard";
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

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
            <View style={styles.contentWrapper}>
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
                            PENDING
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            filterStatus === "Approved" && styles.filterChipActive,
                        ]}
                        onPress={() => setFilterStatus("Approved")}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                filterStatus === "Approved" && styles.filterChipTextActive,
                            ]}
                        >
                            DONE
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            filterStatus === "Rejected" && styles.filterChipActive,
                        ]}
                        onPress={() => setFilterStatus("Rejected")}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                filterStatus === "Rejected" && styles.filterChipTextActive,
                            ]}
                        >
                            REJECTED
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchRequests}>
                        <Ionicons name="reload" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollArea}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF3131" />
                    }
                >
                    {requests.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="file-tray-outline" size={64} color="rgba(255,255,255,0.05)" />
                            <Text style={styles.emptyText}>No requests found</Text>
                        </View>
                    ) : (
                        requests.map((req) => (
                            <AdminGlassCard key={req.id} style={styles.requestCard}>
                                <View style={styles.requestHeader}>
                                    <View>
                                        <Text style={styles.requestOutlet}>
                                            {req.outlets?.nama_outlet.toUpperCase() || "OUTLET"}
                                        </Text>
                                        <Text style={styles.requestId}>TRANSACTION ID: {req.id.slice(0, 8)}</Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        req.status === 'Approved' ? styles.statusApproved :
                                            req.status === 'Rejected' ? styles.statusRejected : styles.statusPending
                                    ]}>
                                        <Text style={styles.statusText}>{req.status.toUpperCase()}</Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                <View style={styles.priceContainer}>
                                    <Text style={styles.amountLabel}>REIMBURSEMENT VALUE</Text>
                                    <Text style={styles.requestAmount}>
                                        {formatCurrency(req.total_amount)}
                                    </Text>
                                </View>

                                <View style={styles.dateInfo}>
                                    <Ionicons name="calendar-outline" size={12} color="#64748B" />
                                    <Text style={styles.requestDate}>
                                        {formatDate(req.start_date)} — {formatDate(req.end_date)}
                                    </Text>
                                </View>

                                {req.status === "Pending" && (
                                    <View style={styles.requestActions}>
                                        <TouchableOpacity
                                            style={styles.approveBtn}
                                            onPress={() => openActionModal(req)}
                                        >
                                            <LinearGradient
                                                colors={['#10B981', '#059669']}
                                                style={styles.actionGradient}
                                            >
                                                <Ionicons name="checkmark-circle" size={16} color="white" />
                                                <Text style={styles.approveBtnText}>APPROVE</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.rejectBtn}
                                            onPress={() => openActionModal(req)}
                                        >
                                            <View style={styles.rejectInner}>
                                                <Ionicons name="close-circle" size={16} color="#FF4D4D" />
                                                <Text style={styles.rejectBtnText}>REJECT</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </AdminGlassCard>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* Action Modal */}
            <Modal visible={actionModal} animationType="fade" transparent>
                <View style={styles.actionModalOverlay}>
                    <View style={styles.actionModalCard}>
                        <Text style={styles.actionModalTitle}>PROCESS REQUEST</Text>
                        <View style={styles.actionModalPrice}>
                            <Text style={styles.actionModalAmount}>
                                {selectedRequest && formatCurrency(selectedRequest.total_amount)}
                            </Text>
                        </View>

                        <Text style={styles.inputLabel}>REASON / NOTES</Text>
                        <TextInput
                            style={styles.catatanInput}
                            placeholder="Add administrative notes..."
                            placeholderTextColor="#64748B"
                            value={catatan}
                            onChangeText={setCatatan}
                            multiline
                        />

                        <View style={styles.actionModalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setActionModal(false)}
                            >
                                <Text style={styles.modalCancelText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalRejectBtn}
                                onPress={handleReject}
                            >
                                <Text style={styles.modalRejectText}>REJECT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalApproveBtn}
                                onPress={handleApprove}
                            >
                                <Text style={styles.modalApproveText}>APPROVE</Text>
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
    contentWrapper: {
        flex: 1,
    },
    // Filters
    filterBar: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 10,
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
    },
    filterChipActive: {
        backgroundColor: "#FF3131",
        borderColor: "#FF3131",
    },
    filterChipText: {
        fontSize: 10,
        fontWeight: "900",
        color: "#64748B",
        letterSpacing: 1,
    },
    filterChipTextActive: {
        color: "white",
    },
    refreshBtn: {
        marginLeft: "auto",
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
    },
    // Content
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 14,
        color: "#64748B",
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    // Request Card
    requestCard: {
        padding: 20,
        marginBottom: 16,
    },
    requestHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    requestOutlet: {
        fontSize: 15,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 1,
    },
    requestId: {
        fontSize: 10,
        color: "#64748B",
        fontWeight: '700',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    statusText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    statusPending: {
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
    },
    statusApproved: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    statusRejected: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 16,
    },
    priceContainer: {
        marginBottom: 16,
    },
    amountLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 1,
        marginBottom: 4,
    },
    requestAmount: {
        fontSize: 24,
        fontWeight: "900",
        color: "#F8FAFC",
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 24,
    },
    requestDate: {
        fontSize: 11,
        color: "#94A3B8",
        fontWeight: '700',
    },
    requestActions: {
        flexDirection: "row",
        gap: 12,
    },
    approveBtn: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    actionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    approveBtnText: {
        color: "white",
        fontWeight: "900",
        fontSize: 12,
        letterSpacing: 1,
    },
    rejectBtn: {
        flex: 1,
        borderRadius: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    rejectInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 13, // 1 offset for border
        gap: 8,
    },
    rejectBtnText: {
        color: "#FF4D4D",
        fontWeight: "900",
        fontSize: 12,
        letterSpacing: 1,
    },
    // Action Modal
    actionModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        padding: 24,
    },
    actionModalCard: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderRadius: 32,
        padding: 32,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 20,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(40px)' } : {}),
    },
    actionModalTitle: {
        fontSize: 14,
        fontWeight: "900",
        color: '#475569',
        letterSpacing: 2,
        marginBottom: 16,
    },
    actionModalPrice: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    actionModalAmount: {
        fontSize: 32,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 1,
    },
    inputLabel: {
        alignSelf: 'flex-start',
        fontSize: 10,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    catatanInput: {
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 16,
        padding: 16,
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        minHeight: 100,
        textAlignVertical: "top",
        marginBottom: 32,
    },
    actionModalButtons: {
        flexDirection: "row",
        gap: 10,
        width: "100%",
    },
    modalCancelBtn: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    modalCancelText: {
        fontWeight: "900",
        color: "#94A3B8",
        fontSize: 11,
        letterSpacing: 1,
    },
    modalRejectBtn: {
        flex: 1,
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.2)",
    },
    modalRejectText: {
        fontWeight: "900",
        color: "#FF4D4D",
        fontSize: 11,
        letterSpacing: 1,
    },
    modalApproveBtn: {
        flex: 1,
        backgroundColor: "#10B981",
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
    },
    modalApproveText: {
        fontWeight: "900",
        color: "white",
        fontSize: 11,
        letterSpacing: 1,
    },
});
