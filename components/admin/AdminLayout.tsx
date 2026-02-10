import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface AdminLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    showBackButton?: boolean;
    rightAction?: React.ReactNode;
    scrollable?: boolean;
    contentContainerStyle?: StyleProp<ViewStyle>;
}

export default function AdminLayout({
    title,
    subtitle,
    children,
    showBackButton = true,
    rightAction,
    scrollable = true,
    contentContainerStyle
}: AdminLayoutProps) {
    const router = useRouter();

    const ContentWrapper = scrollable ? ScrollView : View;

    return (
        <View style={styles.container}>
            {/* Background Gradient - Red to White */}
            <LinearGradient
                colors={['#991B1B', '#DC2626', '#FEE2E2', '#FFFFFF']}
                locations={[0, 0.15, 0.4, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Header */}
            <SafeAreaView edges={["top"]} style={styles.headerContent}>
                <View style={styles.headerLeft}>
                    {showBackButton && (
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Text style={styles.backBtnText}>←</Text>
                        </TouchableOpacity>
                    )}
                    <View>
                        <Text style={styles.headerTitle}>{title}</Text>
                        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
                    </View>
                </View>
                {rightAction}
            </SafeAreaView>

            {/* Content */}
            <ContentWrapper
                style={styles.content}
                contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            >
                {children}
            </ContentWrapper>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#020617",
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 24,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.05)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    backBtnText: {
        fontSize: 18,
        color: "white",
        fontWeight: "bold",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "white",
        letterSpacing: 1.5,
    },
    headerSubtitle: {
        fontSize: 11,
        color: "#94A3B8",
        fontWeight: '700',
        letterSpacing: 1,
        marginTop: 2,
        textTransform: 'uppercase',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 8,
        paddingBottom: 120, // Space for fixed footer
        paddingHorizontal: 20,
    },
});

