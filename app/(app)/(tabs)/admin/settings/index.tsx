
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import AdminLayout from "../../../../../components/admin/AdminLayout";

// Settings Menu Data
const SETTINGS_MENU = [
    {
        id: "users",
        title: "Manajemen Users",
        description: "Kelola akun pengguna & hak akses",
        icon: "👥",
        route: "/(app)/(tabs)/admin/users",
        color: "#eff6ff",
        iconColor: "#2563eb"
    },
    {
        id: "outlets",
        title: "Manajemen Outlets",
        description: "Kelola daftar outlet & saldo",
        icon: "🏪",
        route: "/(app)/(tabs)/admin/outlets",
        color: "#fff7ed",
        iconColor: "#ea580c"
    },
    {
        id: "master_data",
        title: "Master Data",
        description: "Kelola item barang & kategori",
        icon: "📦",
        route: "/(app)/(tabs)/admin/settings/master",
        color: "#e0f2fe",
        iconColor: "#0284c7"
    },
    {
        id: "general",
        title: "Pengaturan Umum",
        description: "Limit saldo, aplikasi, dll",
        icon: "⚙️",
        route: "/(app)/(tabs)/admin/settings/general",
        color: "#f3e8ff",
        iconColor: "#9333ea"
    },
    {
        id: "finance",
        title: "Keuangan",
        description: "Rekening Bank & Kebijakan",
        icon: "💰",
        route: "/(app)/(tabs)/admin/settings/finance",
        color: "#dcfce7",
        iconColor: "#16a34a"
    },
    {
        id: "security",
        title: "Keamanan & Logs",
        description: "Audit trail & Backup data",
        icon: "🛡️",
        route: "/(app)/(tabs)/admin/settings/security",
        color: "#fee2e2",
        iconColor: "#dc2626"
    }
];

export default function SettingsDashboard() {
    const router = useRouter();

    return (
        <AdminLayout
            title="⚙️ Pengaturan"
            subtitle="Konfigurasi sistem admin"
            showBackButton={true}
        >
            <View style={styles.banner}>
                <Text style={styles.bannerIcon}>🛠️</Text>
                <View>
                    <Text style={styles.bannerTitle}>Pusat Kontrol</Text>
                    <Text style={styles.bannerDesc}>Atur semua konfigurasi aplikasi di sini.</Text>
                </View>
            </View>

            <View style={styles.grid}>
                {SETTINGS_MENU.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.card}
                        onPress={() => router.push(item.route as any)}
                    >
                        <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                            <Text style={styles.icon}>{item.icon}</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                            <Text style={styles.cardDesc}>{item.description}</Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Petty Cash Management v1.1.0</Text>
            </View>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    banner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1a1a1a",
        padding: 20,
        borderRadius: 16,
        gap: 16,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5
    },
    bannerIcon: {
        fontSize: 32
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "white"
    },
    bannerDesc: {
        fontSize: 13,
        color: "#9ca3af",
        marginTop: 2
    },
    grid: {
        gap: 16
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        gap: 16
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center"
    },
    icon: {
        fontSize: 24
    },
    cardContent: {
        flex: 1
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 2
    },
    cardDesc: {
        fontSize: 12,
        color: "#6b7280"
    },
    arrow: {
        fontSize: 20,
        color: "#cbd5e1"
    },
    footer: {
        paddingVertical: 40,
        alignItems: "center"
    },
    footerText: {
        fontSize: 12,
        color: "#999"
    }
});
