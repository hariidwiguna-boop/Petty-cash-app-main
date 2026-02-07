import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../stores/authStore";
import MessageModal from "../../components/MessageModal";
import CustomLoading from "../../components/CustomLoading";
import { validateEmail, validatePassword, formatValidationErrors } from "../../lib/validation";
import { theme } from "../../src/design-system/theme";

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
        const isEmailInput = username.includes("@");
        let validationResult;

        if (isEmailInput) {
            validationResult = validateEmail(username);
        } else {
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

        const isEmail = username.includes("@");
        let result;

        if (isEmail) {
            result = await signIn(username, password);
        } else {
            const cleanUsername = username.toLowerCase().replace(/\s+/g, '');
            result = await signIn(`${cleanUsername}@pettycash.com`, password);
            if (result.error) {
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
                    "Fitur 'Confirm Email' aktif di Supabase. Mohon matikan fitur tersebut di dashboard Supabase.",
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
            <LinearGradient
                colors={[theme.colors.background.start, theme.colors.background.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
            >
                <MessageModal
                    visible={modalVisible}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    onClose={() => setModalVisible(false)}
                />

                <CustomLoading visible={isLoading} text="Masuk..." />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
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
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Masukkan username"
                                        placeholderTextColor={theme.colors.text.tertiary}
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.passwordWrapper}>
                                    <TextInput
                                        style={styles.inputPassword}
                                        placeholder="Masukkan password"
                                        placeholderTextColor={theme.colors.text.tertiary}
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
                                <LinearGradient
                                    colors={[theme.colors.primary[500], theme.colors.primary[600]]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.submitBtnGradient}
                                >
                                    <Text style={styles.submitBtnText}>
                                        {isLoading ? "Memproses..." : "Sign In"}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradientBackground: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    loginCard: {
        ...theme.components.card.base,
        padding: theme.spacing['3xl'],
    },
    headerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xl,
        marginBottom: theme.spacing['4xl'],
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    logoLeft: {
        flexDirection: 'column',
        gap: 4,
    },
    logoBar: {
        width: 28,
        height: 8,
        backgroundColor: theme.colors.primary[500],
        borderRadius: 2,
    },
    logoRight: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 4,
        height: 32,
    },
    logoRectangle: {
        width: 8,
        height: 32,
        borderWidth: 2,
        borderColor: theme.colors.primary[500],
        borderRadius: 2,
        backgroundColor: 'transparent',
    },
    logoCircle: {
        width: 10,
        height: 10,
        backgroundColor: theme.colors.warning.main,
        borderRadius: 5,
        marginTop: 0,
    },
    loginHeader: {
        alignItems: 'flex-start',
    },
    title: {
        ...theme.components.header.title,
    },
    brandName: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary[500],
        marginTop: 2,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    form: {
        gap: theme.spacing.xl,
    },
    formGroup: {
        gap: theme.spacing.sm,
    },
    label: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    inputWrapper: {
        ...theme.components.input.base,
    },
    input: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
    },
    passwordWrapper: {
        ...theme.components.input.base,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 0,
    },
    inputPassword: {
        flex: 1,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
    },
    passwordToggle: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    passwordToggleText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.primary[500],
    },
    loginOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: theme.colors.border.normal,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: theme.colors.primary[500],
        borderColor: theme.colors.primary[500],
    },
    checkmark: {
        color: theme.colors.text.inverse,
        fontSize: 12,
        fontWeight: 'bold' as const,
    },
    rememberText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    forgotLink: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.link,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    submitBtn: {
        marginTop: theme.spacing['2xl'],
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        ...theme.shadows.md,
    },
    submitBtnDisabled: {
        opacity: 0.6,
    },
    submitBtnGradient: {
        paddingVertical: theme.spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: {
        ...theme.components.button.text.primary,
    },
});
