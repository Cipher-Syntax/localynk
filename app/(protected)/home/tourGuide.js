import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { IsTourist, Action } from "../../../components/tourist_guide";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";


export default function TourGuide() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#fff"
            }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <Action />
            </ScrollView>
        </SafeAreaView>
    );
}
