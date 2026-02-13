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
                colors={['#E61E28', '#FFFFFF']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
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
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.8)",
    },
    backBtnText: {
        fontSize: 20,
        color: "black",
        fontWeight: "bold",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "900",
        color: "black",
        letterSpacing: 1.5,
    },
    headerSubtitle: {
        fontSize: 11,
        color: "rgba(0, 0, 0, 0.5)",
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

