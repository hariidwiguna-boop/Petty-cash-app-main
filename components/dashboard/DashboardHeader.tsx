import * as React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import BrandLogo from '../../src/design-system/components/BrandLogo';

interface DashboardHeaderProps {
    onSettingsPress: () => void;
    onAdminMenuPress: () => void;
    onLogoutPress: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    onSettingsPress,
    onAdminMenuPress,
    onLogoutPress,
}) => {
    const { profile, outlet } = useAuthStore();

    return (
        <View style={styles.container}>
            {/* Top Outlet Label */}
            <Text style={styles.outletLabel}>{outlet?.nama_outlet || "Petty Cash Shop"}</Text>

            <View style={styles.headerRow}>
                {/* Logo + Greeting */}
                <View style={styles.leftSection}>
                    <BrandLogo size={60} showText={false} variant="dark" />
                    <View style={styles.textColumn}>
                        <Text style={styles.welcomeText}>Wellcome Back</Text>
                        <Text style={styles.userName}>{profile?.nama || "User"}</Text>
                    </View>
                </View>

                {/* Power Button */}
                <TouchableOpacity style={styles.powerBtn} onPress={onLogoutPress}>
                    <Ionicons name="power" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 20 : 10,
        marginBottom: 20,
    },
    outletLabel: {
        fontSize: 18,
        fontWeight: '900',
        color: '#8B1E1E', // Dark Blood Red
        marginBottom: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textColumn: {
        marginLeft: 12,
    },
    welcomeText: {
        fontSize: 16,
        color: '#8B1E1E',
        fontStyle: 'italic',
        fontWeight: '500',
    },
    userName: {
        fontSize: 22,
        color: '#8B1E1E',
        fontWeight: '900',
        marginTop: -4,
        letterSpacing: 0.5,
    },
    powerBtn: {
        width: 44,
        height: 44,
        backgroundColor: '#E61E28',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
});