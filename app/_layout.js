import React, { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Text, TextInput, StyleSheet } from "react-native";
import { AuthProvider } from "../context/AuthContext";
import Toast from "../components/Toast";
import OfflineBanner from "../components/OfflineBanner";
import UpdateBanner from "../components/UpdateBanner";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import useAppUpdate from "../hooks/useAppUpdate";

const SPACE_MONO_FONTS = {
    regular: "SpaceMono-Regular",
    italic: "SpaceMono-Italic",
    bold: "SpaceMono-Bold",
    boldItalic: "SpaceMono-BoldItalic",
};
const BOLD_WEIGHT_THRESHOLD = 600;
const NORMAL_FONT_WEIGHT = "normal";
let globalFontDefaultsApplied = false;

const ensureStyleArray = (style) => {
    if (!style) return [];
    return Array.isArray(style) ? style : [style];
};

const isBoldWeight = (fontWeight) => {
    if (!fontWeight) return false;
    if (typeof fontWeight === "number") return fontWeight >= BOLD_WEIGHT_THRESHOLD;
    const normalized = String(fontWeight).toLowerCase();
    if (normalized === "bold") return true;
    const parsed = Number.parseInt(normalized, 10);
    return Number.isFinite(parsed) && parsed >= BOLD_WEIGHT_THRESHOLD;
};

const isItalicStyle = (fontStyle) => String(fontStyle).toLowerCase() === "italic";

const isSpaceMonoFamily = (fontFamily) => {
    if (!fontFamily) return false;
    return String(fontFamily).toLowerCase().startsWith("spacemono");
};

const shouldRespectExternalFont = (fontFamily) => Boolean(fontFamily) && !isSpaceMonoFamily(fontFamily);

// Map fontWeight/fontStyle to Space Mono variants so existing styles keep emphasis.
const resolveSpaceMonoOverride = (style) => {
    const flattened = StyleSheet.flatten(style) || {};
    if (shouldRespectExternalFont(flattened.fontFamily)) return null;

    const isBold = isBoldWeight(flattened.fontWeight);
    const isItalic = isItalicStyle(flattened.fontStyle);

    let fontFamily = SPACE_MONO_FONTS.regular;
    if (isBold && isItalic) fontFamily = SPACE_MONO_FONTS.boldItalic;
    else if (isBold) fontFamily = SPACE_MONO_FONTS.bold;
    else if (isItalic) fontFamily = SPACE_MONO_FONTS.italic;
    else if (flattened.fontFamily && isSpaceMonoFamily(flattened.fontFamily)) {
        fontFamily = flattened.fontFamily === "SpaceMono" ? SPACE_MONO_FONTS.regular : flattened.fontFamily;
    }

    return {
        fontFamily,
        fontWeight: NORMAL_FONT_WEIGHT,
        fontStyle: "normal",
    };
};

const patchComponentRender = (Component, getOverrideStyle) => {
    if (!Component || typeof Component.render !== "function") return;
    if (Component.__spaceMonoPatched) return;

    const originalRender = Component.render;
    Component.render = function (...args) {
        const origin = originalRender.apply(this, args);
        const override = getOverrideStyle(origin.props?.style);
        if (!override) return origin;
        return React.cloneElement(origin, {
            style: [...ensureStyleArray(origin.props?.style), override],
        });
    };

    Component.__spaceMonoPatched = true;
};

const applyGlobalFontDefaults = () => {
    if (globalFontDefaultsApplied) return;
    patchComponentRender(Text, resolveSpaceMonoOverride);
    patchComponentRender(TextInput, resolveSpaceMonoOverride);
    globalFontDefaultsApplied = true;
};

void SplashScreen.preventAutoHideAsync();
applyGlobalFontDefaults();

export default function Layout() {
    const [fontsLoaded, fontError] = useFonts({
        "SpaceMono-Regular": require("../assets/fonts/SpaceMono-Regular.ttf"),
        "SpaceMono-Italic": require("../assets/fonts/SpaceMono-Italic.ttf"),
        "SpaceMono-Bold": require("../assets/fonts/SpaceMono-Bold.ttf"),
        "SpaceMono-BoldItalic": require("../assets/fonts/SpaceMono-BoldItalic.ttf"),
    });
    const {
        shouldShowUpdateBanner,
        isUpdateDownloading,
        applyUpdate,
        dismissUpdateBanner,
    } = useAppUpdate();

    useEffect(() => {
        if (fontsLoaded || fontError) {
            void SplashScreen.hideAsync();
        }
    }, [fontsLoaded, fontError]);

    if (!fontsLoaded && !fontError) {
        return null;
    }

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