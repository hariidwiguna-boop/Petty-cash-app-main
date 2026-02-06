import { Redirect } from "expo-router";
import { useAuthStore } from "../stores/authStore";

export default function Index() {
    const { session, isInitialized } = useAuthStore();

    if (!isInitialized) {
        return null;
    }

    if (session) {
        return <Redirect href="/(app)/(tabs)" />;
    }

    return <Redirect href="/(auth)/login" />;
}
