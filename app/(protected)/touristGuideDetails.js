import React, { useState, useCallback, useMemo } from 'react'; 
import { View, ScrollView, StyleSheet, Image, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User, Calendar as CalendarIcon, Map, Star, Bed, CheckCircle } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'; 
import { Calendar } from 'react-native-calendars';
import api from '../../api/api';
import StopDetailsModal from '../../components/itinerary/StopDetailsModal';
import ScreenSafeArea from '../../components/ScreenSafeArea';

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
    
    const [selectedTour, setSelectedTour] = useState(null);
    const [stopDetailsVisible, setStopDetailsVisible] = useState(false);

    const getPackageDurationDays = (pkg) => {
        if (!pkg) return 1;
        const raw = parseInt(pkg.duration_days);
        let inferred = Number.isFinite(raw) && raw > 0 ? raw : 0;

        let timeline = [];
        try {
            timeline = typeof pkg.itinerary_timeline === 'string'
                ? JSON.parse(pkg.itinerary_timeline)
                : (pkg.itinerary_timeline || []);
        } catch (_e) {
            timeline = [];
        }

        if (Array.isArray(timeline) && timeline.length > 0) {
            const maxDay = timeline.reduce((max, item) => {
                const dayNum = parseInt(item?.day);
                return Number.isFinite(dayNum) && dayNum > max ? dayNum : max;
            }, 1);
            inferred = Math.max(inferred, maxDay);
        }

        return inferred > 0 ? inferred : 1;
    };

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                if (!guideId || !placeId) {
                    setLoading(false);
                    return;
                }
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
                    const toursData = Array.isArray(toursRes.data) ? toursRes.data : (toursRes.data?.results || []);
                    const guidesTours = toursData.filter(tour => Number(tour.guide) === Number(guideId));
                    setTourPackages(guidesTours);
                    if(guidesTours.length > 0) setSelectedTour(guidesTours[0]);
                    
                    const itineraryAccomIds = new Set();
                    guidesTours.forEach(tour => {
                        let timeline = [];
                        try {
                            timeline = typeof tour.itinerary_timeline === 'string' 
                                ? JSON.parse(tour.itinerary_timeline) 
                                : tour.itinerary_timeline;
                        } catch(_e) {}
                        if (Array.isArray(timeline)) {
                            timeline.forEach(item => {
                                if (item.type === 'accom' && item.refId) {
                                    itineraryAccomIds.add(parseInt(item.refId));
                                }
                            });
                        }
                    });
                    
                    const relevantAccoms = itineraryAccomIds.size > 0 
                        ? allAccoms.filter(acc => itineraryAccomIds.has(acc.id))
                        : allAccoms;

                    setAccommodations(relevantAccoms);

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

    const parsedTimelineData = useMemo(() => {
        if (!selectedTour || !selectedTour.itinerary_timeline) return [];
        try {
            return typeof selectedTour.itinerary_timeline === 'string'
                ? JSON.parse(selectedTour.itinerary_timeline)
                : selectedTour.itinerary_timeline;
        } catch {
            return [];
        }
    }, [selectedTour]);

    const renderSequentialItinerary = () => {
         if (parsedTimelineData.length === 0) return <Text style={styles.emptyText}>No detailed timeline available.</Text>;

         // Group exactly how payment.js does
         const grouped = parsedTimelineData.reduce((acc, item) => {
             const d = parseInt(item.day) || 1;
             if (!acc[d]) acc[d] = [];
             acc[d].push(item);
             return acc;
         }, {});

         return (
             <View style={styles.timelineContainer}>
                 {Object.keys(grouped).sort((a,b)=>a-b).map(day => (
                     <View key={`seq-day-${day}`} style={{marginBottom: 20}}>
                         <Text style={styles.seqDayLabel}>Day {day}</Text>
                         
                         {grouped[day].map((item, index) => {
                             return (
                                 <View key={index} style={styles.timelineItem}>
                                     <View style={styles.timeColumn}>
                                         <Text style={styles.timeText}>{item.startTime}</Text>
                                         {item.endTime && <Text style={styles.timeSubText}>{item.endTime}</Text>}
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
                 ))}
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

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={{ height: 120, backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }} />
                <View style={{ padding: 16 }}>
                    <View style={{ backgroundColor: '#F5F7FA', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#E0E6ED' }}>
                        <ActivityIndicator size="large" color="#00A8FF" style={{marginTop: 50}}/>
                    </View>
                </View>
            </View>
        );
    }

    if (!guide) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.emptyText}>Guide details are unavailable for this selection.</Text>
                <TouchableOpacity style={[styles.actionButton, { marginTop: 14, width: 160 }]} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={14} color="#fff" />
                    <Text style={styles.actionButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
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
            <ScreenSafeArea statusBarStyle='light-cotnent' edges={['bottom']} style={{backgroundColor: '#fff'}}>
                
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
                                {guide.profile_picture ? <Image source={{ uri: getImageUrl(guide.profile_picture) }} style={styles.profilePicture} /> : <User size={40} color="#fff" />}
                            </View>
                            <View style={styles.profileInfo}>
                                <Text style={styles.guideName}>{guide.first_name} {guide.last_name}</Text>
                                <Text style={styles.guideAddress}>{guide.location}</Text>
                                <View style={styles.ratingContainer}><Star size={14} color="#C99700" /><Text style={styles.guideRating}>{guide.guide_rating}</Text></View>
                            </View>
                        </View>

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

                        <View style={styles.destinationImageContainer}>
                            {finalImage ? <Image source={{uri: getImageUrl(finalImage)}} style={styles.destinationImage} /> : <View style={[styles.destinationImage, {backgroundColor: '#ccc'}]} />}
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.imageOverlay}/>
                            <Text style={styles.destinationName}>{destination?.name || "Loading..."}</Text>
                        </View>
                        
                        <View style={styles.detailsSection}>
                            <View style={styles.sectionHeader}>
                                <Map size={18} color="#1A2332" />
                                <Text style={styles.detailsHeader}>Available Tour Packages</Text>
                            </View>

                            {/* --- MULTI-PACKAGE DYNAMIC SELECTION --- */}
                            {tourPackages.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packageScroll}>
                                    {tourPackages.map((pkg) => {
                                        const isSelected = selectedTour?.id === pkg.id;
                                        const duration = getPackageDurationDays(pkg);
                                        return (
                                            <TouchableOpacity 
                                                key={pkg.id} 
                                                style={[styles.packagePill, isSelected && styles.packagePillActive]}
                                                onPress={() => setSelectedTour(pkg)}
                                            >
                                                <Text style={[styles.packagePillText, isSelected && styles.packagePillTextActive]}>
                                                    {duration} Day Package
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    })}
                                </ScrollView>
                            )}
                            
                            <Text style={[styles.detailsHeader, {marginTop: 10, marginBottom: 5}]}>
                                {selectedTour ? selectedTour.name : "Guide's Plan"}
                            </Text>
                            <Text style={styles.bodyText}>
                                {selectedTour ? selectedTour.description : "No specific tour details available."}
                            </Text>

                            <View style={styles.divider} />

                            <View style={styles.subHeaderRow}>
                                <Text style={styles.subHeader}>Itinerary Schedule</Text>
                                {parsedTimelineData.length > 0 && (
                                    <TouchableOpacity
                                        style={styles.viewStopDetailsButton}
                                        onPress={() => setStopDetailsVisible(true)}
                                    >
                                        <Ionicons name="images-outline" size={14} color="#1D4ED8" />
                                        <Text style={styles.viewStopDetailsText}>View Stop Details</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {renderSequentialItinerary()}

                            <View style={styles.divider} />
                            
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
                            <Text style={{ textAlign: 'justify', fontSize: 12, marginBottom: 5 }}>Note: This is for viewing purposes only for the guide&apos;s availability</Text>
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
                                        
                                        itineraryTimeline: selectedTour && selectedTour.itinerary_timeline 
                                            ? (typeof selectedTour.itinerary_timeline === 'string' ? selectedTour.itinerary_timeline : JSON.stringify(selectedTour.itinerary_timeline))
                                            : null,
                                        packageDuration: selectedTour ? getPackageDurationDays(selectedTour) : 1
                                    } 
                                });
                            }}
                        >
                            <Text style={styles.bookButtonText}>BOOK NOW</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <StopDetailsModal
                    visible={stopDetailsVisible}
                    onClose={() => setStopDetailsVisible(false)}
                    timeline={parsedTimelineData}
                    stopCatalog={Array.isArray(selectedTour?.stops) ? selectedTour.stops : []}
                    accommodationCatalog={accommodations}
                    getImageUrl={getImageUrl}
                />
            </ScreenSafeArea>
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
    
    packageScroll: { flexDirection: 'row', marginBottom: 10, marginTop: 5 },
    packagePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    packagePillActive: { backgroundColor: '#EFF6FF', borderColor: '#00A8FF' },
    packagePillText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    packagePillTextActive: { color: '#00A8FF' },

    bodyText: { fontSize: 14, color: '#555', lineHeight: 22 },
    subHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10, marginBottom: 8, flexWrap: 'wrap' },
    subHeader: { fontSize: 13, fontWeight: '700', color: '#333' },
    viewStopDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    viewStopDetailsText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
    emptyText: { fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 10 },

    seqDayLabel: { fontSize: 15, fontWeight: '800', color: '#00A8FF', marginBottom: 10 },
    timelineContainer: { marginTop: 10 },
    timelineItem: { flexDirection: 'row', marginBottom: 15 },
    timeColumn: { width: 85, alignItems: 'center', paddingRight: 10 },
    timeText: { fontSize: 12, fontWeight: '700', color: '#1A2332' },
    timeSubText: { fontSize: 10, color: '#888', marginTop: 2 },
    timeConnector: { flex: 1, width: 1, backgroundColor: '#E0E6ED', marginTop: 4 },
    activityCard: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E0E6ED' },
    activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    activityTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
    typeBadge: { alignSelf: 'flex-start', backgroundColor: '#F5F7FA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#eee' },
    typeText: { fontSize: 10, color: '#666', fontWeight: '600' },

    inclusionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    inclusionTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FFF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4, borderWidth: 1, borderColor: '#C3E6CB' },
    inclusionText: { fontSize: 11, color: '#155724', fontWeight: '600' },

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
