import React, { useState, useCallback, useMemo } from 'react'; 
import { View, ScrollView, StyleSheet, StatusBar, Image, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User, Calendar as CalendarIcon, Map, Star, Compass, Clock, Languages, Package, MapPin, Bed, Wifi, Car, Coffee, CheckCircle } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import api from '../../api/api';

const { width } = Dimensions.get('window');

const TouristGuideDetails = () => {
    const [guide, setGuide] = useState(null);
    const [destination, setDestination] = useState(null);
    const [tourPackages, setTourPackages] = useState([]); 
    const [accommodations, setAccommodations] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [blockedDates, setBlockedDates] = useState([]); 

    const router = useRouter();
    const params = useLocalSearchParams();
    const { guideId, placeId } = params;

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                if (!guideId || !placeId) return;
                
                try {
                    const [guideRes, destRes, toursRes, accomRes, blockedRes] = await Promise.all([
                        api.get(`/api/guides/${guideId}/`),
                        api.get(`/api/destinations/${placeId}/`),
                        api.get(`/api/destinations/${placeId}/tours/`),
                        api.get(`/api/accommodations/`, { params: { host_id: guideId } }),
                        api.get(`/api/bookings/guide_blocked_dates/`, { params: { guide_id: guideId } }) 
                    ]);

                    setGuide(guideRes.data);
                    setDestination(destRes.data);
                    setBlockedDates(blockedRes.data || []);
                    
                    const allAccoms = Array.isArray(accomRes.data) ? accomRes.data : (accomRes.data.results || []);
                    const guidesTours = toursRes.data.filter(tour => tour.guide === parseInt(guideId));
                    
                    // Filter accommodations relevant to the itinerary
                    const itineraryAccomIds = new Set();
                    guidesTours.forEach(tour => {
                        let timeline = [];
                        try {
                            timeline = typeof tour.itinerary_timeline === 'string' 
                                ? JSON.parse(tour.itinerary_timeline) 
                                : tour.itinerary_timeline;
                        } catch(e) {}
                        if (Array.isArray(timeline)) {
                            timeline.forEach(item => {
                                if (item.type === 'accom' && item.refId) {
                                    itineraryAccomIds.add(parseInt(item.refId));
                                }
                            });
                        }
                    });
                    
                    // If no specific accoms in timeline, show all guide's accoms
                    const relevantAccoms = itineraryAccomIds.size > 0 
                        ? allAccoms.filter(acc => itineraryAccomIds.has(acc.id))
                        : allAccoms;

                    setAccommodations(relevantAccoms);
                    setTourPackages(guidesTours);

                } catch (error) {
                    console.error('Failed to fetch page data:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [guideId, placeId])
    );

    const getImageUrl = (imgPath) => {
        if (!imgPath) return 'https://via.placeholder.com/300';
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000'; 
        return `${base}${imgPath}`;
    };

    const renderTimeline = (rawTimeline, tourContext) => {
         if (!rawTimeline) return null;
         let timelineData = [];
         try { timelineData = typeof rawTimeline === 'string' ? JSON.parse(rawTimeline) : rawTimeline; } catch (e) { return null; }
         if (!Array.isArray(timelineData) || timelineData.length === 0) return null;

         return (
             <View style={styles.timelineContainer}>
                 {timelineData.map((item, index) => {
                     let imageUrl = null;
                     // Logic to find image for the timeline item
                     if (item.type === 'stop' && tourContext?.stops) {
                         // Fallback logic to match stop name or ID if available
                         // Note: The backend might not send 'stops' array in the same structure, 
                         // so we rely on what is available or show placeholder.
                     } else if (item.type === 'accom') {
                          const acc = accommodations.find(a => a.id === parseInt(item.refId));
                          if (acc) imageUrl = getImageUrl(acc.photo);
                     }
                     return (
                         <View key={index} style={styles.timelineItem}>
                             <View style={styles.timeColumn}>
                                 <Text style={styles.timeText}>{item.startTime}</Text>
                                 <View style={styles.timeConnector} />
                             </View>
                             <View style={styles.activityCard}>
                                 <View style={styles.activityHeader}>
                                     <View style={[
                                         styles.activityDot, 
                                         { backgroundColor: item.type === 'accom' ? '#8E44AD' : '#00A8FF' }
                                     ]} />
                                     <Text style={styles.activityTitle}>{item.activityName}</Text>
                                 </View>
                                 <Text style={styles.activityDuration}>
                                     {item.startTime} - {item.endTime}
                                 </Text>
                                 <View style={styles.typeBadge}>
                                     <Text style={styles.typeText}>
                                         {item.type === 'accom' ? 'Accommodation' : 'Stop / Activity'}
                                     </Text>
                                 </View>
                             </View>
                         </View>
                     );
                 })}
             </View>
         );
    };

    const markedDates = useMemo(() => {
        if (!guide) return {};
        const marked = {};
        
        (guide.specific_available_dates || []).forEach(date => {
            marked[date] = { selected: true, marked: true, selectedColor: '#00A8FF', disabled: true, disableTouchEvent: true };
        });

        blockedDates.forEach(date => {
            marked[date] = { 
                selected: true, 
                selectedColor: '#FFEBEE', 
                marked: true, 
                dotColor: 'red',
                disabled: true, 
                disableTouchEvent: true 
            };
        });

        return marked;
    }, [guide, blockedDates]);

    if (loading || !guide) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A8FF" />
            </View>
        );
    }
    
    // Select the main tour package (usually the first one for this destination)
    const selectedTour = tourPackages.length > 0 ? tourPackages[0] : null;
    
    // Determine Inclusions
    let safeInclusions = ["Standard Guide Services"];
    if (selectedTour) {
        if (Array.isArray(selectedTour.inclusions) && selectedTour.inclusions.length > 0) safeInclusions = selectedTour.inclusions;
        else if (selectedTour.what_to_bring) {
             if (Array.isArray(selectedTour.what_to_bring)) safeInclusions = selectedTour.what_to_bring;
             else if (typeof selectedTour.what_to_bring === 'string') safeInclusions = [selectedTour.what_to_bring];
        }
    }

    let finalImage = null;
    if (destination?.images?.length > 0) finalImage = destination.images[0].image;
    else if (selectedTour && selectedTour.stops?.length > 0) finalImage = selectedTour.stops[0].image;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <SafeAreaView edges={['top']} style={{backgroundColor: '#fff'}}>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                
                <View style={styles.header}>
                    <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']} style={styles.overlay} />
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                         <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>GUIDE DETAILS</Text>
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.guideCard}>
                        {/* Profile Info */}
                        <View style={styles.cardProfileSection}>
                            <View style={styles.iconWrapper}>
                                {guide.profile_picture ? <Image source={{ uri: getImageUrl(guide.profile_picture) }} style={styles.profilePicture} /> : <User size={40} color="#fff" />}
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.guideName}>{guide.first_name} {guide.last_name}</Text>
                                <Text style={styles.guideAddress}>{guide.location}</Text>
                                <View style={styles.ratingContainer}><Star size={14} color="#C99700" /><Text style={styles.guideRating}>{guide.guide_rating}</Text></View>
                            </View>
                        </View>

                        {/* Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.actionButton} onPress={() => router.push({ pathname: "/profile", params: { userId: guide.id, placeId: placeId } })}>
                                <Ionicons name="person" size={14} color="#fff" />
                                <Text style={styles.actionButtonText}>View Profile</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.actionButton} 
                                onPress={() => router.push({ 
                                    pathname: "/(protected)/message", 
                                    params: { 
                                        partnerId: guide.id, 
                                        partnerName: `${guide.first_name} ${guide.last_name}`,
                                        partnerImage: guide.profile_picture || null 
                                    } 
                                })}
                            >
                                <Ionicons name="chatbubble" size={14} color="#fff" />
                                <Text style={styles.actionButtonText}>Send Message</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Destination Image */}
                        <View style={styles.destinationImageContainer}>
                            {finalImage ? <Image source={{uri: getImageUrl(finalImage)}} style={styles.destinationImage} /> : <View style={[styles.destinationImage, {backgroundColor: '#ccc'}]} />}
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.imageOverlay}/>
                            <Text style={styles.destinationName}>{destination?.name || "Loading..."}</Text>
                        </View>
                        
                        {/* --- NEW: TOUR DETAILS SECTION --- */}
                        <View style={styles.detailsSection}>
                            <View style={styles.sectionHeader}>
                                <Map size={18} color="#1A2332" />
                                <Text style={styles.detailsHeader}>
                                    {selectedTour ? selectedTour.name : "Guide's Plan"}
                                </Text>
                            </View>
                            
                            {/* Description */}
                            <Text style={styles.bodyText}>
                                {selectedTour ? selectedTour.description : "No specific tour details available."}
                            </Text>

                            <View style={styles.divider} />

                            {/* Timeline */}
                            <Text style={styles.subHeader}>Itinerary Schedule</Text>
                            {selectedTour && selectedTour.itinerary_timeline ? (
                                renderTimeline(selectedTour.itinerary_timeline, selectedTour)
                            ) : (
                                <Text style={styles.emptyText}>No detailed timeline available.</Text>
                            )}

                            <View style={styles.divider} />
                            
                            {/* Inclusions */}
                            <Text style={styles.subHeader}>Inclusions & Requirements</Text>
                            <View style={styles.inclusionsContainer}>
                                {safeInclusions.map((item, index) => (
                                    <View key={index} style={styles.inclusionTag}>
                                        <CheckCircle size={12} color="#28A745" />
                                        <Text style={styles.inclusionText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* --- NEW: ACCOMMODATIONS SECTION --- */}
                        {accommodations.length > 0 && (
                            <View style={[styles.detailsSection, {borderTopWidth: 0, marginTop: 0}]}>
                                <View style={styles.sectionHeader}>
                                    <Bed size={18} color="#1A2332" />
                                    <Text style={styles.detailsHeader}>Accommodation</Text>
                                </View>
                                <Text style={styles.highlightText}>Available Options</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accScroll}>
                                    {accommodations.map((acc, index) => (
                                        <View key={index} style={styles.accCard}>
                                            <Image source={{ uri: getImageUrl(acc.photo || acc.image) }} style={styles.accImage} />
                                            <View style={styles.accOverlay} />
                                            <View style={styles.accInfo}>
                                                <Text style={styles.accTitle} numberOfLines={1}>{acc.title || acc.name || "Stay"}</Text>
                                                <Text style={styles.accPrice}>
                                                    {acc.price ? `₱${acc.price}` : "Included"}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Calendar */}
                        <View style={styles.detailsSection}>
                            <View style={styles.sectionHeader}>
                                <CalendarIcon size={18} color="#1A2332" />
                                <Text style={styles.detailsHeader}>Availability</Text>
                            </View>
                            <Text style={styles.detailLabel}>Weekly Schedule:</Text>
                            <View style={styles.availabilityContainer}>
                                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => {
                                    const isAvailable = (guide.available_days || []).includes(day) || (guide.available_days || []).includes("All");
                                    return (
                                        <View key={index} style={[styles.dayBadge, isAvailable ? styles.dayAvailable : styles.dayUnavailable]}>
                                            <Text style={[styles.dayText, isAvailable ? styles.dayTextAvailable : styles.dayTextUnavailable]}>{day.charAt(0)}</Text>
                                        </View>
                                    );
                                })}
                            </View>
                            <Text style={[styles.detailLabel, {marginTop: 15, marginBottom: 10}]}>Full Calendar:</Text>
                            <View style={styles.calendarContainer}>
                                <Calendar
                                    current={new Date().toISOString().split('T')[0]}
                                    markedDates={markedDates}
                                    disabledByDefault={true}
                                    disableAllTouchEventsForDisabledDays={true}
                                    theme={{
                                        calendarBackground: '#fff',
                                        textSectionTitleColor: '#8B98A8',
                                        todayTextColor: '#00A8FF',
                                        dayTextColor: '#1A2332',
                                        textDisabledColor: '#d9e1e8',
                                        arrowColor: '#00A8FF',
                                    }}
                                    style={styles.calendarStyle}
                                />
                                <View style={styles.legendContainer}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.dot, { backgroundColor: '#00A8FF' }]} />
                                        <Text style={styles.legendText}>Available</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.dot, { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#D32F2F' }]} />
                                        <Text style={styles.legendText}>Booked</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.bookButton} 
                            activeOpacity={0.8} 
                            onPress={() => {
                                let finalAccomPrice = 0;
                                let accomName = null;
                                let accomId = null;
                                if (accommodations.length > 0) {
                                    const acc = accommodations[0];
                                    finalAccomPrice = parseFloat(acc.price || 0);
                                    accomName = acc.title;
                                    accomId = acc.id;
                                }
                                const tourPrice = selectedTour ? parseFloat(selectedTour.price_per_day || 0) : parseFloat(guide.price_per_day || 0);
                                const soloPrice = selectedTour ? parseFloat(selectedTour.solo_price || 0) : parseFloat(guide.solo_price_per_day || 0);
                                const extraFee = selectedTour ? parseFloat(selectedTour.additional_fee_per_head || 0) : parseFloat(guide.multiple_additional_fee_per_head || 0);

                                router.push({ 
                                    pathname: "/(protected)/payment",
                                    params: { 
                                        guideId: guide.id,
                                        guideName: `${guide.first_name} ${guide.last_name}`,
                                        basePrice: tourPrice, 
                                        soloPrice: soloPrice,
                                        accommodationPrice: finalAccomPrice, 
                                        accommodationId: accomId, 
                                        accommodationName: accomName,
                                        additionalFee: extraFee,
                                        tourPackageId: selectedTour ? selectedTour.id : null,
                                        placeId: placeId,
                                    } 
                                });
                            }}
                        >
                            <Text style={styles.bookButtonText}>BOOK NOW</Text>
                        </TouchableOpacity>
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
    backButton: { position: 'absolute', top: 20, left: 20, padding: 5, zIndex: 10 },
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
    
    // NEW & UPDATED STYLES FOR ITINERARY
    bodyText: { fontSize: 14, color: '#555', lineHeight: 22 },
    subHeader: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8, marginTop: 10 },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
    emptyText: { fontSize: 13, color: '#888', fontStyle: 'italic' },
    
    timelineContainer: { marginTop: 10 },
    timelineItem: { flexDirection: 'row', marginBottom: 15 },
    timeColumn: { width: 70, alignItems: 'center', paddingRight: 10 },
    timeText: { fontSize: 12, fontWeight: '700', color: '#1A2332' },
    timeConnector: { flex: 1, width: 1, backgroundColor: '#E0E6ED', marginTop: 4 },
    activityCard: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E0E6ED' },
    activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    activityTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
    activityDuration: { fontSize: 11, color: '#888', marginBottom: 6 },
    typeBadge: { alignSelf: 'flex-start', backgroundColor: '#F5F7FA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#eee' },
    typeText: { fontSize: 10, color: '#666', fontWeight: '600' },

    inclusionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    inclusionTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FFF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4, borderWidth: 1, borderColor: '#C3E6CB' },
    inclusionText: { fontSize: 11, color: '#155724', fontWeight: '600' },

    // Accommodations
    accScroll: { marginTop: 5 },
    accCard: { width: 140, marginRight: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee', overflow: 'hidden', position: 'relative', height: 100 },
    accImage: { width: '100%', height: '100%' },
    accOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, backgroundColor: 'rgba(0,0,0,0.4)' },
    accInfo: { position: 'absolute', bottom: 8, left: 8, right: 8 },
    accTitle: { fontSize: 12, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 2 },
    accPrice: { fontSize: 10, color: '#00A8FF', fontWeight: '700', marginTop: 2 },
    highlightText: { fontSize: 12, color: '#00A8FF', fontStyle: 'italic', marginBottom: 10, fontWeight: '600' },

    detailLabel: { fontWeight: '600', color: '#1A2332' },
    calendarContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#eee' },
    calendarStyle: { borderRadius: 8, overflow: 'hidden' },
    legendContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12, color: '#666' },
    bookButton: { backgroundColor: '#00A8FF', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginVertical: 20, shadowColor: "#00A8FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    bookButtonText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
});

export default TouristGuideDetails;