import * as React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../../src/hooks/useResponsive';
import { Transaction } from '../../lib/supabase';
import { theme } from '../../src/design-system/theme';

interface RecentTransactionsProps {
    transactions: Transaction[];
    onTransactionPress?: (transaction: Transaction) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
    transactions,
    onTransactionPress
}) => {
    const { fontScale, isTablet } = useResponsive();
    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    if (transactions.length === 0) {
        return (
            <View style={styles.recentSection}>
                <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
                <Text style={styles.txEmpty}>No recent activity found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.recentSection}>
            <View style={styles.headerRow}>
                <Text style={[styles.sectionTitle, { fontSize: fontScale(12) }]}>RECENT ACTIVITY</Text>
                <View style={styles.activeDot} />
            </View>

            {transactions.map((tx, index) => (
                <View key={tx.id || index} style={styles.txItem}>
                    <View style={styles.txItemInfo}>
                        <Text style={styles.txItemDesc}>{tx.tipe.toUpperCase()}</Text>
                        <Text style={styles.txItemDate}>
                            {new Date(tx.tanggal).toLocaleDateString("id-ID", { day: '2-digit', month: 'short' })}
                        </Text>
                    </View>
                    <View style={styles.txValueRow}>
                        <Text style={styles.txItemAmount}>
                            -{formatCurrency(tx.grand_total)}
                        </Text>
                        <View style={styles.chevron} />
                    </View>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    recentSection: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 20,
        marginBottom: 100, // Extra margin for bottom nav
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 8,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(40px)' } : {}),
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    sectionTitle: {
        fontWeight: "900",
        color: "#94A3B8",
        letterSpacing: 2,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FF3131',
    },
    txItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.05)",
    },
    txItemInfo: {
        flex: 1,
        gap: 2,
    },
    txItemDesc: {
        fontSize: 13,
        fontWeight: "800",
        color: "#F8FAFC",
        letterSpacing: 0.5,
    },
    txItemDate: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: '600',
    },
    txValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    txItemAmount: {
        fontSize: 14,
        fontWeight: "900",
        color: "#FF3131",
    },
    chevron: {
        width: 6,
        height: 6,
        borderTopWidth: 1.5,
        borderRightWidth: 1.5,
        borderColor: '#475569',
        transform: [{ rotate: '45deg' }],
    },
    txEmpty: {
        textAlign: "center",
        color: "#475569",
        fontSize: 12,
        padding: 32,
        fontWeight: '600',
        letterSpacing: 1,
    },
});