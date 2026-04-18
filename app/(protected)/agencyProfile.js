import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import ConfirmationModal from '../../components/ConfirmationModal';
import StopDetailsModal from '../../components/itinerary/StopDetailsModal';

const { width } = Dimensions.get('window');

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
        } catch (e) {
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { color: '#64748B', fontSize: 16 },
    headerBanner: { height: 220, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    backButton: { position: 'absolute', top: 20, left: 20, zIndex: 10, padding: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.2)' },
    profileInfo: { alignItems: 'center', marginTop: 20 },
    logoContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, overflow: 'hidden' },
    logo: { width: '100%', height: '100%' },
    businessName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4, textAlign: 'center' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { color: '#E2E8F0', fontSize: 14, fontWeight: '500' },
    content: { flex: 1, padding: 20, marginTop: -20, backgroundColor: '#F8FAFC', borderTopLeftRadius: 25, borderTopRightRadius: 25 },
    section: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A2332' },
    packageScroll: { flexDirection: 'row', marginBottom: 5 },
    packagePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    packagePillActive: { backgroundColor: '#EFF6FF', borderColor: '#00A8FF' },
    packagePillText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    packagePillTextActive: { color: '#00A8FF' },
    emptyText: { color: '#94A3B8', fontStyle: 'italic', fontSize: 14, textAlign: 'center', marginTop: 10 },
    tourCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    tourHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10 },
    tourName: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', flex: 1 },
    copyButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E0F2FE', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#BAE6FD' },
    copyButtonText: { fontSize: 12, fontWeight: '600', color: '#0369A1' },
    description: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 16 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 16, marginBottom: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
    viewItineraryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    viewItineraryText: { fontSize: 14, fontWeight: 'bold', color: '#00A8FF' },
    bookButton: { backgroundColor: '#00A8FF', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, marginBottom: 20, shadowColor: "#00A8FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    bookButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});

export default AgencyProfile;