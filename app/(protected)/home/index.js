import React, { useState, useEffect, useCallback } from "react";
import { View, ActivityIndicator, ScrollView, RefreshControl, StyleSheet, Text } from "react-native";
import { Header, FeaturedPlaces, About, HomePlacesBrowse, DiscoverWhatYouWant } from "../../../components/home";
import api from "../../../api/api"; 

const Home = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [destinations, setDestinations] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchAllData = async () => {

        try {
            const [destinationsRes, unreadRes] = await Promise.all([
                api.get('/api/destinations/'),
                api.get('/api/alerts/unread-count/')
            ]);

            console.log("API: Success. Items found:", destinationsRes.data?.length || "Unknown structure");

            let safeDestinations = [];
            if (Array.isArray(destinationsRes.data)) {
                safeDestinations = destinationsRes.data;
            } else if (destinationsRes.data?.results && Array.isArray(destinationsRes.data.results)) {
                safeDestinations = destinationsRes.data.results;
            } else if (destinationsRes.data?.data && Array.isArray(destinationsRes.data.data)) {
                safeDestinations = destinationsRes.data.data;
            }

            setDestinations(safeDestinations);

            if (unreadRes.data && unreadRes.data.unread_count !== undefined) {
                setUnreadCount(unreadRes.data.unread_count);
            }

        } catch (error) {
            console.error("API ERROR: Fetch failed", error);
            // setDestinations([]); 
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAllData();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C6FF" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading Experiences...</Text>
            </View>
        );
    }

    return (
        <ScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00C6FF"]} />
            }
        >
            <View style={{ paddingBottom: 80 }}>
                <Header 
                    destinations={destinations} 
                    unreadCount={unreadCount} 
                />

                <FeaturedPlaces 
                    data={destinations} 
                    isPublic={false} 
                />

                <HomePlacesBrowse 
                    data={destinations} 
                    isPublic={false} 
                />

                <DiscoverWhatYouWant isPublic={false} />
                <About />
            </View>
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

export default Home;