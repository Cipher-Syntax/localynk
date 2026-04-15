import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Map, Calendar as CalendarIcon, CheckCircle, Bed, ArrowRight, User } from "lucide-react-native";
import api from '../../api/api';
import StopDetailsModal from '../../components/itinerary/StopDetailsModal';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import NewPackageHighlightsModal from '../../components/NewPackageHighlightsModal';
import { fetchDestinationHighlights } from '../../utils/newPackageHighlights';

const GuideAvailability = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { placeId, placeName, guideId, highlightTourId } = params;

    const [guide, setGuide] = useState(null);
    const [blockedDates, setBlockedDates] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- MULTI-PACKAGE DYNAMIC STATE ---
    const [tourPackages, setTourPackages] = useState([]); 
    const [selectedTour, setSelectedTour] = useState(null);
    const [stopDetailsVisible, setStopDetailsVisible] = useState(false);
    const [highlightPackages, setHighlightPackages] = useState([]);
    const [highlightTargetDate, setHighlightTargetDate] = useState(null);
    const [highlightCount, setHighlightCount] = useState(0);
    const [highlightModalVisible, setHighlightModalVisible] = useState(false);

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

    useEffect(() => {
        const fetchData = async () => {
            if (!guideId || !placeId) return;
            try {
                const [guideRes, toursRes, blockedRes, highlightsRes] = await Promise.all([
                    api.get(`/api/guides/${guideId}/`),
                    api.get(`/api/destinations/${placeId}/tours/`),
                    api.get(`/api/bookings/guide_blocked_dates/`, { params: { guide_id: guideId } }),
                    fetchDestinationHighlights({ destinationId: placeId, limitPerDestination: 5 }).catch(() => null),
                ]);

                setGuide(guideRes.data);
                setBlockedDates(blockedRes.data || []); 
                
                const toursData = Array.isArray(toursRes.data) ? toursRes.data : (toursRes.data?.results || []);
                const guidesTours = toursData.filter(tour => Number(tour.guide) === Number(guideId));
                setTourPackages(guidesTours);
                if (guidesTours.length > 0) {
                    const preferredTourId = Number(highlightTourId);
                    const preferredTour = guidesTours.find((tour) => Number(tour.id) === preferredTourId);
                    setSelectedTour(preferredTour || guidesTours[0]);
                }

                const destinationKey = String(placeId || '').trim();
                const destinationEntry = highlightsRes?.byDestinationId?.[destinationKey];
                const destinationPackages = Array.isArray(destinationEntry?.packages) ? destinationEntry.packages : [];
                const destinationCount = Number(
                    highlightsRes?.countsByDestinationId?.[destinationKey]
                    || destinationEntry?.new_packages_count
                    || 0
                );

                setHighlightPackages(destinationPackages);
                setHighlightCount(destinationCount);
                setHighlightTargetDate(highlightsRes?.targetDate || null);

            } catch (error) {
                console.error('Failed to fetch guide availability data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [guideId, placeId, highlightTourId]);

    const handleSelectHighlightedPackage = useMemo(() => {
        return (highlightedPackage) => {
            const highlightedId = Number(highlightedPackage?.id);
            const matchedPackage = tourPackages.find((pkg) => Number(pkg.id) === highlightedId);

            if (matchedPackage) {
                setSelectedTour(matchedPackage);
                setHighlightModalVisible(false);
                return;
            }

            const ownerType = String(highlightedPackage?.owner_type || '').toLowerCase();
            const highlightedGuideId = Number(highlightedPackage?.guide_id);

            if (ownerType === 'guide' && Number.isFinite(highlightedGuideId) && highlightedGuideId > 0) {
                setHighlightModalVisible(false);
                router.push({
                    pathname: '/(protected)/guideAvailability',
                    params: {
                        guideId: highlightedGuideId,
                        placeId,
                        placeName,
                        highlightTourId: highlightedPackage?.id,
                    },
                });
                return;
            }

            if (ownerType === 'agency') {
                setHighlightModalVisible(false);
                router.push({
                    pathname: '/(protected)/agencySelection',
                    params: {
                        placeId,
                        placeName,
                    },
                });
            }
        };
    }, [tourPackages, router, placeId, placeName]);

    const getImageUrl = (imgPath) => {
        if (!imgPath) return null;
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000';
        return `${base}${imgPath}`;
    };

    const getInclusions = () => {
        if (!selectedTour) return ["Standard Guide Services"];
        if (Array.isArray(selectedTour.inclusions) && selectedTour.inclusions.length > 0) return selectedTour.inclusions;
        if (selectedTour.what_to_bring) {
            if (Array.isArray(selectedTour.what_to_bring)) return selectedTour.what_to_bring;
            if (typeof selectedTour.what_to_bring === 'string') return [selectedTour.what_to_bring];
        }
        return ["Standard Guide Services"];
    };
    const safeInclusions = getInclusions();

    const accommodations = useMemo(() => {
        if (selectedTour && Array.isArray(selectedTour.accommodations) && selectedTour.accommodations.length > 0) return selectedTour.accommodations;
        if (params.accommodations && params.accommodations !== "null") {
            try {
                const parsed = JSON.parse(params.accommodations);
                return Array.isArray(parsed) ? parsed : [];
            } catch (_e) { return []; }
        }
        return [];
    }, [selectedTour, params.accommodations]);

    const markedDates = useMemo(() => {
        if (!guide) return {};

        const marked = {};
        if (guide.specific_available_dates) {
            guide.specific_available_dates.forEach(date => {
                marked[date] = { selected: true, marked: true, selectedColor: '#00A8FF', disabled: true, disableTouchEvent: true };
            });
        }
        blockedDates.forEach(date => {
            marked[date] = { selected: true, selectedColor: '#FFEBEE', marked: true, dotColor: '#D32F2F', textColor: '#D32F2F', disabled: true, disableTouchEvent: true };
        });

        return marked;
    }, [guide, blockedDates]);

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
        if (parsedTimelineData.length === 0) return <Text style={styles.emptyText}>No timeline available.</Text>;

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
                        
                        {grouped[day].map((item, index) => (
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
                        ))}
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
        <ScreenSafeArea edges={['bottom']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Guide Preview</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.introContainer}>
                    <Text style={styles.sectionTitle}>Availability & Plans</Text>
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
                    <Text style={{ textAlign: 'justify', fontSize: 12, marginBottom: 5 }}>Note: This is for viewing purposes only for the guide&apos;s availability</Text>
                    
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
                        <Text style={styles.cardTitle}>Available Tour Packages</Text>
                    </View>

                    {highlightCount > 0 && (
                        <TouchableOpacity
                            style={styles.newPackageCallout}
                            onPress={() => setHighlightModalVisible(true)}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="sparkles-outline" size={16} color="#0369A1" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.newPackageCalloutTitle}>
                                    {highlightCount} new package{highlightCount > 1 ? 's' : ''} added yesterday
                                </Text>
                                <Text style={styles.newPackageCalloutSubtext}>Tap to preview destination highlights.</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    
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

                    <Text style={[styles.cardTitle, {marginTop: 10, marginBottom: 5}]}>
                        {selectedTour ? selectedTour.name : "Custom Plan"}
                    </Text>

                    <Text style={styles.bodyText}>
                        {selectedTour ? selectedTour.description : (params.itinerary || "No itinerary details available.")}
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.subHeaderRow}>
                        <Text style={styles.subHeader}>Schedule</Text>
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

            <SafeAreaView edges={['bottom']} style={styles.footer}>
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
            </SafeAreaView>

            <StopDetailsModal
                visible={stopDetailsVisible}
                onClose={() => setStopDetailsVisible(false)}
                timeline={parsedTimelineData}
                stopCatalog={Array.isArray(selectedTour?.stops) ? selectedTour.stops : []}
                accommodationCatalog={accommodations}
                getImageUrl={getImageUrl}
            />

            <NewPackageHighlightsModal
                visible={highlightModalVisible}
                onClose={() => setHighlightModalVisible(false)}
                destinationName={placeName}
                targetDate={highlightTargetDate}
                packages={highlightPackages}
                onSelectPackage={handleSelectHighlightedPackage}
            />
        </ScreenSafeArea>
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
    
    profileRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    profilePicWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc', marginRight: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    profilePic: { width: '100%', height: '100%' },
    subText: { fontSize: 14, color: '#8B98A8' },
    
    cardContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginLeft: 10 },
    newPackageCallout: {
        marginBottom: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        backgroundColor: '#E0F2FE',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    newPackageCalloutTitle: { fontSize: 12, fontWeight: '800', color: '#075985' },
    newPackageCalloutSubtext: { fontSize: 11, color: '#0369A1', marginTop: 2 },
    calendarStyle: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
    legendContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: '#666' },

    packageScroll: { flexDirection: 'row', marginBottom: 10, marginTop: 5 },
    packagePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    packagePillActive: { backgroundColor: '#EFF6FF', borderColor: '#00A8FF' },
    packagePillText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    packagePillTextActive: { color: '#00A8FF' },

    bodyText: { fontSize: 14, color: '#555', lineHeight: 22 },
    subHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10, marginBottom: 8, flexWrap: 'wrap' },
    subHeader: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 8, marginTop: 10 },
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
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10, borderTopWidth: 1, borderTopColor: '#eee' },
    footerTextContainer: { justifyContent: 'center' },
    footerLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
    footerSub: { fontSize: 12, color: '#888' },
    proceedBtn: { backgroundColor: '#00A8FF', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, gap: 8 },
    proceedText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    seqDayLabel: { fontSize: 15, fontWeight: '800', color: '#00A8FF', marginBottom: 10 },
    timelineContainer: { marginTop: 10 },
    timelineItem: { flexDirection: 'row', marginBottom: 15 },
    timeColumn: { width: 85, alignItems: 'center', paddingRight: 10 },
    timeText: { fontSize: 12, fontWeight: '700', color: '#1A2332' },
    timeSubText: { fontSize: 10, color: '#888', marginTop: 2 },
    timeConnector: { flex: 1, width: 1, backgroundColor: '#E0E6ED', marginTop: 4 },
    
    activityCard: { flex: 1, backgroundColor: '#F5F7FA', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E0E6ED' },
    activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    activityTitle: { fontSize: 14, fontWeight: '700', color: '#333' },
    
    typeBadge: { alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#eee' },
    typeText: { fontSize: 10, color: '#666', fontWeight: '600' },
    emptyText: { fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 10 }
});
