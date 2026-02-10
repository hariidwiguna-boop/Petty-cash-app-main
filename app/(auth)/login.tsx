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
    Image,
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
                colors={['#0F172A', '#020617']} // Slate-900 to Slate-950
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

                <CustomLoading visible={isLoading} text="Initializing..." />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.loginCard}>
                        {/* Premium Logo Integration */}
                        <View style={styles.headerWrapper}>
                            <Image
                                source={require('../../assets/logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                            <View style={styles.loginHeader}>
                                <Text style={styles.title}>Petty Cash</Text>
                                <Text style={styles.brandName}>EXECUTIVE SUITE</Text>
                            </View>
                        </View>

                        {/* High-Performance Login Form */}
                        <View style={styles.form}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Access Key (Username)</Text>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your credential"
                                        placeholderTextColor="#64748B"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Security Code (Password)</Text>
                                <View style={styles.passwordWrapper}>
                                    <TextInput
                                        style={styles.inputPassword}
                                        placeholder="Enter your code"
                                        placeholderTextColor="#64748B"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.passwordToggle}
                                        onPress={() => setShowPassword(!showPassword)}
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
                                    <Text style={styles.rememberText}>Maintain Session</Text>
                                </TouchableOpacity>
                                <TouchableOpacity>
                                    <Text style={styles.forgotLink}>Recovery Access?</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                                onPress={handleLogin}
                                disabled={isLoading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#DC2626', '#991B1B']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.submitBtnGradient}
                                >
                                    <Text style={styles.submitBtnText}>
                                        {isLoading ? "AUTHENTICATING..." : "GRANT ACCESS"}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.footerBranding}>PROPRIETARY SYSTEM • © evrdayplcs</Text>
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
        padding: 24,
    },
    loginCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 32,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
        elevation: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(40px)' } : {}),
    },
    headerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 48,
    },
    logoImage: {
        width: 48,
        height: 48,
    },
    loginHeader: {
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#F8FAFC',
        letterSpacing: -0.5,
    },
    brandName: {
        fontSize: 10,
        color: '#FF3131',
        letterSpacing: 2,
        marginTop: 2,
        fontWeight: '700',
    },
    form: {
        gap: 24,
    },
    formGroup: {
        gap: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputWrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: 16,
        height: 56,
        justifyContent: 'center',
    },
    input: {
        fontSize: 16,
        color: '#F8FAFC',
        fontWeight: '500',
    },
    passwordWrapper: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        height: 56,
    },
    inputPassword: {
        flex: 1,
        fontSize: 16,
        color: '#F8FAFC',
        fontWeight: '500',
    },
    passwordToggle: {
        paddingHorizontal: 16,
        height: '100%',
        justifyContent: 'center',
    },
    passwordToggleText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FF3131',
    },
    loginOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#DC2626',
        borderColor: '#DC2626',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },
    rememberText: {
        fontSize: 13,
        color: '#94A3B8',
    },
    forgotLink: {
        fontSize: 13,
        color: '#FF3131',
        fontWeight: '600',
    },
    submitBtn: {
        marginTop: 12,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#FF3131',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitBtnGradient: {
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 1.5,
    },
    footerBranding: {
        textAlign: 'center',
        marginTop: 32,
        fontSize: 10,
        color: '#475569',
        letterSpacing: 2,
        fontWeight: '600',
    },
});

