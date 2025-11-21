import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, Image, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User, Calendar as CalendarIcon, Map, Star, Compass, Clock, Languages, Package, MapPin } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { Calendar } from 'react-native-calendars'; // Keeping for specific dates if needed later

const { width } = Dimensions.get('window');

const GuideProfile = () => {
    const [guide, setGuide] = useState(null);
    const [destination, setDestination] = useState(null); // Added
    const [tourPackage, setTourPackage] = useState(null); // Added
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { userId, placeId } = params; // Now expecting placeId

    useEffect(() => {
        const fetchData = async () => {
            if (!userId || !placeId) { // Now depends on placeId
                setLoading(false);
                return;
            }
            try {
                const [guideRes, destRes, toursRes] = await Promise.all([
                    api.get(`/api/guides/${userId}/`),
                    api.get(`/api/destinations/${placeId}/`), // Fetch destination
                    api.get(`/api/destinations/${placeId}/tours/`) // Fetch tours
                ]);

                setGuide(guideRes.data);
                setDestination(destRes.data);
                
                // Find the specific tour package by this guide
                const specificTour = toursRes.data.find(tour => tour.guide === parseInt(userId)); 
                setTourPackage(specificTour);

            } catch (error) {
                console.error('Failed to fetch page data for profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, placeId]); // Dependencies now include placeId

    const renderAvailability = (guideDays) => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const shortDays = ["M", "T", "W", "T", "F", "S", "S"];
        const safeGuideDays = guideDays || [];

        return (
            <View style={styles.availabilityContainer}>
                {days.map((day, index) => {
                    const isAvailable = safeGuideDays.includes(day) || safeGuideDays.includes("All");
                    return (
                        <View 
                            key={index} 
                            style={[
                                styles.dayBadge, 
                                isAvailable ? styles.dayAvailable : styles.dayUnavailable
                            ]}
                        >
                            <Text style={[
                                styles.dayText, 
                                isAvailable ? styles.dayTextAvailable : styles.dayTextUnavailable
                            ]}>
                                {shortDays[index]}
                            </Text>
                        </View>
                    );
                })}
            </View>
        );
    };
    
    if (loading || !guide) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A8FF" />
            </View>
        );
    }

    const markedDates = (guide.specific_available_dates || []).reduce((acc, dateString) => {
        acc[dateString] = { selected: true, marked: true, selectedColor: '#00A8FF' };
        return acc;
    }, {});

    // --- IMPROVED IMAGE LOGIC (copied from TouristGuideDetails) ---
    let finalImage = null;
    if (destination?.images?.length > 0) {
        finalImage = destination.images[0].image;
    } else if (tourPackage?.stops?.length > 0) {
        finalImage = tourPackage.stops[0].image;
    }
    // ----------------------------

    return (
        <ScrollView style={styles.container}>
            <SafeAreaView edges={['top']}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                
                <View style={styles.header}>
                    <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']} style={styles.overlay} />
                    <Text style={styles.headerTitle}>GUIDE DETAILS</Text>
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.guideCard}>
                        
                        {/* Profile Header */}
                        <View style={styles.cardProfileSection}>
                            <View style={styles.iconWrapper}>
                                {guide.profile_picture ? (
                                    <Image source={{ uri: guide.profile_picture }} style={styles.profilePicture} />
                                ) : (
                                    <User size={40} color="#fff" />
                                )}
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.guideName}>{guide.first_name} {guide.last_name}</Text>
                                <Text style={styles.guideAddress}>{guide.location}</Text>
                                <View style={styles.ratingContainer}>
                                    <Star size={14} color="#C99700" />
                                    <Text style={styles.guideRating}>{guide.guide_rating}</Text>
                                </View>
                            </View>
                            <Ionicons name="heart-outline" size={22} color="#FF5A5F" />
                        </View>

                        {/* Action Buttons (Removed the "View Profile" button from here, as we are already on the profile) */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.actionButton} onPress={() => router.push({ pathname: "/(protected)/message", params: { partnerId: guide.id, partnerName: `${guide.first_name} ${guide.last_name}` } })}>
                                <Ionicons name="chatbubble" size={14} color="#fff" />
                                <Text style={styles.actionButtonText}>Send Message</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Destination Image (Copied from TouristGuideDetails) */}
                        <View style={styles.destinationImageContainer}>
                            {finalImage ? (
                                <Image source={{uri: finalImage}} style={styles.destinationImage} />
                            ) : (
                                <View style={[styles.destinationImage, {backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center'}]}>
                                    <Text>No Image Available</Text>
                                </View>
                            )}
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.imageOverlay}/>
                            <Text style={styles.destinationName}>{destination?.name || "Loading..."}</Text>
                        </View>
                        
                        {/* Tour Package Section (Copied from TouristGuideDetails) */}
                        {tourPackage && (
                             <View style={styles.detailsSection}>
                                <View style={styles.sectionHeader}>
                                   <Package size={18} color="#1A2332" />
                                   <Text style={styles.detailsHeader}>Tour Package: {tourPackage.name}</Text>
                                </View>
                                <Text style={styles.itineraryText}>{tourPackage.description}</Text>

                                <View style={styles.packageDetailsGrid}>
                                    <View style={styles.packageDetailItem}>
                                        <Clock size={14} color="#8B98A8"/>
                                        <Text style={styles.packageDetailText}>{tourPackage.duration}</Text>
                                    </View>
                                     <View style={styles.packageDetailItem}>
                                        <User size={14} color="#8B98A8"/>
                                        <Text style={styles.packageDetailText}>Max {tourPackage.max_group_size} people</Text>
                                    </View>
                                </View>
                                
                                <Text style={styles.subHeader}>What to Bring:</Text>
                                <Text style={styles.itineraryText}>{tourPackage.what_to_bring}</Text>
                            </View>
                        )}

                        {/* Tour Stops Section (Copied from TouristGuideDetails) */}
                        {tourPackage?.stops && tourPackage.stops.length > 0 && (
                            <View style={styles.detailsSection}>
                                 <View style={styles.sectionHeader}>
                                   <MapPin size={18} color="#1A2332" />
                                   <Text style={styles.detailsHeader}>Tour Stops</Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stopsScrollView}>
                                    {tourPackage.stops.map(stop => (
                                        <View key={stop.id} style={styles.stopCard}>
                                            <Image source={{uri: stop.image}} style={styles.stopImage} />
                                            <Text style={styles.stopName}>{stop.name}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Guide Details Section */}
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsHeader}>Guide Details</Text>
                            <View style={styles.infoItem}><Languages size={16} color="#1A2332" /><Text style={styles.detailText}><Text style={styles.detailLabel}>Language: </Text>{Array.isArray(guide.languages) ? guide.languages.join(', ') : guide.languages}</Text></View>
                            <View style={styles.infoItem}><Compass size={16} color="#1A2332" /><Text style={styles.detailText}><Text style={styles.detailLabel}>Specialty: </Text>{guide.specialty}</Text></View>
                            <View style={styles.infoItem}><Clock size={16} color="#1A2332" /><Text style={styles.detailText}><Text style={styles.detailLabel}>Experience: </Text>{guide.experience_years} years</Text></View>
                        </View>

                        {/* Availability Section */}
                        <View style={styles.detailsSection}>
                            <View style={styles.sectionHeader}>
                                <CalendarIcon size={18} color="#1A2332" />
                                <Text style={styles.detailsHeader}>Availability</Text>
                            </View>
                            <Text style={styles.detailLabel}>General Weekly Availability:</Text>
                            {renderAvailability(guide.available_days)}
                            <Text style={[styles.detailLabel, {marginTop: 10}]}>Specific Available Dates:</Text>
                            <Calendar
                                current={new Date().toISOString().split('T')[0]}
                                markedDates={markedDates}
                                disabledByDefault={true}
                                theme={{
                                    calendarBackground: '#F5F7FA',
                                    textSectionTitleColor: '#8B98A8',
                                    todayTextColor: '#00A8FF',
                                    dayTextColor: '#1A2332',
                                    textDisabledColor: '#d9e1e8'
                                }}
                            />
                        </View>
                        
                        {/* Removed Book Button from GuideProfile */}
                    </View>
                </View>
            </SafeAreaView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    contentContainer: { padding: 16 },
    guideCard: { backgroundColor: '#F5F7FA', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#E0E6ED' },
    cardProfileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    iconWrapper: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1A2332', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    profilePicture: { width: '100%', height: '100%' },
    profileInfo: { flex: 1, marginLeft: 12 },
    guideName: { fontSize: 18, fontWeight: '700', color: '#1A2332' },
    guideAddress: { fontSize: 13, color: '#8B98A8', marginTop: 4 },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    guideRating: { fontSize: 13, color: '#C99700', marginLeft: 4 },
    availabilityContainer: { flexDirection: 'row', gap: 4, marginTop: 4, marginBottom: 10 },
    dayBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    dayAvailable: { backgroundColor: '#28A745' },
    dayUnavailable: { backgroundColor: '#E0E0E0' },
    dayText: { fontSize: 10, fontWeight: '700' },
    dayTextAvailable: { color: '#fff' },
    dayTextUnavailable: { color: '#A0A0A0' },
    buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    actionButton: { flex: 1, backgroundColor: '#00A8FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
    actionButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    destinationImageContainer: { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
    destinationImage: { width: '100%', height: '100%' },
    imageOverlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    destinationName: { position: 'absolute', bottom: 10, left: 10, color: '#fff', fontSize: 20, fontWeight: 'bold' },
    detailsSection: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#E0E6ED' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    detailsHeader: { fontSize: 16, fontWeight: '700', color: '#1A2332', marginLeft: 8 },
    subHeader: { fontSize: 14, fontWeight: '600', color: '#1A2332', marginTop: 10, marginBottom: 5 },
    packageDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginVertical: 10 },
    packageDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    packageDetailText: { fontSize: 13, color: '#1A2332' },
    stopsScrollView: { paddingVertical: 10 },
    stopCard: { marginRight: 15, width: 150 },
    stopImage: { width: 150, height: 100, borderRadius: 8 },
    stopName: { marginTop: 5, fontSize: 13, fontWeight: '600', color: '#1A2332' },
    infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    detailText: { fontSize: 14, color: '#1A2332', marginLeft: 10 },
    detailLabel: { fontWeight: '600', color: '#1A2332' },
    itineraryText: { fontSize: 14, color: '#555', lineHeight: 20 },
    bookButton: { backgroundColor: '#00A8FF', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginVertical: 20, shadowColor: "#00A8FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    bookButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    messageButton: { backgroundColor: '#00A8FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6, marginTop: 20 },
    messageButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

export default GuideProfile;