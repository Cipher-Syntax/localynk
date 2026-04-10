import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { formatPHPhoneLocal } from '../../utils/phoneNumber';
import ScreenSafeArea from '../../components/ScreenSafeArea';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const normalizeDayToken = (day) => {
    if (!day) return null;
    const raw = String(day).trim().toLowerCase();
    if (raw === 'all' || raw === 'daily' || raw === 'everyday') return 'All';
    const map = {
        monday: 'Mon', mon: 'Mon',
        tuesday: 'Tue', tue: 'Tue', tues: 'Tue',
        wednesday: 'Wed', wed: 'Wed',
        thursday: 'Thu', thu: 'Thu', thurs: 'Thu',
        friday: 'Fri', fri: 'Fri',
        saturday: 'Sat', sat: 'Sat',
        sunday: 'Sun', sun: 'Sun',
    };
    return map[raw] || null;
};

const formatOperatingDays = (days) => {
    if (!Array.isArray(days) || days.length === 0) return 'Daily';

    const normalized = new Set(days.map(normalizeDayToken).filter(Boolean));
    if (normalized.has('All')) return 'Daily';

    const ordered = DAY_ORDER.filter((day) => normalized.has(day));
    if (ordered.length === 0) return 'Daily';

    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    if (weekdays.every((day) => normalized.has(day)) && ordered.length === weekdays.length) {
        return 'Mon - Fri';
    }

    if (ordered.length === DAY_ORDER.length) return 'Daily';
    return ordered.join(', ');
};

const formatTimeValue = (timeStr) => {
    if (!timeStr) return null;
    const [hourRaw, minuteRaw] = String(timeStr).split(':');
    const hour = Number.parseInt(hourRaw, 10);
    const minute = Number.parseInt(minuteRaw, 10);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    const period = hour >= 12 ? 'PM' : 'AM';
    const twelveHour = hour % 12 || 12;
    return `${twelveHour}:${String(minute).padStart(2, '0')} ${period}`;
};

const formatOperatingHours = (openingTime, closingTime) => {
    const open = formatTimeValue(openingTime);
    const close = formatTimeValue(closingTime);

    if (open && close) return `${open} - ${close}`;
    if (open) return `Opens ${open}`;
    if (close) return `Closes ${close}`;
    return 'Hours not set';
};

const AgencySelection = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAgency, setSelectedAgency] = useState(null);

    useEffect(() => {
        const fetchAgencies = async () => {
            setLoading(true);
            try {
                const rawPlaceId = Array.isArray(params.placeId) ? params.placeId[0] : params.placeId;
                const destinationId = Number(rawPlaceId);
                const hasDestination = Number.isFinite(destinationId) && destinationId > 0;

                const [agenciesResponse, toursResponse] = await Promise.all([
                    api.get('/api/agencies/'),
                    hasDestination
                        ? api.get(`/api/destinations/${destinationId}/tours/`)
                        : Promise.resolve({ data: [] }),
                ]);

                const rawData = Array.isArray(agenciesResponse.data)
                    ? agenciesResponse.data
                    : agenciesResponse.data.results || [];

                const destinationTours = Array.isArray(toursResponse.data)
                    ? toursResponse.data
                    : toursResponse.data.results || [];

                const destinationAgencyUserIds = new Set(
                    destinationTours
                        .map((tour) => Number(tour?.agency_user_id))
                        .filter((id) => Number.isFinite(id) && id > 0)
                );

                const destinationAgencyProfileIds = new Set(
                    destinationTours
                        .map((tour) => Number(tour?.agency?.id || tour?.agency_id || tour?.agency))
                        .filter((id) => Number.isFinite(id) && id > 0)
                );

                const agencyMaxGuestsByUserId = new Map();
                const agencyMaxGuestsByProfileId = new Map();

                destinationTours.forEach((tour) => {
                    const pax = Number.parseInt(tour?.max_group_size, 10);
                    if (!Number.isFinite(pax) || pax <= 0) return;

                    const agencyUserId = Number(tour?.agency_user_id);
                    if (Number.isFinite(agencyUserId) && agencyUserId > 0) {
                        agencyMaxGuestsByUserId.set(
                            agencyUserId,
                            Math.max(agencyMaxGuestsByUserId.get(agencyUserId) || 0, pax)
                        );
                    }

                    const agencyProfileId = Number(tour?.agency?.id || tour?.agency_id || tour?.agency);
                    if (Number.isFinite(agencyProfileId) && agencyProfileId > 0) {
                        agencyMaxGuestsByProfileId.set(
                            agencyProfileId,
                            Math.max(agencyMaxGuestsByProfileId.get(agencyProfileId) || 0, pax)
                        );
                    }
                });

                const validAgencies = rawData.filter(item => 
                    item.business_name && 
                    item.business_name.trim() !== '' &&
                    item.status === 'Approved'
                );

                const destinationScopedAgencies = hasDestination
                    ? validAgencies.filter((agency) => {
                        const agencyUserId = Number(agency.user);
                        const agencyProfileId = Number(agency.id);
                        return destinationAgencyUserIds.has(agencyUserId) || destinationAgencyProfileIds.has(agencyProfileId);
                    })
                    : validAgencies;

                const decoratedAgencies = destinationScopedAgencies.map((agency) => {
                    const agencyUserId = Number(agency.user);
                    const agencyProfileId = Number(agency.id);
                    const maxGuests = Math.max(
                        agencyMaxGuestsByUserId.get(agencyUserId) || 0,
                        agencyMaxGuestsByProfileId.get(agencyProfileId) || 0
                    );

                    return {
                        ...agency,
                        maxGuests,
                    };
                });

                setAgencies(decoratedAgencies);
            } catch (error) {
                console.error('Failed to fetch agencies:', error);
                setAgencies([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAgencies();
    }, [params.placeId]);

    const handleOpenDetails = (agency) => {
        if (agency.is_active === false || agency.is_guide_visible === false) return;
        
        setSelectedAgency(agency);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedAgency(null);
    };

    const handleSelectAgency = () => {
        if (!selectedAgency) return;
        
        setModalVisible(false);
        
        router.push({
            pathname: '/(protected)/payment',
            params: { 
                entityId: selectedAgency.user, 
                agencyId: selectedAgency.id,
                entityName: selectedAgency.business_name,
                agencyLogo: selectedAgency.logo || selectedAgency.profile_picture,
                bookingType: 'agency', 
                placeId: params.placeId,
                placeName: params.placeName,
                agencyDownPayment: selectedAgency.down_payment_percentage,
                agencyAvailableDays: JSON.stringify(selectedAgency.available_days || []),
                agencyOpeningTime: selectedAgency.opening_time || '',
                agencyClosingTime: selectedAgency.closing_time || '',
            }
        });
    };

    const handleSendMessage = (agency) => {
        const partnerId = Number(agency?.user);
        if (!Number.isFinite(partnerId) || partnerId <= 0) {
            return;
        }

        router.push({
            pathname: '/(protected)/message',
            params: {
                partnerId: String(partnerId),
                partnerName: agency?.business_name || 'Agency',
                partnerImage: agency?.logo || agency?.profile_picture || '',
            },
        });
    };

    const filteredAgencies = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return agencies.filter((agency) => {
            const isDeactivated = agency.is_active === false;
            const isOffline = agency.is_guide_visible === false || isDeactivated;

            const statusPass = statusFilter === 'all'
                ? true
                : statusFilter === 'available'
                    ? !isOffline
                    : isOffline;

            if (!statusPass) return false;

            if (!query) return true;

            const haystack = [
                agency.business_name,
                agency.owner_name,
                agency.email,
                agency.phone,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [agencies, searchQuery, statusFilter]);

    const renderAgencyCard = ({ item }) => {
        if (!item || !item.business_name) return null;

        let imageUri = null;
        const targetImage = item.logo || item.profile_picture; 
        
        if (targetImage) {
            imageUri = targetImage.startsWith('http') 
                ? targetImage 
                : `${api.defaults.baseURL}${targetImage}`;
        }

        const rating = item.rating ? parseFloat(item.rating).toFixed(1) : 'New'; 
        const reviewCount = item.review_count || 0; 
        const operatingDays = formatOperatingDays(item.available_days);
        const operatingHours = formatOperatingHours(item.opening_time, item.closing_time);
        const maxGuestsLabel = Number(item.maxGuests) > 0 ? `${item.maxGuests} guests` : 'Not set';

        // Status checks
        const isDeactivated = item.is_active === false;
        const isOffline = item.is_guide_visible === false || isDeactivated; 
        
        const cardOpacity = isOffline ? 0.6 : 1;

        return (
            <View style={[styles.agencyCard, { opacity: cardOpacity }]}>
                <View style={styles.cardProfileSection}>
                    <View style={[styles.iconWrapper, isOffline && { opacity: 0.5 }]}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.profilePicture} />
                        ) : (
                            <View style={styles.placeholderIcon}>
                                <Ionicons name="business" size={32} color="#FFF" />
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.profileInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            <Text style={styles.businessName}>{item.business_name}</Text>
                            
                            {isDeactivated ? (
                                <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}>
                                    <Text style={[styles.statusText, { color: '#EF4444' }]}>Deactivated</Text>
                                </View>
                            ) : isOffline ? (
                                <View style={[styles.statusBadge, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
                                    <Text style={[styles.statusText, { color: '#64748B' }]}>Offline</Text>
                                </View>
                            ) : null}
                        </View>
                        
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color={isOffline ? "#CBD5E1" : "#F59E0B"} />
                            <Text style={[styles.ratingText, isOffline && { color: '#94A3B8' }]}>{rating}</Text>
                            {reviewCount > 0 && (
                                <Text style={styles.reviewCount}>({reviewCount} reviews)</Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.verifiedBadge}>
                         <Ionicons name="shield-checkmark" size={16} color={isOffline ? "#CBD5E1" : "#00C853"} />
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.scheduleWrap}>
                    <View style={styles.scheduleRow}>
                        <Ionicons name="calendar-outline" size={14} color="#0072FF" />
                        <Text style={styles.scheduleLabel}>Operating Days</Text>
                        <Text style={styles.scheduleValue}>{operatingDays}</Text>
                    </View>
                    <View style={styles.scheduleRow}>
                        <Ionicons name="time-outline" size={14} color="#0072FF" />
                        <Text style={styles.scheduleLabel}>Hours</Text>
                        <Text style={styles.scheduleValue}>{operatingHours}</Text>
                    </View>
                    <View style={styles.scheduleRow}>
                        <Ionicons name="people-outline" size={14} color="#0072FF" />
                        <Text style={styles.scheduleLabel}>Max Guests</Text>
                        <Text style={styles.scheduleValue}>{maxGuestsLabel}</Text>
                    </View>
                </View>

                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="call-outline" size={14} color="#64748B" />
                        <Text style={styles.detailText}>
                            {item.phone ? formatPHPhoneLocal(item.phone) : 'No contact info'}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="mail-outline" size={14} color="#64748B" />
                        <Text style={styles.detailText}>
                            {item.email}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.detailsButton, 
                        isOffline && { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' }
                    ]}
                    onPress={() => handleOpenDetails(item)}
                    activeOpacity={0.7}
                    disabled={isOffline}
                >
                    <Text style={[styles.detailsButtonText, isOffline && { color: '#94A3B8' }]}>
                        {isOffline ? 'UNAVAILABLE' : 'VIEW DETAILS'}
                    </Text>
                    <Ionicons name={isOffline ? "lock-closed" : "eye-outline"} size={16} color={isOffline ? "#94A3B8" : "#0072FF"} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.messageButton,
                        isOffline && { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }
                    ]}
                    onPress={() => handleSendMessage(item)}
                    activeOpacity={0.7}
                    disabled={isOffline || !item?.user}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={isOffline ? '#94A3B8' : '#FFFFFF'} />
                    <Text style={[styles.messageButtonText, isOffline && { color: '#94A3B8' }]}>SEND MESSAGE</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderModalContent = () => {
        if (!selectedAgency) return null;

        let imageUri = null;
        const targetImage = selectedAgency.logo || selectedAgency.profile_picture;
        
        if (targetImage) {
            imageUri = targetImage.startsWith('http') 
                ? targetImage 
                : `${api.defaults.baseURL}${targetImage}`;
        }

        const rating = selectedAgency.rating ? parseFloat(selectedAgency.rating).toFixed(1) : 'New';
        const reviewCount = selectedAgency.review_count || 0;
        const operatingDays = formatOperatingDays(selectedAgency.available_days);
        const operatingHours = formatOperatingHours(selectedAgency.opening_time, selectedAgency.closing_time);
        const maxGuestsLabel = Number(selectedAgency.maxGuests) > 0 ? `${selectedAgency.maxGuests} guests` : 'Not set';

        return (
            <ScrollView>
                <View style={styles.modalHeader}>
                    <View style={styles.modalImageContainer}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.modalImage} />
                        ) : (
                            <View style={styles.modalPlaceholder}>
                                <Ionicons name="business" size={60} color="#CBD5E1" />
                            </View>
                        )}
                    </View>
                    <Text style={styles.modalTitle}>{selectedAgency.business_name}</Text>
                    <View style={styles.modalRating}>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.modalRatingText}>{rating} • {reviewCount} reviews</Text>
                    </View>
                </View>

                <ScrollView style={styles.modalInfoList} showsVerticalScrollIndicator={false}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}><Ionicons name="people" size={18} color="#0072FF" /></View>
                        <View>
                            <Text style={styles.infoLabel}>Max Guests Allowed</Text>
                            <Text style={styles.infoValue}>{maxGuestsLabel}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}><Ionicons name="calendar" size={18} color="#0072FF" /></View>
                        <View>
                            <Text style={styles.infoLabel}>Operating Days</Text>
                            <Text style={styles.infoValue}>{operatingDays}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}><Ionicons name="time" size={18} color="#0072FF" /></View>
                        <View>
                            <Text style={styles.infoLabel}>Operating Hours</Text>
                            <Text style={styles.infoValue}>{operatingHours}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}><Ionicons name="call" size={18} color="#0072FF" /></View>
                        <View>
                            <Text style={styles.infoLabel}>Contact Number</Text>
                            <Text style={styles.infoValue}>{selectedAgency.phone ? formatPHPhoneLocal(selectedAgency.phone) : 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}><Ionicons name="mail" size={18} color="#0072FF" /></View>
                        <View>
                            <Text style={styles.infoLabel}>Email Address</Text>
                            <Text style={styles.infoValue}>{selectedAgency.email}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}><Ionicons name="shield-checkmark" size={18} color="#00C853" /></View>
                        <View>
                            <Text style={styles.infoLabel}>Verification Status</Text>
                            <Text style={styles.infoValue}>Officially Approved Agency</Text>
                        </View>
                    </View>
                </ScrollView>

                <SafeAreaView edges={['bottom']} style={styles.modalFooter}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseModal}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.confirmBtn} onPress={handleSelectAgency}>
                        <LinearGradient
                            colors={['#0072FF', '#00C6FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.confirmGradient}
                        >
                            <Text style={styles.confirmBtnText}>CHOOSE AGENCY</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </SafeAreaView>
            </ScrollView>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ScreenSafeArea edges={['bottom', 'top']} style={{ flex: 1 }}>
                    <View style={styles.header}>
                        <View style={[styles.headerImage, { backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }]} />
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.heroSection}>
                            <View style={{ height: 28, width: 180, backgroundColor: '#E0E6ED', borderRadius: 8, marginBottom: 8 }} />
                            <View style={{ height: 16, width: '100%', backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 4 }} />
                            <View style={{ height: 16, width: '80%', backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                        </View>

                        {[1, 2, 3].map((item) => (
                            <View key={item} style={styles.agencyCard}>
                                <View style={styles.cardProfileSection}>
                                    <View style={[styles.iconWrapper, { backgroundColor: '#E0E6ED', borderWidth: 0 }]} />
                                    <View style={styles.profileInfo}>
                                        <View style={{ height: 18, width: 140, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 8 }} />
                                        <View style={{ height: 14, width: 100, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 6 }} />
                                        <View style={{ height: 14, width: 80, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.detailsRow}>
                                    <View style={{ height: 14, width: 100, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                                    <View style={{ height: 14, width: 120, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                                </View>
                                <View style={{ height: 45, width: '100%', backgroundColor: '#E0E6ED', borderRadius: 12, marginTop: 8 }} />
                            </View>
                        ))}
                    </ScrollView>
                </ScreenSafeArea>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
                
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>SELECT AGENCY</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.heroSection}>
                        <Text style={styles.heroTitle}>Trusted Partners</Text>
                        <Text style={styles.heroSubtitle}>
                            Choose a verified agency to handle your itinerary for <Text style={{fontWeight:'700', color:'#00A8FF'}}>{params.placeName || 'your trip'}</Text>.
                        </Text>
                    </View>

                    <View style={styles.filterCard}>
                        <View style={styles.searchInputWrap}>
                            <Ionicons name="search" size={16} color="#64748B" />
                            <TextInput
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search agency by name, or email"
                                placeholderTextColor="#94A3B8"
                                style={styles.searchInput}
                            />
                            {!!searchQuery && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={16} color="#64748B" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.filterChipRow}>
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'available', label: 'Available' },
                                { key: 'offline', label: 'Offline' },
                            ].map((chip) => (
                                <TouchableOpacity
                                    key={chip.key}
                                    onPress={() => setStatusFilter(chip.key)}
                                    style={[styles.filterChip, statusFilter === chip.key && styles.filterChipActive]}
                                >
                                    <Text style={[styles.filterChipText, statusFilter === chip.key && styles.filterChipTextActive]}>{chip.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.filterSummaryText}>
                            Showing {filteredAgencies.length} of {agencies.length} agency{agencies.length !== 1 ? 'ies' : ''}
                        </Text>
                    </View>

                    <FlatList
                        data={filteredAgencies}
                        renderItem={renderAgencyCard}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name={agencies.length > 0 ? 'search-outline' : 'business-outline'} size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>
                                    {agencies.length > 0
                                        ? 'No agencies match your current filters.'
                                        : 'No approved agencies linked to this destination yet.'}
                                </Text>
                            </View>
                        }
                    />
                </ScrollView>
            </SafeAreaView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleCloseModal}
            >
                <SafeAreaView edges={['bottom']} style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        {renderModalContent()}
                    </View>
                </SafeAreaView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTitle: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase'
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 5,
        zIndex: 10,
    },

    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },

    heroSection: {
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },

    filterCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        padding: 12,
        marginBottom: 14,
    },
    searchInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 13,
        color: '#0F172A',
    },
    filterChipRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 999,
        backgroundColor: '#F8FAFC',
    },
    filterChipActive: {
        backgroundColor: '#E0F2FE',
        borderColor: '#0EA5E9',
    },
    filterChipText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#0369A1',
        fontWeight: '700',
    },
    filterSummaryText: {
        marginTop: 10,
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },

    agencyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardProfileSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    profilePicture: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderIcon: {
        width: '100%',
        height: '100%',
        backgroundColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    businessName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#B45309', 
    },
    reviewCount: {
        fontSize: 12,
        color: '#94A3B8',
    },
    verifiedBadge: {
        padding: 4,
    },

    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },

    scheduleWrap: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        padding: 10,
        gap: 8,
        marginBottom: 12,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    scheduleLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    scheduleValue: {
        fontSize: 12,
        color: '#0F172A',
        fontWeight: '700',
        marginLeft: 'auto',
    },

    detailsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 12,
        color: '#64748B',
    },

    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#0072FF',
        borderRadius: 12,
        gap: 8,
        backgroundColor: '#EFF6FF',
    },
    detailsButtonText: {
        color: '#0072FF',
        fontSize: 14,
        fontWeight: '700',
    },
    messageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        marginTop: 10,
        backgroundColor: '#0072FF',
        borderWidth: 1,
        borderColor: '#0072FF',
    },
    messageButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },

    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#F8FAFC'
    },
    loadingText: { 
        marginTop: 12, 
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500'
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 15,
        color: '#94A3B8',
        textAlign: 'center',
        width: '80%',
        lineHeight: 22,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end', 
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        height: 'auto',        
        maxHeight: '90%',      
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalImageContainer: {
        width: '100%',     
        height: 200,       
        borderRadius: 16,  
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F1F5F9', 
    },
    modalImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover', 
    },
    modalPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 4,
    },
    modalRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    modalRatingText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    
    modalInfoList: {
       marginBottom: 10
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    infoIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoLabel: {
        fontSize: 12,
        color: '#64748B',
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '600',
    },

    modalFooter: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 10,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        color: '#64748B',
        fontWeight: '700',
        fontSize: 15,
    },
    confirmBtn: {
        flex: 2, 
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    confirmGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default AgencySelection;
