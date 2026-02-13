import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandLogo from './BrandLogo';

interface MainDashboardLayoutProps {
    children: React.ReactNode;
    userName?: string;
    outletName?: string;
    onLogout?: () => void;
}

export default function MainDashboardLayout({
    children,
    userName = "User",
    outletName = "Outlet",
    onLogout
}: MainDashboardLayoutProps) {
    return (
        <View style={styles.container}>
            {/* Red to White Background Gradient */}
            <LinearGradient
                colors={['#FF0000', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />

            {/* Curved Header */}
            <View style={styles.headerContainer}>
                <LinearGradient
                    colors={['#FF0000', '#FF3131']}
                    style={styles.headerGradient}
                >
                    <SafeAreaView edges={['top']} style={styles.headerContent}>
                        {/* Top Bar (Outlet Name) */}
                        <View style={styles.topBar}>
                            <Text style={styles.outletTitle}>{outletName}</Text>
                        </View>

                        {/* Profile Bar */}
                        <View style={styles.profileBar}>
                            <BrandLogo size={50} showText={false} variant="dark" style={styles.headerLogo} />
                            <View style={styles.greetingContainer}>
                                <Text style={styles.welcomeText}>Welcome Back</Text>
                                <Text style={styles.userName}>{userName}</Text>
                            </View>
                            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
                                <Ionicons name="power" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>

                    {/* Curved SVG/View at bottom */}
                    <View style={styles.curve} />
                </LinearGradient>
            </View>

            <View style={styles.body}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        height: 220,
        width: '100%',
        overflow: 'hidden',
    },
    headerGradient: {
        flex: 1,
        position: 'relative',
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    topBar: {
        marginBottom: 5,
    },
    outletTitle: {
        color: '#8B1E1E',
        fontSize: 18,
        fontWeight: '900',
    },
    profileBar: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLogo: {
        backgroundColor: 'transparent',
    },
    greetingContainer: {
        marginLeft: 15,
        flex: 1,
    },
    welcomeText: {
        color: '#8B1E1E',
        fontSize: 16,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    userName: {
        color: '#8B1E1E',
        fontSize: 22,
        fontWeight: '900',
        marginTop: -5,
    },
    logoutBtn: {
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
    curve: {
        position: 'absolute',
        bottom: -50,
        left: -20,
        right: -20,
        height: 100,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 1000,
        borderTopRightRadius: 1000,
        transform: [{ scaleX: 1.5 }],
        opacity: 0.3, // Added opacity to match the soft curve look in Mockup 2
    },
    body: {
        flex: 1,
        marginTop: -40, // Pull body up over the curve
    },
});
