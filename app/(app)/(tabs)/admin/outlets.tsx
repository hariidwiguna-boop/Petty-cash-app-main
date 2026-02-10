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
import { formatDateToISO, getTodayISO } from "../../../../lib/dateUtils";
import AdminLayout from "../../../../components/admin/AdminLayout";
import AdminGlassCard from "../../../../components/admin/AdminGlassCard";
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

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
        <AdminLayout
            title="🏪 Outlets"
            subtitle="Kelola data outlet"
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

            <View style={s.tb}>
                <AdminGlassCard style={s.searchBarCard} intensity="light">
                    <Ionicons name="search" size={18} color="#94A3B8" />
                    <TextInput
                        style={s.si}
                        placeholder="Cari outlet..."
                        placeholderTextColor="#64748B"
                        value={search}
                        onChangeText={setSearch}
                    />
                </AdminGlassCard>
                <TouchableOpacity style={s.add} onPress={openAddModal}>
                    <LinearGradient
                        colors={['#FF3131', '#991B1B']}
                        style={s.addGradient}
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={s.addT}>TAMBAH</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={s.sc}
                contentContainerStyle={s.scContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF3131" />
                }
            >
                {outlets.length === 0 ? (
                    <View style={s.emptyBox}>
                        <Ionicons name="business" size={64} color="rgba(255,255,255,0.05)" />
                        <Text style={s.emptyText}>Empty Repository</Text>
                        <Text style={s.emptyHint}>Belum ada outlet terdaftar di sistem.</Text>
                    </View>
                ) : (
                    outlets.filter(o => o.nama_outlet.toLowerCase().includes(search.toLowerCase())).map(o => (
                        <AdminGlassCard key={o.id} style={s.oc}>
                            <View style={s.oH}>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.oN}>{o.nama_outlet.toUpperCase()}</Text>
                                    <Text style={s.picName}>{o.pic_name || 'NO PIC ASSIGNED'}</Text>
                                </View>
                                <View style={s.oA}>
                                    <TouchableOpacity style={s.iconBtn} onPress={() => openEditModal(o)}>
                                        <Ionicons name="pencil" size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={s.iconBtn} onPress={() => confirmDeleteOutlet(o)}>
                                        <Ionicons name="trash" size={18} color="#FF4D4D" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={s.divider} />

                            <View style={s.oS}>
                                <View style={s.statItem}>
                                    <Text style={s.statLabel}>SALDO AWAL</Text>
                                    <Text style={s.oL}>{formatCurrency(o.saldo_awal)}</Text>
                                </View>
                                <View style={s.statItem}>
                                    <Text style={s.statLabel}>LIMIT ALERT</Text>
                                    <Text style={[s.oL, { color: '#F59E0B' }]}>{formatCurrency(o.saldo_limit)}</Text>
                                </View>
                            </View>

                            {o.nama_bank && (
                                <View style={s.bkContainer}>
                                    <Ionicons name="card" size={14} color="#64748B" />
                                    <Text style={s.bk}>{o.nama_bank} • {o.no_rekening}</Text>
                                </View>
                            )}
                        </AdminGlassCard>
                    ))
                )}
            </ScrollView>

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
                                            color: '#FFFFFF',
                                            width: '100%',
                                            outline: 'none',
                                            fontFamily: 'system-ui',
                                            cursor: 'pointer',
                                            fontWeight: '600'
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
                                        <Text style={{ color: '#F1F5F9', fontWeight: '600' }}>
                                            {formData.saldo_date || "Pilih Tanggal"}
                                        </Text>
                                    </TouchableOpacity>

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={new Date(formData.saldo_date)}
                                            mode="date"
                                            display="default"
                                            onChange={(event, date) => {
                                                setShowDatePicker(false);
                                                if (date) {
                                                    setFormData({ ...formData, saldo_date: formatDateToISO(date) });
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

        </AdminLayout>
    );
}

const s = StyleSheet.create({
    tb: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 24,
        gap: 12,
    },
    searchBarCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 4, // Adjusted for internal text input
        borderRadius: 16,
        gap: 12,
    },
    si: {
        flex: 1,
        height: 44,
        color: "#F1F5F9",
        fontSize: 14,
        fontWeight: '600',
    },
    add: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: "#FF3131",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    addGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 6,
    },
    addT: {
        color: "#fff",
        fontWeight: "900",
        fontSize: 12,
        letterSpacing: 1,
    },
    sc: {
        flex: 1,
    },
    scContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    emptyBox: {
        alignItems: "center",
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "900",
        color: "#F8FAFC",
        marginTop: 16,
        letterSpacing: 1,
    },
    emptyHint: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 8,
        fontWeight: '600',
    },
    oc: {
        marginBottom: 16,
        padding: 20,
    },
    oH: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    oN: {
        fontSize: 16,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 1,
    },
    picName: {
        fontSize: 11,
        color: "#94A3B8",
        fontWeight: '700',
        marginTop: 2,
        letterSpacing: 0.5,
    },
    oA: {
        flexDirection: "row",
        gap: 4,
    },
    iconBtn: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 16,
    },
    oS: {
        flexDirection: "row",
        gap: 32,
    },
    statItem: {
        flex: 1,
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 1,
        marginBottom: 4,
    },
    oL: {
        fontSize: 15,
        color: "#4ADE80",
        fontWeight: "800",
    },
    bkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
    },
    bk: {
        fontSize: 11,
        color: "#94A3B8",
        fontWeight: '700',
    },
    // Modal
    mo: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.85)",
        justifyContent: "center",
        padding: 24,
    },
    mc: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderRadius: 32,
        padding: 32,
        maxHeight: "90%",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 20,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(40px)' } : {}),
    },
    mt: {
        fontSize: 20,
        fontWeight: "900",
        color: "#FFFFFF",
        marginBottom: 24,
        textAlign: "center",
        letterSpacing: 1,
    },
    label: {
        fontSize: 10,
        fontWeight: "900",
        color: "#475569",
        marginBottom: 8,
        marginTop: 12,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    inp: {
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        color: "#FFFFFF",
        fontWeight: '600',
    },
    mf: {
        flexDirection: "row",
        gap: 12,
        marginTop: 32,
    },
    cb: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    cbT: {
        fontWeight: "900",
        color: "#F8FAFC",
        fontSize: 14,
        letterSpacing: 1,
    },
    sb: {
        flex: 1,
        backgroundColor: "#FF3131",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    sbDisabled: {
        backgroundColor: "rgba(255, 49, 49, 0.5)",
    },
    sbT: {
        fontWeight: "900",
        color: "#fff",
        fontSize: 14,
        letterSpacing: 1,
    },
    savingRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
});
