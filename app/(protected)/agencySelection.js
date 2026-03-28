import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView, StatusBar, Dimensions, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import { formatPHPhoneLocal } from '../../utils/phoneNumber';

const { width, height } = Dimensions.get('window');

const AgencySelection = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAgency, setSelectedAgency] = useState(null);

    useEffect(() => {
        const fetchAgencies = async () => {
            try {
                const response = await api.get('/api/agencies/');
                const rawData = Array.isArray(response.data) ? response.data : response.data.results || [];

                const validAgencies = rawData.filter(item => 
                    item.business_name && 
                    item.business_name.trim() !== '' &&
                    item.status === 'Approved'
                );

                setAgencies(validAgencies);
            } catch (error) {
                console.error('Failed to fetch agencies:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAgencies();
    }, []);

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
            pathname: '/(protected)/agencyBookingDetails',
            params: { 
                agencyId: selectedAgency.user, 
                agencyName: selectedAgency.business_name,
                placeId: params.placeId,
                placeName: params.placeName
            }
        });
    };

    const renderAgencyCard = ({ item }) => {
        if (!item || !item.business_name) return null;

        let imageUri = null;
        if (item.profile_picture) {
            imageUri = item.profile_picture.startsWith('http') 
                ? item.profile_picture 
                : `${api.defaults.baseURL}${item.profile_picture}`;
        }

        const rating = item.rating ? parseFloat(item.rating).toFixed(1) : 'New'; 
        const reviewCount = item.review_count || 0; 

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
                        
                        <View style={styles.ownerRow}>
                            <Ionicons name="person-circle-outline" size={14} color="#64748B" />
                            <Text style={styles.ownerName}>{item.owner_name}</Text>
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
            </View>
        );
    };

    const renderModalContent = () => {
        if (!selectedAgency) return null;

        let imageUri = null;
        if (selectedAgency.profile_picture) {
            imageUri = selectedAgency.profile_picture.startsWith('http') 
                ? selectedAgency.profile_picture 
                : `${api.defaults.baseURL}${selectedAgency.profile_picture}`;
        }

        const rating = selectedAgency.rating ? parseFloat(selectedAgency.rating).toFixed(1) : 'New';
        const reviewCount = selectedAgency.review_count || 0;

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
                        <View style={styles.infoIconBox}><Ionicons name="person" size={18} color="#0072FF" /></View>
                        <View>
                            <Text style={styles.infoLabel}>Owner</Text>
                            <Text style={styles.infoValue}>{selectedAgency.owner_name}</Text>
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

                <SafeAreaView style={styles.modalFooter}>
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
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />
                <SafeAreaView edges={['top']} style={{ flex: 1 }}>
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
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                
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

                    <FlatList
                        data={agencies}
                        renderItem={renderAgencyCard}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="business-outline" size={48} color="#CBD5E1" />
                                <Text style={styles.emptyText}>
                                    No approved agencies available at the moment.
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
                <SafeAreaView style={styles.modalOverlay}>
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

    ownerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    ownerName: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
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