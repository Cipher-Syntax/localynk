import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { SafeAreaView } from 'react-native-safe-area-context';

// Simple Star Rating Component
const StarRating = ({ rating, onRate }) => {
    return (
        <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => onRate(star)}>
                    <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={32}
                        color={star <= rating ? '#FFD700' : '#C0C0C0'}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

const ReviewModal = () => {
    const { bookingId } = useLocalSearchParams();
    const router = useRouter();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // State for guide review
    const [guideRating, setGuideRating] = useState(0);
    const [guideComment, setGuideComment] = useState('');

    // State for AGENCY review
    const [agencyRating, setAgencyRating] = useState(0);
    const [agencyComment, setAgencyComment] = useState('');

    // State for destination review
    const [destinationRating, setDestinationRating] = useState(0);
    const [destinationComment, setDestinationComment] = useState('');

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!bookingId) return;
            try {
                const response = await api.get(`/api/bookings/${bookingId}/`);
                setBooking(response.data);
            } catch (error) {
                console.error('Failed to fetch booking details:', error);
                Alert.alert('Error', 'Could not load booking details.');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [bookingId]);

    const handleSubmit = async () => {
        const destinationToReview = booking?.destination || booking?.accommodation?.destination;
        
        // Validation: Check if at least one rating (Guide OR Agency OR Destination) is provided
        const hasGuideRating = booking?.guide && guideRating > 0;
        const hasAgencyRating = booking?.agency && agencyRating > 0;
        const hasDestRating = destinationToReview && destinationRating > 0;

        if (!hasGuideRating && !hasAgencyRating && !hasDestRating) {
            Alert.alert('Incomplete', 'Please provide a rating.');
            return;
        }

        setSubmitting(true);
        try {
            const promises = [];

            // 1. Submit GUIDE review if applicable
            if (booking.guide && guideRating > 0) {
                promises.push(api.post('/api/reviews/', {
                    reviewed_user: booking.guide, // This is the ID
                    rating: guideRating,
                    comment: guideComment,
                    booking: bookingId,
                }));
            }

            // 2. Submit AGENCY review if applicable
            if (booking.agency && agencyRating > 0) {
                promises.push(api.post('/api/reviews/', {
                    reviewed_user: booking.agency, // This is the ID (Agency is also a User)
                    rating: agencyRating,
                    comment: agencyComment,
                    booking: bookingId,
                }));
            }

            // 3. Submit DESTINATION review if applicable
            if (destinationToReview && destinationRating > 0) {
                const destId = typeof destinationToReview === 'object' ? destinationToReview.id : destinationToReview;
                promises.push(api.post('/api/destination_reviews/', {
                    destination: destId,
                    rating: destinationRating,
                    comment: destinationComment,
                    booking: bookingId,
                }));
            }

            await Promise.all(promises);

            Alert.alert('Success', 'Your review has been submitted. Thank you!');
            router.back();

        } catch (error) {
            console.error('Failed to submit review:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.destination || error.response?.data?.reviewed_user || 'An error occurred.';
            Alert.alert('Error', `There was an issue submitting your review. ${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };
    
    const destinationForReview = booking?.destination_detail || (booking?.accommodation_detail && booking?.accommodation_detail?.destination_detail);


    if (loading) {
        return <ActivityIndicator style={styles.centered} size="large" />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Leave a Review</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <Ionicons name="close-circle" size={28} color="#C0C0C0" />
                    </TouchableOpacity>
                </View>

                {/* --- GUIDE Review Section --- */}
                {booking?.guide && (
                    <View style={styles.reviewSection}>
                        <Text style={styles.sectionTitle}>Review Your Guide</Text>
                        <Text style={styles.sectionSubtitle}>{booking.guide_detail?.username || 'Guide'}</Text>
                        <StarRating rating={guideRating} onRate={setGuideRating} />
                        <TextInput
                            style={styles.textInput}
                            placeholder="Share your experience with the guide..."
                            multiline
                            value={guideComment}
                            onChangeText={setGuideComment}
                        />
                    </View>
                )}

                {/* --- AGENCY Review Section --- */}
                {booking?.agency && (
                    <View style={styles.reviewSection}>
                        <Text style={styles.sectionTitle}>Review Agency</Text>
                        <Text style={styles.sectionSubtitle}>{booking.agency_detail?.username || booking.agency_detail?.full_name || 'Agency'}</Text>
                        <StarRating rating={agencyRating} onRate={setAgencyRating} />
                        <TextInput
                            style={styles.textInput}
                            placeholder="How was the service provided by the agency?"
                            multiline
                            value={agencyComment}
                            onChangeText={setAgencyComment}
                        />
                    </View>
                )}

                {/* --- DESTINATION Review Section --- */}
                {destinationForReview && (
                    <View style={styles.reviewSection}>
                        <Text style={styles.sectionTitle}>Review the Destination</Text>
                        <Text style={styles.sectionSubtitle}>{destinationForReview.name}</Text>
                        <StarRating rating={destinationRating} onRate={setDestinationRating} />
                        <TextInput
                            style={styles.textInput}
                            placeholder="Share your thoughts about the destination..."
                            multiline
                            value={destinationComment}
                            onChangeText={setDestinationComment}
                        />
                    </View>
                )}

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Submit Review</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    container: {
        padding: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
    },
    reviewSection: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
    },
    starContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        height: 100,
        textAlignVertical: 'top',
        fontSize: 14,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ReviewModal;