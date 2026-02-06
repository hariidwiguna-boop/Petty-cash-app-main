import "../global.css";
import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../stores/authStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { prefetchData } from "../lib/reactQueryHooks";
import { RouteErrorBoundary } from "../components/ErrorBoundary";

// Optimized QueryClient configuration
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error: any) => {
                // Don't retry on 4xx errors
                if (error?.status >= 400 && error?.status < 500) {
                    return false;
                }
                return failureCount < 3;
            },
            staleTime: 5 * 60 * 1000, // 5 minutes default
            gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
            refetchOnWindowFocus: false, // Disable refetch on window focus for mobile
            refetchOnReconnect: true, // Enable refetch on reconnect
        },
        mutations: {
            retry: 1, // Retry mutations once
        },
    },
});

// ============================================
// AUTH GUARD
// ============================================
function AuthGuard({ children }: { children: React.ReactNode }) {
    const { session, isLoading, isInitialized, initialize } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (!isInitialized) {
            initialize();
        }
    }, [isInitialized]);

    useEffect(() => {
        if (!isInitialized || isLoading) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!session && !inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace("/(auth)/login");
        } else if (session && inAuthGroup) {
            // Redirect to main app if authenticated
            router.replace("/(app)/(tabs)");
        }
    }, [session, isInitialized, isLoading, segments]);

    if (!isInitialized || isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#16a34a" />
            </View>
        );
    }

    return <>{children}</>;
}

// ============================================
// ROOT LAYOUT
// ============================================
export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <RouteErrorBoundary>
                    <AuthGuard>
                        <StatusBar style="auto" />
                        <Slot />
                    </AuthGuard>
                </RouteErrorBoundary>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}

