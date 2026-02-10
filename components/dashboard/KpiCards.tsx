import * as React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../../src/hooks/useResponsive';
import { theme } from '../../src/design-system/theme';

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
        <View style={styles.kpiGrid}>
            <View style={styles.topRow}>
                {/* 1. Kas Awal Hari Ini */}
                <View style={[styles.kpiCard, isTablet && { flex: 1 }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: 'rgba(148, 163, 184, 0.1)' }]}>
                        <Text style={styles.kpiIconText}>🏦</Text>
                    </View>
                    <View style={styles.kpiInfo}>
                        <Text style={[styles.kpiLabel, { fontSize: fontScale(9) }]}>ASSET START</Text>
                        <Text style={[styles.kpiValue, { color: '#F8FAFC', fontSize: fontScale(14) }]}>
                            {formatCurrency(data.kasAwalHariIni)}
                        </Text>
                    </View>
                </View>

                {/* 2. Kas Masuk Hari Ini */}
                <View style={[styles.kpiCard, styles.kpiKasMasuk, isTablet && { flex: 1 }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <Text style={styles.kpiIconText}>📈</Text>
                    </View>
                    <View style={styles.kpiInfo}>
                        <Text style={[styles.kpiLabel, { fontSize: fontScale(9) }]}>INCOME TODAY</Text>
                        <Text style={[styles.kpiValue, { color: '#10B981', fontSize: fontScale(14) }]}>
                            {formatCurrency(data.kasMasukHariIni)}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.bottomRow}>
                {/* 3. Kas Keluar Hari Ini */}
                <View style={[styles.kpiCard, styles.kpiKasKeluar, isTablet && { flex: 1 }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: 'rgba(220, 38, 38, 0.15)' }]}>
                        <Text style={styles.kpiIconText}>📉</Text>
                    </View>
                    <View style={styles.kpiInfo}>
                        <Text style={[styles.kpiLabel, { fontSize: fontScale(9) }]}>EXPENSE TODAY</Text>
                        <Text style={[styles.kpiValue, { color: '#FF3131', fontSize: fontScale(14) }]}>
                            {formatCurrency(data.kasKeluarHariIni)}
                        </Text>
                    </View>
                </View>

                {/* 4. Saldo Saat Ini */}
                <View style={[styles.kpiCard, styles.kpiSaldo, isTablet && { flex: 1 }]}>
                    <View style={[styles.kpiIcon, { backgroundColor: 'rgba(220, 38, 38, 0.2)' }]}>
                        <Text style={styles.kpiIconText}>💎</Text>
                    </View>
                    <View style={styles.kpiInfo}>
                        <Text style={[styles.kpiLabel, { fontSize: fontScale(9) }]}>CURRENT BALANCE</Text>
                        <Text style={[styles.kpiValue, { color: '#FFFFFF', fontSize: fontScale(14) }]}>
                            {formatCurrency(data.saldoSekarang)}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    kpiGrid: {
        padding: 20,
        paddingTop: 8,
        gap: 12,
    },
    topRow: {
        flexDirection: 'row',
        gap: 12,
    },
    bottomRow: {
        flexDirection: 'row',
        gap: 12,
    },
    kpiCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(30px)' } : {}),
    },
    kpiSaldo: {
        borderColor: 'rgba(220, 38, 38, 0.3)',
        backgroundColor: 'rgba(220, 38, 38, 0.05)',
    },
    kpiKasMasuk: {
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    kpiKasKeluar: {
        borderColor: 'rgba(220, 38, 38, 0.2)',
    },
    kpiIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    kpiIconText: {
        fontSize: 14,
    },
    kpiInfo: {
        gap: 4,
    },
    kpiLabel: {
        color: "#94A3B8",
        fontWeight: "800",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    kpiValue: {
        fontWeight: "900",
        letterSpacing: -0.5,
    },
});