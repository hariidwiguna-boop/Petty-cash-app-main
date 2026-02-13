import * as React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export const ActionButtons: React.FC = () => {
    const router = useRouter();

    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                {/* REQUEST */}
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/reimburse")}>
                    <Ionicons name="cash-outline" size={32} color="rgba(0,0,0,0.5)" />
                    <Text style={styles.label}>REQUEST</Text>
                </TouchableOpacity>

                {/* STATUS */}
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/status")}>
                    <Ionicons name="checkmark-done-outline" size={32} color="rgba(0,0,0,0.5)" />
                    <Text style={styles.label}>STATUS</Text>
                </TouchableOpacity>

                {/* FAB Placeholder (Spacing) */}
                <View style={styles.fabSpace} />

                {/* RIWAYAT */}
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/history")}>
                    <Ionicons name="time-outline" size={32} color="rgba(0,0,0,0.5)" />
                    <Text style={styles.label}>RIWAYAT</Text>
                </TouchableOpacity>

                {/* LAPORAN */}
                <TouchableOpacity style={styles.navItem} onPress={() => router.push("/(app)/(tabs)/daily-report")}>
                    <Ionicons name="newspaper-outline" size={32} color="rgba(0,0,0,0.5)" />
                    <Text style={styles.label}>LAPORAN</Text>
                </TouchableOpacity>
            </View>

            {/* Floating Red Action Button */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => router.push("/(app)/(tabs)/input")}
                    activeOpacity={0.9}
                >
                    <Ionicons name="add" size={48} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.fabLabel}>CATAT{"\n"}TRANSAKSI</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 110,
        alignItems: 'center',
    },
    container: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        height: 80,
        width: '100%',
        position: 'absolute',
        bottom: 0,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingHorizontal: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabSpace: {
        width: 80,
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        color: 'rgba(0,0,0,0.8)',
        marginTop: 2,
    },
    fabContainer: {
        position: 'absolute',
        top: 0,
        alignItems: 'center',
    },
    fab: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#E61E28',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
        borderWidth: 4,
        borderColor: '#FFFFFF',
    },
    fabLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(0,0,0,0.8)',
        textAlign: 'center',
        marginTop: 4,
    },
});