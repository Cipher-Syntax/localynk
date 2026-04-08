import { View } from "react-native";
import { ExplorePlaces } from '../../components/explore'
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
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={{ height: 120, backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }} />
                <View style={{ padding: 16 }}>
                    <View style={{ height: 45, backgroundColor: '#E0E6ED', borderRadius: 10, marginBottom: 16 }} />
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                        <View style={{ flex: 1, height: 40, backgroundColor: '#E0E6ED', borderRadius: 20 }} />
                        <View style={{ flex: 1, height: 40, backgroundColor: '#E0E6ED', borderRadius: 20 }} />
                    </View>
                    <View style={{ width: '100%', height: 280, backgroundColor: '#E0E6ED', borderRadius: 15, marginBottom: 16 }} />
                    <View style={{ width: '100%', height: 280, backgroundColor: '#E0E6ED', borderRadius: 15 }} />
                </View>
            </View>
        );
    }
    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
                <ExplorePlaces />
            </SafeAreaView>
        </View>
    );
}
