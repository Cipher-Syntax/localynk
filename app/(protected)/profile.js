import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, StatusBar, Image, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User, Calendar as CalendarIcon, Map, Star, Compass, Clock, Languages, Package, MapPin, Bed, Wifi, Car, Coffee } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { Calendar } from 'react-native-calendars';

const { width } = Dimensions.get('window');

const GuideProfile = () => {
    const [guide, setGuide] = useState(null);
    const [destination, setDestination] = useState(null);
    const [tourPackage, setTourPackage] = useState(null);
    const [accommodations, setAccommodations] = useState([]); // Added state for accommodations
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const params = useLocalSearchParams();
    const { userId, placeId } = params;

    // --- HELPER: Image URL Fixer ---
    const getImageUrl = (imgPath) => {
        if (!imgPath) return 'https://via.placeholder.com/300';
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000'; 
        return `${base}${imgPath}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!userId || !placeId) {
                setLoading(false);
                return;
            }
            try {
                // Added accommodations fetch
                const [guideRes, destRes, toursRes, accomRes] = await Promise.all([
                    api.get(`/api/guides/${userId}/`),
                    api.get(`/api/destinations/${placeId}/`),
                    api.get(`/api/destinations/${placeId}/tours/`),
                    api.get('/api/accommodations/list/') 
                ]);

                setGuide(guideRes.data);
                setDestination(destRes.data);
                setAccommodations(accomRes.data); // Set accommodations
                
                const specificTour = toursRes.data.find(tour => tour.guide === parseInt(userId)); 
                setTourPackage(specificTour);

            } catch (error) {
                console.error('Failed to fetch page data for profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, placeId]);

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

    let finalImage = null;
    if (destination?.images?.length > 0) {
        finalImage = destination.images[0].image;
    } else if (tourPackage?.stops?.length > 0) {
        finalImage = tourPackage.stops[0].image;
    }

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

                        {/* Action Buttons */}
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.actionButton} onPress={() => router.push({ pathname: "/(protected)/message", params: { partnerId: guide.id, partnerName: `${guide.first_name} ${guide.last_name}` } })}>
                                <Ionicons name="chatbubble" size={14} color="#fff" />
                                <Text style={styles.actionButtonText}>Send Message</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Destination Image */}
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
                        
                        {/* Tour Package Section */}
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

                        {/* Tour Stops Section */}
                        {tourPackage?.stops && tourPackage.stops.length > 0 && (
                            <View style={styles.detailsSection}>
                                 <View style={styles.sectionHeader}>
                                   <MapPin size={18} color="#1A2332" />
                                   <Text style={styles.detailsHeader}>Tour Stops</Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stopsScrollView}>
                                    {tourPackage.stops.map(stop => (
                                        <View key={stop.id} style={styles.stopCard}>
                                            <Image source={{uri: getImageUrl(stop.image)}} style={styles.stopImage} />
                                            <Text style={styles.stopName}>{stop.name}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* 🔥 ACCOMMODATIONS SECTION (Added from Reference) 🔥 */}
                        {accommodations.length > 0 && (
                            <View style={styles.detailsSection}>
                                <View style={styles.sectionHeader}>
                                    <Bed size={18} color="#1A2332" />
                                    <Text style={styles.detailsHeader}>Available Accommodations</Text>
                                </View>
                                
                                <ScrollView 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false} 
                                    contentContainerStyle={styles.accSwiperContainer}
                                >
                                    {accommodations.map((acc) => (
                                        <TouchableOpacity 
                                            key={acc.id} 
                                            style={styles.accCard}
                                            activeOpacity={0.9}
                                        >
                                            <Image 
                                                source={{ uri: getImageUrl(acc.photo) }}
                                                style={styles.accImage} 
                                            />
                                            <View style={styles.accBadge}>
                                                <Text style={styles.accBadgeText}>
                                                    {acc.accommodation_type || "Stay"}
                                                </Text>
                                            </View>

                                            <View style={styles.accContent}>
                                                <Text style={styles.accTitle} numberOfLines={1}>
                                                    {acc.title}
                                                </Text>
                                                <View style={styles.accLocationRow}>
                                                    <MapPin size={12} color="#888" />
                                                    <Text style={styles.accLocation} numberOfLines={1}>
                                                        {acc.location}
                                                    </Text>
                                                </View>
                                                
                                                <View style={styles.accDivider} />

                                                <View style={styles.accFooter}>
                                                    <Text style={styles.accPrice}>
                                                        ₱{acc.price} <Text style={styles.accPerNight}>/ night</Text>
                                                    </Text>
                                                    
                                                    <View style={styles.accAmenities}>
                                                        {acc.amenities?.wifi && <Wifi size={14} color="#666" style={{marginLeft:6}} />}
                                                        {acc.amenities?.parking && <Car size={14} color="#666" style={{marginLeft:6}} />}
                                                        {acc.amenities?.breakfast && <Coffee size={14} color="#666" style={{marginLeft:6}} />}
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
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
    
    // --- ACCOMMODATION CARD STYLES ---
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
        borderWidth: 1,
        borderColor: '#f0f0f0',
        overflow: 'hidden'
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
    accPrice: { fontSize: 14, fontWeight: '700', color: '#00A8FF' },
    accPerNight: { fontSize: 11, color: '#999', fontWeight: '400' },
    accAmenities: { flexDirection: 'row' },

    // Calendar & Legend
    calendarContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#eee' },
    calendarStyle: { borderRadius: 8, overflow: 'hidden' },
    legendContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 12, color: '#666' },
});

export default GuideProfile;