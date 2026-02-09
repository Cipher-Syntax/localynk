import React, { useState, useEffect, useCallback } from "react";
import { View, ActivityIndicator, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { Header, FeaturedPlaces, About, HomePlacesBrowse, DiscoverWhatYouWant } from "../../../components/home";
import api from "../../../api/api"; 
import { useAuth } from "../../../context/AuthContext";

const Home = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [destinations, setDestinations] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchAllData = async () => {
        try {
            const [destinationsRes, unreadRes, personalizationRes] = await Promise.all([
                api.get('/api/destinations/'),
                api.get('/api/alerts/unread-count/'),
                api.get('/api/me/').catch(err => ({ data: {} }))
            ]);

            let allDestinations = destinationsRes.data?.results || destinationsRes.data?.data || destinationsRes.data || [];

            const preferences = personalizationRes.data?.preferred_destinations;
            
            const preferredIds = (preferences && Array.isArray(preferences)) 
                ? preferences.map(p => (typeof p === 'object' ? p.id : p))
                : [];
            
            console.log("Fetched Preferences IDs:", preferredIds);
            
            if (allDestinations.length > 0) {
                const sortedByRating = [...allDestinations].sort((a, b) => parseFloat(b.average_rating || 0) - parseFloat(a.average_rating || 0));
                const highestRatedItem = sortedByRating[0];

                let finalOrder = [];
                const processedIds = new Set();

                if (highestRatedItem) {
                    finalOrder.push(highestRatedItem);
                    processedIds.add(highestRatedItem.id);
                }

                const userChoices = allDestinations.filter(item => 
                    preferredIds.includes(item.id) && !processedIds.has(item.id)
                );
                
                userChoices.sort((a, b) => parseFloat(b.average_rating || 0) - parseFloat(a.average_rating || 0));
                
                finalOrder = [...finalOrder, ...userChoices];
                userChoices.forEach(item => processedIds.add(item.id));

                const remaining = allDestinations.filter(item => !processedIds.has(item.id));
                remaining.sort((a, b) => parseFloat(b.average_rating || 0) - parseFloat(a.average_rating || 0));
                
                finalOrder = [...finalOrder, ...remaining];

                setDestinations(finalOrder);
            } else {
                setDestinations([]);
            }

            if (unreadRes.data && unreadRes.data.unread_count !== undefined) {
                setUnreadCount(unreadRes.data.unread_count);
            }
        } 
        catch (error) {
            console.log("Home Error:", error);
            setDestinations([]); 
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [user]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAllData();
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
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00C6FF"]} />}
        >
            <View style={{ paddingBottom: 80 }}>
                <Header destinations={destinations} unreadCount={unreadCount} />
                <FeaturedPlaces data={destinations} isPublic={false} />
                
                <HomePlacesBrowse data={destinations} isPublic={false} />
                
                <DiscoverWhatYouWant isPublic={false} />
                <About />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff", height: "100%" }
});

export default Home;