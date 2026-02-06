import { Stack } from "expo-router";

export default function AdminLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="approval" />
            <Stack.Screen name="users" />
            <Stack.Screen name="outlets" />
            <Stack.Screen name="reports" />
        </Stack>
    );
}
