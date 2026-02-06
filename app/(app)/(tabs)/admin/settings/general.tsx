
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../../../../../lib/supabase";
import MessageModal from "../../../../../components/MessageModal";

export default function GeneralSettingsScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Config State
    const [configs, setConfigs] = useState({
        maintenance_mode: "false",
        default_outlet_limit: "200000",
        contact_wa: ""
    });

    // Message Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalInfo, setModalInfo] = useState({ title: "", message: "", type: "info" as any });

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const { data, error } = await supabase.from("app_config").select("*");
            if (error) throw error;

            const newConfigs: any = { ...configs };
            data?.forEach(item => {
                if (newConfigs.hasOwnProperty(item.key)) {
                    newConfigs[item.key] = item.value;
                }
            });
            setConfigs(newConfigs);
        } catch (error: any) {
            console.error("Fetch Config Error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveConfig = async (key: string, value: string) => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("app_config")
                .upsert({ key, value, updated_at: new Date() });

            if (error) throw error;

            // Update local state
            setConfigs(prev => ({ ...prev, [key]: value }));

        } catch (error: any) {
            setModalInfo({ title: "Error", message: error.message, type: "error" });
            setModalVisible(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const upserts = Object.keys(configs).map(key => ({
                key,
                value: configs[key as keyof typeof configs],
                updated_at: new Date()
            }));

            const { error } = await supabase.from("app_config").upsert(upserts);
            if (error) throw error;

            setModalInfo({ title: "Sukses", message: "Pengaturan berhasil disimpan", type: "success" });
            setModalVisible(true);
        } catch (error: any) {
            setModalInfo({ title: "Error", message: error.message, type: "error" });
            setModalVisible(true);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>⚙️ Pengaturan Umum</Text>
            </View>

            {isLoading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#C94C4C" />
                </View>
            ) : (
                <View style={styles.content}>
                    {/* Maintenance Mode */}
                    <View style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>Mode Maintenance</Text>
                                <Text style={styles.cardDesc}>
                                    Matikan akses user ke aplikasi sementara. Admin tetap bisa login.
                                </Text>
                            </View>
                            <Switch
                                trackColor={{ false: "#767577", true: "#C94C4C" }}
                                thumbColor={configs.maintenance_mode === "true" ? "#fff" : "#f4f3f4"}
                                onValueChange={(val) => saveConfig("maintenance_mode", String(val))}
                                value={configs.maintenance_mode === "true"}
                            />
                        </View>
                    </View>

                    {/* Defaults */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Konfigurasi Dasar</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Default Limit Saldo Outlet (Rp)</Text>
                            <TextInput
                                style={styles.input}
                                value={configs.default_outlet_limit}
                                keyboardType="numeric"
                                onChangeText={(v) => setConfigs({ ...configs, default_outlet_limit: v })}
                                onEndEditing={() => saveConfig("default_outlet_limit", configs.default_outlet_limit)}
                            />
                            <Text style={styles.hint}>Nilai otomatis saat membuat outlet baru.</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nomor WhatsApp Gateway</Text>
                            <TextInput
                                style={styles.input}
                                value={configs.contact_wa}
                                placeholder="628123456789"
                                keyboardType="phone-pad"
                                onChangeText={(v) => setConfigs({ ...configs, contact_wa: v })}
                            />
                            <Text style={styles.hint}>Digunakan untuk notifikasi system (Opsional).</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, isSaving && styles.disabledBtn]}
                            onPress={handleSaveAll}
                            disabled={isSaving}
                        >
                            <Text style={styles.saveText}>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <MessageModal
                visible={modalVisible}
                title={modalInfo.title}
                message={modalInfo.message}
                type={modalInfo.type}
                onClose={() => setModalVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f0f4d0" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 20,
        backgroundColor: "white",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        gap: 16
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f1f5f9",
        alignItems: "center",
        justifyContent: "center"
    },
    backText: { fontSize: 18, color: "#64748b" },
    headerTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    content: { padding: 20, gap: 16 },
    card: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb"
    },
    cardRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    cardTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 4 },
    cardDesc: { fontSize: 13, color: "#6b7280" },
    inputGroup: { marginTop: 16 },
    label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
    input: {
        backgroundColor: "#f9fafb",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        padding: 12,
        fontSize: 15
    },
    hint: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
    saveBtn: {
        backgroundColor: "#C94C4C",
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
        marginTop: 20
    },
    disabledBtn: { backgroundColor: "#e5a3a3" },
    saveText: { color: "white", fontWeight: "700" }
});
