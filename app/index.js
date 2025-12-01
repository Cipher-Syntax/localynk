import { Redirect } from "expo-router";
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from "../context/AuthContext";

export default function Index() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    if (isAuthenticated) {
        return <Redirect href="/(protected)/home" />;
    }

    return <Redirect href="/auth/landingPage" />;
}