import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
} from "react-native";
import { useAuthStore } from "../../stores/authStore";
import MessageModal from "../../components/MessageModal";
import CustomLoading from "../../components/CustomLoading";
import { validateEmail, validatePassword, formatValidationErrors } from "../../lib/validation";

export default function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { signIn } = useAuthStore();

    // Message Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: "",
        message: "",
        type: "info" as "success" | "error" | "warning" | "info" | "confirm",
    });

    const showMessage = (
        title: string,
        message: string,
        type: "success" | "error" | "warning" | "info" | "confirm" = "info"
    ) => {
        setModalConfig({ title, message, type });
        setModalVisible(true);
    };

    const handleLogin = async () => {
        // Validasi input
        const isEmailInput = username.includes("@");
        let validationResult;
        
        if (isEmailInput) {
            validationResult = validateEmail(username);
        } else {
            // Untuk username, minimal validasi basic
            if (!username || username.trim().length === 0) {
                showMessage("Error", "Username wajib diisi", "error");
                return;
            }
            validationResult = { isValid: true, errors: [] };
        }
        
        const passwordValidation = validatePassword(password);
        
        if (!validationResult.isValid || !passwordValidation.isValid) {
            const allErrors = [...validationResult.errors, ...passwordValidation.errors];
            showMessage("Error Validasi", formatValidationErrors(allErrors), "error");
            return;
        }

        setIsLoading(true);

        // Check if input is email or username
        const isEmail = username.includes("@");
        let result;

        if (isEmail) {
            result = await signIn(username, password);
        } else {
            // Login with email format: username@pettycash.com or try direct email
            // Ensure we use the same cleaning logic as registration
            const cleanUsername = username.toLowerCase().replace(/\s+/g, '');
            result = await signIn(`${cleanUsername}@pettycash.com`, password);
            if (result.error) {
                // Fallback try as direct email
                result = await signIn(username, password);
            }
        }

        setIsLoading(false);

        if (result.error) {
            console.error("Login Error Details:", result.error);
            const usedEmail = isEmail ? username : `${username.toLowerCase().replace(/\s+/g, '')}@pettycash.com`;

            if (result.error.includes("Email not confirmed")) {
                showMessage(
                    "Email Belum Dikonfirmasi",
                    "Fitur 'Confirm Email' aktif di Supabase. Mohon matikan fitur tersebut di dashboard Supabase (Authentication -> Providers -> Email -> Confirm User).",
                    "warning"
                );
            } else if (result.error.includes("Invalid login credentials")) {
                showMessage("Login Gagal", `Username atau password salah.\n\nCoba login sebagai: ${usedEmail}`, "error");
            } else {
                showMessage("Login Gagal", `Error: ${result.error}\n\nEmail: ${usedEmail}`, "error");
            }
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            {/* Message Modal */}
            <MessageModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={() => setModalVisible(false)}
            />

            {/* Custom Loading */}
            <CustomLoading visible={isLoading} text="Masuk..." />

            <View style={styles.loginCard}>
                {/* Logo Section */}
                <View style={styles.headerWrapper}>
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
                    <View style={styles.loginHeader}>
                        <Text style={styles.title}>Petty Cash{"\n"}Management</Text>
                        <Text style={styles.brandName}>@evrdayplcs</Text>
                    </View>
                </View>

                {/* Login Form */}
                <View style={styles.form}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Masukkan username"
                            placeholderTextColor="#999"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordWrapper}>
                            <TextInput
                                style={styles.inputPassword}
                                placeholder="Masukkan password"
                                placeholderTextColor="#999"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                style={styles.passwordToggle}
                                onPress={() => setShowPassword(!showPassword)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Text style={styles.passwordToggleText}>
                                    {showPassword ? "Hide" : "Show"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.loginOptions}>
                        <TouchableOpacity
                            style={styles.rememberMe}
                            onPress={() => setRememberMe(!rememberMe)}
                        >
                            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.rememberText}>Ingat saya</Text>
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <Text style={styles.forgotLink}>Lupa password?</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.submitBtnText}>{isLoading ? "Memproses..." : "Sign In"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f4d0",
        justifyContent: "center",
        padding: 20,
    },
    loginCard: {
        backgroundColor: "white",
        borderRadius: 24,
        padding: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 40,
        elevation: 10,
    },
    headerWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        marginBottom: 32,
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    logoLeft: {
        flexDirection: "column",
        gap: 4,
    },
    logoBar: {
        width: 28,
        height: 8,
        backgroundColor: "#1a1a1a",
        borderRadius: 0,
    },
    logoRight: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 4,
        height: 32,
    },
    logoRectangle: {
        width: 8,
        height: 32,
        borderWidth: 2,
        borderColor: "#1a1a1a",
        borderRadius: 0,
        backgroundColor: "transparent",
    },
    logoCircle: {
        width: 10,
        height: 10,
        backgroundColor: "#C94C4C",
        borderRadius: 5, // Make it round
        marginTop: 0,
    },
    loginHeader: {
        alignItems: "flex-start",
    },
    title: {
        fontSize: 20,
        fontWeight: "800",
        color: "#1a1a1a",
        textAlign: "left",
        lineHeight: 24,
    },
    brandName: {
        fontSize: 13,
        color: "#C94C4C",
        marginTop: 2,
        fontWeight: "600",
    },
    form: {
        gap: 16,
    },
    formGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1a1a1a",
    },
    input: {
        backgroundColor: "#f8f9fa",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: "#1a1a1a",
    },
    passwordWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 12,
        overflow: "hidden", // Ensure children respect radius
        paddingRight: 8, // Add spacing for icon
    },
    inputPassword: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: "#1a1a1a",
        height: "100%", // Fill height
    },
    passwordToggle: {
        padding: 10,
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
    },
    passwordToggleText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#3b82f6",
    },
    loginOptions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
    },
    rememberMe: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: "#d0d0d0",
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxActive: {
        backgroundColor: "#C94C4C",
        borderColor: "#C94C4C",
    },
    checkmark: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
    },
    rememberText: {
        fontSize: 13,
        color: "#666",
    },
    forgotLink: {
        fontSize: 13,
        color: "#3b82f6",
        fontWeight: "600",
    },
    submitBtn: {
        backgroundColor: "#C94C4C",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 16,
        shadowColor: "#C94C4C",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 6,
    },
    submitBtnDisabled: {
        backgroundColor: "#d97979",
    },
    submitBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "800",
    },
});
