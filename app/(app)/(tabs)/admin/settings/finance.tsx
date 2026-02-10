import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AdminLayout from "../../../../../components/admin/AdminLayout";
import AdminGlassCard from "../../../../../components/admin/AdminGlassCard";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";

export default function FinanceSettingsScreen() {
    const router = useRouter();

    return (
        <AdminLayout
            title="💰 Fiscal Policy"
            subtitle="Banking protocols & reimbursement rules"
            showBackButton={true}
        >
            <View style={styles.container}>
                <AdminGlassCard style={styles.card}>
                    <View style={styles.iconBg}>
                        <Ionicons name="calculator-outline" size={24} color="#10B981" />
                    </View>
                    <Text style={styles.title}>LIQUIDITY THRESHOLDS</Text>
                    <Text style={styles.desc}>
                        Branch liquidity ceilings and operational limits have been centralized within the Core Parameters module.
                    </Text>
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => router.push("/(app)/(tabs)/admin/settings/general")}
                    >
                        <LinearGradient
                            colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.1)']}
                            style={styles.btnGradient}
                        >
                            <Text style={styles.btnText}>ACCESS CORE PARAMETERS</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </AdminGlassCard>

                <AdminGlassCard style={styles.card}>
                    <View style={[styles.iconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                        <Ionicons name="card-outline" size={24} color="#3B82F6" />
                    </View>
                    <Text style={[styles.title, { color: '#3B82F6' }]}>ASSET ACCOUNTS & GATEWAYS</Text>
                    <Text style={styles.desc}>
                        [SYSTEM UPGRADE PENDING] Management interfaces for top-up destination accounts and organizational funding sources are currently under development.
                    </Text>
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>ENHANCEMENT SCHEDULED</Text>
                    </View>
                </AdminGlassCard>
            </View>
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, gap: 20 },
    card: {
        padding: 24,
        alignItems: 'center',
    },
    iconBg: {
        width: 56,
        height: 56,
        borderRadius: 18,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
    },
    title: {
        fontSize: 12,
        fontWeight: "900",
        color: "#10B981",
        letterSpacing: 2,
        marginBottom: 12,
        textAlign: 'center',
    },
    desc: {
        fontSize: 12,
        color: "#94A3B8",
        lineHeight: 18,
        marginBottom: 24,
        textAlign: 'center',
        fontWeight: '600',
    },
    btn: {
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
    },
    btnGradient: {
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    btnText: {
        color: "#10B981",
        fontWeight: "900",
        fontSize: 10,
        letterSpacing: 1,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.1)',
    },
    statusText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 1,
    }
});
