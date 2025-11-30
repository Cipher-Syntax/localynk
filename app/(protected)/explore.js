import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }
    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <ExplorePlaces />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff"
    }
});