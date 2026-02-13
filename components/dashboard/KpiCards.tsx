import * as React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../src/design-system/components/glass/GlassCard';

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
        return amount.toLocaleString("id-ID").replace(/\s/g, '');
    };

    return (
        <View style={styles.container}>
            {/* Main Balance Card (Saldo Saat Ini) */}
            <View style={styles.mainCardContainer}>
                <View style={styles.walletIconContainer}>
                    <Ionicons name="wallet-outline" size={40} color="#CBD5E1" />
                    <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </View>
                </View>

                <GlassCard elevation="light" radius="xl" style={styles.mainCard}>
                    <Text style={styles.mainLabel}>S A L D O   S A A T   I N I</Text>
                    <Text style={styles.mainValue}>Rp . {formatCurrency(data.saldoSekarang)}</Text>
                </GlassCard>
            </View>

            {/* 3-Column Grid */}
            <View style={styles.gridRow}>
                {/* Saldo Awal */}
                <GlassCard radius="lg" style={StyleSheet.flatten([styles.gridCard, styles.cardAwal])}>
                    <Text style={styles.gridLabel}>SALDO AWAL</Text>
                    <Text style={styles.gridValue}>Rp . {formatCurrency(data.kasAwalHariIni)}</Text>
                </GlassCard>

                {/* Saldo Masuk */}
                <GlassCard radius="lg" style={StyleSheet.flatten([styles.gridCard, styles.cardMasuk])}>
                    <Text style={styles.gridLabel}>SALDO MASUK</Text>
                    <Text style={[styles.gridValue, { color: '#22C55E' }]}>Rp . {formatCurrency(data.kasMasukHariIni)}</Text>
                </GlassCard>

                {/* Saldo Keluar */}
                <GlassCard radius="lg" style={StyleSheet.flatten([styles.gridCard, styles.cardKeluar])}>
                    <Text style={styles.gridLabel}>SALDO KELUAR</Text>
                    <Text style={[styles.gridValue, { color: '#FF0000' }]}>Rp . {formatCurrency(data.kasKeluarHariIni)}</Text>
                </GlassCard>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        gap: 20,
        zIndex: 10,
    },
    mainCardContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    walletIconContainer: {
        position: 'absolute',
        top: -30,
        zIndex: 20,
        width: 70,
        height: 70,
        backgroundColor: '#FFFFFF',
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    checkBadge: {
        position: 'absolute',
        bottom: 5,
        left: 0,
        backgroundColor: '#CBD5E1',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    mainCard: {
        width: '100%',
        paddingVertical: 32,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#0000FF55', // Soft blue border seen in mockup
    },
    mainLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94A3B8',
        letterSpacing: 2,
        marginBottom: 8,
    },
    mainValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#2563EB', // Distinctive Blue
    },
    gridRow: {
        flexDirection: 'row',
        gap: 8,
    },
    gridCard: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        minHeight: 100,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cardAwal: { backgroundColor: 'rgba(241, 245, 249, 0.5)' },
    cardMasuk: { borderColor: '#22C55E55' },
    cardKeluar: { borderColor: '#FF000055' },
    gridLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        marginBottom: 6,
    },
    gridValue: {
        fontSize: 14,
        fontWeight: '900',
        color: '#94A3B8',
        textAlign: 'center',
    },
});