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
        return "Rp . " + amount.toLocaleString("id-ID").replace(/\s/g, '');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>TRANSAKSI HARI INI</Text>
            </View>

            {transactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Belum ada transaksi hari ini.</Text>
                </View>
            ) : (
                <View style={styles.list}>
                    {transactions.map((tx, index) => (
                        <View key={tx.id || index} style={styles.txItem}>
                            <View style={styles.leftCol}>
                                <Text style={styles.txDesc}>{tx.tipe || 'Transaksi'}</Text>
                                <Text style={styles.txDate}>
                                    {new Date(tx.tanggal).toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' })}
                                </Text>
                            </View>
                            <View style={styles.rightCol}>
                                <Text style={[
                                    styles.txAmount,
                                    { color: tx.tipe === 'Kas Masuk' ? '#22C55E' : '#FF0000' }
                                ]}>
                                    {tx.tipe === 'Kas Masuk' ? '' : '-'} {formatCurrency(tx.grand_total)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 30,
        minHeight: 300,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 14,
        fontWeight: '900',
        color: '#94A3B8',
        letterSpacing: 2,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        gap: 0,
    },
    txItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    leftCol: {
        flex: 1,
        gap: 4,
    },
    txDesc: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    txDate: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    rightCol: {
        alignItems: 'flex-end',
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '900',
    },
});