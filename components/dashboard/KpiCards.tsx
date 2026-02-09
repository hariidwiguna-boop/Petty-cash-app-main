// ============================================
// KPI CARDS COMPONENT - evrdayplcs. Brand Theme
// Red Glass | White Glass Design (No Black)
// ============================================

import * as React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../../src/hooks/useResponsive';

// Brand Colors - Red & White Only
const BRAND = {
    red: '#DC2626',
    redLight: '#EF4444',
    redGlass: 'rgba(220, 38, 38, 0.08)',
    white: '#FFFFFF',
    whiteGlass: 'rgba(255, 255, 255, 0.95)',
    textDark: '#1E293B',
    textGray: '#64748B',
};

interface KpiCardsProps {
    data: {
        saldoSekarang: number;
        kasAwalHariIni: number;
        kasMasukHariIni: number;
        kasKeluarHariIni: number;
    };
}

export const KpiCards: React.FC<KpiCardsProps> = ({ data }) => {
    const { isTablet, fontScale, horizontalScale } = useResponsive();
    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    return (
        <View style={[styles.kpiGrid, isTablet && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
            {/* 1. Kas Awal Hari Ini */}
            <View style={[styles.kpiCard, isTablet && { width: '48.5%' }]}>
                <View style={[styles.kpiIcon, { backgroundColor: 'rgba(100, 116, 139, 0.08)' }]}>
                    <Text style={styles.kpiIconText}>📥</Text>
                </View>
                <View style={styles.kpiInfo}>
                    <Text style={[styles.kpiLabel, { fontSize: fontScale(10) }]}>Kas Awal Hari Ini</Text>
                    <Text style={[styles.kpiValue, { color: BRAND.textDark, fontSize: fontScale(14) }]}>
                        {formatCurrency(data.kasAwalHariIni)}
                    </Text>
                </View>
            </View>

            {/* 2. Kas Masuk Hari Ini */}
            <View style={[styles.kpiCard, styles.kpiKasMasuk, isTablet && { width: '48.5%' }]}>
                <View style={[styles.kpiIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Text style={styles.kpiIconText}>↗️</Text>
                </View>
                <View style={styles.kpiInfo}>
                    <Text style={[styles.kpiLabel, { fontSize: fontScale(10) }]}>Kas Masuk Hari Ini</Text>
                    <Text style={[styles.kpiValue, { color: '#10b981', fontSize: fontScale(14) }]}>
                        {formatCurrency(data.kasMasukHariIni)}
                    </Text>
                </View>
            </View>

            {/* 3. Kas Keluar Hari Ini */}
            <View style={[styles.kpiCard, styles.kpiKasKeluar, isTablet && { width: '48.5%' }]}>
                <View style={[styles.kpiIcon, { backgroundColor: BRAND.redGlass }]}>
                    <Text style={styles.kpiIconText}>↘️</Text>
                </View>
                <View style={styles.kpiInfo}>
                    <Text style={[styles.kpiLabel, { fontSize: fontScale(10) }]}>Kas Keluar Hari Ini</Text>
                    <Text style={[styles.kpiValue, { color: BRAND.red, fontSize: fontScale(14) }]}>
                        {formatCurrency(data.kasKeluarHariIni)}
                    </Text>
                </View>
            </View>

            {/* 4. Saldo Saat Ini (Bottom) */}
            <View style={[styles.kpiCard, styles.kpiSaldo, isTablet && { width: '48.5%' }]}>
                <View style={[styles.kpiIcon, { backgroundColor: BRAND.redGlass }]}>
                    <Text style={styles.kpiIconText}>💰</Text>
                </View>
                <View style={styles.kpiInfo}>
                    <Text style={[styles.kpiLabel, { fontSize: fontScale(10) }]}>Saldo Saat Ini</Text>
                    <Text style={[styles.kpiValue, { color: BRAND.red, fontSize: fontScale(14) }]}>
                        {formatCurrency(data.saldoSekarang)}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    kpiGrid: {
        flexDirection: "column",
        gap: 8, // Reduced gap
        padding: 20,
        paddingTop: 16, // Reduced top padding
    },
    kpiCard: {
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.45)",
        borderRadius: 16, // Smaller border radius
        padding: 10, // Significantly reduced padding (was 18)
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderWidth: 1, // Thinner border
        borderColor: "rgba(255, 255, 255, 0.8)",
        shadowColor: "#1E293B",
        shadowOffset: { width: 0, height: 4 }, // Smaller shadow offset
        shadowOpacity: 0.1,
        shadowRadius: 10, // Smaller shadow radius
        elevation: 4,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } : {}),
    },
    kpiSaldo: {
        borderColor: "rgba(220, 38, 38, 0.2)",
    },
    kpiKasMasuk: {
        borderColor: "rgba(16, 185, 129, 0.2)",
    },
    kpiKasKeluar: {
        borderColor: "rgba(220, 38, 38, 0.2)",
    },
    kpiIcon: {
        width: 36, // Smaller icon (was 48)
        height: 36,
        borderRadius: 10, // Smaller radius
        alignItems: "center",
        justifyContent: "center",
    },
    kpiIconText: {
        fontSize: 16, // Smaller emoji (was 22)
    },
    kpiInfo: {
        flex: 1,
    },
    kpiLabel: {
        fontSize: 10, // Smaller label (was 12)
        color: "#334155",
        fontWeight: "600",
        marginBottom: 2,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    kpiValue: {
        fontSize: 14, // Smaller value (was 16)
        fontWeight: "800",
    },
});