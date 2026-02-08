import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AdminLayout from "../../../../../components/admin/AdminLayout";

export default function FinanceSettingsScreen() {
    const router = useRouter();

    return (
        <AdminLayout
            title="💰 Pengaturan Keuangan"
            subtitle="Rekening Bank & Kebijakan"
            showBackButton={true}
        >
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
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
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
