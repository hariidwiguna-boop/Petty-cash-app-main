import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../../../lib/supabase";
import MessageModal from "../../../../../components/MessageModal";
import AdminLayout from "../../../../../components/admin/AdminLayout";
import AdminGlassCard from "../../../../../components/admin/AdminGlassCard";
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

// Data types
type Tab = "items" | "categories";

export default function MasterDataScreen() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("items");
    const [isLoading, setIsLoading] = useState(false);

    // Data
    const [items, setItems] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    // Modal
    const [formVisible, setFormVisible] = useState(false);
    const [editData, setEditData] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});

    // Message
    const [msgVisible, setMsgVisible] = useState(false);
    const [msgConfig, setMsgConfig] = useState<any>({ title: "", message: "", type: "info" });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === "items") {
                const { data } = await supabase.from("master_items").select("*").order("nama_bahan");
                setItems(data || []);
            } else {
                const { data } = await supabase.from("master_categories").select("*").order("nama_kategori");
                setCategories(data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const table = activeTab === "items" ? "master_items" : "master_categories";

            // Validate
            if (activeTab === "items" && !formData.nama_bahan) throw new Error("Nama barang wajib diisi");
            if (activeTab === "categories" && !formData.nama_kategori) throw new Error("Nama kategori wajib diisi");

            const payload = { ...formData };
            if (editData) {
                // Update
                const { error } = await supabase.from(table).update(payload).eq("id", editData.id);
                if (error) throw error;
                setMsgConfig({ title: "Sukses", message: "Data berhasil diupdate", type: "success" });
            } else {
                // Insert
                const { error } = await supabase.from(table).insert(payload);
                if (error) throw error;
                setMsgConfig({ title: "Sukses", message: "Data berhasil ditambahkan", type: "success" });
            }

            setMsgVisible(true);
            setFormVisible(false);
            fetchData();
        } catch (error: any) {
            setMsgConfig({ title: "Error", message: error.message, type: "error" });
            setMsgVisible(true);
        }
    };

    const handleDelete = (id: string, name: string) => {
        setMsgConfig({
            title: "Hapus Data?",
            message: `Yakin ingin menghapus "${name}"?`,
            type: "confirm",
            onConfirm: async () => {
                const table = activeTab === "items" ? "master_items" : "master_categories";
                await supabase.from(table).delete().eq("id", id);
                fetchData();
                setMsgVisible(false);
            }
        });
        setMsgVisible(true);
    };

    const openForm = (data?: any) => {
        setEditData(data || null);
        if (activeTab === "items") {
            setFormData(data ? { nama_bahan: data.nama_bahan, satuan_default: data.satuan_default } : { nama_bahan: "", satuan_default: "Pcs" });
        } else {
            setFormData(data ? { nama_kategori: data.nama_kategori } : { nama_kategori: "" });
        }
        setFormVisible(true);
    };

    // Renderers
    const renderItem = ({ item }: { item: any }) => (
        <AdminGlassCard style={styles.listItem}>
            <View style={styles.itemIconBg}>
                <Ionicons name="cube-outline" size={20} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.nama_bahan.toUpperCase()}</Text>
                <Text style={styles.itemMeta}>UNIT: {item.satuan_default?.toUpperCase() || "N/A"}</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openForm(item)}>
                    <Ionicons name="pencil-outline" size={16} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id, item.nama_bahan)}>
                    <Ionicons name="trash-outline" size={16} color="#FF4D4D" />
                </TouchableOpacity>
            </View>
        </AdminGlassCard>
    );

    const renderCategory = ({ item }: { item: any }) => (
        <AdminGlassCard style={styles.listItem}>
            <View style={[styles.itemIconBg, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <Ionicons name="grid-outline" size={20} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.nama_kategori.toUpperCase()}</Text>
                <Text style={styles.itemMeta}>SYSTEM CATEGORY</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openForm(item)}>
                    <Ionicons name="pencil-outline" size={16} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id, item.nama_kategori)}>
                    <Ionicons name="trash-outline" size={16} color="#FF4D4D" />
                </TouchableOpacity>
            </View>
        </AdminGlassCard>
    );

    return (
        <AdminLayout
            title="📦 Master Data"
            subtitle="Kelola item barang & kategori"
            showBackButton={true}
            scrollable={false}
        >
            {/* Tabs */}
            <View style={styles.tabSection}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "items" && styles.activeTab]}
                        onPress={() => setActiveTab("items")}
                    >
                        <Ionicons name="cube" size={14} color={activeTab === "items" ? "#FFFFFF" : "#475569"} />
                        <Text style={[styles.tabText, activeTab === "items" && styles.activeTabText]}>INVENTORY</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === "categories" && styles.activeTab]}
                        onPress={() => setActiveTab("categories")}
                    >
                        <Ionicons name="grid" size={14} color={activeTab === "categories" ? "#FFFFFF" : "#475569"} />
                        <Text style={[styles.tabText, activeTab === "categories" && styles.activeTabText]}>CATEGORIES</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.toolbar}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
                        <TextInput
                            style={styles.search}
                            placeholderTextColor="#475569"
                            placeholder={`SEARCH ${activeTab === "items" ? "CATALOG" : "CATEGORIES"}...`}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                    <TouchableOpacity style={styles.addBtn} onPress={() => openForm()}>
                        <LinearGradient
                            colors={['#FF3131', '#D00000']}
                            style={styles.addGradient}
                        >
                            <Ionicons name="add" size={20} color="white" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#FF3131" />
                        <Text style={styles.loadingText}>SYNCING CATALOGUE...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={activeTab === "items"
                            ? items.filter(i => i.nama_bahan.toLowerCase().includes(search.toLowerCase()))
                            : categories.filter(c => c.nama_kategori.toLowerCase().includes(search.toLowerCase()))
                        }
                        keyExtractor={i => i.id}
                        renderItem={activeTab === "items" ? renderItem : renderCategory}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Ionicons name="layers-outline" size={48} color="rgba(255,255,255,0.05)" />
                                <Text style={styles.empty}>NO DATA FOUND</Text>
                            </View>
                        }
                        contentContainerStyle={{ paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Form Modal */}
            <Modal visible={formVisible} transparent animationType="fade">
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editData ? "EDIT" : "ENROLL"} {activeTab === "items" ? "PRODUCT" : "CATEGORY"}
                        </Text>

                        {activeTab === "items" ? (
                            <>
                                <Text style={styles.inputLabel}>PRODUCT DESIGNATION</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.nama_bahan}
                                    onChangeText={v => setFormData({ ...formData, nama_bahan: v })}
                                    placeholder="e.g. Office Supplies"
                                    placeholderTextColor="#475569"
                                />
                                <Text style={styles.inputLabel}>STANDARD UNIT OF MEASURE</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.satuan_default}
                                    onChangeText={v => setFormData({ ...formData, satuan_default: v })}
                                    placeholder="Pcs/Pack/Rim"
                                    placeholderTextColor="#475569"
                                />
                            </>
                        ) : (
                            <>
                                <Text style={styles.inputLabel}>CATEGORY NOMENCLATURE</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.nama_kategori}
                                    onChangeText={v => setFormData({ ...formData, nama_kategori: v })}
                                    placeholder="e.g. Operational Expenses"
                                    placeholderTextColor="#475569"
                                />
                            </>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnSec} onPress={() => setFormVisible(false)}>
                                <Text style={styles.btnSecText}>DISCARD</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnPri} onPress={handleSave}>
                                <Text style={styles.btnPriText}>COMMIT</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <MessageModal
                visible={msgVisible}
                title={msgConfig.title}
                message={msgConfig.message}
                type={msgConfig.type}
                onClose={() => setMsgVisible(false)}
                onConfirm={() => {
                    if (msgConfig.onConfirm) msgConfig.onConfirm();
                }}
            />
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    tabSection: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderRadius: 16,
        padding: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    activeTab: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    tabText: { fontSize: 10, color: "#475569", fontWeight: "900", letterSpacing: 1 },
    activeTabText: { color: "#FFFFFF" },
    content: { flex: 1, paddingHorizontal: 20 },
    toolbar: { flexDirection: "row", gap: 12, marginBottom: 24, alignItems: 'center' },
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
    searchIcon: { marginRight: 10 },
    search: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    addBtn: { borderRadius: 12, overflow: 'hidden' },
    addGradient: {
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        marginBottom: 12,
    },
    itemIconBg: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    itemName: {
        fontSize: 13,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 0.5,
    },
    itemMeta: {
        fontSize: 10,
        color: "#475569",
        marginTop: 4,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    actions: { flexDirection: "row", gap: 8 },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    deleteBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.03)',
        borderColor: 'rgba(239, 68, 68, 0.1)',
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 2,
    },
    emptyState: {
        paddingVertical: 100,
        alignItems: 'center',
        gap: 16,
    },
    empty: {
        textAlign: "center",
        fontSize: 12,
        color: "#475569",
        fontWeight: '900',
        letterSpacing: 1,
    },
    // Modal
    modalBg: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        padding: 24
    },
    modalContent: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderRadius: 32,
        padding: 32,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(40px)' } : {}),
    },
    modalTitle: {
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
        color: '#FFFFFF',
        fontWeight: '600',
        marginBottom: 20
    },
    modalActions: { flexDirection: "row", gap: 12, marginTop: 12 },
    btnSec: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    btnSecText: { fontWeight: "900", color: "#94A3B8", fontSize: 11, letterSpacing: 1 },
    btnPri: {
        flex: 1,
        backgroundColor: "#FF3131",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: 'center',
    },
    btnPriText: { color: "white", fontWeight: "900", fontSize: 11, letterSpacing: 1 },
});
