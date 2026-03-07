import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { Notifications } from "../../components/notifications";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Notification() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={{ height: 120, backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25, marginBottom: 16 }} />
                <View style={{ paddingHorizontal: 16 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E6ED', marginRight: 16 }} />
                            <View style={{ flex: 1, gap: 8 }}>
                                <View style={{ width: '80%', height: 16, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                                <View style={{ width: '50%', height: 12, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                            </View>
                        </View>
                    ))}
                </View>
            </View>
        );
    }
    return (
        <ScrollView>
            <SafeAreaView>
                <Notifications />
            </SafeAreaView>
        </ScrollView>
    );
}