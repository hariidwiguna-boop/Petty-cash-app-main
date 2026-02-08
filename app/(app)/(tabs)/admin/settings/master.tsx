
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../../../lib/supabase";
import MessageModal from "../../../../../components/MessageModal";

type Tab = "items" | "categories";

import AdminLayout from "../../../../../components/admin/AdminLayout";

// ... imports

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
        <View style={styles.listItem}>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.nama_bahan}</Text>
                <Text style={styles.itemMeta}>Satuan: {item.satuan_default || "-"}</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openForm(item)}><Text>✏️</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id, item.nama_bahan)}><Text>🗑️</Text></TouchableOpacity>
            </View>
        </View>
    );

    const renderCategory = ({ item }: { item: any }) => (
        <View style={styles.listItem}>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.nama_kategori}</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openForm(item)}><Text>✏️</Text></TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id, item.nama_kategori)}><Text>🗑️</Text></TouchableOpacity>
            </View>
        </View>
    );

    return (
        <AdminLayout
            title="📦 Master Data"
            subtitle="Kelola item barang & kategori"
            showBackButton={true}
            scrollable={false}
        >
            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, activeTab === "items" && styles.activeTab]} onPress={() => setActiveTab("items")}>
                    <Text style={[styles.tabText, activeTab === "items" && styles.activeTabText]}>Item Barang</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, activeTab === "categories" && styles.activeTab]} onPress={() => setActiveTab("categories")}>
                    <Text style={[styles.tabText, activeTab === "categories" && styles.activeTabText]}>Kategori</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <View style={styles.toolbar}>
                    <TextInput
                        style={styles.search}
                        placeholder={`Cari ${activeTab === "items" ? "Barang" : "Kategori"}...`}
                        value={search}
                        onChangeText={setSearch}
                    />
                    <TouchableOpacity style={styles.addBtn} onPress={() => openForm()}>
                        <Text style={styles.addBtnText}>+ Tambah</Text>
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <ActivityIndicator style={{ marginTop: 20 }} color="#C94C4C" />
                ) : (
                    <FlatList
                        data={activeTab === "items"
                            ? items.filter(i => i.nama_bahan.toLowerCase().includes(search.toLowerCase()))
                            : categories.filter(c => c.nama_kategori.toLowerCase().includes(search.toLowerCase()))
                        }
                        keyExtractor={i => i.id}
                        renderItem={activeTab === "items" ? renderItem : renderCategory}
                        ListEmptyComponent={<Text style={styles.empty}>Belum ada data</Text>}
                        contentContainerStyle={{ paddingBottom: 80 }}
                    />
                )}
            </View>

            {/* Form Modal */}
            <Modal visible={formVisible} transparent animationType="slide">
                <View style={styles.modalBg}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editData ? "Edit" : "Tambah"} {activeTab === "items" ? "Barang" : "Kategori"}</Text>

                        {activeTab === "items" ? (
                            <>
                                <Text style={styles.label}>Nama Barang</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.nama_bahan}
                                    onChangeText={v => setFormData({ ...formData, nama_bahan: v })}
                                    placeholder="Contoh: Kertas A4"
                                />
                                <Text style={styles.label}>Satuan Default</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.satuan_default}
                                    onChangeText={v => setFormData({ ...formData, satuan_default: v })}
                                    placeholder="Pcs/Pack/Rim"
                                />
                            </>
                        ) : (
                            <>
                                <Text style={styles.label}>Nama Kategori</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.nama_kategori}
                                    onChangeText={v => setFormData({ ...formData, nama_kategori: v })}
                                    placeholder="Contoh: Operasional"
                                />
                            </>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnSec} onPress={() => setFormVisible(false)}><Text>Batal</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.btnPri} onPress={handleSave}><Text style={{ color: "white", fontWeight: "bold" }}>Simpan</Text></TouchableOpacity>
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
    tabs: { flexDirection: "row", backgroundColor: "white", paddingHorizontal: 20 },
    tab: { paddingVertical: 12, marginRight: 24, borderBottomWidth: 2, borderBottomColor: "transparent" },
    activeTab: { borderBottomColor: "#C94C4C" },
    tabText: { fontSize: 15, color: "#666", fontWeight: "600" },
    activeTabText: { color: "#C94C4C" },
    content: { flex: 1, padding: 20 },
    toolbar: { flexDirection: "row", gap: 10, marginBottom: 16 },
    search: { flex: 1, backgroundColor: "white", borderRadius: 10, padding: 10, fontSize: 14 },
    addBtn: { backgroundColor: "#C94C4C", borderRadius: 10, paddingHorizontal: 16, justifyContent: "center" },
    addBtnText: { color: "white", fontWeight: "700" },
    listItem: { backgroundColor: "white", padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: "row", alignItems: "center" },
    itemName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
    itemMeta: { fontSize: 12, color: "#666", marginTop: 4 },
    actions: { flexDirection: "row", gap: 8 },
    actionBtn: { padding: 8, backgroundColor: "#f1f5f9", borderRadius: 8 },
    empty: { textAlign: "center", marginTop: 40, color: "#999" },
    // Modal
    modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
    modalContent: { backgroundColor: "white", borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 16, textAlign: "center" },
    label: { fontSize: 12, fontWeight: "700", marginBottom: 6 },
    input: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12, marginBottom: 16 },
    modalActions: { flexDirection: "row", gap: 10, marginTop: 10 },
    btnSec: { flex: 1, backgroundColor: "#f1f5f9", padding: 14, borderRadius: 10, alignItems: "center" },
    btnPri: { flex: 1, backgroundColor: "#C94C4C", padding: 14, borderRadius: 10, alignItems: "center" }
});
