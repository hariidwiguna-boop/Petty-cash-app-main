
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import AdminLayout from "../../../../../components/admin/AdminLayout";
import AdminGlassCard from "../../../../../components/admin/AdminGlassCard";
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

// Settings Menu Data
const SETTINGS_MENU = [
    {
        id: "users",
        title: "TEAM MANAGEMENT",
        description: "Control user credentials & authorization",
        icon: "people",
        route: "/(app)/(tabs)/admin/users",
        accent: "#3B82F6"
    },
    {
        id: "outlets",
        title: "BRANCH NETWORK",
        description: "Configure outlets & fiscal balances",
        icon: "business",
        route: "/(app)/(tabs)/admin/outlets",
        accent: "#F59E0B"
    },
    {
        id: "master_data",
        title: "MASTER CATALOG",
        description: "Product inventory & categorization",
        icon: "cube",
        route: "/(app)/(tabs)/admin/settings/master",
        accent: "#8B5CF6"
    },
    {
        id: "general",
        title: "CORE PARAMETERS",
        description: "System limits & global variables",
        icon: "settings",
        route: "/(app)/(tabs)/admin/settings/general",
        accent: "#10B981"
    },
    {
        id: "finance",
        title: "FISCAL POLICY",
        description: "Banking details & reimbursement rules",
        icon: "wallet",
        route: "/(app)/(tabs)/admin/settings/finance",
        accent: "#EC4899"
    },
    {
        id: "security",
        title: "SECURITY AUDIT",
        description: "Audit trails, logs & data continuity",
        icon: "shield-checkmark",
        route: "/(app)/(tabs)/admin/settings/security",
        accent: "#EF4444"
    }
];

export default function SettingsDashboard() {
    const router = useRouter();

    return (
        <AdminLayout
            title="⚙️ Settings"
            subtitle="System architecture control"
            showBackButton={true}
        >
            <View style={styles.heroContainer}>
                <AdminGlassCard style={styles.heroCard}>
                    <LinearGradient
                        colors={['rgba(59, 130, 246, 0.1)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroGradient}
                    />
                    <View style={styles.heroContent}>
                        <View style={styles.heroIconBg}>
                            <Ionicons name="construct" size={24} color="#3B82F6" />
                        </View>
                        <View>
                            <Text style={styles.heroTitle}>COMMAND CENTER</Text>
                            <Text style={styles.heroDesc}>Optimize and govern system operations.</Text>
                        </View>
                    </View>
                </AdminGlassCard>
            </View>

            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.grid}>
                    {SETTINGS_MENU.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.cardContainer}
                            onPress={() => router.push(item.route as any)}
                            activeOpacity={0.7}
                        >
                            <AdminGlassCard style={styles.menuCard}>
                                <View style={[styles.iconBox, { backgroundColor: `${item.accent}15` }]}>
                                    <Ionicons name={item.icon as any} size={22} color={item.accent} />
                                </View>
                                <View style={styles.cardInfo}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardDesc}>{item.description}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#475569" />
                            </AdminGlassCard>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>EVR DAY PLCS PETTY CASH</Text>
                    <Text style={styles.versionSub}>SYSTEM ARCHITECTURE v1.1.0_PRO</Text>
                </View>
            </ScrollView>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    heroContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    heroCard: {
        padding: 24,
        overflow: 'hidden',
    },
    heroGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    heroContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 20,
    },
    heroIconBg: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    heroTitle: {
        fontSize: 14,
        fontWeight: "900",
        color: "white",
        letterSpacing: 2,
    },
    heroDesc: {
        fontSize: 12,
        color: "#94A3B8",
        fontWeight: '600',
        marginTop: 4,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    grid: {
        gap: 12,
    },
    cardContainer: {
        width: '100%',
    },
    menuCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        gap: 16,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: 1,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: '700',
    },
    footer: {
        marginTop: 40,
        alignItems: "center",
        gap: 6,
    },
    versionText: {
        fontSize: 10,
        fontWeight: '900',
        color: "#475569",
        letterSpacing: 3,
    },
    versionSub: {
        fontSize: 9,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: 1,
    }
});
