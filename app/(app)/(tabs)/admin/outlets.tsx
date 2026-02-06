import React, { useEffect, useState } from "react";
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
    ActivityIndicator,
    Platform,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import MessageModal from "../../../../components/MessageModal";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../../lib/supabase";

interface Outlet {
    id: string;
    nama_outlet: string;
    pic_name?: string;
    saldo_awal: number;
    saldo_limit: number;
    nama_bank?: string;
    no_rekening?: string;
    atas_nama?: string;
    saldo_date?: string;
}

export default function OutletsScreen() {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [search, setSearch] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
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
        nama_outlet: "",
        pic_name: "",
        saldo_awal: "",
        saldo_date: new Date().toISOString().split('T')[0], // Default today
        saldo_limit: "",
        nama_bank: "",
        no_rekening: "",
        atas_nama: "",
    });

    // Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);

    const fetchOutlets = async () => {
        console.log("[FETCH] Fetching outlets via REST...");

        try {
            // ⚠️ Hardcoded key temporarily for debugging
            const SUPABASE_URL = 'https://bwsjkoyjwygrfdnxwcwi.supabase.co';
            const SUPABASE_KEY = (supabase as any).supabaseKey;

            const response = await fetch(`${SUPABASE_URL}/rest/v1/outlets?select=*&order=nama_outlet.asc`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Status: ${response.status} ${text}`);
            }

            const data = await response.json();
            console.log("[FETCH] Got", data?.length, "outlets");
            setOutlets(data || []);
        } catch (error) {
            console.error("[FETCH ERROR]", error);
            // Fallback to client if REST fails
            const { data, error: sbError } = await supabase.from("outlets").select("*").order("nama_outlet");
            if (sbError) {
                showMessage("Error", "Gagal memuat data: " + sbError.message, "error");
            } else {
                setOutlets(data || []);
            }
        }
    };

    useEffect(() => { fetchOutlets(); }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOutlets();
        setRefreshing(false);
    };

    const formatCurrency = (a: number) => "Rp " + a.toLocaleString("id-ID");

    const openAddModal = () => {
        console.log("[MODAL] Opening add modal");
        setEditingOutlet(null);
        setFormData({
            nama_outlet: "",
            pic_name: "",
            saldo_awal: "",
            saldo_date: new Date().toISOString().split('T')[0],
            saldo_limit: "",
            nama_bank: "",
            no_rekening: "",
            atas_nama: ""
        });
        setModalVisible(true);
    };

    const openEditModal = (o: Outlet) => {
        console.log("[MODAL] Opening edit modal for:", o.nama_outlet);
        setEditingOutlet(o);
        setFormData({
            nama_outlet: o.nama_outlet,
            pic_name: o.pic_name || "",
            saldo_awal: String(o.saldo_awal || ""),
            saldo_date: o.saldo_date || new Date().toISOString().split('T')[0],
            saldo_limit: String(o.saldo_limit || ""),
            nama_bank: o.nama_bank || "",
            no_rekening: o.no_rekening || "",
            atas_nama: o.atas_nama || "",
        });
        setModalVisible(true);
    };

    const saveOutlet = async () => {
        console.log("[SAVE] using Direct Fetch API");

        if (!formData.nama_outlet.trim()) {
            showMessage("Error", "Nama outlet harus diisi", "error");
            return;
        }

        setSaving(true);

        // Fix: Ensure numbers are actually numbers, default to 0
        const safeSaldoAwal = formData.saldo_awal ? parseFloat(formData.saldo_awal.replace(/[^0-9.-]+/g, "")) : 0;
        const safeSaldoLimit = formData.saldo_limit ? parseFloat(formData.saldo_limit.replace(/[^0-9.-]+/g, "")) : 200000;

        const outletData: any = {
            nama_outlet: formData.nama_outlet.trim(),
            saldo_awal: isNaN(safeSaldoAwal) ? 0 : safeSaldoAwal,
            saldo_date: formData.saldo_date,
            saldo_limit: isNaN(safeSaldoLimit) ? 200000 : safeSaldoLimit,
            is_active: true
        };

        if (formData.pic_name) outletData.pic_name = formData.pic_name.trim();
        if (formData.nama_bank) outletData.nama_bank = formData.nama_bank.trim();
        if (formData.no_rekening) outletData.no_rekening = formData.no_rekening.trim();
        if (formData.atas_nama) outletData.atas_nama = formData.atas_nama.trim();

        // ⚠️ Hardcoded key temporarily for debugging connection
        const SUPABASE_URL = 'https://bwsjkoyjwygrfdnxwcwi.supabase.co';
        const SUPABASE_KEY = (supabase as any).supabaseKey; // Access internal key

        const headers: any = {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };

        const url = `${SUPABASE_URL}/rest/v1/outlets${editingOutlet ? `?id=eq.${editingOutlet.id}` : ''}`;
        const method = editingOutlet ? 'PATCH' : 'POST';

        // Remove ID from body if PATCH
        if (editingOutlet) delete outletData.id;

        console.log(`[SAVE] Fetch ${method} ${url}`, outletData);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(outletData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const text = await response.text();
            console.log("[SAVE] Response:", response.status, text);

            if (!response.ok) {
                showMessage("Error API", `Status: ${response.status}\n${text}`, "error");
            } else {
                showMessage("Sukses", editingOutlet ? "Outlet diupdate!" : "Outlet ditambahkan!", "success");
                setModalVisible(false);
                fetchOutlets();
            }
        } catch (err: any) {
            console.error("[SAVE EXCEPTION]", err);
            showMessage("Error Koneksi", err.name === 'AbortError' ? "Request Timeout (10s)" : err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [outletToDelete, setOutletToDelete] = useState<Outlet | null>(null);

    // ... (existing code)

    const confirmDeleteOutlet = (o: Outlet) => {
        console.log("[DELETE] Request delete for:", o.nama_outlet);
        setOutletToDelete(o);
        showMessage(
            "Hapus Outlet?",
            `Yakin ingin menghapus "${o.nama_outlet}"? Data tidak bisa dikembalikan.`,
            "confirm",
            () => executeDelete(o) // Pass the outlet to delete
        );
    };

    const executeDelete = async (outlet: Outlet) => {
        if (!outlet) return;

        console.log("[DELETE] Deleting via REST...", outlet.nama_outlet);
        setSaving(true); // Reuse saving state for loading indicator

        // ⚠️ Hardcoded key temporarily for debugging connection
        const SUPABASE_URL = 'https://bwsjkoyjwygrfdnxwcwi.supabase.co';
        const SUPABASE_KEY = (supabase as any).supabaseKey; // Access internal key



        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/outlets?id=eq.${outlet.id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            if (response.ok) {
                console.log("[DELETE] Success!");
                setOutletToDelete(null);

                // Show success feedback
                showMessage("Berhasil", "Outlet berhasil dihapus", "success");

                fetchOutlets();
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
        <SafeAreaView style={s.c} edges={["top"]}>
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


            <View style={s.card}>
                <View style={s.hdr}>
                    <Text style={s.t}>🏪 Outlets</Text>
                    <TouchableOpacity style={s.x} onPress={() => router.back()}>
                        <Text style={s.xT}>✕</Text>
                    </TouchableOpacity>
                </View>
                <View style={s.tb}>
                    <TextInput style={s.si} placeholder="Cari..." value={search} onChangeText={setSearch} />
                    <TouchableOpacity style={s.add} onPress={openAddModal}>
                        <Text style={s.addT}>➕ Tambah</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView style={s.sc} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                    {outlets.length === 0 ? (
                        <View style={s.emptyBox}>
                            <Text style={s.emptyIcon}>🏪</Text>
                            <Text style={s.emptyText}>Belum ada outlet</Text>
                            <Text style={s.emptyHint}>Klik "Tambah" untuk menambahkan outlet</Text>
                        </View>
                    ) : (
                        outlets.filter(o => o.nama_outlet.toLowerCase().includes(search.toLowerCase())).map(o => (
                            <View key={o.id} style={s.oc}>
                                <View style={s.oH}>
                                    <Text style={s.oN}>{o.nama_outlet}</Text>
                                    <View style={s.oA}>
                                        <TouchableOpacity style={s.iconBtn} onPress={() => openEditModal(o)}>
                                            <Text>✏️</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={s.iconBtn} onPress={() => confirmDeleteOutlet(o)}>
                                            <Text>🗑️</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={s.oS}>
                                    <Text style={s.oL}>Saldo: {formatCurrency(o.saldo_awal)}</Text>
                                    <Text style={s.oL}>Limit: {formatCurrency(o.saldo_limit)}</Text>
                                </View>
                                {o.nama_bank && <Text style={s.bk}>🏦 {o.nama_bank} - {o.no_rekening}</Text>}
                            </View>
                        ))
                    )}
                </ScrollView>
                <View style={s.ft}>
                    <TouchableOpacity style={s.btn} onPress={() => router.back()}>
                        <Text style={s.btnT}>← Kembali</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modal Form */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={s.mo}>
                    <View style={s.mc}>
                        <Text style={s.mt}>{editingOutlet ? "✏️ Edit" : "➕ Tambah"} Outlet</Text>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
                            <Text style={s.label}>Nama Outlet *</Text>
                            <TextInput
                                style={s.inp}
                                placeholder="contoh: MBK Cibubur"
                                value={formData.nama_outlet}
                                onChangeText={v => setFormData({ ...formData, nama_outlet: v })}
                            />

                            <Text style={s.label}>Nama PIC</Text>
                            <TextInput
                                style={s.inp}
                                placeholder="contoh: Budi Santoso"
                                value={formData.pic_name}
                                onChangeText={v => setFormData({ ...formData, pic_name: v })}
                            />

                            <Text style={s.label}>Saldo Awal</Text>
                            <TextInput
                                style={s.inp}
                                placeholder="1000000"
                                keyboardType="numeric"
                                value={formData.saldo_awal}
                                onChangeText={v => setFormData({ ...formData, saldo_awal: v })}
                            />

                            <Text style={s.label}>Tanggal Saldo Awal</Text>
                            {Platform.OS === 'web' ? (
                                // Web: Use native HTML date input
                                <View style={s.inp}>
                                    {React.createElement('input', {
                                        type: 'date',
                                        value: formData.saldo_date || '',
                                        onChange: (e: any) => {
                                            if (e.target.value) {
                                                setFormData({ ...formData, saldo_date: e.target.value });
                                            }
                                        },
                                        style: {
                                            border: 'none',
                                            background: 'transparent',
                                            fontSize: '15px',
                                            color: '#1a1a1a',
                                            width: '100%',
                                            outline: 'none',
                                            fontFamily: 'system-ui',
                                            cursor: 'pointer'
                                        }
                                    })}
                                </View>
                            ) : (
                                // Native: Use TouchableOpacity + DateTimePicker
                                <>
                                    <TouchableOpacity
                                        style={s.inp}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Text>{formData.saldo_date || "Pilih Tanggal"}</Text>
                                    </TouchableOpacity>

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={new Date(formData.saldo_date)}
                                            mode="date"
                                            display="default"
                                            onChange={(event, date) => {
                                                setShowDatePicker(false);
                                                if (date) {
                                                    setFormData({ ...formData, saldo_date: date.toISOString().split('T')[0] });
                                                }
                                            }}
                                        />
                                    )}
                                </>
                            )}

                            <Text style={s.label}>Limit Alert</Text>
                            <TextInput
                                style={s.inp}
                                placeholder="200000"
                                keyboardType="numeric"
                                value={formData.saldo_limit}
                                onChangeText={v => setFormData({ ...formData, saldo_limit: v })}
                            />

                            <Text style={s.label}>Info Bank (opsional)</Text>
                            <TextInput style={s.inp} placeholder="Nama Bank (BCA, Mandiri, dll)" value={formData.nama_bank} onChangeText={v => setFormData({ ...formData, nama_bank: v })} />
                            <TextInput style={s.inp} placeholder="No Rekening" keyboardType="numeric" value={formData.no_rekening} onChangeText={v => setFormData({ ...formData, no_rekening: v })} />
                            <TextInput style={s.inp} placeholder="Atas Nama" value={formData.atas_nama} onChangeText={v => setFormData({ ...formData, atas_nama: v })} />
                        </ScrollView>

                        <View style={s.mf}>
                            <TouchableOpacity
                                style={s.cb}
                                onPress={() => {
                                    console.log("[MODAL] Cancel pressed");
                                    setModalVisible(false);
                                }}
                            >
                                <Text style={s.cbT}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.sb, saving && s.sbDisabled]}
                                onPress={saveOutlet}
                                disabled={saving}
                            >
                                {saving ? (
                                    <View style={s.savingRow}>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text style={s.sbT}> Menyimpan...</Text>
                                    </View>
                                ) : (
                                    <Text style={s.sbT}>💾 Simpan</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    c: { flex: 1, backgroundColor: "#f0f4d0" },
    card: { flex: 1, backgroundColor: "#fff", margin: 16, borderRadius: 20, overflow: "hidden" },
    hdr: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
    t: { fontSize: 20, fontWeight: "800" },
    x: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f1f5f9", alignItems: "center", justifyContent: "center" },
    xT: { fontSize: 16, color: "#64748b" },
    tb: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
    si: { flex: 1, minWidth: 200, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
    add: { backgroundColor: "#C94C4C", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, justifyContent: "center" },
    addT: { color: "#fff", fontWeight: "700", fontSize: 14 },
    sc: { flex: 1, padding: 16 },
    emptyBox: { alignItems: "center", paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, fontWeight: "700", color: "#374151" },
    emptyHint: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
    oc: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 14, padding: 14, marginBottom: 12 },
    oH: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    oN: { fontSize: 16, fontWeight: "800", color: "#1a1a1a" },
    oA: { flexDirection: "row", gap: 8 },
    iconBtn: { padding: 8 },
    oS: { flexDirection: "row", gap: 16 },
    oL: { fontSize: 13, color: "#16a34a", fontWeight: "600" },
    bk: { fontSize: 12, color: "#666", marginTop: 8, backgroundColor: "#f9fafb", padding: 8, borderRadius: 8 },
    ft: { padding: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
    btn: { backgroundColor: "#f1f5f9", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
    btnT: { fontWeight: "700", color: "#64748b", fontSize: 15 },
    // Modal
    mo: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 },
    mc: { backgroundColor: "#fff", borderRadius: 20, padding: 24, maxHeight: "90%" },
    mt: { fontSize: 18, fontWeight: "800", marginBottom: 20, textAlign: "center" },
    label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 4 },
    inp: { backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12, marginBottom: 8, fontSize: 15 },
    mf: { flexDirection: "row", gap: 12, marginTop: 16 },
    cb: { flex: 1, backgroundColor: "#f1f5f9", padding: 14, borderRadius: 12, alignItems: "center" },
    cbT: { fontWeight: "700", color: "#64748b", fontSize: 15 },
    sb: { flex: 1, backgroundColor: "#C94C4C", padding: 14, borderRadius: 12, alignItems: "center" },
    sbDisabled: { backgroundColor: "#e5a3a3" },
    sbT: { fontWeight: "700", color: "#fff", fontSize: 15 },
    savingRow: { flexDirection: "row", alignItems: "center" },
});
