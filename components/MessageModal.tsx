import React from "react";
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

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
    confirmText = "Continue",
    cancelText = "Cancel",
}: MessageModalProps) {
    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case "success": return "checkmark-circle";
            case "error": return "alert-circle";
            case "warning": return "warning";
            case "confirm": return "help-circle";
            default: return "information-circle";
        }
    };

    const getColors = (): readonly [string, string, ...string[]] => {
        switch (type) {
            case "success": return ['#22C55E', '#16A34A'];
            case "error": return ['#FF0000', '#D00000'];
            case "warning": return ['#F59E0B', '#D97706'];
            default: return ['#3B82F6', '#2563EB'];
        }
    };

    const primaryColor = getColors()[0];

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <LinearGradient colors={getColors()} style={styles.headerGradient}>
                        <Ionicons name={getIcon() as any} size={48} color="#FFFFFF" />
                    </LinearGradient>

                    <View style={styles.content}>
                        <Text style={styles.title}>{title || type.toUpperCase()}</Text>
                        <Text style={styles.message}>{message}</Text>

                        <View style={styles.buttonRow}>
                            {type === "confirm" && (
                                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                    <Text style={styles.cancelText}>{cancelText}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[styles.mainBtn, { backgroundColor: primaryColor }]}
                                onPress={type === "confirm" ? onConfirm : onClose}
                            >
                                <Text style={styles.mainBtnText}>{confirmText === "Continue" && type !== "confirm" ? "OK" : confirmText}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 25,
    },
    container: {
        width: Math.min(width - 50, 340),
        backgroundColor: "#FFFFFF",
        borderRadius: 30,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
    },
    headerGradient: {
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: 25,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    message: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
        fontWeight: '500',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    mainBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '800',
    },
});
