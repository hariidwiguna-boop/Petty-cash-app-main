
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function FinanceSettingsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>💰 Pengaturan Keuangan</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.title}>Limit Saldo Outlet</Text>
                    <Text style={styles.desc}>
                        Pengaturan limit saldo outlet saat ini disatukan dengan Pengaturan Umum (General Settings).
                    </Text>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => router.push("/(app)/(tabs)/admin/settings/general")}
                    >
                        <Text style={styles.btnText}>Buka Pengaturan Umum</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Daftar Rekening Bank & E-Wallet</Text>
                    <Text style={styles.desc}>
                        (Segera Hadir) Kelola daftar rekening tujuan top-up dan rekening sumber dana admin di sini.
                    </Text>
                </View>
            </View>
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
    content: { padding: 20, gap: 16 },
    card: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#e5e7eb"
    },
    title: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
    desc: { fontSize: 14, color: "#666", lineHeight: 20, marginBottom: 16 },
    btn: {
        backgroundColor: "#e0f2fe",
        padding: 12,
        borderRadius: 10,
        alignItems: "center"
    },
    btnText: { color: "#0284c7", fontWeight: "700" }
});
