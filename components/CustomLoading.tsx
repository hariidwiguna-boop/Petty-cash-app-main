import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Modal, Animated, Easing } from "react-native";

interface CustomLoadingProps {
    visible: boolean;
}

export default function CustomLoading({ visible }: CustomLoadingProps) {
    const fadeAnim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        if (visible) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 0.3,
                        duration: 800,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            fadeAnim.stopAnimation();
        }
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                    {/* Brand Logo - Geometric Design based on @evrdayplcs */}
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
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
    },
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        transform: [{ scale: 2 }],
    },
    logoLeft: {
        flexDirection: "column",
        gap: 8,
    },
    logoBar: {
        width: 50,
        height: 15,
        backgroundColor: "#1E293B",
    },
    logoRight: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        height: 61,
    },
    logoRectangle: {
        width: 15,
        height: 61,
        borderWidth: 4,
        borderColor: "#1E293B",
        backgroundColor: "transparent",
    },
    logoCircle: {
        width: 20,
        height: 20,
        backgroundColor: "#FF0000",
        borderRadius: 10,
    },
});
