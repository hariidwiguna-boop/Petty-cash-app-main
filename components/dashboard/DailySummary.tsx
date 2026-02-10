import * as React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useResponsive } from '../../src/hooks/useResponsive';
import { Transaction, TransactionItem } from '../../lib/supabase';
import { theme } from '../../src/design-system/theme';

interface DailySummaryProps {
    data: {
        todayTransactions: (Transaction & { transaction_items: TransactionItem[] })[];
        usagePercent: number;
        saldoLimit: number;
    };
    today: string;
}

export const DailySummary: React.FC<DailySummaryProps> = ({ data, today }) => {
    const { fontScale, isTablet } = useResponsive();
    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString("id-ID");
    };

    return (
        <View style={styles.dailySummaryCard}>
            <View style={styles.dailyHeader}>
                <View style={styles.accentBar} />
                <View>
                    <Text style={[styles.dailyTitle, { fontSize: fontScale(15) }]}>TODAY'S OPERATIONS</Text>
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
                                            {item.deskripsi} {item.qty ? `(${item.qty})` : ''}
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

            <View style={styles.progressSection}>
                <View style={styles.progressLabel}>
                    <Text style={styles.progressLabelText}>BUDGET UTILIZATION</Text>
                    <Text style={[styles.progressPercent, data.usagePercent > 80 && styles.textRed]}>
                        {data.usagePercent}%
                    </Text>
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
                <View style={styles.progressFooter}>
                    <Text style={styles.progressHint}>LIMIT: {formatCurrency(data.saldoLimit)}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    dailySummaryCard: {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderRadius: 24,
        padding: 24,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 12,
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(40px)' } : {}),
    },
    dailyHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 20,
    },
    accentBar: {
        width: 4,
        height: 32,
        backgroundColor: '#FF3131',
        borderRadius: 2,
    },
    dailyTitle: {
        fontWeight: "900",
        color: "#F8FAFC",
        letterSpacing: 1.5,
    },
    dailyDate: {
        color: "#64748B",
        fontWeight: "700",
        letterSpacing: 2,
        marginTop: 2,
    },
    dailyStats: {
        marginBottom: 24,
        gap: 12,
    },
    emptyState: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    emptyText: {
        color: '#475569',
        fontSize: 13,
        fontStyle: 'italic',
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
        backgroundColor: '#475569',
        marginRight: 8,
    },
    itemDesc: {
        fontSize: 13,
        color: "#94A3B8",
        flex: 1,
        fontWeight: '500',
    },
    itemValue: {
        fontSize: 13,
        fontWeight: '800',
        color: "#F1F5F9",
    },
    progressSection: {
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    progressLabel: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center',
        marginBottom: 10,
    },
    progressLabelText: {
        fontSize: 10,
        color: "#64748B",
        fontWeight: "800",
        letterSpacing: 1,
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: "900",
        color: "#F8FAFC",
    },
    textRed: {
        color: '#FF3131',
    },
    progressBar: {
        height: 6,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#22C55E",
        borderRadius: 3,
    },
    progressWarning: {
        backgroundColor: "#F59E0B",
    },
    progressDanger: {
        backgroundColor: "#FF3131",
    },
    progressFooter: {
        marginTop: 10,
    },
    progressHint: {
        fontSize: 10,
        color: "#475569",
        fontWeight: '700',
        letterSpacing: 1,
        textAlign: "right",
    },
});