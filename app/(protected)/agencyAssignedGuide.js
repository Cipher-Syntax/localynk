import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { User } from "lucide-react-native";
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api';
import Toast from '../../components/Toast';
import { styles } from './styles/agencyAssignedGuide.styles';

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

