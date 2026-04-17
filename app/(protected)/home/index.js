import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, RefreshControl } from "react-native";
import { Header, FeaturedPlaces, About, HomePlacesBrowse, DiscoverWhatYouWant } from "../../../components/home";
import { ScreenSafeArea } from "../../../components";
import api from "../../../api/api"; 
import { useAuth } from "../../../context/AuthContext";
import { useNetworkStatus } from '../../../utils/useNetworkStatus';
import { useFocusEffect } from "expo-router";

const Home = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [destinations, setDestinations] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const isConnected = useNetworkStatus()

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

            // console.log("Fetched Preferences IDs:", preferredIds);

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

    useEffect(() => {
        if (isConnected) {
            console.log("Internet is back! Auto-refreshing data...");
            fetchAllData();
        }
    }, [isConnected])

    useFocusEffect(
        useCallback(() => {
            api.get('/api/alerts/unread-count/')
                .then(res => {
                    if (res.data && res.data.unread_count !== undefined) {
                        setUnreadCount(res.data.unread_count);
                    }
                })
                .catch(err => console.log("Failed to refresh unread count:", err));
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchAllData();
    }, []);

    if (loading) {
        return (
            <ScreenSafeArea statusBarStyle="light-content" edges={[]}>
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={{ height: 120, backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }} />
                    <View style={{ padding: 16, marginTop: 10 }}>
                        <View style={{ height: 24, width: 180, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 16 }} />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={{ width: 280, height: 180, backgroundColor: '#E0E6ED', borderRadius: 16, marginRight: 16 }} />
                            <View style={{ width: 280, height: 180, backgroundColor: '#E0E6ED', borderRadius: 16 }} />
                        </ScrollView>

                        <View style={{ height: 24, width: 150, backgroundColor: '#E0E6ED', borderRadius: 4, marginTop: 30, marginBottom: 16 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <View style={{ width: '64%', height: 220, backgroundColor: '#E0E6ED', borderRadius: 16 }} />
                            <View style={{ width: '33%', justifyContent: 'space-between' }}>
                                <View style={{ height: 105, backgroundColor: '#E0E6ED', borderRadius: 16 }} />
                                <View style={{ height: 105, backgroundColor: '#E0E6ED', borderRadius: 16 }} />
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </ScreenSafeArea>
        );
    }

    return (
        <ScreenSafeArea statusBarStyle="light-content" edges={[]}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
                contentContainerStyle={{ paddingBottom: 0 }}
                keyboardShouldPersistTaps="always"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00C6FF"]} />}
            >
                <View>
                    <Header destinations={destinations} unreadCount={unreadCount} />
                    <FeaturedPlaces data={destinations} isPublic={false} />
                    
                    <HomePlacesBrowse data={destinations} isPublic={false} />
                    
                    <DiscoverWhatYouWant isPublic={false} />
                    <About />
                </View>
            </ScrollView>
        </ScreenSafeArea>
    );
}

export default Home;