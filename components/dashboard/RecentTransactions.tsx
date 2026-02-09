// ============================================
// RECENT TRANSACTIONS COMPONENT
// ============================================

import * as React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../../src/hooks/useResponsive';
import { Transaction } from '../../lib/supabase';

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
                <Text style={styles.sectionTitle}>Transaksi Terakhir</Text>
                <Text style={styles.txEmpty}>Belum ada transaksi</Text>
            </View>
        );
    }

    return (
        <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, { fontSize: fontScale(14) }]}>Transaksi Terakhir</Text>
            {transactions.map((tx, index) => (
                <View key={tx.id || index} style={styles.txItem}>
                    <View style={styles.txItemInfo}>
                        <Text style={styles.txItemDesc}>{tx.tipe}</Text>
                        <Text style={styles.txItemDate}>
                            {new Date(tx.tanggal).toLocaleDateString("id-ID")}
                        </Text>
                    </View>
                    <Text style={styles.txItemAmount}>
                        -{formatCurrency(tx.grand_total)}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    recentSection: {
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 12,
        color: "#1f2937",
    },
    txItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        backgroundColor: "rgba(248, 250, 252, 0.8)",
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 0.05)",
    },
    txItemInfo: {
        flex: 1,
    },
    txItemDesc: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1f2937",
    },
    txItemDate: {
        fontSize: 11,
        color: "#6b7280",
    },
    txItemAmount: {
        fontSize: 14,
        fontWeight: "800",
        color: "#dc2626",
    },
    txEmpty: {
        textAlign: "center",
        color: "#9ca3af",
        fontSize: 13,
        padding: 24,
    },
});