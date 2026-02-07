// ============================================
// KPI CARDS COMPONENT
// ============================================

import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface KpiCardsProps {
    data: {
        saldoSekarang: number;
        kasAwalHariIni: number;
        kasMasukHariIni: number;
        kasKeluarHariIni: number;
    };
}

export const KpiCards: React.FC<KpiCardsProps> = ({ data }) => {
    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    return (
        <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, styles.kpiSaldo]}>
                <View style={[styles.kpiIcon, { backgroundColor: "#dbeafe" }]}>
                    <Text style={styles.kpiIconText}>💰</Text>
                </View>
                <View style={styles.kpiInfo}>
                    <Text style={styles.kpiLabel}>Saldo Saat Ini</Text>
                    <Text style={[styles.kpiValue, { color: "#1d4ed8" }]}>
                        {formatCurrency(data.saldoSekarang)}
                    </Text>
                </View>
            </View>

            <View style={[styles.kpiCard, styles.kpiKasAwal]}>
                <View style={[styles.kpiIcon, { backgroundColor: "#dcfce7" }]}>
                    <Text style={styles.kpiIconText}>📥</Text>
                </View>
                <View style={styles.kpiInfo}>
                    <Text style={styles.kpiLabel}>Kas Awal Hari Ini</Text>
                    <Text style={[styles.kpiValue, { color: "#16a34a" }]}>
                        {formatCurrency(data.kasAwalHariIni)}
                    </Text>
                </View>
            </View>

            <View style={[styles.kpiCard, styles.kpiKasMasuk]}>
                <View style={[styles.kpiIcon, { backgroundColor: "#e0f2fe" }]}>
                    <Text style={styles.kpiIconText}>↗️</Text>
                </View>
                <View style={styles.kpiInfo}>
                    <Text style={styles.kpiLabel}>Kas Masuk Hari Ini</Text>
                    <Text style={[styles.kpiValue, { color: "#0284c7" }]}>
                        {formatCurrency(data.kasMasukHariIni)}
                    </Text>
                </View>
            </View>

            <View style={[styles.kpiCard, styles.kpiKasKeluar]}>
                <View style={[styles.kpiIcon, { backgroundColor: "#fee2e2" }]}>
                    <Text style={styles.kpiIconText}>↘️</Text>
                </View>
                <View style={styles.kpiInfo}>
                    <Text style={styles.kpiLabel}>Kas Keluar Hari Ini</Text>
                    <Text style={[styles.kpiValue, { color: "#dc2626" }]}>
                        {formatCurrency(data.kasKeluarHariIni)}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    kpiGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        padding: 20,
        paddingTop: 24,
    },
    kpiCard: {
        width: "48%",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 14,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.6)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    kpiSaldo: {},
    kpiKasAwal: {},
    kpiKasMasuk: {},
    kpiKasKeluar: {},
    kpiIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    kpiIconText: {
        fontSize: 20,
    },
    kpiInfo: {
        flex: 1,
    },
    kpiLabel: {
        fontSize: 10,
        color: "#666",
        fontWeight: "500",
        marginBottom: 2,
    },
    kpiValue: {
        fontSize: 14,
        fontWeight: "800",
    },
});