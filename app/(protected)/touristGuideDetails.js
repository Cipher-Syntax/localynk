import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, Image, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User, Calendar as CalendarIcon, Map, Star, Compass, Clock, Languages, Package, MapPin, Bed, Wifi, Car, Coffee } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
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
    
    const router = useRouter();
    const params = useLocalSearchParams();
    const { guideId, placeId } = params;

    useEffect(() => {
        const fetchData = async () => {
            if (!guideId || !placeId) return;

            try {
                const [guideRes, destRes, toursRes, accomRes] = await Promise.all([
                    api.get(`/api/guides/${guideId}/`),
                    api.get(`/api/destinations/${placeId}/`),
                    api.get(`/api/destinations/${placeId}/tours/`),
                    api.get(`/api/accommodations/`, { params: { host_id: guideId } })
                ]);

                setGuide(guideRes.data);
                setDestination(destRes.data);
                
                const allAccoms = Array.isArray(accomRes.data) ? accomRes.data : (accomRes.data.results || []);
                const guidesTours = toursRes.data.filter(tour => tour.guide === parseInt(guideId));
                
                // --- Filter Accommodations based on Itinerary ---
                const itineraryAccomIds = new Set();
                
                guidesTours.forEach(tour => {
                    let timeline = [];
                    try {
                        timeline = typeof tour.itinerary_timeline === 'string' 
                            ? JSON.parse(tour.itinerary_timeline) 
                            : tour.itinerary_timeline;
                    } catch(e) {
                        console.log("Error parsing timeline:", e);
                    }

                    if (Array.isArray(timeline)) {
                        timeline.forEach(item => {
                            // Collect IDs where type is accommodation
                            if (item.type === 'accom' && item.refId) {
                                itineraryAccomIds.add(parseInt(item.refId));
                            }
                        });
                    }
                });

                // Only keep accommodations that are part of the tour itinerary
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
    }, [guideId, placeId]);

    const getImageUrl = (imgPath) => {
        if (!imgPath) return 'https://via.placeholder.com/300';
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000'; 
        return `${base}${imgPath}`;
    };

    const renderTimeline = (rawTimeline, tourContext) => {
        if (!rawTimeline) return null;
        
        let timelineData = [];
        try {
            timelineData = typeof rawTimeline === 'string' ? JSON.parse(rawTimeline) : rawTimeline;
        } catch (e) { return null; }

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
                                    {imageUrl ? (
                                        <Image source={{ uri: imageUrl }} style={styles.timelineImage} />
                                    ) : (
                                        <View style={styles.timelinePlaceholder}>
                                            {item.type === 'accom' ? <Bed size={16} color="#8E44AD" /> : <MapPin size={16} color="#00A8FF" />}
                                        </View>
                                    )}
                                    <View style={styles.activityTextContainer}>
                                        <Text style={styles.activityTitle} numberOfLines={1}>{item.activityName}</Text>
                                        <Text style={styles.activityDuration}>{item.startTime} - {item.endTime}</Text>
                                        <View style={[styles.typeBadge, { backgroundColor: item.type === 'accom' ? '#F3E5F5' : '#E1F5FE' }]}>
                                            <Text style={[styles.typeText, { color: item.type === 'accom' ? '#8E44AD' : '#0288D1' }]}>
                                                {item.type === 'accom' ? 'Accommodation' : 'Tour Stop'}
                                            </Text>
                                        </View>
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
        if (!guide || !guide.specific_available_dates) return {};
        const marked = {};
        guide.specific_available_dates.forEach(date => {
            marked[date] = { selected: true, marked: true, selectedColor: '#00A8FF', disabled: true, disableTouchEvent: true };
        });
        return marked;
    }, [guide]);
    
    const renderAvailabilityBubbles = (guideDays) => {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const shortDays = ["M", "T", "W", "T", "F", "S", "S"];
        const safeGuideDays = guideDays || [];

        return (
            <View style={styles.availabilityContainer}>
                {days.map((day, index) => {
                    const isAvailable = safeGuideDays.includes(day) || safeGuideDays.includes("All");
                    return (
                        <View key={index} style={[styles.dayBadge, isAvailable ? styles.dayAvailable : styles.dayUnavailable]}>
                            <Text style={[styles.dayText, isAvailable ? styles.dayTextAvailable : styles.dayTextUnavailable]}>
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
    
    let finalImage = null;
    if (destination?.images?.length > 0) {
        finalImage = destination.images[0].image;
    } 
    else if (tourPackages.length > 0 && tourPackages[0].stops?.length > 0) {
        finalImage = tourPackages[0].stops[0].image;
    }

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
                        
                        <View style={styles.cardProfileSection}>
                            <View style={styles.iconWrapper}>
                                {guide.profile_picture ? (
                                    <Image source={{ uri: getImageUrl(guide.profile_picture) }} style={styles.profilePicture} />
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

                        <View style={styles.destinationImageContainer}>
                            {finalImage ? (
                                <Image source={{uri: getImageUrl(finalImage)}} style={styles.destinationImage} />
                            ) : (
                                <View style={[styles.destinationImage, {backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center'}]}>
                                    <Text>No Image Available</Text>
                                </View>
                            )}
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.imageOverlay}/>
                            <Text style={styles.destinationName}>{destination?.name || "Loading..."}</Text>
                        </View>
                        
                        {tourPackages.length > 0 && (
                             <View style={styles.detailsSection}>
                                <View style={styles.sectionHeader}>
                                   <Package size={18} color="#1A2332" />
                                   <Text style={styles.detailsHeader}>Tour Packages ({tourPackages.length})</Text>
                                </View>

                                {tourPackages.map((tour, index) => {
                                    let scheduleItems = [];
                                    try {
                                        const raw = tour.itinerary_timeline;
                                        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                                        if (Array.isArray(parsed)) {
                                            scheduleItems = parsed.filter(item => item.type === 'stop');
                                        }
                                    } catch(e) {}
                                    const showRawStops = scheduleItems.length === 0 && tour.stops && tour.stops.length > 0;

                                    return (
                                        <View key={tour.id} style={{marginBottom: 25}}>
                                            <Text style={[styles.subHeader, {marginTop: 5}]}>{tour.name}</Text>
                                            <Text style={styles.itineraryText}>{tour.description}</Text>
                                            
                                            {renderTimeline(tour.itinerary_timeline, tour)}

                                            <View style={styles.packageDetailsGrid}>
                                                <View style={styles.detailRow}>
                                                    <View style={styles.packageDetailItem}>
                                                        <Clock size={14} color="#8B98A8"/>
                                                        <Text style={styles.packageDetailText}>{tour.duration}</Text>
                                                    </View>
                                                     <View style={styles.packageDetailItem}>
                                                        <User size={14} color="#8B98A8"/>
                                                        <Text style={styles.packageDetailText}>Max {tour.max_group_size} people</Text>
                                                    </View>
                                                </View>
                                                
                                                <View style={[styles.detailRow, {marginTop: 8}]}>
                                                    <View style={styles.packageDetailItem}>
                                                        <Text style={styles.priceLabel}>Base Price:</Text>
                                                        <Text style={[styles.packageDetailText, {color: '#00A8FF', fontWeight: 'bold'}]}>
                                                            ₱ {tour.price_per_day}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.packageDetailItem}>
                                                        <Text style={styles.priceLabel}>Additional Guest Fee:</Text>
                                                        <Text style={[styles.packageDetailText, {color: '#1A2332', fontWeight: '600'}]}>
                                                            +₱ {tour.additional_fee_per_head || 0}<Text style={{fontSize: 10, fontWeight: '400', color:'#888'}}>/pax</Text>
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                            
                                            <Text style={styles.subHeader}>What to Bring:</Text>
                                            <Text style={styles.itineraryText}>{tour.what_to_bring}</Text>

                                            {(scheduleItems.length > 0 || showRawStops) && (
                                                <View style={{marginTop: 15}}>
                                                    <View style={[styles.sectionHeader, {marginBottom: 8}]}>
                                                        <MapPin size={14} color="#666" />
                                                        <Text style={[styles.detailLabel, {fontSize: 12, marginLeft: 6}]}>Tour Stops (Chronological):</Text>
                                                    </View>
                                                    
                                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stopsScrollView}>
                                                        {scheduleItems.length > 0 ? scheduleItems.map((item, i) => {
                                                            const matchedStop = tour.stops?.find(s => s.name === item.activityName || s.id === item.refId);
                                                            const imgUrl = matchedStop ? matchedStop.image : null;
                                                            return (
                                                                <View key={i} style={styles.stopCard}>
                                                                    <Image source={{uri: getImageUrl(imgUrl)}} style={styles.stopImage} />
                                                                    <Text style={styles.stopName} numberOfLines={1}>{item.activityName}</Text>
                                                                    <Text style={styles.stopTime}>{item.startTime} - {item.endTime}</Text>
                                                                </View>
                                                            );
                                                        }) 
                                                        : tour.stops.map(stop => (
                                                            <View key={stop.id} style={styles.stopCard}>
                                                                <Image source={{uri: getImageUrl(stop.image)}} style={styles.stopImage} />
                                                                <Text style={styles.stopName} numberOfLines={1}>{stop.name}</Text>
                                                                <Text style={styles.stopTime}>Visit</Text>
                                                            </View>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            )}
                                            
                                            {index < tourPackages.length - 1 && (
                                                <View style={{height: 1, backgroundColor: '#E0E6ED', marginTop: 20, marginBottom: 5}} />
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        {accommodations.length > 0 && (
                            <View style={styles.detailsSection}>
                                <View style={styles.sectionHeader}>
                                    <Bed size={18} color="#1A2332" />
                                    <Text style={styles.detailsHeader}>Included Accommodation</Text>
                                </View>
                                <Text style={styles.selectionHintText}>Part of your tour package (Non-removable)</Text>
                                
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accSwiperContainer}>
                                    {accommodations.map((acc) => (
                                        <View 
                                            key={acc.id} 
                                            style={[styles.accCard, styles.accCardIncluded]} 
                                        >
                                            <Image 
                                                source={{ uri: getImageUrl(acc.photo) }}
                                                style={styles.accImage} 
                                            />
                                            <View style={styles.accBadge}>
                                                <Text style={styles.accBadgeText}>{acc.accommodation_type || "Stay"}</Text>
                                            </View>

                                            <View style={styles.selectedOverlay}>
                                                <Ionicons name="checkmark-circle" size={32} color="#00C853" />
                                            </View>

                                            <View style={styles.accContent}>
                                                <Text style={styles.accTitle} numberOfLines={1}>{acc.title}</Text>
                                                <View style={styles.accLocationRow}>
                                                    <MapPin size={12} color="#888" />
                                                    <Text style={styles.accLocation} numberOfLines={1}>{acc.location}</Text>
                                                </View>
                                                
                                                <View style={styles.accDivider} />

                                                <View style={styles.accFooter}>
                                                    <Text style={styles.accPrice}>Included</Text>
                                                    
                                                    <View style={styles.accAmenities}>
                                                        {acc.amenities?.wifi && <Wifi size={14} color="#666" style={{marginLeft:6}} />}
                                                        {acc.amenities?.parking && <Car size={14} color="#666" style={{marginLeft:6}} />}
                                                        {acc.amenities?.breakfast && <Coffee size={14} color="#666" style={{marginLeft:6}} />}
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
             
                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsHeader}>Guide Details</Text>
                            <View style={styles.infoItem}><Languages size={16} color="#1A2332" /><Text style={styles.detailText}><Text style={styles.detailLabel}>Language: </Text>{Array.isArray(guide.languages) ? guide.languages.join(', ') : guide.languages}</Text></View>
                            <View style={styles.infoItem}><Compass size={16} color="#1A2332" /><Text style={styles.detailText}><Text style={styles.detailLabel}>Specialty: </Text>{guide.specialty}</Text></View>
                            <View style={styles.infoItem}><Clock size={16} color="#1A2332" /><Text style={styles.detailText}><Text style={styles.detailLabel}>Experience: </Text>{guide.experience_years} years</Text></View>
                        </View>

                        <View style={styles.detailsSection}>
                            <View style={styles.sectionHeader}>
                                <CalendarIcon size={18} color="#1A2332" />
                                <Text style={styles.detailsHeader}>Availability</Text>
                            </View>
                            <Text style={styles.detailLabel}>Weekly Schedule:</Text>
                            {renderAvailabilityBubbles(guide.available_days)}
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
                                        monthTextColor: '#1A2332',
                                        textMonthFontWeight: '700',
                                        textDayHeaderFontWeight: '600',
                                    }}
                                    style={styles.calendarStyle}
                                />
                                <View style={styles.legendContainer}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.dot, { backgroundColor: '#00A8FF' }]} />
                                        <Text style={styles.legendText}>Available</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.dot, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc' }]} />
                                        <Text style={styles.legendText}>Unavailable</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                        
                        <TouchableOpacity 
                            style={styles.bookButton} 
                            activeOpacity={0.8} 
                            onPress={() => {
                                // AUTO-SELECT ACCOMMODATION DATA (if any exists in itinerary)
                                let finalAccomPrice = 0;
                                let accomName = null;
                                let accomId = null;

                                if (accommodations.length > 0) {
                                    const acc = accommodations[0]; // Take the first valid accom found in itinerary
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
                                        
                                        // PASSING ACCOMMODATION DATA AUTOMATICALLY
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
    accCard: { 
        width: 240, 
        marginRight: 15, 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        shadowColor: "#000", 
        shadowOffset: {width: 0, height: 2}, 
        shadowOpacity: 0.1, 
        shadowRadius: 4, 
        elevation: 3, 
        borderWidth: 2, 
        borderColor: '#f0f0f0', // Default border
        overflow: 'hidden' 
    },
    // INCLUDED State Styles
    accCardIncluded: {
        borderColor: '#00C853',
        borderWidth: 2,
        backgroundColor: '#F9FFF9',
    },
    selectedOverlay: {
        position: 'absolute',
        top: '35%',
        alignSelf: 'center',
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 30,
        padding: 5
    },
    accImage: { width: '100%', height: 130 },
    accBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0, 168, 255, 0.9)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    accBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    accContent: { padding: 12 },
    accTitle: { fontSize: 15, fontWeight: '700', color: '#1A2332', marginBottom: 4 },
    accLocationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    accLocation: { fontSize: 12, color: '#888', marginLeft: 4 },
    accDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
    accFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    accPrice: { fontSize: 14, fontWeight: '700', color: '#00C853' }, // Green for "Included"
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