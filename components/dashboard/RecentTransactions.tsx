// ============================================
// RECENT TRANSACTIONS COMPONENT
// ============================================

import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from '../../lib/supabase';

interface RecentTransactionsProps {
    transactions: Transaction[];
    onTransactionPress?: (transaction: Transaction) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ 
    transactions, 
    onTransactionPress 
}) => {
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
            <Text style={styles.sectionTitle}>Transaksi Terakhir</Text>
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
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 12,
        color: "#1a1a1a",
    },
    txItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        backgroundColor: "#f8fafc",
        borderRadius: 10,
        marginBottom: 8,
    },
    txItemInfo: {
        flex: 1,
    },
    txItemDesc: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1a1a1a",
    },
    txItemDate: {
        fontSize: 11,
        color: "#666",
    },
    txItemAmount: {
        fontSize: 14,
        fontWeight: "800",
        color: "#dc2626",
    },
    txEmpty: {
        textAlign: "center",
        color: "#999",
        fontSize: 13,
        padding: 24,
    },
});