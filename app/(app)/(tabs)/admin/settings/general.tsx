import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../../../../lib/supabase";
import MessageModal from "../../../../../components/MessageModal";
import AdminLayout from "../../../../../components/admin/AdminLayout";
import AdminGlassCard from "../../../../../components/admin/AdminGlassCard";
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

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
        <AdminLayout
            title="⚙️ Pengaturan Umum"
            subtitle="Limit saldo, aplikasi, dll"
            showBackButton={true}
        >
            {isLoading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#FF3131" />
                    <Text style={[styles.loadingText, { marginTop: 16 }]}>ACCESSING SYSTEM CONFIG...</Text>
                </View>
            ) : (
                <View style={styles.content}>
                    {/* Maintenance Mode */}
                    <AdminGlassCard style={styles.card}>
                        <View style={styles.cardRow}>
                            <View style={styles.iconBg}>
                                <Ionicons name="construct-outline" size={20} color="#FF3131" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>MAINTENANCE OVERRIDE</Text>
                                <Text style={styles.cardDesc}>
                                    Suspend user access for systemic upgrades. Executive bypass remains active.
                                </Text>
                            </View>
                            <Switch
                                trackColor={{ false: "rgba(255,255,255,0.05)", true: "rgba(255, 49, 49, 0.4)" }}
                                thumbColor={configs.maintenance_mode === "true" ? "#FF3131" : "#475569"}
                                onValueChange={(val) => saveConfig("maintenance_mode", String(val))}
                                value={configs.maintenance_mode === "true"}
                            />
                        </View>
                    </AdminGlassCard>

                    {/* Defaults */}
                    <AdminGlassCard style={styles.card}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="terminal-outline" size={16} color="#3B82F6" />
                            <Text style={styles.sectionTitle}>SYSTEM PARAMETERS</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>GLOBAL BRANCH CREDIT LIMIT (IDR)</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="wallet-outline" size={18} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={configs.default_outlet_limit}
                                    keyboardType="numeric"
                                    placeholderTextColor="#475569"
                                    onChangeText={(v) => setConfigs({ ...configs, default_outlet_limit: v })}
                                    onEndEditing={() => saveConfig("default_outlet_limit", configs.default_outlet_limit)}
                                />
                            </View>
                            <Text style={styles.hint}>Initial liquidity ceiling for newly enroled branches.</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>WHATSAPP GATEWAY PROTOCOL</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="logo-whatsapp" size={18} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={configs.contact_wa}
                                    placeholder="628123456789"
                                    placeholderTextColor="#475569"
                                    keyboardType="phone-pad"
                                    onChangeText={(v) => setConfigs({ ...configs, contact_wa: v })}
                                />
                            </View>
                            <Text style={styles.hint}>System-wide communication channel for automated alerting.</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveBtn, isSaving && styles.disabledBtn]}
                            onPress={handleSaveAll}
                            disabled={isSaving}
                        >
                            <LinearGradient
                                colors={isSaving ? ['#475569', '#1E293B'] : ['#FF3131', '#D00000']}
                                style={styles.saveGradient}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <Ionicons name="save-outline" size={18} color="white" />
                                        <Text style={styles.saveText}>COMMIT SYSTEM CHANGES</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </AdminGlassCard>
                </View>
            )}

            <MessageModal
                visible={modalVisible}
                title={modalInfo.title}
                message={modalInfo.message}
                type={modalInfo.type}
                onClose={() => setModalVisible(false)}
            />
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { fontSize: 10, fontWeight: '900', color: '#475569', letterSpacing: 2 },
    content: { padding: 20, gap: 20 },
    card: {
        padding: 24,
    },
    cardRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    iconBg: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 49, 49, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 1,
        marginBottom: 6
    },
    cardDesc: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: '700',
        lineHeight: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "900",
        color: "#3B82F6",
        letterSpacing: 2,
    },
    inputGroup: { marginBottom: 20 },
    label: {
        fontSize: 10,
        fontWeight: "900",
        color: "#475569",
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    hint: {
        fontSize: 10,
        color: "#475569",
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '700',
    },
    saveBtn: {
        marginTop: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    saveGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    disabledBtn: { opacity: 0.5 },
    saveText: {
        color: "white",
        fontWeight: "900",
        fontSize: 11,
        letterSpacing: 1,
    }
});
