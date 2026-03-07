import { Redirect } from "expo-router";
import { View } from 'react-native';
import { useAuth } from "../context/AuthContext";

export default function Index() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                {/* Generic Splash / Shell Skeleton */}
                <View style={{ height: 120, backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }} />
                <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ width: 120, height: 120, borderRadius: 24, backgroundColor: '#E0E6ED', marginBottom: 20 }} />
                    <View style={{ width: 180, height: 20, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 10 }} />
                    <View style={{ width: 140, height: 16, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                </View>
            </View>
        );
    }

    if (isAuthenticated) {
        return <Redirect href="/(protected)/home" />;
    }

    return <Redirect href="/auth/landingPage" />;
}