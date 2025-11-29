import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    ScrollView,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';

const AgencySelection = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAgencies = async () => {
            try {
                // 🔥 1. Fetch from the corrected endpoint
                const response = await api.get('/api/agencies/');
                const rawData = Array.isArray(response.data) ? response.data : response.data.results || [];

                // 🔥 2. Filter valid agencies (using business_name)
                const validAgencies = rawData.filter(item => 
                    item.business_name && 
                    item.business_name.trim() !== '' &&
                    item.is_approved === true // Check for approval status
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
        // 🔥 3. Use 'business_name' instead of 'first_name'
        if (!item || !item.business_name) return null;

        // Use the profile_picture from serializer or a specific fallback
        // Also handles relative URLs from Django
        let imageUri = 'https://via.placeholder.com/400x200?text=Agency';
        if (item.profile_picture) {
            imageUri = item.profile_picture.startsWith('http') 
                ? item.profile_picture 
                : `${api.defaults.baseURL}${item.profile_picture}`;
        }

        return (
            <View style={styles.agencyCard}>
                <Image 
                    source={{ uri: imageUri }} 
                    style={styles.agencyImage}
                    // Optional: Add a local fallback if network image fails
                    defaultSource={require('../../assets/localynk_images/featured1.png')} 
                />
                <View style={styles.cardContent}>
                    <Text style={styles.agencyName}>{item.business_name}</Text>
                    <Text style={styles.agencyOwner}>Owner: {item.owner_name}</Text>
                    
                    {/* Display Phone or Email if Bio is missing */}
                    <Text style={styles.agencyDesc} numberOfLines={2}>
                        {item.phone ? `Contact: ${item.phone}` : item.email}
                    </Text>

                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => handleSelectAgency(item.user, item.business_name)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.selectButtonText}>Select Agency</Text>
                    </TouchableOpacity>
                </View>
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
                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* HEADER IMAGE */}
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/localynk_images/header.png')}
                            style={styles.headerImage}
                        />
                        <LinearGradient
                            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                            style={styles.overlay}
                        />
                        <Text style={styles.headerTitle}>AGENCY LISTING</Text>
                    </View>

                    {/* SECTION HEADER */}
                    <View style={styles.sectionHeaderContainer}>
                        <View style={styles.logoBadge}>
                            <Ionicons name="business" size={20} color="#00A8FF" />
                        </View>
                        <View>
                            <Text style={styles.sectionLabel}>Select Agency</Text>
                            <Text style={styles.sectionSubLabel}>Trusted partners for your trip</Text>
                        </View>
                    </View>

                    {/* LIST */}
                    <View style={styles.listContainer}>
                        <FlatList
                            data={agencies}
                            renderItem={renderAgencyCard}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                            ListEmptyComponent={
                                <Text style={{textAlign: 'center', marginTop: 40, color: '#666'}}>
                                    No approved agencies available at the moment.
                                </Text>
                            }
                        />
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
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
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase'
    },
    sectionHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 5,
    },
    logoBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#E8F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A2332',
    },
    sectionSubLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 8, color: '#555' },
    listContainer: { paddingHorizontal: 16 },
    agencyCard: {
        marginTop: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 18,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    agencyImage: { width: '100%', height: 180, resizeMode: 'cover' },
    cardContent: { padding: 16 },
    agencyName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A2332',
        marginBottom: 4,
    },
    agencyOwner: {
        fontSize: 12,
        color: '#00A8FF',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase'
    },
    agencyDesc: {
        color: '#666',
        fontSize: 13,
        marginBottom: 16,
        lineHeight: 18,
    },
    selectButton: {
        backgroundColor: '#00A8FF',
        paddingVertical: 12,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    selectButtonText: { color: '#fff', fontWeight: '800' },
});

export default AgencySelection;