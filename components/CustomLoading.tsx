import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, Modal } from "react-native";

interface CustomLoadingProps {
    visible: boolean;
    text?: string;
}

export default function CustomLoading({ visible, text = "Memproses..." }: CustomLoadingProps) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoLeft}>
                            <View style={styles.logoBar} />
                            <View style={styles.logoBar} />
                            <View style={styles.logoBar} />
                        </View>
                        <View style={styles.logoRight}>
                            <View style={styles.logoRectangle} />
                            <View style={styles.logoCircle} />
                        </View>
                    </View>

                    {/* Spinner */}
                    <ActivityIndicator size="large" color="#C94C4C" style={styles.spinner} />

                    {/* Text */}
                    <Text style={styles.text}>{text}</Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(255, 255, 255, 0.9)", // White-ish semi-transparent
        alignItems: "center",
        justifyContent: "center",
    },
    container: {
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
    },
    // Logo Styles (Scaled up 1.5x)
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        transform: [{ scale: 1.5 }],
        marginBottom: 20,
    },
    logoLeft: {
        flexDirection: "column",
        gap: 6,
    },
    logoBar: {
        width: 42,
        height: 12,
        backgroundColor: "#1a1a1a",
        borderRadius: 0, // Sharp
    },
    logoRight: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 6,
        height: 48,
    },
    logoRectangle: {
        width: 12,
        height: 48,
        borderWidth: 3,
        borderColor: "#1a1a1a",
        borderRadius: 0, // Sharp
        backgroundColor: "transparent",
    },
    logoCircle: {
        width: 15,
        height: 15,
        backgroundColor: "#C94C4C",
        borderRadius: 7.5, // Round
        marginTop: 0,
    },
    spinner: {
        marginTop: 10,
    },
    text: {
        fontSize: 16,
        fontWeight: "700",
        color: "#C94C4C",
        letterSpacing: 0.5,
    }
});
