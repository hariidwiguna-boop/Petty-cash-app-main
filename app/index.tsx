import { Redirect } from "expo-router";
import { useAuthStore } from "../stores/authStore";

export default function Index() {
    const { session, isInitialized, profile } = useAuthStore();

    if (!isInitialized) {
        return null;
    }

    if (session) {
        if (profile?.role === 'Admin') {
            return <Redirect href="/(app)/(tabs)/admin" />;
        }
        return <Redirect href="/(app)/(tabs)" />;
    }

    return <Redirect href="/(auth)/login" />;
}
