import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView, StatusBar, Dimensions, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';

const { width, height } = Dimensions.get('window');

const AgencySelection = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Modal State ---
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
                    item.is_approved === true
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

    // 1. Open Modal with Agency Details
    const handleOpenDetails = (agency) => {
        setSelectedAgency(agency);
        setModalVisible(true);
    };

    // 2. Close Modal
    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedAgency(null);
    };

    // 3. Proceed to Booking (Original Functionality, now called from Modal)
    const handleSelectAgency = () => {
        if (!selectedAgency) return;
        
        setModalVisible(false);
        
        router.push({
            pathname: '/(protected)/agencyBookingDetails',
            params: { 
                agencyId: selectedAgency.user, // Using user ID as reference
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

        return (
            <View style={styles.agencyCard}>
                <View style={styles.cardProfileSection}>
                    {/* Profile Picture */}
                    <View style={styles.iconWrapper}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.profilePicture} />
                        ) : (
                            <View style={styles.placeholderIcon}>
                                <Ionicons name="business" size={32} color="#FFF" />
                            </View>
                        )}
                    </View>
                    
                    {/* Agency Details */}
                    <View style={styles.profileInfo}>
                        <Text style={styles.businessName}>{item.business_name}</Text>
                        
                        <View style={styles.ownerRow}>
                            <Ionicons name="person-circle-outline" size={14} color="#64748B" />
                            <Text style={styles.ownerName}>{item.owner_name}</Text>
                        </View>

                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text style={styles.ratingText}>{rating}</Text>
                            {reviewCount > 0 && (
                                <Text style={styles.reviewCount}>({reviewCount} reviews)</Text>
                            )}
                        </View>
                    </View>

                    {/* Verified Badge */}
                    <View style={styles.verifiedBadge}>
                         <Ionicons name="shield-checkmark" size={16} color="#00C853" />
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Contact / Info Snippet */}
                <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="call-outline" size={14} color="#64748B" />
                        <Text style={styles.detailText}>
                            {item.phone || 'No contact info'}
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="mail-outline" size={14} color="#64748B" />
                        <Text style={styles.detailText}>
                            {item.email}
                        </Text>
                    </View>
                </View>

                {/* MODIFIED: View Details Button instead of direct Choose */}
                <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => handleOpenDetails(item)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.detailsButtonText}>VIEW DETAILS</Text>
                    <Ionicons name="eye-outline" size={16} color="#0072FF" />
                </TouchableOpacity>
            </View>
        );
    };

    // --- Modal Content Renderer ---
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
                {/* Modal Header Image */}
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

                {/* Modal Details List */}
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
                            <Text style={styles.infoValue}>{selectedAgency.phone || 'N/A'}</Text>
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

                {/* Modal Footer Actions */}
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A8FF" />
                <Text style={styles.loadingText}>Loading agencies...</Text>
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

            {/* Custom Modal */}
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

    // CARD STYLES
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
        color: '#B45309', // Amber/Gold
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

    // New "View Details" Button Style
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

    // --- MODAL STYLES ---
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end', // Bottom sheet style
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        height: 'auto',        // Changed from '65%' to auto
        maxHeight: '90%',      // Added max height to prevent overflow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    modalContent: {
        // flex: 1, // Removed flex:1 so it shrinks to content height
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalImageContainer: {
        width: '100%',     // CHANGED: Full width
        height: 200,       // CHANGED: Rectangular box height
        borderRadius: 16,  // CHANGED: Box corners, not circle
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F1F5F9', // Placeholder bg
    },
    modalImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover', // Ensures image fills the box
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
    
    // Modal Info List
    modalInfoList: {
       // flex: 1, // Removed to allow auto height behavior
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

    // Modal Footer
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
        flex: 2, // Bigger confirm button
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