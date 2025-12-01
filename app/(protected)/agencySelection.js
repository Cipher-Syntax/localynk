import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, ScrollView, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';

const { width } = Dimensions.get('window');

const AgencySelection = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const handleSelectAgency = (agencyId, agencyName) => {
        router.push({
            pathname: '/(protected)/agencyBookingDetails',
            params: { 
                agencyId: agencyId,
                agencyName: agencyName,
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

        // Use data from backend if available, otherwise defaults
        // Ensure your AgencySerializer includes 'rating' and 'review_count' from the related user
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

                {/* Action Button */}
                <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => handleSelectAgency(item.user, item.business_name)}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#0072FF', '#00C6FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.selectButtonText}>CHOOSE AGENCY</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
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
            <StatusBar barStyle="light-content" />
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

    selectButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    selectButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.5,
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
});

export default AgencySelection;