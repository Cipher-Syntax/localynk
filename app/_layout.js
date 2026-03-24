import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import Toast from "../components/Toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function Layout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="public/index" />
                    <Stack.Screen name="auth/landingPage" />
                    <Stack.Screen name="auth/login" />
                    <Stack.Screen name="auth/register" />
                    <Stack.Screen name="(protected)" />
                </Stack>
                <Toast />
            </AuthProvider>
        </GestureHandlerRootView>
    );
}