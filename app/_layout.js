import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import Toast from "../components/Toast";
import OfflineBanner from "../components/OfflineBanner";
import UpdateBanner from "../components/UpdateBanner";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import useAppUpdate from "../hooks/useAppUpdate";

export default function Layout() {
    const {
        shouldShowUpdateBanner,
        isUpdateDownloading,
        applyUpdate,
        dismissUpdateBanner,
    } = useAppUpdate();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <OfflineBanner />
                <UpdateBanner
                    visible={shouldShowUpdateBanner}
                    isUpdating={isUpdateDownloading}
                    onUpdatePress={applyUpdate}
                    onDismissPress={dismissUpdateBanner}
                />
                
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