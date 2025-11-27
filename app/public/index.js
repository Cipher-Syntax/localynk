import React, { useState, useEffect, useCallback } from "react";
import { View, ActivityIndicator, ScrollView, RefreshControl, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header, FeaturedPlaces, About, HomePlacesBrowse, DiscoverWhatYouWant } from "../../components/home";
import PublicHeader from "../../components/home/PublicHeader";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";

const PublicHome = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { isAuthenticated } = useAuth();
    
    const [destinations, setDestinations] = useState([]);

    const fetchPublicData = async () => {
        try {
            console.log("Fetching Public Home data...");
            const response = await api.get('/api/destinations/');

            let safeDestinations = [];
            if (Array.isArray(response.data)) {
                safeDestinations = response.data;
            } else if (response.data?.results && Array.isArray(response.data.results)) {
                safeDestinations = response.data.results;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                safeDestinations = response.data.data;
            }

            setDestinations(safeDestinations);

        } catch (error) {
            console.error("Error fetching public data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPublicData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPublicData();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C6FF" />
            </View>
        );
    }

    return (
        <ScrollView
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00C6FF"]} />
            }
        >
            <SafeAreaView>
                {!isAuthenticated ? (
                    <PublicHeader /> 
                ) : (
                    <Header destinations={destinations} unreadCount={0} />
                )}

                <FeaturedPlaces 
                    data={destinations} 
                    isPublic={!isAuthenticated} 
                />
                
                <HomePlacesBrowse 
                    data={destinations} 
                    isPublic={!isAuthenticated} 
                />
                
                <DiscoverWhatYouWant isPublic={!isAuthenticated} />
                
                <About />
            </SafeAreaView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        height: "100%"
    }
});

export default PublicHome;