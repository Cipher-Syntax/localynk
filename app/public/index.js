import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, RefreshControl} from "react-native";
import { Header, FeaturedPlaces, About, HomePlacesBrowse, DiscoverWhatYouWant } from "../../components/home";
import PublicHeader from "../../components/home/PublicHeader";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/api";
import { useRouter, useFocusEffect } from "expo-router";
import { useNetworkStatus } from "../../utils/useNetworkStatus";

const PublicHome = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    
    const [destinations, setDestinations] = useState([]);
    const isConnected = useNetworkStatus();
    
    useFocusEffect(
        useCallback(() => {
            if (isAuthenticated) {
                router.replace('/(protected)/home');
            }
        }, [isAuthenticated, router])
    );

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

    useEffect(() => {
        fetchPublicData();
    }, [isConnected])

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPublicData();
    }, []);

    if (loading) {
        return (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={{ height: 380, backgroundColor: '#E0E6ED' }} />
                
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
        );
    }

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00C6FF"]} />
            }
        >
            <View style={{ paddingBottom: 40 }}>
                {!isAuthenticated ? (
                    <PublicHeader destinations={destinations} /> 
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
            </View>
        </ScrollView>
    );
}

export default PublicHome;