import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Image, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import Toast from '../../components/Toast';

const AgencyAssignedGuide = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const { bookingId, totalPrice, guideName } = params; 

    const [assignedGuides, setAssignedGuides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
    
    const formattedPrice = `₱${parseFloat(totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const agencyName = "City Explorers Agency";

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!bookingId) {
                setToast({ visible: true, message: "Missing booking details. Cannot display guide.", type: 'error' });
                setLoading(false);
                return;
            }
            try {
                const response = await api.get(`/api/bookings/${bookingId}/`);
                setAssignedGuides(response.data.assigned_guides_detail);
            } catch (error) {
                console.error("Failed to fetch booking details:", error);
                setToast({ visible: true, message: "Failed to fetch booking details.", type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [bookingId]);


    const handleProceedToPayment = () => {
        router.push({
            pathname: '/(protected)/agencyPaymentReviewModal', 
            params: { 
                bookingId: bookingId, 
                totalPrice: totalPrice,
                guideName: assignedGuides[0]?.name || guideName || "Team Assigned",
            }
        });
    };

    const renderGuideCard = (guide, index) => (
        <View key={index} style={styles.guideCard}>
            <View style={styles.cardProfileSection}>
                <View style={styles.iconWrapper}>
                    <User size={40} color="#8B98A8" />
                </View>
                <View style={styles.profileInfo}>
                    <Text style={styles.guideName}>{guide.name}</Text>
                    <Text style={styles.guideAddress}>{guide.address}</Text>
                    <Text style={styles.guideRating}>
                        {guide.rating} <Ionicons name="star" color="#C99700" />
                    </Text>
                </View>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#00A8FF" />
            </View>

            <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Language</Text>
                    <Text style={styles.detailValue}>
                        {Array.isArray(guide.languages)
                            ? guide.languages.join(', ')
                            : (guide.languages || guide.language || 'N/A')}
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Specialty</Text>
                    <Text style={styles.detailValue}>
                        {Array.isArray(guide.specializations)
                            ? guide.specializations.join(', ')
                            : (guide.specialization || guide.specialty || 'General')}
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Years of Experience</Text>
                    <Text style={styles.detailValue}>{guide.experience}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Role</Text>
                    <Text style={styles.detailValue}>{index === 0 ? 'LEAD GUIDE' : 'SUPPORT'}</Text>
                </View>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A8FF" />
                <Text style={{ marginTop: 10, color: '#00A8FF' }}>Finalizing guide assignment...</Text>
            </View>
        );
    }
    
    return (
        <ScrollView style={styles.container}>
            <SafeAreaView edges={['bottom']}>
                <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
                
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    <Text style={styles.headerTitle}>BOOKING CONFIRMED</Text>
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.agencyMessage}>
                        {agencyName} has assigned **{assignedGuides.length} guide(s)** to your booking ({bookingId}).
                    </Text>
                    
                    <Text style={styles.sectionTitle}>Assigned Guide Team</Text>
                    {assignedGuides.map(renderGuideCard)}
                    
                    <View style={styles.priceFooter}>
                        <Text style={styles.priceLabelFooter}>TOTAL PRICE CONFIRMED</Text>
                        <Text style={styles.priceValueFooter}>{formattedPrice}</Text>
                    </View>

                    <TouchableOpacity style={styles.buttonContainer} activeOpacity={0.8} onPress={handleProceedToPayment}>
                        <Text style={styles.bookButton}>PROCEED TO PAYMENT</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.infoText}>
                        <Ionicons name="information-circle-outline" size={14} color="#666" /> This is the final confirmed price from the agency. Click &apos;Proceed to Payment&apos; to finalize your booking.
                    </Text>
                </View>
            </SafeAreaView>
        </ScrollView>
    );
};

export default AgencyAssignedGuide;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
    contentContainer: { padding: 16, gap: 12 },
    agencyMessage: { fontSize: 14, fontWeight: '600', color: '#1A2332', textAlign: 'center', marginBottom: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A2332', marginBottom: 4, paddingHorizontal: 4 },
    guideCard: { backgroundColor: '#fff', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#E0E6ED', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1, marginBottom: 8 },
    cardProfileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconWrapper: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EBF0F5', justifyContent: 'center', alignItems: 'center' },
    profileInfo: { flex: 1, marginLeft: 12 },
    guideName: { fontSize: 16, fontWeight: '800', color: '#1A2332' },
    guideAddress: { fontSize: 12, color: '#8B98A8', marginTop: 2 },
    guideRating: { fontSize: 14, color: '#C99700', fontWeight: '700', marginTop: 4 },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 0, gap: 8 },
    detailItem: { width: '48%', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#F5F7FA', borderRadius: 8 },
    detailLabel: { fontSize: 11, color: '#8B98A8', fontWeight: '600' },
    detailValue: { fontSize: 13, color: '#1A2332', fontWeight: '700', marginTop: 4 },
    priceFooter: { backgroundColor: '#E8F4FF', padding: 12, borderRadius: 10, marginTop: 16, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#00A8FF' },
    priceLabelFooter: { fontSize: 12, color: '#0088CC', fontWeight: '600' },
    priceValueFooter: { fontSize: 22, color: '#28A745', fontWeight: '900', marginTop: 4 },
    buttonContainer: { alignItems: 'center' },
    bookButton: { backgroundColor: '#00A8FF', color: '#fff', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8, fontSize: 15, fontWeight: '700', overflow: 'hidden', textAlign: 'center', width: '100%' },
    infoText: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 8, paddingHorizontal: 10 }
});
