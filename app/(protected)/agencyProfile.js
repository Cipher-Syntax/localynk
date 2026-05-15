import { Image } from 'expo-image';
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import ConfirmationModal from '../../components/ConfirmationModal';
import StopDetailsModal from '../../components/itinerary/StopDetailsModal';
import { styles } from './styles/agencyProfile.styles';

const AgencyProfile = () => {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { agencyId, placeId } = useLocalSearchParams();

    const [agency, setAgency] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTour, setSelectedTour] = useState(null);
    const [copyModalVisible, setCopyModalVisible] = useState(false);
    const [stopDetailsVisible, setStopDetailsVisible] = useState(false);

    useEffect(() => {
        const fetchAgencyData = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/agency-profile-public/${agencyId}/`);
                setAgency(res.data);
                if (res.data.tour_packages && res.data.tour_packages.length > 0) {
                    setSelectedTour(res.data.tour_packages[0]);
                }
            } catch (error) {
                console.error("Failed to fetch agency profile:", error);
            } finally {
                setLoading(false);
            }
        };

        if (agencyId) {
            fetchAgencyData();
        }
    }, [agencyId]);

    const handleBookAgency = () => {
        if (!agency) return;

        router.push({
            pathname: '/(protected)/payment',
            params: { 
                entityId: agency.user, 
                agencyId: agency.id,
                entityName: agency.business_name,
                agencyLogo: agency.logo || agency.profile_picture,
                bookingType: 'agency', 
                placeId: placeId,
                placeName: agency.user_details?.municipality || agency.user_details?.location || "Destination",
                agencyDownPayment: agency.down_payment_percentage,
                agencyAvailableDays: JSON.stringify(agency.available_days || []),
                agencyOpeningTime: agency.opening_time || '',
                agencyClosingTime: agency.closing_time || '',
                
                tourPackageId: selectedTour ? selectedTour.id : null,
                itineraryTimeline: selectedTour && selectedTour.itinerary_timeline 
                    ? (typeof selectedTour.itinerary_timeline === 'string' ? selectedTour.itinerary_timeline : JSON.stringify(selectedTour.itinerary_timeline))
                    : null,
                packageDuration: selectedTour ? (Number(selectedTour.duration_days) || 1) : 1
            }
        });
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000';
        return `${base}${path}`;
    };

    const timelineData = useMemo(() => {
        if (!selectedTour?.itinerary_timeline) return [];
        try {
            return typeof selectedTour.itinerary_timeline === 'string'
                ? JSON.parse(selectedTour.itinerary_timeline)
                : selectedTour.itinerary_timeline;
        } catch (_error) {
            return [];
        }
    }, [selectedTour]);

    if (loading) {
        return (
            <ScreenSafeArea>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00A8FF" />
                </View>
            </ScreenSafeArea>
        );
    }

    if (!agency) {
        return (
            <ScreenSafeArea>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Agency profile not found.</Text>
                </View>
            </ScreenSafeArea>
        );
    }

    const businessLogo = getImageUrl(agency.logo);
    const isOwnAgency = currentUser && Number(currentUser.id) === Number(agency.user);

    return (
        <ScreenSafeArea>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header / Banner */}
                <View style={styles.headerBanner}>
                    <LinearGradient
                        colors={['#0072FF', '#00C6FF']}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    
                    <View style={styles.profileInfo}>
                        <View style={styles.logoContainer}>
                            {businessLogo ? (
                                <Image source={{ uri: businessLogo }} style={styles.logo} />
                            ) : (
                                <Ionicons name="business" size={40} color="#00A8FF" />
                            )}
                        </View>
                        <Text style={styles.businessName}>{agency.business_name}</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-sharp" size={14} color="#fff" />
                            <Text style={styles.locationText}>{agency.user_details?.municipality || agency.user_details?.location || "Travel Agency"}</Text>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Packages Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="map" size={18} color="#1A2332" />
                            <Text style={styles.sectionTitle}>Available Tour Packages</Text>
                        </View>
                        
                        {agency.tour_packages?.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packageScroll}>
                                {agency.tour_packages.map((pkg) => (
                                    <TouchableOpacity
                                        key={pkg.id}
                                        style={[styles.packagePill, selectedTour?.id === pkg.id && styles.packagePillActive]}
                                        onPress={() => setSelectedTour(pkg)}
                                    >
                                        <Text style={[styles.packagePillText, selectedTour?.id === pkg.id && styles.packagePillTextActive]}>
                                            {pkg.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (
                            <Text style={styles.emptyText}>This agency has no public tour packages yet.</Text>
                        )}
                    </View>

                    {selectedTour && (
                        <View style={styles.tourCard}>
                            <View style={styles.tourHeaderRow}>
                                <Text style={styles.tourName}>{selectedTour.name}</Text>
                                {!isOwnAgency && currentUser && (currentUser.is_local_guide || currentUser.role === 'guide') && (
                                    <TouchableOpacity 
                                        style={styles.copyButton} 
                                        onPress={() => setCopyModalVisible(true)}
                                    >
                                        <Ionicons name="copy-outline" size={14} color="#00A8FF" />
                                        <Text style={styles.copyButtonText}>Copy Package</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <Text style={styles.description}>{selectedTour.description}</Text>
                            
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Ionicons name="time-outline" size={16} color="#64748B" />
                                    <Text style={styles.statText}>{selectedTour.duration}</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="people-outline" size={16} color="#64748B" />
                                    <Text style={styles.statText}>Up to {selectedTour.max_group_size} pax</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Ionicons name="pricetag-outline" size={16} color="#00A8FF" />
                                    <Text style={[styles.statText, {color: '#00A8FF', fontWeight: 'bold'}]}>₱{selectedTour.price_per_day}</Text>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={styles.viewItineraryBtn}
                                onPress={() => setStopDetailsVisible(true)}
                            >
                                <Text style={styles.viewItineraryText}>View Detailed Itinerary</Text>
                                <Ionicons name="chevron-forward" size={16} color="#00A8FF" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {!isOwnAgency && (
                        <TouchableOpacity 
                            style={styles.bookButton} 
                            activeOpacity={0.8} 
                            onPress={handleBookAgency}
                        >
                            <Text style={styles.bookButtonText}>BOOK THIS AGENCY</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

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

            <StopDetailsModal
                visible={stopDetailsVisible}
                onClose={() => setStopDetailsVisible(false)}
                timeline={timelineData}
                stopCatalog={Array.isArray(selectedTour?.stops) ? selectedTour.stops : []}
                getImageUrl={getImageUrl}
            />
        </ScreenSafeArea>
    );
};


export default AgencyProfile;