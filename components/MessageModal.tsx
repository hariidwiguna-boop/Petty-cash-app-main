import React from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
} from "react-native";

interface MessageModalProps {
    visible: boolean;
    title?: string;
    message?: string;
    type?: "success" | "error" | "warning" | "info" | "confirm";
    onClose?: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

const { width } = Dimensions.get("window");

export default function MessageModal({
    visible,
    title,
    message,
    type = "info",
    onClose,
    onConfirm,
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
}: MessageModalProps) {
    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case "success": return "✅";
            case "error": return "❌";
            case "warning": return "⚠️";
            case "confirm": return "🤔";
            default: return "ℹ️";
        }
    };

    const getColor = () => {
        switch (type) {
            case "success": return "#16a34a"; // green-600
            case "error": return "#dc2626"; // red-600
            case "warning": return "#f59e0b"; // amber-500
            case "confirm": return "#2563eb"; // blue-600
            default: return "#4b5563"; // gray-600
        }
    };

    const getBgColor = () => {
        switch (type) {
            case "success": return "#dcfce7"; // green-100
            case "error": return "#fee2e2"; // red-100
            case "warning": return "#fef3c7"; // amber-100
            case "confirm": return "#dbeafe"; // blue-100
            default: return "#f3f4f6"; // gray-100
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Icon Header */}
                    <View style={[styles.iconContainer, { backgroundColor: getBgColor() }]}>
                        <Text style={styles.icon}>{getIcon()}</Text>
                    </View>

                    {/* Content */}
                    <Text style={styles.title}>{title || type.toUpperCase()}</Text>
                    <Text style={styles.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {type === "confirm" ? (
                            <>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={onClose}
                                >
                                    <Text style={styles.cancelText}>{cancelText}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, { backgroundColor: getColor() }]}
                                    onPress={onConfirm}
                                >
                                    <Text style={styles.confirmText}>{confirmText}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: getColor() }]}
                                onPress={onClose}
                            >
                                <Text style={styles.confirmText}>OK</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    container: {
        width: Math.min(width - 48, 340),
        backgroundColor: "white",
        borderRadius: 24,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    icon: {
        fontSize: 32,
    },
    title: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1f2937",
        marginBottom: 8,
        textAlign: "center",
    },
    message: {
        fontSize: 14,
        color: "#4b5563",
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: "row",
        gap: 12,
        width: "100%",
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelButton: {
        backgroundColor: "#f3f4f6",
    },
    confirmText: {
        color: "white",
        fontSize: 14,
        fontWeight: "700",
    },
    cancelText: {
        color: "#4b5563",
        fontSize: 14,
        fontWeight: "600",
    },
});
