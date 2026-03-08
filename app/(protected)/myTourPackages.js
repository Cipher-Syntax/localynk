import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Image, 
    ActivityIndicator, 
    Alert,
    RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const MyTourPackages = () => {
    const { user } = useAuth();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [destinations, setDestinations] = useState([]);
    const [myTours, setMyTours] = useState([]);
    const [myAccommodations, setMyAccommodations] = useState([]);
    
    const [expandedDestId, setExpandedDestId] = useState(null);

    // Safely extract arrays from paginated or non-paginated API responses
    const extractArray = (data) => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
    };

    const getImageUrl = (imgPath) => {
        if (!imgPath || typeof imgPath !== 'string') return 'https://via.placeholder.com/300';
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000'; 
        return `${base}${imgPath}`;
    };

    const fetchAllData = async () => {
        if (!user) return;
        try {
            // Fetch raw data
            const [destRes, toursRes, accomRes] = await Promise.all([
                api.get(`/api/guides/${user.id}/destinations/`).catch(() => ({ data: [] })),
                api.get('/api/my-tours/').catch(() => ({ data: [] })),
                api.get('/api/accommodations/list/').catch(() => ({ data: [] }))
            ]);
            
            // Safely parse arrays to prevent .filter or .map crashes
            const fetchedDestinations = extractArray(destRes.data);
            const fetchedTours = extractArray(toursRes.data);
            const fetchedAccommodations = extractArray(accomRes.data);
            
            setDestinations(fetchedDestinations);
            setMyTours(fetchedTours);
            
            // Safely filter accommodations
            const userAccommodations = fetchedAccommodations.filter(acc => 
                acc.host === user.id || (acc.host && acc.host.id === user.id)
            );
            setMyAccommodations(userAccommodations);
            
        } catch (error) {
            console.error('Error fetching tour packages data:', error);
            Alert.alert("Notice", "Could not load all tour packages data right now.");
        }
    };

    const loadData = async () => {
        setLoading(true);
        await fetchAllData();
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAllData();
        setRefreshing(false);
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const toggleExpand = (destId) => {
        setExpandedDestId(expandedDestId === destId ? null : destId);
    };

    const handleDeleteDestination = (destId, destName) => {
        Alert.alert(
            "Remove Destination",
            `Are you sure you want to delete all your tour packages and accommodations for ${destName}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            setLoading(true);
                            
                            const toursToDelete = myTours.filter(t => 
                                t.main_destination === destId || (t.main_destination && t.main_destination.id === destId)
                            );
                            
                            const accomToDelete = myAccommodations.filter(a => 
                                a.destination === destId || (a.destination && a.destination.id === destId)
                            );
                            
                            for (let t of toursToDelete) {
                                await api.delete(`/api/tours/${t.id}/`).catch(() => {});
                            }
                            for (let a of accomToDelete) {
                                await api.delete(`/api/accommodations/${a.id}/`).catch(() => {});
                            }
                            
                            Alert.alert("Success", "Successfully removed from destination.");
                            await fetchAllData(); 
                        } catch (error) {
                            console.error("Delete failed:", error);
                            Alert.alert("Error", "Failed to delete items. Please try again.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderDestinationCard = (dest) => {
        if (!dest || !dest.id) return null;

        const isExpanded = expandedDestId === dest.id;
        
        const destTours = myTours.filter(t => 
            t.main_destination === dest.id || (t.main_destination && t.main_destination.id === dest.id)
        );
        const destAccommodations = myAccommodations.filter(a => 
            a.destination === dest.id || (a.destination && a.destination.id === dest.id)
        );

        let destImage = 'https://via.placeholder.com/300';
        if (dest.images && dest.images.length > 0) {
            destImage = getImageUrl(dest.images[0].image);
        } else if (destTours.length > 0 && destTours[0].stops && destTours[0].stops.length > 0) {
            destImage = getImageUrl(destTours[0].stops[0].image);
        }

        return (
            <View key={`dest-${dest.id}`} style={styles.cardContainer}>
                <TouchableOpacity 
                    style={styles.cardHeader} 
                    onPress={() => toggleExpand(dest.id)}
                    activeOpacity={0.8}
                >
                    <Image source={{ uri: destImage }} style={styles.cardImage} />
                    
                    <View style={styles.cardInfo}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{dest.name || "Unknown Destination"}</Text>
                            <TouchableOpacity 
                                style={styles.deleteButton} 
                                onPress={() => handleDeleteDestination(dest.id, dest.name || "this destination")}
                            >
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.cardDetailRow}>
                            <Ionicons name="location-outline" size={14} color="#64748B" />
                            <Text style={styles.cardDetailText} numberOfLines={1}>{dest.location || "Location not set"}</Text>
                        </View>
                        
                        <View style={styles.cardBottomRow}>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{dest.category || "General"}</Text>
                            </View>
                            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
                        </View>
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <Text style={styles.sectionHeader}>Tour Packages</Text>
                        {destTours.length > 0 ? (
                            destTours.map(tour => (
                                <View key={`tour-${tour.id}`} style={styles.itemRow}>
                                    <Ionicons name="map-outline" size={18} color="#0072FF" style={styles.itemIcon} />
                                    <View style={styles.itemTextContainer}>
                                        <Text style={styles.itemName}>{tour.name || "Unnamed Tour"}</Text>
                                        <Text style={styles.itemSubText}>{tour.duration || "N/A"} • Max {tour.max_group_size || 0} pax</Text>
                                    </View>
                                    <Text style={styles.itemPrice}>₱{tour.price_per_day || "0.00"}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No active tour packages</Text>
                        )}

                        {/* <Text style={[styles.sectionHeader, { marginTop: 15 }]}>Accommodations</Text>
                        {destAccommodations.length > 0 ? (
                            destAccommodations.map(acc => (
                                <View key={`acc-${acc.id}`} style={styles.itemRow}>
                                    <Ionicons name="bed-outline" size={18} color="#10B981" style={styles.itemIcon} />
                                    <View style={styles.itemTextContainer}>
                                        <Text style={styles.itemName}>{acc.title || "Unnamed Stay"}</Text>
                                        <Text style={styles.itemSubText}>{acc.accommodation_type || 'Stay'}</Text>
                                    </View>
                                    <Text style={styles.itemPrice}>₱{acc.price || "0.00"}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No linked accommodations</Text>
                        )} */}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Tour Packages</Text>
                <View style={{ width: 24 }} /> 
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#0072FF" />
                </View>
            ) : (
                <ScrollView 
                    style={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0072FF"]} />
                    }
                >
                    <Text style={styles.pageDescription}>
                        Manage the destinations you operate in. Deleting a destination removes all its associated tour packages and accommodations.
                    </Text>

                    {destinations.length > 0 ? (
                        destinations.map(renderDestinationCard)
                    ) : (
                        <View style={styles.emptyStateContainer}>
                            <Ionicons name="briefcase-outline" size={60} color="#CBD5E1" />
                            <Text style={styles.emptyStateTitle}>No Tour Packages Found</Text>
                            <Text style={styles.emptyStateText}>You haven't set up any tour packages or destinations yet.</Text>
                        </View>
                    )}
                    
                    <View style={{height: 40}} /> 
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default MyTourPackages;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
    scrollContent: { padding: 20 },
    pageDescription: { fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 20 },
    
    cardContainer: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', padding: 12 },
    cardImage: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#E2E8F0' },
    cardInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
    cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', flex: 1, marginRight: 8 },
    deleteButton: { padding: 4 },
    cardDetailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    cardDetailText: { fontSize: 13, color: '#64748B', marginLeft: 4, flex: 1 },
    cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    badge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 11, fontWeight: '600', color: '#0072FF' },
    
    expandedContent: { backgroundColor: '#F8FAFC', padding: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    sectionHeader: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
    itemIcon: { marginRight: 12 },
    itemTextContainer: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    itemSubText: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
    itemPrice: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    emptyText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginLeft: 5 },

    emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyStateTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginTop: 15, marginBottom: 5 },
    emptyStateText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 20 },
});