import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "Petty Cash",
    slug: "petty-cash-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    scheme: "petty-cash",
    splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#020617"
    },
    ios: {
        supportsTablet: true,
        bundleIdentifier: "com.pettycash.app"
    },
    android: {
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon.png",
            backgroundColor: "#020617"
        },
        edgeToEdgeEnabled: true,
        package: "com.pettycash.app",
        permissions: [
            "android.permission.RECORD_AUDIO"
        ]
    },
    web: {
        favicon: "./assets/favicon.png",
        bundler: "metro",
        display: "standalone",
        backgroundColor: "#020617",
        description: "Aplikasi Petty Cash Management"
    },
    plugins: [
        "expo-router",
        "expo-sqlite",
        "expo-secure-store",
        [
            "expo-image-picker",
            {
                "photosPermission": "Aplikasi membutuhkan akses ke galeri untuk upload bukti transaksi.",
                "cameraPermission": "Aplikasi membutuhkan akses kamera untuk mengambil foto bukti transaksi."
            }
        ],
        "@react-native-community/datetimepicker"
    ],
    experiments: {
        typedRoutes: true
    },
    extra: {
        router: {},
        eas: {
            projectId: "a34f3c64-2704-47fb-961e-d93df37c577f"
        },
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
});
