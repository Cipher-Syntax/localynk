import React, { useState, useCallback, useMemo } from 'react'; // Added useCallback
import { View, ScrollView, StyleSheet, StatusBar, Image, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User, Calendar as CalendarIcon, Map, Star, Compass, Clock, Languages, Package, MapPin, Bed, Wifi, Car, Coffee } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'; // Added useFocusEffect
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

    // --- REPLACED useEffect with useFocusEffect ---
    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                if (!guideId || !placeId) return;
                
                // Optional: Keep loading true if you want a spinner every time, 
                // or remove this line if you want silent updates
                // setLoading(true); 

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
                    
                    // ... (Logic to filter accommodations same as before) ...
                    const allAccoms = Array.isArray(accomRes.data) ? accomRes.data : (accomRes.data.results || []);
                    const guidesTours = toursRes.data.filter(tour => tour.guide === parseInt(guideId));
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
                    const relevantAccoms = allAccoms.filter(acc => itineraryAccomIds.has(acc.id));
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

    // ... (Keep renderTimeline, markedDates, and the rest of the return statement EXACTLY as they were) ...
    // ...
    // (I am omitting the duplicate render code to save space, but you should keep the existing UI code)

    const renderTimeline = (rawTimeline, tourContext) => {
         // ... (Keep existing code)
         if (!rawTimeline) return null;
         let timelineData = [];
         try { timelineData = typeof rawTimeline === 'string' ? JSON.parse(rawTimeline) : rawTimeline; } catch (e) { return null; }
         if (!Array.isArray(timelineData) || timelineData.length === 0) return null;

         return (
             <View style={styles.timelineContainer}>
                 <Text style={[styles.detailLabel, {fontSize: 13, marginBottom: 12}]}>Detailed Schedule:</Text>
                 {timelineData.map((item, index) => {
                     let imageUrl = null;
                     if (item.type === 'stop' && tourContext?.stops) {
                         const stopData = tourContext.stops.find(s => s.name === item.activityName || s.id === item.refId);
                         if (stopData) imageUrl = getImageUrl(stopData.image);
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
                                 <View style={styles.activityContentRow}>
                                     {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.timelineImage} /> : <View style={styles.timelinePlaceholder}><MapPin size={16} color="#00A8FF" /></View>}
                                     <View style={styles.activityTextContainer}>
                                         <Text style={styles.activityTitle} numberOfLines={1}>{item.activityName}</Text>
                                         <Text style={styles.activityDuration}>{item.startTime} - {item.endTime}</Text>
                                     </View>
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
        
        // 1. Mark available dates (Blue)
        (guide.specific_available_dates || []).forEach(date => {
            marked[date] = { selected: true, marked: true, selectedColor: '#00A8FF', disabled: true, disableTouchEvent: true };
        });

        // 2. Mark BLOCKED dates (Red/Disabled) - Overrides available dates
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
    
    let finalImage = null;
    if (destination?.images?.length > 0) finalImage = destination.images[0].image;
    else if (tourPackages.length > 0 && tourPackages[0].stops?.length > 0) finalImage = tourPackages[0].stops[0].image;

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
                            <TouchableOpacity style={styles.actionButton} onPress={() => router.push({ pathname: "/(protected)/message", params: { partnerId: guide.id, partnerName: `${guide.first_name} ${guide.last_name}` } })}>
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
                                const selectedTour = tourPackages.length > 0 ? tourPackages[0] : null;
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

// ... (Styles same as previous)
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
    subHeader: { fontSize: 14, fontWeight: '600', color: '#1A2332', marginTop: 10, marginBottom: 5 },
    packageDetailsGrid: { flexDirection: 'column', marginVertical: 10 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    packageDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    packageDetailText: { fontSize: 13, color: '#1A2332' },
    priceLabel: { fontSize: 11, color: '#666', marginRight: 4 },
    stopsScrollView: { paddingVertical: 10 },
    stopCard: { marginRight: 15, width: 160, backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#E0E6ED' },
    stopImage: { width: '100%', height: 90, borderRadius: 6, marginBottom: 6 },
    stopName: { fontSize: 13, fontWeight: '600', color: '#1A2332' },
    stopTime: { fontSize: 11, color: '#00A8FF', marginTop: 2, fontWeight: '500' },
    infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    detailText: { fontSize: 14, color: '#1A2332', marginLeft: 10 },
    detailLabel: { fontWeight: '600', color: '#1A2332' },
    itineraryText: { fontSize: 14, color: '#555', lineHeight: 20 },
    timelineContainer: { marginTop: 10, marginBottom: 10 },
    timelineItem: { flexDirection: 'row', marginBottom: 12 },
    timeColumn: { width: 65, alignItems: 'center', paddingRight: 8 },
    timeText: { fontSize: 11, fontWeight: '700', color: '#1A2332' },
    timeConnector: { flex: 1, width: 1, backgroundColor: '#E0E6ED', marginTop: 4 },
    activityCard: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E0E6ED' },
    activityContentRow: { flexDirection: 'row', gap: 10 },
    timelineImage: { width: 50, height: 50, borderRadius: 6, backgroundColor: '#eee' },
    timelinePlaceholder: { width: 50, height: 50, borderRadius: 6, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
    activityTextContainer: { flex: 1, justifyContent: 'center' },
    activityTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 2 },
    activityDuration: { fontSize: 11, color: '#888', marginBottom: 4 },
    typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    typeText: { fontSize: 9, fontWeight: '700' },
    
    // Accommodation Styles
    accSwiperContainer: { paddingRight: 20, paddingVertical: 10 },
    accCard: { width: 240, marginRight: 15, backgroundColor: '#fff', borderRadius: 12, shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 2, borderColor: '#f0f0f0', overflow: 'hidden' },
    accCardIncluded: { borderColor: '#00C853', borderWidth: 2, backgroundColor: '#F9FFF9' },
    selectedOverlay: { position: 'absolute', top: '35%', alignSelf: 'center', zIndex: 10, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 30, padding: 5 },
    accImage: { width: '100%', height: 130 },
    accBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0, 168, 255, 0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    accBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    accContent: { padding: 12 },
    accTitle: { fontSize: 15, fontWeight: '700', color: '#1A2332', marginBottom: 4 },
    accLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    accLocation: { fontSize: 12, color: '#888', marginLeft: 4 },
    accDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
    accFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    accPrice: { fontSize: 14, fontWeight: '700', color: '#00C853' },
    accPerNight: { fontSize: 11, color: '#999', fontWeight: '400' },
    accAmenities: { flexDirection: 'row' },
    selectionHintText: { fontSize: 12, color: '#666', fontStyle: 'italic', marginBottom: 8, marginLeft: 2 },

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