import { Image } from 'expo-image';
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { formatPHPhoneLocal } from '../../utils/phoneNumber';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import { styles } from './styles/agencySelection.styles';

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
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.businessName} numberOfLines={1}>{item.business_name}</Text>
                            <TouchableOpacity 
                                onPress={() => router.push({
                                    pathname: '/(protected)/agencyProfile',
                                    params: { agencyId: item.id, placeId: params.placeId }
                                })}
                                style={styles.viewProfileMiniBtn}
                            >
                                <Text style={styles.viewProfileMiniText}>VIEW PROFILE</Text>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
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
                        {isOffline ? 'UNAVAILABLE' : 'CHOOSE AGENCY'}
                    </Text>
                    <Ionicons name={isOffline ? "lock-closed" : "arrow-forward"} size={16} color={isOffline ? "#94A3B8" : "#0072FF"} />
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

                <ScreenSafeArea statusBarStyle='light-content' edges={['bottom', 'top']} style={styles.modalFooter}>
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
                </ScreenSafeArea>
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


export default AgencySelection;
