import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Random image URLs for agencies (using placeholder service)
const AGENCY_IMAGES = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1517457373614-b7152f800fd1?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1488386341026-7e89a88adc34?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=250&fit=crop',
  'https://images.unsplash.com/photo-1504681869696-d977211a0e38?w=400&h=250&fit=crop',
];

const AgencySelection = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { placeName } = params;

  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [selectedAgencyName, setSelectedAgencyName] = useState('');

  const mockAgencies = [
    {
      id: 1,
      name: 'Sunshine Tours',
      rating: 4.5,
      reviews: 342,
      description: 'Reliable and friendly tour agency specializing in outdoor adventures.',
      specialties: ['Nature', 'Culture', 'Beach'],
      price: '₱ 1,200/person',
      image: AGENCY_IMAGES[0],
      established: '2015',
    },
    {
      id: 2,
      name: 'Adventure Seekers',
      rating: 4.8,
      reviews: 518,
      description: 'For thrill-seekers and adventure lovers seeking unforgettable experiences.',
      specialties: ['Hiking', 'Rafting', 'Extreme Sports'],
      price: '₱ 1,500/person',
      image: AGENCY_IMAGES[1],
      established: '2016',
    },
    {
      id: 3,
      name: 'City Explorers',
      rating: 4.2,
      reviews: 267,
      description: 'Explore cities and urban landmarks with our knowledgeable guides.',
      specialties: ['Urban', 'Historical', 'Food'],
      price: '₱ 900/person',
      image: AGENCY_IMAGES[2],
      established: '2017',
    },
    {
      id: 4,
      name: 'Wanderlust Journeys',
      rating: 4.9,
      reviews: 621,
      description: 'Premium travel experiences crafted for discerning travelers worldwide.',
      specialties: ['Luxury', 'Cultural', 'Photography'],
      price: '₱ 2,000/person',
      image: AGENCY_IMAGES[3],
      established: '2014',
    },
    {
      id: 5,
      name: 'Local Guides Co.',
      rating: 4.6,
      reviews: 453,
      description: 'Authentic local experiences with guides who know every hidden gem.',
      specialties: ['Local', 'Authentic', 'Off-beat'],
      price: '₱ 800/person',
      image: AGENCY_IMAGES[4],
      established: '2018',
    },
    {
      id: 6,
      name: 'Express Tours',
      rating: 4.3,
      reviews: 289,
      description: 'Fast-paced tours for travelers who want to see it all in one day.',
      specialties: ['Quick Tours', 'Popular Sites', 'Budget'],
      price: '₱ 700/person',
      image: AGENCY_IMAGES[5],
      established: '2019',
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      setAgencies(mockAgencies);
      setLoading(false);
    }, 1500);
  }, []);

  const handleSelectAgency = (agencyId, agencyName) => {
    setSelectedAgencyName(agencyName);
    setModalMessage(
      `Your booking request for ${placeName || 'this location'} has been successfully sent to ${agencyName}!\n\nThe agency will review your request and contact you within 1-3 business days with available dates, group sizes, and final pricing.\n\nThank you for choosing us!`
    );
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    router.replace('/(protected)/home/');
  };

  const renderAgencyCard = ({ item }) => (
    <View style={styles.agencyCard}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.agencyImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        />
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.reviewsText}>({item.reviews})</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.agencyName}>{item.name}</Text>
        <Text style={styles.agencyDesc}>{item.description}</Text>

        <View style={styles.specialtiesContainer}>
          {item.specialties.map((specialty, idx) => (
            <View key={idx} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={14} color="#00A8FF" />
          <Text style={styles.infoText}>Est. {item.established}</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.priceValue}>{item.price}</Text>
        </View>

        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => handleSelectAgency(item.id, item.name)}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.selectButtonText}>Select Agency</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#00A8FF', '#0088CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <Text style={styles.headerTitle}>Select Your Agency</Text>
              <Text style={styles.headerSubtitle}>{placeName || 'This Location'}</Text>
              <Text style={styles.headerDesc}>
                Choose from verified agencies to create your perfect tour
              </Text>
            </LinearGradient>
          </View>

          {/* Agency List */}
          <View style={styles.listContainer}>
            <FlatList
              data={agencies}
              renderItem={renderAgencyCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.flatListContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No agencies available at this moment.</Text>
              }
            />
          </View>

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <Ionicons name="information-circle" size={24} color="#00A8FF" />
            <Text style={styles.footerText}>
              All agencies are verified and trusted by thousands of travelers. Your satisfaction is guaranteed!
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Success Modal */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#00A8FF', '#0088CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <Ionicons name="checkmark-circle" size={48} color="#fff" />
              <Text style={styles.modalTitle}>Booking Sent!</Text>
            </LinearGradient>

            <Text style={styles.modalSubtitle}>{selectedAgencyName}</Text>
            <Text style={styles.modalText}>{modalMessage}</Text>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.modalButton}
                onPress={handleModalClose}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <Text style={styles.modalButtonText}>Continue to Home</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    marginBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  headerDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  agencyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  agencyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  reviewsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  cardContent: {
    padding: 16,
  },
  agencyName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A2332',
    marginBottom: 6,
  },
  agencyDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  specialtyTag: {
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00A8FF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  priceContainer: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#00A8FF',
  },
  priceLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00A8FF',
    marginTop: 2,
  },
  selectButton: {
    backgroundColor: '#00A8FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#999',
  },
  footerInfo: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#0088CC',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  // Modal Styles
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00A8FF',
    textAlign: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  modalText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalButton: {
    backgroundColor: '#00A8FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default AgencySelection;