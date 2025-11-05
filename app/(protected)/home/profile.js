import { View, Text, ActivityIndicator } from "react-native";
import React, { useState, useEffect } from "react";

export default function Profile() {
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
        <View style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center"
        }}>
            <Text style={{textAlign: "center", fontWeight: 900, fontSize: 30}}>Profile Screen</Text>
        </View>
    );
}
