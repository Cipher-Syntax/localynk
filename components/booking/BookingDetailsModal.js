import React from 'react';
import { 
    Modal, 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    Image,
    Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const BookingDetailsModal = ({ booking, visible, onClose }) => {
    if (!booking) return null;

    // --- Helper Logic to Extract Data based on Booking Type ---
    const isAccommodation = !!booking.accommodation_detail;
    
    // 1. Determine Title & Type
    const title = isAccommodation 
        ? booking.accommodation_detail.title 
        : (booking.destination_detail?.name ? `${booking.destination_detail.name} Tour` : 'Custom Tour');
    
    const typeLabel = isAccommodation ? 'Accommodation Stay' : 'Guided Tour';

    // 2. Determine Image (Priority: Accomm Photo -> Guide Profile -> Fallback)
    // Note: Ensure your backend sends full URLs for images, or prepend base URL if needed.
    const heroImage = isAccommodation 
        ? { uri: booking.accommodation_detail.photo } 
        : (booking.guide_detail?.profile_picture ? { uri: booking.guide_detail.profile_picture } : null);

    // 3. Determine Provider Info
    const providerName = isAccommodation 
        ? booking.accommodation_detail.host_full_name 
        : (booking.guide_detail ? `${booking.guide_detail.first_name} ${booking.guide_detail.last_name}` : booking.agency_detail?.username);

    const providerRole = isAccommodation ? 'Host' : (booking.guide_detail ? 'Local Guide' : 'Agency');

    // 4. Status Color Helper
    const getStatusColor = (status) => {
        switch(status?.toLowerCase()) {
            case 'accepted': return '#28a745';
            case 'pending': return '#ffc107';
            case 'declined': 
            case 'cancelled': return '#dc3545';
            default: return '#6c757d';
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    
                    {/* --- HERO IMAGE SECTION --- */}
                    <View style={styles.imageContainer}>
                        {heroImage ? (
                            <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
                        ) : (
                            <View style={[styles.heroImage, styles.placeholderImage]}>
                                <Ionicons name="images-outline" size={50} color="#fff" />
                            </View>
                        )}
                        
                        {/* Status Badge Overlay */}
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                            <Text style={styles.statusText}>{booking.status}</Text>
                        </View>

                        {/* Close Button Overlay */}
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <View style={styles.closeButtonBlur}>
                                <Ionicons name="close" size={22} color="#000" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* --- SCROLLABLE CONTENT --- */}
                    <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                        
                        {/* Header Info */}
                        <Text style={styles.title}>{title}</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location-sharp" size={16} color="#00A8FF" />
                            <Text style={styles.locationText}>
                                {booking.destination_detail?.name || booking.accommodation_detail?.location || 'Unknown Location'}
                            </Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Provider Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>Service Provider</Text>
                            <View style={styles.providerRow}>
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>{providerName?.charAt(0) || '?'}</Text>
                                </View>
                                <View>
                                    <Text style={styles.providerName}>{providerName || 'Unknown'}</Text>
                                    <Text style={styles.providerRole}>{providerRole}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Booking Details Grid */}
                        <View style={styles.section}>
                            <Text style={styles.sectionHeader}>Booking Details</Text>
                            
                            <View style={styles.detailRow}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.label}>Check-in / Date</Text>
                                    <Text style={styles.value}>
                                        <Ionicons name="calendar-outline" size={14} /> {booking.check_in || 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.label}>Guests</Text>
                                    <Text style={styles.value}>
                                        <Ionicons name="people-outline" size={14} /> {booking.num_guests || 1} Person(s)
                                    </Text>
                                </View>
                            </View>

                            {booking.check_out && (
                                <View style={[styles.detailRow, { marginTop: 15 }]}>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.label}>Check-out</Text>
                                        <Text style={styles.value}>
                                            <Ionicons name="calendar-outline" size={14} /> {booking.check_out}
                                        </Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Text style={styles.label}>Booking Type</Text>
                                        <Text style={styles.value}>{typeLabel}</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        {isAccommodation && booking.accommodation_detail?.amenities && (
                            <View style={styles.section}>
                                <Text style={styles.sectionHeader}>Amenities Included</Text>
                                <View style={styles.amenitiesContainer}>
                                    {Object.keys(booking.accommodation_detail.amenities).length > 0 ? (
                                        Object.keys(booking.accommodation_detail.amenities).map((key, index) => (
                                            booking.accommodation_detail.amenities[key] && (
                                                <View key={index} style={styles.amenityChip}>
                                                    <Text style={styles.amenityText}>{key.replace(/_/g, ' ')}</Text>
                                                </View>
                                            )
                                        ))
                                    ) : (
                                        <Text style={styles.noInfoText}>No amenities listed.</Text>
                                    )}
                                </View>
                            </View>
                        )}

                        <View style={styles.divider} />

                        {/* Price Section */}
                        <View style={styles.priceSection}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Total Price</Text>
                                <Text style={styles.priceValue}>₱ {Number(booking.total_price).toLocaleString()}</Text>
                            </View>
                            <Text style={styles.priceSubtext}>
                                {isAccommodation ? 'Includes accommodation fees' : 'Includes guide fees'}
                            </Text>
                        </View>

                        <View style={{height: 20}} /> 
                    </ScrollView>

                    <View style={styles.footer}>
                         <TouchableOpacity style={styles.fullCloseButton} onPress={onClose}>
                            <Text style={styles.fullCloseButtonText}>Close Details</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalView: {
        backgroundColor: 'white',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        height: '90%',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        overflow: 'hidden',
    },
    // Hero Image
    imageContainer: {
        height: 220,
        width: '100%',
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 10,
    },
    closeButtonBlur: {
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderRadius: 20,
        padding: 8,
    },
    statusBadge: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    
    // Content
    contentContainer: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#222',
        marginBottom: 5,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    locationText: {
        marginLeft: 5,
        color: '#666',
        fontSize: 15,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 15,
    },

    // Sections
    section: {
        marginBottom: 10,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    
    // Provider
    providerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 45,
        height: 45,
        borderRadius: 25,
        backgroundColor: '#00A8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    providerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    providerRole: {
        fontSize: 13,
        color: '#888',
    },

    // Details Grid
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        width: '48%',
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 10,
    },
    label: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    value: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500',
    },

    // Amenities
    amenitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    amenityChip: {
        backgroundColor: '#eff6ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#dbeafe',
    },
    amenityText: {
        color: '#1e40af',
        fontSize: 12,
        textTransform: 'capitalize',
    },
    noInfoText: {
        color: '#999',
        fontStyle: 'italic',
    },

    // Price
    priceSection: {
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    priceValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#00A8FF',
    },
    priceSubtext: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },

    // Footer
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff',
    },
    fullCloseButton: {
        backgroundColor: '#f1f3f5',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    fullCloseButtonText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default BookingDetailsModal;