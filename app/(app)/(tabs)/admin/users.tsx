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
import AdminGlassCard from "../../../../components/admin/AdminGlassCard";
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

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

            {/* Search & Add */}
            <View style={styles.toolbar}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="SEARCH TEAM MEMBERS..."
                        placeholderTextColor="#475569"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
                    <LinearGradient
                        colors={['#FF3131', '#D00000']}
                        style={styles.addGradient}
                    >
                        <Ionicons name="person-add" size={18} color="white" />
                        <Text style={styles.addBtnText}>NEW USER</Text>
                    </LinearGradient>
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
                {filteredUsers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.05)" />
                        <Text style={styles.emptyText}>UNABLE TO LOCATE USERS</Text>
                    </View>
                ) : (
                    filteredUsers.map((user) => (
                        <AdminGlassCard key={user.id} style={styles.userCard}>
                            <View style={[
                                styles.userAvatar,
                                { backgroundColor: user.role === 'Admin' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)' }
                            ]}>
                                <Text style={[
                                    styles.userAvatarText,
                                    { color: user.role === 'Admin' ? '#3B82F6' : '#94A3B8' }
                                ]}>
                                    {user.nama?.charAt(0).toUpperCase() || "U"}
                                </Text>
                            </View>
                            <View style={styles.userInfo}>
                                <Text style={styles.userName}>{user.nama.toUpperCase()}</Text>
                                <Text style={styles.userUsername}>@{user.username.toLowerCase()}</Text>
                                <View style={styles.userMeta}>
                                    <View
                                        style={[
                                            styles.roleBadge,
                                            user.role?.toLowerCase() === "admin" ? styles.roleBadgeAdmin : styles.roleBadgeKasir,
                                        ]}
                                    >
                                        <Text style={styles.roleText}>
                                            {user.role ? user.role.toUpperCase() : "STAFF"}
                                        </Text>
                                    </View>
                                    <View style={styles.outletInfo}>
                                        <Ionicons name="business" size={10} color="#475569" />
                                        <Text style={styles.userOutlet}>
                                            {user.role === 'Admin' ? "GLOBAL ACCESS" : (user.outlets?.nama_outlet.toUpperCase() || "NO BRANCH")}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.userActions}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => openEditModal(user)}
                                >
                                    <Ionicons name="pencil-outline" size={16} color="#94A3B8" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionBtn, styles.deleteBtn]}
                                    onPress={() => confirmDeleteUser(user)}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#FF4D4D" />
                                </TouchableOpacity>
                            </View>
                        </AdminGlassCard>
                    ))
                )}
            </ScrollView>

            {/* User Form Modal */}
            <Modal visible={modalVisible} animationType="fade" transparent>
                <View style={styles.formModalOverlay}>
                    <View style={styles.formModalCard}>
                        <Text style={styles.formModalTitle}>
                            {editingUser ? "EDIT USER PROFILE" : "ENROLL NEW USER"}
                        </Text>

                        <Text style={styles.inputLabel}>IDENTIFICATION / USERNAME</Text>
                        <TextInput
                            style={[styles.input, editingUser && styles.inputDisabled]}
                            value={formData.username}
                            onChangeText={(v) => setFormData({ ...formData, username: v })}
                            placeholder="username"
                            placeholderTextColor="#475569"
                            autoCapitalize="none"
                            editable={!editingUser}
                        />
                        {editingUser && <Text style={styles.inputHint}>Permanent account identifier</Text>}

                        {!editingUser && (
                            <>
                                <Text style={styles.inputLabel}>SECURE ACCESS PASSWORD</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.password}
                                    onChangeText={(v) => setFormData({ ...formData, password: v })}
                                    placeholder="Enter secure password"
                                    placeholderTextColor="#475569"
                                    secureTextEntry
                                />
                            </>
                        )}

                        <Text style={styles.inputLabel}>FULL LEGAL NAME</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.nama}
                            onChangeText={(v) => setFormData({ ...formData, nama: v })}
                            placeholder="John Doe"
                            placeholderTextColor="#475569"
                        />

                        <Text style={styles.inputLabel}>ORGANIZATIONAL ROLE</Text>
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
                                        styles.roleOptionLabel,
                                        formData.role === "Kasir" && styles.roleOptionLabelActive,
                                    ]}
                                >
                                    CASHIER
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
                                        styles.roleOptionLabel,
                                        formData.role === "Admin" && styles.roleOptionLabelActive,
                                    ]}
                                >
                                    EXECUTIVE
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {formData.role === "Admin" ? (
                            <View style={styles.adminAccessBadge}>
                                <Ionicons name="globe-outline" size={16} color="#10B981" />
                                <Text style={styles.adminAccessText}>
                                    UNRESTRICTED ACCESS GRANTED
                                </Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.inputLabel}>ASSIGNED BRANCH</Text>
                                <View style={styles.outletSelectorWrapper}>
                                    <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled={true}>
                                        {outlets.length === 0 ? (
                                            <Text style={styles.emptyOutletText}>NO BRANCHES DEFINED</Text>
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
                                                        {outlet.nama_outlet.toUpperCase()}
                                                    </Text>
                                                    {formData.outlet_id === outlet.id && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
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
                                <Text style={styles.cancelBtnText}>DISCARD</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={saveUser} disabled={saving}>
                                {saving ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Text style={styles.saveBtnText}>COMMIT CHANGES</Text>
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
    // Toolbar
    toolbar: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 12,
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        paddingHorizontal: 16,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    addBtn: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    addGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 10,
    },
    addBtnText: {
        color: "white",
        fontWeight: "900",
        fontSize: 11,
        letterSpacing: 1,
    },
    // Content
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 16,
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
    },
    // User Card
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    userAvatar: {
        width: 54,
        height: 54,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    userAvatarText: { fontSize: 22, fontWeight: "900" },
    userInfo: { flex: 1 },
    userName: {
        fontSize: 16,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    userUsername: {
        fontSize: 12,
        color: "#64748B",
        fontWeight: '700',
    },
    userMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 6,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    roleBadgeAdmin: { backgroundColor: "rgba(59, 130, 246, 0.15)" },
    roleBadgeKasir: { backgroundColor: "rgba(148, 163, 184, 0.1)" },
    roleText: {
        fontSize: 9,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 1,
    },
    outletInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    userOutlet: {
        fontSize: 10,
        color: "#475569",
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    userActions: {
        flexDirection: "row",
        gap: 8,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    deleteBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.03)',
        borderColor: 'rgba(239, 68, 68, 0.1)',
    },
    // Form Modal
    formModalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        padding: 24,
    },
    formModalCard: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderRadius: 32,
        padding: 32,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 20,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(40px)' } : {}),
    },
    formModalTitle: {
        fontSize: 14,
        fontWeight: "900",
        color: "#FFFFFF",
        marginBottom: 32,
        textAlign: "center",
        letterSpacing: 2,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: "900",
        color: "#475569",
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        marginBottom: 16,
    },
    inputDisabled: {
        opacity: 0.5,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    inputHint: {
        fontSize: 10,
        color: '#475569',
        marginTop: -12,
        marginBottom: 16,
        marginLeft: 4,
        fontWeight: '700',
    },
    roleSelector: { flexDirection: "row", gap: 10, marginBottom: 24 },
    roleOption: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        alignItems: "center",
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    roleOptionActive: {
        backgroundColor: "rgba(255, 49, 49, 0.1)",
        borderColor: '#FF3131',
    },
    roleOptionLabel: {
        fontWeight: "900",
        color: "#475569",
        fontSize: 11,
        letterSpacing: 1,
    },
    roleOptionLabelActive: { color: "#FF3131" },

    adminAccessBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
        gap: 10,
        marginBottom: 24,
    },
    adminAccessText: {
        color: '#10B981',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },

    outletSelectorWrapper: {
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        marginBottom: 24,
        overflow: 'hidden'
    },
    outletOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    outletOptionActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
    },
    outletOptionText: {
        fontWeight: '800',
        color: '#94A3B8',
        fontSize: 12,
        letterSpacing: 0.5,
    },
    outletOptionTextActive: {
        color: '#10B981',
        fontWeight: '900',
    },
    emptyOutletText: {
        padding: 16,
        textAlign: 'center',
        color: '#475569',
        fontSize: 12,
        fontWeight: '700',
    },

    formModalFooter: { flexDirection: "row", gap: 12, marginTop: 12 },
    cancelBtn: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cancelBtnText: {
        fontWeight: "900",
        color: "#94A3B8",
        fontSize: 11,
        letterSpacing: 1,
    },
    saveBtn: {
        flex: 2,
        backgroundColor: "#FF3131",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: 'center',
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: {
        fontWeight: "900",
        color: "white",
        fontSize: 11,
        letterSpacing: 1,
    },
});
