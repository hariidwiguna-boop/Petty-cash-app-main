import * as React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../../src/hooks/useResponsive';
import { Transaction, TransactionItem } from '../../lib/supabase';
import GlassCard from '../../src/design-system/components/glass/GlassCard';

interface DailySummaryProps {
    data: {
        todayTransactions: (Transaction & { transaction_items: TransactionItem[] })[];
        usagePercent: number;
        saldoLimit: number;
    };
    today: string;
}

export const DailySummary: React.FC<DailySummaryProps> = ({ data, today }) => {
    const { fontScale } = useResponsive();
    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    return (
        <GlassCard elevation="heavy" radius="2xl" style={styles.dailySummaryCard} reflection={true}>
            <View style={styles.dailyHeader}>
                <View>
                    <Text style={[styles.dailyTitle, { fontSize: fontScale(14) }]}>TODAY'S OPERATIONS</Text>
                    <Text style={[styles.dailyDate, { fontSize: fontScale(10) }]}>{today.toUpperCase()}</Text>
                </View>
            </View>

            {/* Detailed Expenses List */}
            <View style={styles.dailyStats}>
                {data.todayTransactions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No transactions recorded for today.</Text>
                    </View>
                ) : (
                    data.todayTransactions.map((tx, idx) => (
                        <View key={idx} style={styles.txRow}>
                            {tx.transaction_items && tx.transaction_items.length > 0 ? (
                                tx.transaction_items.map((item: TransactionItem, i: number) => (
                                    <View key={i} style={styles.itemLine}>
                                        <View style={styles.dot} />
                                        <Text style={styles.itemDesc} numberOfLines={1}>
                                            {item.deskripsi}
                                        </Text>
                                        <Text style={styles.itemValue}>
                                            {formatCurrency(Number(item.total_harga))}
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.itemLine}>
                                    <View style={styles.dot} />
                                    <Text style={styles.itemDesc}>
                                        {tx.tipe || "General Expense"}
                                    </Text>
                                    <Text style={styles.itemValue}>
                                        {formatCurrency(Number(tx.grand_total))}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))
                )}
            </View>

            <GlassCard elevation="none" radius="md" style={styles.progressSection}>
                <View style={styles.progressLabel}>
                    <Text style={styles.progressLabelText}>BUDGET UTILIZATION</Text>
                    <Text style={styles.progressPercent}>
                        {data.usagePercent}%
                    </Text>
                </View>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${data.usagePercent}%` },
                            data.usagePercent > 80 && styles.progressDanger,
                        ]}
                    />
                </View>
                <View style={styles.progressFooter}>
                    <Text style={styles.progressHint}>LIMIT: {formatCurrency(data.saldoLimit)}</Text>
                </View>
            </GlassCard>
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    dailySummaryCard: {
        padding: 24,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    dailyHeader: {
        marginBottom: 24,
    },
    dailyTitle: {
        fontWeight: "800",
        color: "black",
        letterSpacing: 0.5,
    },
    dailyDate: {
        color: "rgba(0, 0, 0, 0.5)",
        fontWeight: "700",
        letterSpacing: 1,
        marginTop: 2,
    },
    dailyStats: {
        marginBottom: 24,
        gap: 12,
    },
    emptyState: {
        paddingVertical: 12,
    },
    emptyText: {
        color: 'rgba(0, 0, 0, 0.4)',
        fontSize: 13,
        fontWeight: '500',
    },
    txRow: {
        gap: 8,
    },
    itemLine: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        marginRight: 8,
    },
    itemDesc: {
        fontSize: 13,
        color: "rgba(0, 0, 0, 0.6)",
        flex: 1,
        fontWeight: '500',
    },
    itemValue: {
        fontSize: 13,
        fontWeight: '800',
        color: "black",
    },
    progressSection: {
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    progressLabel: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center',
        marginBottom: 10,
    },
    progressLabelText: {
        fontSize: 10,
        color: "rgba(0, 0, 0, 0.5)",
        fontWeight: "800",
        letterSpacing: 1,
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: "900",
        color: "black",
    },
    progressBar: {
        height: 4,
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        borderRadius: 2,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#E61E28",
        borderRadius: 2,
    },
    progressDanger: {
        backgroundColor: "#E61E28",
    },
    progressFooter: {
        marginTop: 10,
    },
    progressHint: {
        fontSize: 10,
        color: "rgba(0, 0, 0, 0.4)",
        fontWeight: '700',
        letterSpacing: 1,
        textAlign: "right",
    },
});