import { Tabs } from "expo-router";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { display: "none" }, // Hide bottom tabs - GAS style is single page with modals
            }}
        >
            <Tabs.Screen name="index" />
            <Tabs.Screen name="input" />
            <Tabs.Screen name="history" />
            <Tabs.Screen name="reimburse" />
            <Tabs.Screen name="status" />
            <Tabs.Screen name="daily-report" />
            <Tabs.Screen name="profile" />
        </Tabs>
    );
}
