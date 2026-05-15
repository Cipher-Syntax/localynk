import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { PaymentReviewModal } from '../../components/payment';
import { formatPHPhoneLocal } from '../../utils/phoneNumber';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import { styles } from './styles/completePayment.styles';

const fetchBookingDetails = async (bookingId) => {
    console.log("Fetching data for booking:", bookingId);

    return {
        id: bookingId,
        guide: {
            name: "Juan Dela Cruz",
            purpose: "Mountain Guiding",
            address: "Baliwasan",
            basePrice: 500,
            serviceFee: 50,
        },
        startDate: new Date("2025-11-13T00:00:00.000Z"),
        endDate: new Date("2025-11-20T00:00:00.000Z"),
        selectedOption: 'group',
        numPeople: 2,
        billingInfo: {
            firstName: 'Justine',
            lastName: 'Toang',
            phoneNumber: '09123456789',
            country: 'Philippines',
            email: 'justine.toang@email.com',
        },
        totalPrice: 1000,
    };
};


const CompletePayment = () => {
    const { bookingId } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('gcash');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (bookingId) {
            fetchBookingDetails(bookingId).then(data => {
                setBookingData(data);
                setLoading(false);
            });
        }
    }, [bookingId]);

    if (loading || !bookingData) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    const ReadOnlyField = ({ label, value }) => (
        <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>{label}</Text>
            <Text style={styles.readOnlyValue}>{value}</Text>
        </View>
    );

    const ReadOnlyRow = ({ children }) => (
        <View style={styles.billingRow}>{children}</View>
    );

    const calculateDays = () => {
        if (!bookingData.startDate || !bookingData.endDate) return 1;
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.max(Math.round((bookingData.endDate - bookingData.startDate) / oneDay), 1);
    };

    // const days = Math.max(Math.round(Math.abs((bookingData.endDate - bookingData.startDate) / (24 * 60 * 60 * 1000))), 1);
    const days = calculateDays()
    const guideEarnings = bookingData.totalPrice - bookingData.guide.serviceFee;

    return (
        <ScrollView style={styles.container}>
            <ScreenSafeArea edges={['bottom', 'top']} statusBarStyle='dark-content'>

                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    <Text style={styles.headerTitle}>COMPLETE YOUR BOOKING</Text>
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.guideInfoCard}>
                        <View style={styles.guideHeader}>
                            <View style={styles.guideIcon}>
                                <User size={40} color="#fff" />
                            </View>
                            <View style={styles.guideInfo}>
                                <Text style={styles.guideName}>{bookingData.guide.name}</Text>
                                <Text style={styles.guideDetail}>{bookingData.guide.purpose}</Text>
                                <Text style={styles.guideDetail}>{bookingData.guide.address}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Booking Dates (Confirmed)</Text>
                        <View style={styles.dateRow}>
                            <Pressable style={[styles.dateInput, styles.readOnly]}>
                                <Text style={styles.dateInputText}>{bookingData.startDate.toLocaleDateString()}</Text>
                                <Ionicons name="calendar" size={18} color="#8B98A8" />
                            </Pressable>
                            <Pressable style={[styles.dateInput, styles.readOnly]}>
                                <Text style={styles.dateInputText}>{bookingData.endDate.toLocaleDateString()}</Text>
                                <Ionicons name="calendar" size={18} color="#8B98A8" />
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Booking Type (Confirmed)</Text>
                        <ReadOnlyField label="Type" value={bookingData.selectedOption === 'group' ? 'Group' : 'Solo'} />
                        {bookingData.selectedOption === 'group' && (
                            <ReadOnlyField label="Number of people" value={bookingData.numPeople} />
                        )}
                    </View>
                    
                    {/* UPDATED Price Breakdown */}
                    <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Agreed Base Rate</Text>
                            <Text style={styles.priceValue}>₱ {bookingData.guide.basePrice.toLocaleString()}</Text>
                        </View>
                        {bookingData.selectedOption === 'group' && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Group Size</Text>
                                <Text style={styles.priceValue}>{bookingData.numPeople} person(s)</Text>
                            </View>
                        )}
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Days</Text>
                            <Text style={styles.priceValue}>{days} day(s)</Text>
                        </View>
                        <View style={styles.priceDivider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Guide Earnings (after fee)</Text>
                            <Text style={styles.priceValue}>₱ {guideEarnings.toLocaleString()}</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Platform Service Fee</Text>
                            <Text style={styles.priceValue}>₱ {bookingData.guide.serviceFee.toLocaleString()}</Text>
                        </View>
                        <View style={styles.priceDivider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Total to Pay</Text>
                            <Text style={styles.totalValue}>₱ {bookingData.totalPrice.toLocaleString()}</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Billing Information</Text>
                        <ReadOnlyRow>
                            <ReadOnlyField label="First Name" value={bookingData.billingInfo.firstName} />
                            <ReadOnlyField label="Last Name" value={bookingData.billingInfo.lastName} />
                        </ReadOnlyRow>
                        <ReadOnlyRow>
                            <ReadOnlyField label="Phone Number" value={formatPHPhoneLocal(bookingData.billingInfo.phoneNumber)} />
                            <ReadOnlyField label="Country" value={bookingData.billingInfo.country} />
                        </ReadOnlyRow>
                        <ReadOnlyField label="Email" value={bookingData.billingInfo.email} />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Options</Text>
                        <TouchableOpacity
                            style={styles.paymentOption}
                            onPress={() => setPaymentMethod('gcash')}
                        >
                            <View style={[styles.radioButton, paymentMethod === 'gcash' && styles.radioButtonActive]} />
                            <Text style={styles.paymentOptionText}>Gcash</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity style={styles.confirmButton} onPress={() => setIsModalOpen(true)}>
                        <Text style={styles.confirmButtonText}>Review and Pay ₱{bookingData.totalPrice.toLocaleString()}</Text>
                    </TouchableOpacity>
                </View>

                {isModalOpen && (
                    <PaymentReviewModal 
                        isModalOpen={isModalOpen} 
                        setIsModalOpen={setIsModalOpen}
                        paymentData={{
                            ...bookingData,
                            paymentMethod: paymentMethod,
                        }} 
                    />
                )}
            </ScreenSafeArea>
        </ScrollView>
    );
};

export default CompletePayment;

