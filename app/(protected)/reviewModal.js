import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from '../../components/Toast';

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
    const [guideRating, setGuideRating] = useState(0);
    const [guideComment, setGuideComment] = useState('');
    const [agencyRating, setAgencyRating] = useState(0);
    const [agencyComment, setAgencyComment] = useState('');
    const [destinationRating, setDestinationRating] = useState(0);
    const [destinationComment, setDestinationComment] = useState('');
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

    const handleBackPress = () => {
        if (typeof router.canGoBack === 'function' && router.canGoBack()) {
            router.back();
            return;
        }
        router.replace('/(protected)/bookings');
    };

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!bookingId) return;
            try {
                const response = await api.get(`/api/bookings/${bookingId}/`);
                setBooking(response.data);
            } catch (error) {
                console.error('Failed to fetch booking details:', error);
                setToast({ visible: true, message: 'Could not load booking details.', type: 'error' });
                setTimeout(() => router.back(), 1500);
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [bookingId, router]);

    const handleSubmit = async () => {
        const destinationToReview = booking?.destination || booking?.accommodation?.destination;
        
        const hasGuideRating = booking?.guide && guideRating > 0;
        const hasAgencyRating = booking?.agency && agencyRating > 0;
        const hasDestRating = destinationToReview && destinationRating > 0;

        if (!hasGuideRating && !hasAgencyRating && !hasDestRating) {
            setToast({ visible: true, message: 'Please provide at least one rating.', type: 'error' });
            return;
        }

        setSubmitting(true);
        try {
            const promises = [];

            if (booking.guide && guideRating > 0) {
                promises.push(api.post('/api/reviews/', {
                    reviewed_user: booking.guide,
                    rating: guideRating,
                    comment: guideComment,
                    booking: bookingId,
                }));
            }

            if (booking.agency && agencyRating > 0) {
                promises.push(api.post('/api/reviews/', {
                    reviewed_user: booking.agency,
                    rating: agencyRating,
                    comment: agencyComment,
                    booking: bookingId,
                }));
            }

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

            setToast({ visible: true, message: 'Your review has been submitted. Thank you!', type: 'success' });
            setTimeout(() => router.back(), 1500);

        } catch (error) {
            console.error('Failed to submit review:', error.response?.data || error.message);
            
            // --- UPDATED: Robust error parsing to catch Profanity validation from the backend ---
            let errorMessage = 'An error occurred. Please try again.';
            const errData = error.response?.data;
            
            if (errData) {
                if (errData.comment) {
                    errorMessage = Array.isArray(errData.comment) ? errData.comment[0] : errData.comment;
                } else if (errData.booking) {
                    errorMessage = Array.isArray(errData.booking) ? errData.booking[0] : errData.booking;
                } else if (errData.non_field_errors) {
                    errorMessage = Array.isArray(errData.non_field_errors) ? errData.non_field_errors[0] : errData.non_field_errors;
                } else if (errData.destination) {
                    errorMessage = "Destination error: " + (Array.isArray(errData.destination) ? errData.destination[0] : errData.destination);
                } else if (errData.reviewed_user) {
                    errorMessage = "User error: " + (Array.isArray(errData.reviewed_user) ? errData.reviewed_user[0] : errData.reviewed_user);
                }
            }
            
            setToast({ visible: true, message: errorMessage, type: 'error' });

        } finally {
            setSubmitting(false);
        }
    };
    
    const destinationForReview = booking?.destination_detail || (booking?.accommodation_detail && booking?.accommodation_detail?.destination_detail);


    if (loading) {
        return (
            <SafeAreaView edges={['bottom', 'top']} style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" translucent={false} />
                <View style={[styles.header, styles.loadingHeader]}>
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={22} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Leave a Review</Text>
                    <View style={styles.closeButton} />
                </View>
                <ActivityIndicator style={styles.centered} size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView edges={['bottom', 'top']} style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" translucent={false} />
            <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={22} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Leave a Review</Text>
                    <TouchableOpacity onPress={handleBackPress} style={styles.closeButton}>
                        <Ionicons name="close" size={22} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {booking?.guide && (
                    <View style={styles.reviewSection}>
                        <Text style={styles.sectionTitle}>Review Your Guide</Text>
                        <Text style={styles.sectionSubtitle}>{booking.guide_detail?.first_name + ' ' + booking.guide_detail?.last_name || 'Guide'}</Text>
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
    safeArea: { flex: 1, backgroundColor: '#f7f7f7' },
    container: { padding: 20 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    loadingHeader: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 0 },
    title: { flex: 1, textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: '#111827' },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewSection: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 5 },
    sectionSubtitle: { fontSize: 16, color: '#666', marginBottom: 15 },
    starContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
    textInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, height: 100, textAlignVertical: 'top', fontSize: 14 },
    submitButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ReviewModal;