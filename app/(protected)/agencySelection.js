import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Image,
    ScrollView,
    Dimensions,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';

const { width } = Dimensions.get('window');

const AgencySelection = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    const { placeName, placeImage } = params;

    const [agencies, setAgencies] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // NOTE: The modal state is defined here, but currently unused in logic
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedAgencyName, setSelectedAgencyName] = useState('');

    useEffect(() => {
        const fetchAgencies = async () => {
            try {
                const response = await api.get('/api/agencies/');
                const rawData = Array.isArray(response.data) ? response.data : response.data.results || [];

                const validAgencies = rawData.filter(item => 
                    item.first_name && 
                    item.first_name.trim() !== '' && 
                    item.profile_picture
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
        // Currently, this navigates immediately. 
        // The Modal is NOT triggered here.
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

    const handleModalClose = () => {
        setModalVisible(false);
        router.replace('/(protected)/home/');
    };

    const renderAgencyCard = ({ item }) => {
        if (!item || !item.first_name) return null;

        return (
            <View style={styles.agencyCard}>
                <Image 
                    source={{ uri: item.profile_picture }} 
                    style={styles.agencyImage}
                    defaultSource={{ uri: 'https://via.placeholder.com/400x200' }} 
                />
                <View style={styles.cardContent}>
                    <Text style={styles.agencyName}>{item.first_name} {item.last_name}</Text>
                    <Text style={styles.agencyDesc}>{item.bio || 'No bio available'}</Text>

                    <TouchableOpacity
                        style={styles.selectButton}
                        onPress={() => handleSelectAgency(item.id, `${item.first_name} ${item.last_name}`)}
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
                <Text style={styles.loadingText}>Fetching agencies...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false}>

                    {/* 🟦 HEADER IMAGE */}
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

                    {/* 🟦 NEW: SECTION LABEL / LOGO AREA */}
                    <View style={styles.sectionHeaderContainer}>
                        <View style={styles.logoBadge}>
                            <Ionicons name="business" size={20} color="#00A8FF" />
                        </View>
                        <View>
                            <Text style={styles.sectionLabel}>Select Agency</Text>
                            <Text style={styles.sectionSubLabel}>Choose the best guide for you</Text>
                        </View>
                    </View>

                    {/* 🟦 LIST */}
                    <View style={styles.listContainer}>
                        <FlatList
                            data={agencies}
                            renderItem={renderAgencyCard}
                            keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                            scrollEnabled={false}
                            ListEmptyComponent={
                                <Text style={{textAlign: 'center', marginTop: 20, color: '#666'}}>
                                    No agencies found.
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

    /* HEADER FIXED */
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

    /* NEW SECTION HEADER STYLES */
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

    /* LOADING */
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 8, color: '#555' },

    /* LIST */
    listContainer: { paddingHorizontal: 16 },

    agencyCard: {
        marginTop: 20, // Reduced margin since we have a header now
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
    agencyImage: { width: '100%', height: 200 },

    cardContent: { padding: 16 },
    agencyName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A2332',
        marginBottom: 6,
    },
    agencyDesc: {
        color: '#666',
        fontSize: 13,
        marginBottom: 12,
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

    /* MODAL */
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 25,
        alignItems: 'center',
    },
    modalHeader: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F5A623',
        marginBottom: 8,
        letterSpacing: 1,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 10,
    },
    modalAgency: {
        fontSize: 16,
        fontWeight: '700',
        color: '#00A8FF',
        marginBottom: 12,
    },
    modalMessage: {
        textAlign: 'center',
        color: '#555',
        lineHeight: 18,
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#00A8FF',
        paddingVertical: 14,
        borderRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    modalButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default AgencySelection;