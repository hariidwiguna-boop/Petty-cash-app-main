import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    TextInput,
    Modal,
    StyleSheet,
    Platform,
    ActivityIndicator,
} from "react-native";
import MessageModal from "../../../../components/MessageModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { createClient } from '@supabase/supabase-js';
import { supabase } from "../../../../lib/supabase";
import AdminLayout from "../../../../components/admin/AdminLayout";

interface User {
    id: string;
    username: string;
    nama: string;
    role: string;
    outlet_id?: string;
    outlets?: { nama_outlet: string };
}

export default function UsersScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [outlets, setOutlets] = useState<any[]>([]);

    // Form modal
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [saving, setSaving] = useState(false);

    // Message Modal State
    const [msgModalVisible, setMsgModalVisible] = useState(false);
    const [msgModalConfig, setMsgModalConfig] = useState({
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
        setMsgModalConfig({ title, message, type, onConfirm });
        setMsgModalVisible(true);
    };

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        nama: "",
        role: "Kasir",
        outlet_id: "",
    });

    // Delete Modal State -> Replaced by MessageModal
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const openAddModal = () => {
        setEditingUser(null);
        setFormData({ username: "", password: "", nama: "", role: "Kasir", outlet_id: "" });
        setModalVisible(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: "",
            nama: user.nama,
            role: user.role,
            outlet_id: user.outlet_id || "",
        });
        setModalVisible(true);
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("*, outlets(nama_outlet)")
                .order("nama");

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Fetch users error:", error);
        }
    };

    const fetchOutlets = async () => {
        const { data } = await supabase.from("outlets").select("id, nama_outlet");
        setOutlets(data || []);
    };

    useEffect(() => {
        fetchUsers();
        fetchOutlets();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsers();
        setRefreshing(false);
    };

    const filteredUsers = users.filter(
        (u) =>
            u.nama?.toLowerCase().includes(search.toLowerCase()) ||
            u.username?.toLowerCase().includes(search.toLowerCase())
    );

    // ⚠️ Hardcoded for now to match your existing debugging setup
    const SUPABASE_URL = 'https://bwsjkoyjwygrfdnxwcwi.supabase.co';

    const saveUser = async () => {
        if (!formData.username || !formData.nama) {
            showMessage("Error", "Username dan nama harus diisi", "error");
            return;
        }

        setSaving(true);
        console.log("[SAVE] User - Process Started");

        const SUPABASE_KEY = (supabase as any).supabaseKey;

        let userId = editingUser?.id;

        try {
            // 1. If Adding New User -> Create in Supabase Auth first
            if (!editingUser) {
                if (!formData.password) {
                    showMessage("Error", "Password wajib diisi untuk user baru", "error");
                    setSaving(false);
                    return;
                }

                console.log("[SAVE] Creating Auth User...");

                // Create a temporary client to avoid logging out the current admin
                // Create a temporary client to avoid logging out the current admin
                // We use a dummy email because Supabase Auth requires email. Domain must be valid TLD (e.g. .com)
                const cleanUsername = formData.username.toLowerCase().replace(/\s+/g, '');
                const dummyEmail = `${cleanUsername}@pettycash.com`;
                const tempSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
                    auth: {
                        persistSession: false, // Critical: Don't store this session
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                });

                const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                    email: dummyEmail,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.nama,
                            role: formData.role
                        }
                    }
                });

                if (authError) {
                    throw new Error(`Auth Error: ${authError.message}`);
                }

                if (!authData.user?.id) {
                    throw new Error("Gagal mendapatkan User ID dari Auth");
                }

                userId = authData.user.id;
                console.log("[SAVE] Auth User Created. ID:", userId);
            }

            // 2. Prepare Profile Data
            const userData: any = {
                id: userId, // Link to Auth ID
                username: formData.username,
                nama: formData.nama,
                role: formData.role, // Fix: Must be 'Admin' or 'Kasir' exactly (from schema)
                outlet_id: formData.outlet_id || null,
            };

            console.log("[SAVE] Saving Profile via Direct Fetch API...");

            const headers: any = {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            };

            const url = `${SUPABASE_URL}/rest/v1/profiles${editingUser ? `?id=eq.${editingUser.id}` : ''}`;
            const method = editingUser ? 'PATCH' : 'POST';

            // Remove ID from body if PATCH (update) to strictly avoid changing PK
            if (editingUser) delete userData.id;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(userData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const text = await response.text();
            console.log("[SAVE] Response:", response.status, text);

            if (!response.ok) {
                // If Profile insert fails but Auth was created, we might have an orphaned Auth user.
                // ideally we should cleanup, but for now just show error.
                showMessage("Error API", `Status: ${response.status}\n${text}`, "error");
            } else {
                showMessage("Sukses", editingUser ? "User diupdate!" : "User ditambahkan!", "success");
                setModalVisible(false);
                fetchUsers();
            }

        } catch (err: any) {
            console.error("[SAVE EXCEPTION]", err);
            showMessage("Error", err.message || "Terjadi kesalahan sistem", "error");
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteUser = (user: User) => {
        setUserToDelete(user);
        showMessage(
            "Hapus User?",
            `Yakin ingin menghapus user "${user.nama}"?`,
            "confirm",
            () => executeDeleteUser(user)
        );
    };

    const executeDeleteUser = async (user_to_delete: User) => {
        if (!user_to_delete) return;

        console.log("[DELETE] Deleting user via REST:", user_to_delete.username);
        setSaving(true);

        const SUPABASE_KEY = (supabase as any).supabaseKey;

        try {
            // Delete from profiles table
            // Note: This does NOT delete from auth.users (requires service role).
            // But it effectively removes them from the app listing.
            const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_to_delete.id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (response.ok) {
                // Show success feedback
                showMessage("Berhasil", "User berhasil dihapus", "success");
                setUserToDelete(null);
                fetchUsers();
            } else {
                const text = await response.text();
                console.error("[DELETE ERROR]", text);
                showMessage("Error", "Gagal hapus: " + text, "error");
            }
        } catch (e: any) {
            console.error("[DELETE EXCEPTION]", e);
            showMessage("Error", "Gagal hapus: " + e.message, "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AdminLayout
            title="👥 Users"
            subtitle="Kelola pengguna"
            showBackButton={true}
        >
            {/* Message Modal */}
            <MessageModal
                visible={msgModalVisible}
                title={msgModalConfig.title}
                message={msgModalConfig.message}
                type={msgModalConfig.type}
                onConfirm={() => {
                    if (msgModalConfig.onConfirm) msgModalConfig.onConfirm();
                    setMsgModalVisible(false);
                }}
                onClose={() => setMsgModalVisible(false)}
            />

            <View style={styles.modalCard}>

                {/* Search & Add */}
                <View style={styles.toolbar}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari user..."
                        value={search}
                        onChangeText={setSearch}
                    />
                    <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
                        <Text style={styles.addBtnText}>➕ Tambah</Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.modalContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {filteredUsers.map((user) => (
                        <View key={user.id} style={styles.userCard}>
                            <View style={styles.userAvatar}>
                                <Text style={styles.userAvatarText}>
                                    {user.nama?.charAt(0).toUpperCase() || "U"}
                                </Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.nama}</Text>
                                <Text style={styles.userUsername}>@{user.username}</Text>
                                <View style={styles.userMeta}>
                                    <View
                                        style={[
                                            styles.roleBadge,
                                            user.role?.toLowerCase() === "admin" && styles.roleBadgeAdmin,
                                        ]}
                                    >
                                        <Text style={styles.roleText}>
                                            {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
                                        </Text>
                                    </View>
                                    <Text style={styles.userOutlet}>
                                        {user.role === 'Admin' ? "🌍 Semua Outlet" : (user.outlets?.nama_outlet || "No outlet")}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.userActions}>
                                <TouchableOpacity
                                    style={styles.editIconBtn}
                                    onPress={() => openEditModal(user)}
                                >
                                    <Text>✏️</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.deleteIconBtn}
                                    onPress={() => confirmDeleteUser(user)}
                                >
                                    <Text>🗑️</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </ScrollView>

            </View>

            {/* User Form Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.formModalOverlay}>
                    <View style={styles.formModalCard}>
                        <Text style={styles.formModalTitle}>
                            {editingUser ? "Edit User" : "Tambah User"}
                        </Text>

                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={[styles.input, editingUser && { backgroundColor: '#e5e7eb', opacity: 0.7 }]}
                            value={formData.username}
                            onChangeText={(v) => setFormData({ ...formData, username: v })}
                            placeholder="username"
                            autoCapitalize="none"
                            editable={!editingUser}
                        />
                        {editingUser && <Text style={{ fontSize: 10, color: '#666', marginBottom: 12, marginTop: -8 }}>Username tidak dapat diubah</Text>}

                        {!editingUser && (
                            <>
                                <Text style={styles.label}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.password}
                                    onChangeText={(v) => setFormData({ ...formData, password: v })}
                                    placeholder="password"
                                    secureTextEntry
                                />
                            </>
                        )}

                        <Text style={styles.label}>Nama Lengkap</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.nama}
                            onChangeText={(v) => setFormData({ ...formData, nama: v })}
                            placeholder="Nama Lengkap"
                        />

                        <Text style={styles.label}>Role</Text>
                        <View style={styles.roleSelector}>
                            <TouchableOpacity
                                style={[
                                    styles.roleOption,
                                    formData.role === "Kasir" && styles.roleOptionActive,
                                ]}
                                onPress={() => setFormData({ ...formData, role: "Kasir" })}
                            >
                                <Text
                                    style={[
                                        styles.roleOptionText,
                                        formData.role === "Kasir" && styles.roleOptionTextActive,
                                    ]}
                                >
                                    Kasir
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.roleOption,
                                    formData.role === "Admin" && styles.roleOptionActive,
                                ]}
                                onPress={() => setFormData({ ...formData, role: "Admin", outlet_id: "" })}
                            >
                                <Text
                                    style={[
                                        styles.roleOptionText,
                                        formData.role === "Admin" && styles.roleOptionTextActive,
                                    ]}
                                >
                                    Admin
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {formData.role === "Admin" ? (
                            <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0fdf4', borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' }}>
                                <Text style={{ color: '#166534', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                                    🌍 Admin memiliki akses ke semua outlet
                                </Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.label}>Outlet</Text>
                                <View style={styles.outletSelectorWrapper}>
                                    <ScrollView style={{ maxHeight: 120 }} nestedScrollEnabled={true}>
                                        {outlets.length === 0 ? (
                                            <Text style={{ color: '#999', fontStyle: 'italic' }}>Belum ada data outlet</Text>
                                        ) : (
                                            outlets.map((outlet) => (
                                                <TouchableOpacity
                                                    key={outlet.id}
                                                    style={[
                                                        styles.outletOption,
                                                        formData.outlet_id === outlet.id && styles.outletOptionActive
                                                    ]}
                                                    onPress={() => setFormData({ ...formData, outlet_id: outlet.id })}
                                                >
                                                    <Text style={[
                                                        styles.outletOptionText,
                                                        formData.outlet_id === outlet.id && styles.outletOptionTextActive
                                                    ]}>
                                                        {outlet.nama_outlet}
                                                    </Text>
                                                    {formData.outlet_id === outlet.id && <Text style={styles.checkmark}>✓</Text>}
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </ScrollView>
                                </View>
                            </>
                        )}

                        <View style={styles.formModalFooter}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={saveUser} disabled={saving}>
                                {saving ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <ActivityIndicator size="small" color="white" />
                                        <Text style={styles.saveBtnText}> Menyimpan...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.saveBtnText}>Simpan</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
    // Toolbar
    toolbar: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        padding: 12,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    searchInput: {
        flex: 1,
        minWidth: 200,
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    addBtn: {
        backgroundColor: "#C94C4C",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    addBtnText: { color: "white", fontWeight: "700", fontSize: 13 },
    // Content
    modalContent: { flex: 1, padding: 16 },
    // User Card
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
    },
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#3b82f6",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    userAvatarText: { color: "white", fontSize: 18, fontWeight: "700" },
    userInfo: { flex: 1 },
    userName: { fontSize: 15, fontWeight: "700" },
    userUsername: { fontSize: 12, color: "#666" },
    userMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    roleBadge: {
        backgroundColor: "#e0f2fe",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    roleBadgeAdmin: { backgroundColor: "#fef3c7" },
    roleText: { fontSize: 10, fontWeight: "600", color: "#0284c7" },
    userOutlet: { fontSize: 11, color: "#999" },
    userActions: { flexDirection: "row", gap: 8 },
    editIconBtn: { padding: 8 },
    deleteIconBtn: { padding: 8 },
    // Footer
    modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
    btnSecondary: {
        backgroundColor: "#f1f5f9",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    btnSecondaryText: { fontSize: 15, fontWeight: "700", color: "#64748b" },
    // Form Modal
    formModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },
    formModalCard: { backgroundColor: "white", borderRadius: 20, padding: 24 },
    formModalTitle: {
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 16,
        textAlign: "center",
    },
    label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
    input: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 12,
    },
    roleSelector: { flexDirection: "row", gap: 8, marginBottom: 16 },
    roleOption: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#f3f4f6",
        alignItems: "center",
    },
    roleOptionActive: { backgroundColor: "#C94C4C" },
    roleOptionText: { fontWeight: "700", color: "#666" },
    roleOptionTextActive: { color: "white" },

    // Outlet Selector
    outletSelectorWrapper: {
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 10,
        backgroundColor: '#f9fafb',
        marginBottom: 16,
        overflow: 'hidden'
    },
    outletOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    outletOptionActive: {
        backgroundColor: '#ecfdf5', // Light green background for active
    },
    outletOptionText: {
        fontWeight: '600',
        color: '#374151',
        fontSize: 14,
    },
    outletOptionTextActive: {
        color: '#059669', // Green text for active
    },
    checkmark: {
        color: '#059669',
        fontWeight: 'bold'
    },

    formModalFooter: { flexDirection: "row", gap: 12, marginTop: 8 },
    cancelBtn: {
        flex: 1,
        backgroundColor: "#f1f5f9",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    cancelBtnText: { fontWeight: "700", color: "#64748b" },
    saveBtn: {
        flex: 1,
        backgroundColor: "#C94C4C",
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    saveBtnDisabled: { backgroundColor: "#e5a3a3" },
    saveBtnText: { fontWeight: "700", color: "white" },
});
