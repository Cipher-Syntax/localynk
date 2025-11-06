import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const PaymentReviewModal = ({ isModalOpen, setIsModalOpen, paymentData }) => {
    // --- MODIFIED STATE ---
    // Removed showAlert and slideAnim
    const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);
    const [isPayment, setIsPayment] = useState(false);
    const router = useRouter();

    const handleConfirm = () => {
        // --- THIS IS YOUR NEW LOGIC ---
        if (paymentData?.paymentMethod) {
            // This is a FINAL payment.
            // TODO: Call your payment API (e.g., callGcashAPI(paymentData))
            console.log("Processing payment...", paymentData);
        } else {
            // This is a BOOKING REQUEST.
            // TODO: Save to your database with status: 'Pending'
            // e.g., saveBookingRequest(paymentData);
            console.log("Submitting booking request...", paymentData);
        }
        
        setIsPayment(!!paymentData?.paymentMethod);
        setShowConfirmationScreen(true);
    };

    const handleConfirmationDismiss = () => {
        setShowConfirmationScreen(false);
        setIsModalOpen(false);
        
        if (isPayment) {
            router.replace('/(protected)/home');
        } else {
            router.replace('/(protected)/home');
        }
    };

    const { guide, accommodation, startDate, endDate, firstName, lastName, phoneNumber, country, email, basePrice, serviceFee, totalPrice, paymentMethod, groupType, numberOfPeople, } = paymentData || {};

    const calculateDays = () => {
        if (!startDate || !endDate) return 1;
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.max(Math.round(Math.abs((endDate - startDate) / oneDay)) + 1, 1);
    };

    const days = calculateDays();
    const guideEarnings = totalPrice - serviceFee;

    return (
        <Modal visible={isModalOpen} animationType="slide">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScrollView style={styles.container}>
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                            <Ionicons name="close" size={28} color="#1A2332" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>BOOKING SUMMARY</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.contentContainer}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Booking Details</Text>

                            {accommodation && (
                                <View style={styles.detailCard}>
                                    <View style={styles.detailHeader}>
                                        <View style={styles.detailIcon}>
                                            <Ionicons name="home" size={20} color="#fff" />
                                        </View>
                                        <View style={styles.detailInfo}>
                                            <Text style={styles.detailLabel}>Accommodation</Text>
                                            <Text style={styles.detailName}>{accommodation.name}</Text>
                                            <Text style={styles.detailText}>{accommodation.location}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {guide && (
                                <View style={styles.detailCard}>
                                    <View style={styles.detailHeader}>
                                        <View style={styles.detailIcon}>
                                            <User size={20} color="#fff" />
                                        </View>
                                        <View style={styles.detailInfo}>
                                            <Text style={styles.detailLabel}>Tourist Guide</Text>
                                            <Text style={styles.detailName}>{guide.name}</Text>
                                            <Text style={styles.detailText}>{guide.purpose}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Booking Dates</Text>
                            <View style={styles.dateCard}>
                                <View style={styles.dateItem}>
                                    <Text style={styles.dateLabel}>Check-in</Text>
                                    <Text style={styles.dateValue}>{startDate?.toLocaleDateString()}</Text>
                                </View>
                                <View style={styles.dateDivider} />
                                <View style={styles.dateItem}>
                                    <Text style={styles.dateLabel}>Check-out</Text>
                                    <Text style={styles.dateValue}>{endDate?.toLocaleDateString()}</Text>
                                </View>
                                <View style={styles.dateDivider} />
                                <View style={styles.dateItem}>
                                    <Text style={styles.dateLabel}>Duration</Text>
                                    <Text style={styles.dateValue}>{days} day(s)</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Price Breakdown</Text>
                            <View style={styles.priceCard}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Base Price</Text>
                                <Text style={styles.priceValue}>
                                    ₱ {guide?.basePrice ? guide.basePrice.toLocaleString() : '0'}
                                </Text>
                            </View>

                            {groupType === 'group' && (
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Group Size</Text>
                                    <Text style={styles.priceValue}>{numberOfPeople} person(s)</Text>
                                </View>
                            )}


                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Days</Text>
                                <Text style={styles.priceValue}>
                                    {Math.max(Math.round(Math.abs((endDate - startDate) / (24 * 60 * 60 * 1000))) + 1, 1)} day(s)
                                </Text>
                            </View>

                            <View style={styles.priceDivider} />

                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Guide Earnings (after fee)</Text>
                                <Text style={styles.priceValue}>
                                    ₱ {guide?.serviceFee && totalPrice
                                        ? (totalPrice - guide.serviceFee).toLocaleString()
                                        : '0'}
                                </Text>
                            </View>

                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>App Service Fee</Text>
                                <Text style={styles.priceValue}>
                                    ₱ {guide?.serviceFee ? guide.serviceFee.toLocaleString() : '0'}
                                </Text>
                            </View>

                            <View style={styles.priceDivider} />

                            <View style={styles.priceRow}>
                                <Text style={styles.totalLabel}>Total to Pay</Text>
                                <Text style={styles.totalValue}>
                                    ₱ {totalPrice ? totalPrice.toLocaleString() : '0'}
                                </Text>
                            </View>
                        </View>

                        </View>

                        {paymentMethod && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Payment Method</Text>
                                <View style={styles.paymentCard}>
                                    <Text style={styles.paymentMethod}>{paymentMethod.toUpperCase()}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Billing Information</Text>
                            <View style={styles.billingCard}>
                                <View style={styles.billingRow}>
                                    <View style={styles.billingItem}>
                                        <Text style={styles.billingLabel}>First Name</Text>
                                        <Text style={styles.billingValue}>{firstName}</Text>
                                    </View>
                                    <View style={styles.billingItem}>
                                        <Text style={styles.billingLabel}>Last Name</Text>
                                        <Text style={styles.billingValue}>{lastName}</Text>
                                    </View>
                                </View>
                                <View style={styles.billingRow}>
                                    <View style={styles.billingItem}>
                                        <Text style={styles.billingLabel}>Phone Number</Text>
                                        <Text style={styles.billingValue}>{phoneNumber}</Text>
                                    </View>
                                    <View style={styles.billingItem}>
                                        <Text style={styles.billingLabel}>Country</Text>
                                        <Text style={styles.billingValue}>{country}</Text>
                                    </View>
                                </View>
                                <View style={styles.billingFullRow}>
                                    <Text style={styles.billingLabel}>Email</Text>
                                    <Text style={styles.billingValue}>{email}</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                            <Text style={styles.confirmButtonText}>
                                {/* ----- DYNAMIC BUTTON TEXT ----- */}
                                {paymentMethod ? "Confirm & Pay" : "Send Booking Request"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalOpen(false)}>
                            <Text style={styles.cancelButtonText}>Edit Details</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </ScrollView>

            <Modal
                visible={showConfirmationScreen}
                animationType="fade"
                transparent={false}
            >
                <SafeAreaView style={styles.confirmationContainer}>
                    <View style={styles.confirmationContent}>
                        <Text style={styles.confirmationHeader}>
                            {isPayment ? "CONFIRMATION" : "REQUEST SENT"}
                        </Text>
                        
                        <Ionicons 
                            name={isPayment ? "checkmark-circle" : "hourglass-outline"} 
                            size={100} 
                            style={[
                                styles.confirmationIcon, 
                                { color: isPayment ? '#00A8FF' : '#F5A623' }
                            ]} 
                        />
                        
                        <Text style={styles.confirmationTitle}>
                            {isPayment ? "Successful!" : "Request Sent!"}
                        </Text>
                        
                        <Text style={styles.confirmationMessage}>
                            {isPayment
                                ? "Your booking is confirmed. Thank you for booking with us!"
                                : "Please wait for the tour guide to approve your booking request. You will receive a notification shortly."
                            }
                        </Text>

                        <TouchableOpacity 
                            style={styles.confirmationButton} 
                            onPress={handleConfirmationDismiss}
                        >
                            <Text style={styles.confirmationButtonText}>
                                {isPayment ? "Confirm" : "OK"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </Modal>
    );
};

export default PaymentReviewModal;

// --- STYLES (Added new styles at the end) ---
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        // backgroundColor: '#D9E2E9' 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: '#F5F7FA', 
        borderBottomWidth: 1, 
        borderBottomColor: '#E0E6ED' 
    },
    headerTitle: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#1A2332' 
    },
    contentContainer: { 
        padding: 16, 
        paddingBottom: 30 
    },
    section: { 
        marginBottom: 20 
    },
    sectionTitle: { 
        fontSize: 14, 
        fontWeight: '700', 
        color: '#1A2332', 
        marginBottom: 12 
    },
    detailCard: { 
        backgroundColor: '#F5F7FA', 
        borderRadius: 12, 
        padding: 12, 
        marginBottom: 10, 
        borderWidth: 1, 
        borderColor: '#E0E6ED' 
    },
    detailHeader: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    detailIcon: { 
        width: 45, 
        height: 45, 
        borderRadius: 8, 
        backgroundColor: '#1A2332', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginRight: 12 
    },
    detailInfo: { 
        flex: 1 
    },
    detailLabel: { 
        fontSize: 10, 
        color: '#8B98A8', 
        fontWeight: '600' 
    },
    detailName: { 
        fontSize: 13, 
        fontWeight: '700', 
        color: '#1A2332', 
        marginTop: 2 
    },
    detailText: { 
        fontSize: 11, 
        color: '#8B98A8', 
        marginTop: 1 
    },
    dateCard: { 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        padding: 16, 
        borderWidth: 1, 
        borderColor: '#E0E6ED' 
    },
    dateItem: { 
        paddingVertical: 8 
    },
    dateLabel: { 
        fontSize: 11, 
        color: '#8B98A8', 
        fontWeight: '600' 
    },
    dateValue: { 
        fontSize: 13, 
        fontWeight: '700', 
        color: '#1A2332', 
        marginTop: 4 
    },
    dateDivider: { 
        height: 1, 
        backgroundColor: '#E0E6ED', 
        marginVertical: 8 
    },
    priceCard: { 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        padding: 16, 
        borderWidth: 1, 
        borderColor: '#E0E6ED' 
    },
    priceRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 10 
    },
    priceLabel: { 
        fontSize: 12, 
        color: '#1A2332', 
        fontWeight: '500' 
    },
    priceValue: { 
        fontSize: 12, 
        color: '#1A2332', 
        fontWeight: '600' 
    },
    priceDivider: { 
        height: 1, 
        backgroundColor: '#E0E6ED', 
        marginVertical: 10 
    },
    totalLabel: { 
        fontSize: 13, 
        fontWeight: '700', 
        color: '#1A2332' 
    },
    totalValue: { 
        fontSize: 13, 
        fontWeight: '700', 
        color: '#00A8FF' 
    },
    paymentCard: { 
        backgroundColor: '#F5F7FA', 
        borderRadius: 12, 
        padding: 14, 
        borderWidth: 1, 
        borderColor: '#E0E6ED', 
        alignItems: 'center' 
    },
    paymentMethod: { 
        fontSize: 13, 
        fontWeight: '700', 
        color: '#1A2332' 
    },
    billingCard: { 
        backgroundColor: '#F5F7FA', 
        borderRadius: 12, 
        padding: 12, 
        borderWidth: 1, 
        borderColor: '#E0E6ED' 
    },
    billingRow: { 
        flexDirection: 'row', 
        gap: 12, 
        marginBottom: 12 
    },
    billingFullRow: { 
        paddingVertical: 8 
    },
    billingItem: { 
        flex: 1 
    },
    billingLabel: { 
        fontSize: 10, 
        color: '#8B98A8', 
        fontWeight: '600' 
    },
    billingValue: { 
        fontSize: 12, 
        fontWeight: '600', 
        color: '#1A2332', 
        marginTop: 3 
    },
    confirmButton: { 
        backgroundColor: '#00A8FF', 
        paddingVertical: 12, 
        borderRadius: 8, 
        alignItems: 'center', 
        marginBottom: 10 
    },
    confirmButtonText: { 
        color: '#fff', 
        fontWeight: '700', 
        fontSize: 14 
    },
    cancelButton: { 
        backgroundColor: '#fff', 
        paddingVertical: 12, 
        borderRadius: 8, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#00A8FF' 
    },
    cancelButtonText: { 
        color: '#00A8FF', 
        fontWeight: '700', 
        fontSize: 14 
    },

    // --- REMOVED OLD ALERT STYLES ---
    
    // --- NEW CONFIRMATION MODAL STYLES ---
    confirmationContainer: {
        flex: 1,
        backgroundColor: '#F5F7FA', // A light background color
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmationContent: {
        width: '90%',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    confirmationHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#00A8FF',
        letterSpacing: 1,
        marginBottom: 40,
        opacity: 0.8
    },
    confirmationIcon: {
        marginBottom: 24,
    },
    confirmationTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1A2332',
        marginBottom: 12,
    },
    confirmationMessage: {
        fontSize: 15,
        color: '#8B98A8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    confirmationButton: {
        backgroundColor: '#00A8FF',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
    },
    confirmationButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});