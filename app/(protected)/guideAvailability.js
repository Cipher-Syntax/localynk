import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Map, Calendar as CalendarIcon, CheckCircle, Bed, ArrowRight, User } from "lucide-react-native";
import api from '../../api/api';

const { width } = Dimensions.get('window');

const GuideAvailability = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { placeId, placeName, guideId } = params;

    const [guide, setGuide] = useState(null);
    const [tourPackage, setTourPackage] = useState(null);
    const [blockedDates, setBlockedDates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!guideId || !placeId) return;
            try {
                const [guideRes, toursRes, blockedRes] = await Promise.all([
                    api.get(`/api/guides/${guideId}/`),
                    api.get(`/api/destinations/${placeId}/tours/`),
                    api.get(`/api/bookings/guide_blocked_dates/`, { params: { guide_id: guideId } })
                ]);

                setGuide(guideRes.data);
                setBlockedDates(blockedRes.data || []); 
                
                const specificTour = toursRes.data.find(tour => tour.guide === parseInt(guideId));
                setTourPackage(specificTour);
            } catch (error) {
                console.error('Failed to fetch guide availability data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [guideId, placeId]);

    const getImageUrl = (imgPath) => {
        if (!imgPath) return null;
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000';
        return `${base}${imgPath}`;
    };

    const getInclusions = () => {
        if (!tourPackage) return ["Standard Guide Services"];
        if (Array.isArray(tourPackage.inclusions) && tourPackage.inclusions.length > 0) return tourPackage.inclusions;
        if (tourPackage.what_to_bring) {
            if (Array.isArray(tourPackage.what_to_bring)) return tourPackage.what_to_bring;
            if (typeof tourPackage.what_to_bring === 'string') return [tourPackage.what_to_bring];
        }
        return ["Standard Guide Services"];
    };
    const safeInclusions = getInclusions();

    const accommodations = useMemo(() => {
        if (tourPackage && Array.isArray(tourPackage.accommodations) && tourPackage.accommodations.length > 0) return tourPackage.accommodations;
        if (params.accommodations && params.accommodations !== "null") {
            try {
                const parsed = JSON.parse(params.accommodations);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) { return []; }
        }
        return [];
    }, [tourPackage, params.accommodations]);

    const markedDates = useMemo(() => {
        if (!guide) return {};

        const marked = {};

        // 1. Mark available dates (Blue)
        if (guide.specific_available_dates) {
            guide.specific_available_dates.forEach(date => {
                marked[date] = { 
                    selected: true, 
                    marked: true, 
                    selectedColor: '#00A8FF',
                    disabled: true, 
                    disableTouchEvent: true 
                };
            });
        }

        // 2. Mark BLOCKED dates (Red)
        blockedDates.forEach(date => {
            marked[date] = { 
                selected: true, 
                selectedColor: '#FFEBEE', 
                marked: true, 
                dotColor: '#D32F2F',      
                textColor: '#D32F2F',    
                disabled: true, 
                disableTouchEvent: true 
            };
        });

        return marked;
    }, [guide, blockedDates]);

    const timelineData = useMemo(() => {
        if (!tourPackage || !tourPackage.itinerary_timeline) return [];
        try {
            const raw = tourPackage.itinerary_timeline;
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } 
        catch (e) {
            console.error("Error parsing timeline:", e);
            return [];
        }
    }, [tourPackage]);

    const renderTimeline = () => {
        if (timelineData.length === 0) return <Text style={styles.emptyText}>No timeline available.</Text>;

        return (
            <View style={styles.timelineContainer}>
                {timelineData.map((item, index) => (
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
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A8FF" />
            </View>
        );
    }

    if (!guide) return <View style={styles.container}><Text>No Data</Text></View>;

    return (
        <SafeAreaView style={styles.container}>
             <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Guide Preview</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.introContainer}>
                    <Text style={styles.sectionTitle}>Availability & Plans</Text>
                    
                    {/* UPDATED: Added Profile Picture Logic */}
                    <View style={styles.profileRow}>
                        <View style={styles.profilePicWrapper}>
                            {guide.profile_picture ? (
                                <Image source={{ uri: getImageUrl(guide.profile_picture) }} style={styles.profilePic} />
                            ) : (
                                <User size={24} color="#fff" />
                            )}
                        </View>
                        <Text style={styles.subText}>
                            Viewing schedule for <Text style={{fontWeight:'700', color:'#00A8FF'}}>{guide.first_name} {guide.last_name}</Text>
                        </Text>
                    </View>
                </View>

                <View style={styles.cardContainer}>
                    <View style={styles.sectionHeader}>
                        <CalendarIcon size={18} color="#1A2332" />
                        <Text style={styles.cardTitle}>Availability Calendar</Text>
                    </View>
                    
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
                            <View style={[styles.dot, { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#D32F2F' }]} />
                            <Text style={styles.legendText}>Booked</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.dot, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc' }]} />
                            <Text style={styles.legendText}>Unavailable</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardContainer}>
                    <View style={styles.sectionHeader}>
                        <Map size={18} color="#1A2332" />
                        <Text style={styles.cardTitle}>
                            Proposed Itinerary: {tourPackage ? tourPackage.name : "Custom Plan"}
                        </Text>
                    </View>
                    
                    <Text style={styles.bodyText}>
                        {tourPackage ? tourPackage.description : (params.itinerary || "No itinerary details available.")}
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.subHeader}>Schedule</Text>
                    {renderTimeline()}

                    <View style={styles.divider} />
                    
                    <Text style={styles.subHeader}>What to Expect / Bring</Text>
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
                    <View style={styles.cardContainer}>
                        <View style={styles.sectionHeader}>
                            <Bed size={18} color="#1A2332" />
                            <Text style={styles.cardTitle}>Accommodation</Text>
                        </View>
                        <Text style={styles.highlightText}>Included in package</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accScroll}>
                            {accommodations.map((acc, index) => (
                                <View key={index} style={styles.accCard}>
                                    <Image source={{ uri: acc.image || 'https://via.placeholder.com/150' }} style={styles.accImage} />
                                    <View style={styles.accOverlay} />
                                    <View style={styles.accInfo}>
                                        <Text style={styles.accTitle} numberOfLines={1}>{acc.title || acc.name || "Accommodation"}</Text>
                                        <Text style={styles.accPrice}>{acc.price || "Included"}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}
                <View style={{height: 100}} />
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.footerTextContainer}>
                    <Text style={styles.footerLabel}>Interested?</Text>
                    <Text style={styles.footerSub}>View full profile to book.</Text>
                </View>
                <TouchableOpacity 
                    style={styles.proceedBtn}
                    activeOpacity={0.8}
                    onPress={() => router.push({
                        pathname: "/(protected)/touristGuideDetails", 
                        params: { guideId: guide.id, placeId: placeId, placeName: placeName }
                    })}
                >
                    <Text style={styles.proceedText}>View Details</Text>
                    <ArrowRight size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default GuideAvailability;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', elevation: 2 },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    scrollContent: { padding: 20, paddingBottom: 100 },
    introContainer: { marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1A2332' },
    
    // NEW STYLES
    profileRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    profilePicWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc', marginRight: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    profilePic: { width: '100%', height: '100%' },
    
    subText: { fontSize: 14, color: '#8B98A8' },
    cardContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginLeft: 10 },
    calendarStyle: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
    legendContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: '#666' },
    bodyText: { fontSize: 14, color: '#555', lineHeight: 22 },
    subHeader: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8, marginTop: 10 },
    highlightText: { fontSize: 12, color: '#00A8FF', fontStyle: 'italic', marginBottom: 10, fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
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
    footer: { position: 'absolute', bottom: 10, left: 0, right: 0, backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10, borderTopWidth: 1, borderTopColor: '#eee' },
    footerTextContainer: { justifyContent: 'center' },
    footerLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
    footerSub: { fontSize: 12, color: '#888' },
    proceedBtn: { backgroundColor: '#00A8FF', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, gap: 8 },
    proceedText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    
    timelineContainer: { marginTop: 10 },
    timelineItem: { flexDirection: 'row', marginBottom: 15 },
    timeColumn: { width: 70, alignItems: 'center', paddingRight: 10 },
    timeText: { fontSize: 12, fontWeight: '700', color: '#1A2332' },
    timeConnector: { flex: 1, width: 1, backgroundColor: '#E0E6ED', marginTop: 4 },
    
    activityCard: { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E0E6ED' },
    activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    activityTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
    activityDuration: { fontSize: 11, color: '#888', marginBottom: 6 },
    
    typeBadge: { alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#eee' },
    typeText: { fontSize: 10, color: '#666', fontWeight: '600' },
    emptyText: { fontSize: 13, color: '#888', fontStyle: 'italic' }
});