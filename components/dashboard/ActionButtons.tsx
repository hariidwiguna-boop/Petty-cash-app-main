// ============================================
// ACTION BUTTONS COMPONENT
// ============================================

import * as React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export const ActionButtons: React.FC = () => {
    const router = useRouter();

    return (
        <>
            {/* Main Action Button */}
            <TouchableOpacity
                style={styles.mainActionBtn}
                onPress={() => router.push("/(app)/(tabs)/input")}
                activeOpacity={0.8}
            >
                <Text style={styles.mainActionIcon}>📝</Text>
                <Text style={styles.mainActionText}>Catat Pengeluaran</Text>
            </TouchableOpacity>

            {/* Action Grid */}
            <View style={styles.actionGrid}>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push("/(app)/(tabs)/reimburse")}
                >
                    <Text style={styles.actionIcon}>📋</Text>
                    <Text style={styles.actionLabel}>Request{"\n"}Reimburse</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push("/(app)/(tabs)/status")}
                >
                    <Text style={styles.actionIcon}>📊</Text>
                    <Text style={styles.actionLabel}>Status{"\n"}Reimburse</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push("/(app)/(tabs)/history")}
                >
                    <Text style={styles.actionIcon}>📜</Text>
                    <Text style={styles.actionLabel}>Riwayat</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionCard}
                    onPress={() => router.push("/(app)/(tabs)/daily-report")}
                >
                    <Text style={styles.actionIcon}>📈</Text>
                    <Text style={styles.actionLabel}>Laporan{"\n"}Harian</Text>
                </TouchableOpacity>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    mainActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        backgroundColor: "#C94C4C",
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: "#C94C4C",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 25,
        elevation: 8,
    },
    mainActionIcon: {
        fontSize: 28,
    },
    mainActionText: {
        fontSize: 18,
        fontWeight: "800",
        color: "white",
    },
    actionGrid: {
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    actionCard: {
        flex: 1,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 8,
        alignItems: "center",
        gap: 8,
    },
    actionIcon: {
        fontSize: 28,
    },
    actionLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#666",
        textAlign: "center",
        lineHeight: 14,
    },
});