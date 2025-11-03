import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../api/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants/constants";
import { jwtDecode } from "jwt-decode";

export default function ProtectedLayout() {
    const [isAuthorized, setIsAuthorized] = useState(null);
    const router = useRouter();

    // const refreshToken = async () => {
    //     try {
    //         const refresh = await AsyncStorage.getItem(REFRESH_TOKEN);
    //         if (!refresh) throw new Error("No refresh token");

    //         const response = await api.post("/api/token/refresh/", { refresh });
    //         await AsyncStorage.setItem(ACCESS_TOKEN, response.data.access);
    //         setIsAuthorized(true);
    //     } catch (error) {
    //         console.log("Failed to refresh token:", error);
    //         setIsAuthorized(false);
    //     }
    // };

    // const checkAuth = async () => {
    //     try {
    //         const token = await AsyncStorage.getItem(ACCESS_TOKEN);
    //         if (!token) {
    //             setIsAuthorized(false);
    //             return;
    //         }

    //         const decoded = jwtDecode(token);
    //         const now = Date.now() / 1000;

    //         if (decoded.exp < now) {
    //             await refreshToken();
    //         } 
    //         else {
    //             setIsAuthorized(true); 
    //         }
    //     } 
    //     catch (error) {
    //         console.log("Auth check error:", error);
    //         setIsAuthorized(false);
    //     }
    // };

    // useEffect(() => {
    //     checkAuth();
    // }, []);

    // useEffect(() => {
    //     if (isAuthorized === false) {
    //         router.replace("/auth/login");
    //     }
    // }, [isAuthorized]);

    // if (isAuthorized === null) {
    //     return (
    //         <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    //             <Text style={{ fontSize: 18, fontWeight: "bold" }}>Loading...</Text>
    //         </View>
    //     );
    // }

    return <Stack screenOptions={{ headerShown: false }} />;
}
