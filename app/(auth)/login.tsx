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
import { theme } from "../../src/design-system/theme";
import GlassCard from "../../src/design-system/components/glass/GlassCard";
import { Ionicons } from '@expo/vector-icons';
import { transparentPalette } from "../../src/design-system/tokens/colors";
import { useAuthStore } from "../../stores/authStore";
import { validateEmail, validatePassword, formatValidationErrors } from "../../lib/validation";
import MessageModal from "../../components/MessageModal";
import CustomLoading from "../../components/CustomLoading";
import BrandLogo from "../../src/design-system/components/BrandLogo";

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
                colors={['#FF0000', '#FFFFFF']} // 100% Fidelity Red to White
                style={styles.gradientBackground}
            >
                <MessageModal
                    visible={modalVisible}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    onClose={() => setModalVisible(false)}
                />

                <CustomLoading visible={isLoading} />

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.contentWrapper}>
                        <BrandLogo size={120} textColor="#000000" style={styles.mainLogo} />

                        <View style={styles.formContainer}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Username :</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}>
                                        <Ionicons name="person" size={24} color="#000000" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Type your username"
                                        placeholderTextColor="rgba(255,255,255,0.6)"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Password :</Text>
                                <View style={styles.inputWrapper}>
                                    <View style={styles.iconBox}>
                                        <Ionicons name="lock-closed" size={24} color="#000000" />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Type your password"
                                        placeholderTextColor="rgba(255,255,255,0.6)"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeBtn}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={28} color="rgba(0,0,0,0.5)" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.rowBetween}>
                                <TouchableOpacity
                                    style={styles.checkboxRow}
                                    onPress={() => setRememberMe(!rememberMe)}
                                >
                                    <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                                        {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                                    </View>
                                    <Text style={styles.rememberText}>Remember me</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.submitBtn}
                                onPress={handleLogin}
                                disabled={isLoading}
                            >
                                <LinearGradient
                                    colors={['#FF0000', '#D00000']}
                                    style={styles.submitBtnGradient}
                                >
                                    <Text style={styles.submitBtnText}>SIGN IN</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.footerBranding}>
                            <Text style={styles.footerApp}>Aplikasi Petty Cash Management</Text>
                            <Text style={styles.footerBy}>By <Text style={styles.brandLink}>@evrdayplcs</Text></Text>
                        </View>
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradientBackground: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    contentWrapper: {
        flex: 1,
        padding: 40,
        justifyContent: 'center',
        paddingTop: 80,
    },
    mainLogo: {
        marginBottom: 60,
    },
    formContainer: {
        width: '100%',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 16,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        borderRadius: 4,
        height: 50,
        overflow: 'hidden',
    },
    iconBox: {
        width: 44,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderRightColor: 'rgba(255, 255, 255, 0.2)',
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 18,
        paddingHorizontal: 12,
        fontWeight: '500',
    },
    eyeBtn: {
        paddingHorizontal: 15,
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 22,
        height: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 4,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#FF0000',
        borderColor: '#FF0000',
    },
    rememberText: {
        color: 'rgba(0, 0, 0, 0.5)',
        fontSize: 15,
        fontWeight: '600',
    },
    submitBtn: {
        borderRadius: 100,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    submitBtnGradient: {
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    footerBranding: {
        marginTop: 80,
        alignItems: 'center',
    },
    footerApp: {
        color: 'rgba(0, 0, 0, 0.5)',
        fontSize: 16,
        fontWeight: '500',
    },
    footerBy: {
        color: 'rgba(0, 0, 0, 0.5)',
        fontSize: 14,
        marginTop: 4,
        fontWeight: '500',
    },
    brandLink: {
        color: '#FF0000',
        fontWeight: '700',
    },
});

