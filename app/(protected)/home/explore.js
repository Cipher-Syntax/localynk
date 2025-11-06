import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { ExplorePlaces } from "../../../components/explore";
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from "react-native-safe-area-context";

export default function Explore() {
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
        <ScrollView>
            <SafeAreaView>
                <ExplorePlaces />
            </SafeAreaView>
        </ScrollView>
    );
}
