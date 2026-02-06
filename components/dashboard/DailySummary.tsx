// ============================================
// DAILY SUMMARY COMPONENT
// ============================================

import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction, TransactionItem } from '../../lib/supabase';

interface DailySummaryProps {
    data: {
        todayTransactions: (Transaction & { transaction_items: TransactionItem[] })[];
        usagePercent: number;
        saldoLimit: number;
    };
    today: string;
}

export const DailySummary: React.FC<DailySummaryProps> = ({ data, today }) => {
    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    return (
        <View style={styles.dailySummaryCard}>
            <View style={styles.dailyHeader}>
                <Text style={styles.dailyIcon}>📊</Text>
                <Text style={styles.dailyTitle}>Ringkasan Hari Ini</Text>
            </View>
            <Text style={styles.dailyDate}>{today}</Text>

            {/* Detailed Expenses List */}
            <View style={styles.dailyStats}>
                <Text style={[styles.dailyStatText, { marginBottom: 8, fontWeight: '600' }]}>Rincian Pengeluaran:</Text>
                {data.todayTransactions.length === 0 ? (
                    <Text style={{ color: '#999', fontSize: 13, fontStyle: 'italic' }}>Belum ada pengeluaran hari ini.</Text>
                ) : (
                    data.todayTransactions.map((tx, idx) => (
                        <View key={idx}>
                            {tx.transaction_items && tx.transaction_items.length > 0 ? (
                                tx.transaction_items.map((item: TransactionItem, i: number) => (
                                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ fontSize: 13, color: '#374151', flex: 1 }}>
                                            • {item.deskripsi} {item.qty ? `(${item.qty} ${item.satuan})` : ''}
                                        </Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626' }}>
                                            {formatCurrency(Number(item.total_harga))}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 13, color: '#374151', flex: 1 }}>
                                        • {tx.tipe || "Pengeluaran"}
                                    </Text>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626' }}>
                                        {formatCurrency(Number(tx.grand_total))}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressLabel}>
                    <Text style={styles.progressLabelText}>Penggunaan Kas</Text>
                    <Text style={styles.progressPercent}>{data.usagePercent}%</Text>
                </View>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${data.usagePercent}%` },
                            data.usagePercent > 80 && styles.progressDanger,
                            data.usagePercent > 50 && data.usagePercent <= 80 && styles.progressWarning,
                        ]}
                    />
                </View>
                <Text style={styles.progressHint}>dari limit {formatCurrency(data.saldoLimit)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    dailySummaryCard: {
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 2,
    },
    dailyHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    dailyIcon: {
        fontSize: 20,
    },
    dailyTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    dailyDate: {
        fontSize: 12,
        color: "#666",
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        borderStyle: "dashed",
    },
    dailyStats: {
        marginBottom: 14,
        gap: 6,
    },
    dailyStatText: {
        fontSize: 13,
        color: "#444",
    },
    progressContainer: {
        backgroundColor: "#f9fafb",
        borderRadius: 10,
        padding: 12,
    },
    progressLabel: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    progressLabelText: {
        fontSize: 12,
        color: "#666",
    },
    progressPercent: {
        fontSize: 12,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    progressBar: {
        height: 8,
        backgroundColor: "#e5e7eb",
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#22c55e",
        borderRadius: 4,
    },
    progressWarning: {
        backgroundColor: "#f59e0b",
    },
    progressDanger: {
        backgroundColor: "#ef4444",
    },
    progressHint: {
        fontSize: 11,
        color: "#9ca3af",
        marginTop: 6,
        textAlign: "right",
    },
});