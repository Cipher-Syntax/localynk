import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, StyleSheet, Image, TextInput, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PaymentReviewModal } from '../../components/payment';

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
    const router = useRouter();

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

    const days = Math.max(Math.round(Math.abs((bookingData.endDate - bookingData.startDate) / (24 * 60 * 60 * 1000))) + 1, 1);
    const guideEarnings = bookingData.totalPrice - bookingData.guide.serviceFee;

    return (
        <ScrollView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

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
                {/* Guide Info (Read-only) */}
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

                {/*Dates (Read-only) */}
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

                {/* Booking Type (Read-only) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Booking Type (Confirmed)</Text>
                     <ReadOnlyField label="Type" value={bookingData.selectedOption === 'group' ? 'Group' : 'Solo'} />
                    {bookingData.selectedOption === 'group' && (
                         <ReadOnlyField label="Number of people" value={bookingData.numPeople} />
                    )}
                </View>
                
                {/*Price Breakdown (Read-only) */}
                <View style={styles.priceCard}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Base Price</Text>
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
                        <Text style={styles.priceLabel}>App Service Fee</Text>
                        <Text style={styles.priceValue}>₱ {bookingData.guide.serviceFee.toLocaleString()}</Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total to Pay</Text>
                        <Text style={styles.totalValue}>₱ {bookingData.totalPrice.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Billing Info (Read-only) */}
                 <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Billing Information</Text>
                    <ReadOnlyRow>
                        <ReadOnlyField label="First Name" value={bookingData.billingInfo.firstName} />
                        <ReadOnlyField label="Last Name" value={bookingData.billingInfo.lastName} />
                    </ReadOnlyRow>
                    <ReadOnlyRow>
                        <ReadOnlyField label="Phone Number" value={bookingData.billingInfo.phoneNumber} />
                        <ReadOnlyField label="Country" value={bookingData.billingInfo.country} />
                    </ReadOnlyRow>
                    <ReadOnlyField label="Email" value={bookingData.billingInfo.email} />
                </View>

                {/* The only interactive part */}
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
        </ScrollView>
    );
};

export default CompletePayment;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
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
        fontWeight: '700',
        letterSpacing: 1,
    },
    contentContainer: {
        padding: 16,
    },
    guideInfoCard: {
        backgroundColor: '#253347',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    guideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    guideIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0072FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    guideInfo: {
        flex: 1,
    },
    guideName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    guideDetail: {
        color: '#E0E0E0',
        fontSize: 14,
        marginTop: 2,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A2332',
        marginBottom: 12,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateInput: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 4,
    },
    dateInputText: {
        fontSize: 14,
        color: '#1A2332',
    },
    readOnly: {
        backgroundColor: '#E0E0E0',
    },
    priceCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    priceLabel: {
        fontSize: 14,
        color: '#5B6878',
    },
    priceValue: {
        fontSize: 14,
        color: '#1A2332',
        fontWeight: '600',
    },
    priceDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 10,
    },
    totalLabel: {
        fontSize: 16,
        color: '#1A2332',
        fontWeight: '700',
    },
    totalValue: {
        fontSize: 18,
        color: '#0072FF',
        fontWeight: '700',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#0072FF',
        marginRight: 12,
    },
    radioButtonActive: {
        backgroundColor: '#0072FF',
    },
    paymentOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A2332',
    },
    confirmButton: {
        backgroundColor: '#0072FF',
        borderRadius: 50,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    readOnlyContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        flex: 1,
        marginHorizontal: 4,
    },
    readOnlyLabel: {
        fontSize: 12,
        color: '#8B98A8',
        marginBottom: 4,
    },
    readOnlyValue: {
        fontSize: 14,
        color: '#1A2332',
        fontWeight: '600',
    },
    billingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
});
