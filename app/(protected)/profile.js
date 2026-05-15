import { Image } from 'expo-image';
import React, { useState, useEffect, useMemo } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User, Calendar as CalendarIcon, Star, Compass, Clock, Languages, Package, MapPin, Bed, Wifi, Car, Coffee, CheckCircle } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { Calendar } from 'react-native-calendars';
import StopDetailsModal from '../../components/itinerary/StopDetailsModal';
import ConfirmationModal from '../../components/ConfirmationModal';

import { useAuth } from '../../context/AuthContext'; 
import ScreenSafeArea from '../../components/ScreenSafeArea';
import { styles } from './styles/profile.styles';

const GuideProfile = () => {
    const { user } = useAuth(); 
    const router = useRouter();
    const params = useLocalSearchParams();
    const { userId, placeId } = params;

    const [guide, setGuide] = useState(null);
    const [destination, setDestination] = useState(null);
    const [accommodations, setAccommodations] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [copyModalVisible, setCopyModalVisible] = useState(false);

    // --- MULTI-PACKAGE DYNAMIC STATE ---
    const [tourPackages, setTourPackages] = useState([]);
    const [selectedTour, setSelectedTour] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [stopDetailsVisible, setStopDetailsVisible] = useState(false);

    const isOwnProfile = user && user.id === parseInt(userId);

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

            setLoading(true);
            setGuide(null);
            
            try {
                const [guideRes, destRes, toursRes, accomRes] = await Promise.all([
                    api.get(`/api/guides/${userId}/`),
                    api.get(`/api/destinations/${placeId}/`),
                    api.get(`/api/destinations/${placeId}/tours/`),
                    // FIX: Target the guide's accommodations explicitly using host_id
                    api.get('/api/accommodations/', { params: { host_id: userId } }) 
                ]);

                setGuide(guideRes.data);
                setDestination(destRes.data);
                
                // Safely handle array or paginated response
                const fetchedAccoms = Array.isArray(accomRes.data) ? accomRes.data : (accomRes.data.results || []);
                setAccommodations(fetchedAccoms);
                
                const guidesTours = toursRes.data.filter(tour => tour.guide === parseInt(userId));
                setTourPackages(guidesTours);
                if (guidesTours.length > 0) {
                    setSelectedTour(guidesTours[0]);
                }

            } catch (error) {
                console.error('Failed to fetch page data for profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId, placeId, user]); 

    // --- DELETE & EDIT LOGIC ---
    const handleDeleteTour = () => {
        Alert.alert(
            "Delete Tour Package",
            `Are you sure you want to delete "${selectedTour.name}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            setIsDeleting(true);
                            await api.delete(`/api/tours/${selectedTour.id}/`);
                            const updatedTours = tourPackages.filter(t => t.id !== selectedTour.id);
                            setTourPackages(updatedTours);
                            setSelectedTour(updatedTours.length > 0 ? updatedTours[0] : null);
                            Alert.alert("Success", "Tour package deleted successfully.");
                        } catch (_error) {
                            Alert.alert("Error", "Failed to delete tour package. Please try again.");
                        } finally {
                            setIsDeleting(false);
                        }
                    } 
                }
            ]
        );
    };

    const handleEditTour = () => {
        router.push({ pathname: '/(protected)/addTour', params: { editTourId: selectedTour.id } });
    };

    // --- BULLETPROOF MULTI-DAY CALCULATION ---
    const timelineData = useMemo(() => {
        if (!selectedTour || !selectedTour.itinerary_timeline) return [];
        try {
            const raw = selectedTour.itinerary_timeline;
            return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch(_e) { return []; }
    }, [selectedTour]);

    const renderSequentialItinerary = () => {
         if (timelineData.length === 0) return <Text style={styles.emptyText}>No detailed timeline available.</Text>;

         const grouped = timelineData.reduce((acc, item) => {
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

    let safeInclusions = ["Standard Guide Services"];
    if (selectedTour) {
        if (Array.isArray(selectedTour.inclusions) && selectedTour.inclusions.length > 0) safeInclusions = selectedTour.inclusions;
        else if (selectedTour.what_to_bring) {
             if (Array.isArray(selectedTour.what_to_bring)) safeInclusions = selectedTour.what_to_bring;
             else if (typeof selectedTour.what_to_bring === 'string') safeInclusions = [selectedTour.what_to_bring];
        }
    }

    let finalImage = null;
    if (destination?.images?.length > 0) {
        finalImage = destination.images[0].image;
    } else if (selectedTour?.stops?.length > 0) {
        finalImage = selectedTour.stops[0].image;
    }

    return (
        <ScrollView style={styles.container}>
            <ScreenSafeArea statusBarStyle='light-content' edges={['bottom']}>
                
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
                                   <Text style={styles.detailsHeader}>Available Tour Packages</Text>
                                </View>

                                {/* Package Selection Pills */}
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packageScroll}>
                                    {tourPackages.map(pkg => {
                                        const isSelected = selectedTour?.id === pkg.id;
                                        const duration = parseInt(pkg.duration_days) || 1;
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
                                        );
                                    })}
                                </ScrollView>

                                {/* Selected Tour Details Header & Action Buttons */}
                                <View style={styles.tourTitleRow}>
                                    <Text style={styles.selectedTourTitle}>{selectedTour?.name || "Custom Plan"}</Text>
                                    
                                    {isOwnProfile && selectedTour && (
                                        <View style={styles.actionIconsRow}>
                                            <TouchableOpacity onPress={handleEditTour} style={styles.iconBtn}>
                                                <Ionicons name="pencil" size={18} color="#00A8FF" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={handleDeleteTour} style={[styles.iconBtn, {backgroundColor: '#fee2e2'}]} disabled={isDeleting}>
                                                {isDeleting ? <ActivityIndicator size="small" color="#ef4444"/> : <Ionicons name="trash" size={18} color="#ef4444" />}
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    {!isOwnProfile && selectedTour && user && (user.role === 'guide' || user.is_local_guide || user.is_agency || user.role === 'agency') && (
                                        <TouchableOpacity 
                                            style={styles.copyPackageButton} 
                                            onPress={() => setCopyModalVisible(true)}
                                        >
                                            <Ionicons name="copy-outline" size={14} color="#00A8FF" />
                                            <Text style={styles.copyPackageText}>Copy Package</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Text style={styles.itineraryText}>{selectedTour?.description || "No description provided."}</Text>

                                {selectedTour && (
                                    <View style={styles.packageDetailsGrid}>
                                        <View style={styles.packageDetailItem}>
                                            <Clock size={14} color="#8B98A8"/>
                                            <Text style={styles.packageDetailText}>{selectedTour.duration}</Text>
                                        </View>
                                        <View style={styles.packageDetailItem}>
                                            <User size={14} color="#8B98A8"/>
                                            <Text style={styles.packageDetailText}>Max {selectedTour.max_group_size} people</Text>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.divider} />
                                <View style={styles.subHeaderRow}>
                                    <Text style={styles.subHeader}>Itinerary Schedule</Text>
                                    {timelineData.length > 0 && (
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
                        )}

                        {selectedTour?.stops && selectedTour.stops.length > 0 && (
                            <View style={styles.detailsSection}>
                                 <View style={styles.sectionHeader}>
                                   <MapPin size={18} color="#1A2332" />
                                   <Text style={styles.detailsHeader}>Tour Stops Preview</Text>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stopsScrollView}>
                                    {selectedTour.stops.map(stop => (
                                        <View key={stop.id} style={styles.stopCard}>
                                            <Image source={{uri: getImageUrl(stop.image)}} style={styles.stopImage} />
                                            <Text style={styles.stopName}>{stop.name}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {accommodations.length > 0 && (
                            <View style={styles.detailsSection}>
                                <View style={styles.sectionHeader}>
                                    <Bed size={18} color="#1A2332" />
                                    <Text style={styles.detailsHeader}>Available Accommodations</Text>
                                </View>
                                
                                <FlatList 
                                    horizontal 
                                    showsHorizontalScrollIndicator={false} 
                                    contentContainerStyle={styles.accSwiperContainer}
                                    data={accommodations}
                                    keyExtractor={acc => acc.id?.toString()}
                                    renderItem={({ item: acc }) => (
                                        <TouchableOpacity 
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
                                    )}
                                />
                            </View>
                        )}

                        <View style={styles.detailsSection}>
                            <Text style={styles.detailsHeader}>Guide Details</Text>
                            <View style={styles.infoItem}>
                                <Languages size={16} color="#1A2332" />
                                <Text style={styles.detailText}>
                                    <Text style={styles.detailLabel}>
                                        Language: </Text>{Array.isArray(guide.languages) ? guide.languages.join(', ') : guide.languages}
                                    </Text>
                                </View>
                            <View style={styles.infoItem}>
                                <Compass size={16} color="#1A2332" />
                                <Text style={styles.detailText}>
                                    <Text style={styles.detailLabel}>Specialty: </Text>
                                    {Array.isArray(guide.specialties) && guide.specialties.length > 0
                                        ? guide.specialties.join(', ')
                                        : guide.specialty}
                                </Text>
                            </View>
                            <View style={styles.infoItem}><Clock size={16} color="#1A2332" /><Text style={styles.detailText}><Text style={styles.detailLabel}>Experience: </Text>{guide.experience_years} years</Text></View>
                        </View>

                        <SafeAreaView edges={['bottom']} style={styles.detailsSection}>
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
                        </SafeAreaView>
                        
                    </View>
                </View>

                <StopDetailsModal
                    visible={stopDetailsVisible}
                    onClose={() => setStopDetailsVisible(false)}
                    timeline={timelineData}
                    stopCatalog={Array.isArray(selectedTour?.stops) ? selectedTour.stops : []}
                    accommodationCatalog={accommodations}
                    getImageUrl={getImageUrl}
                />

                <ConfirmationModal
                    visible={copyModalVisible}
                    title="Copy Tour Package"
                    description="Please review properly what you want to copy and remove what you do not want to include."
                    confirmText="Proceed"
                    cancelText="Cancel"
                    onConfirm={() => {
                        setCopyModalVisible(false);
                        router.push({
                            pathname: "/(protected)/addTour",
                            params: {
                                copiedPackage: JSON.stringify(selectedTour)
                            }
                        });
                    }}
                    onCancel={() => setCopyModalVisible(false)}
                />
            </ScreenSafeArea>
        </ScrollView>
    );
};

export default GuideProfile;
