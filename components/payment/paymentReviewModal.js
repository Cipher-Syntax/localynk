import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Image, Alert, ActivityIndicator, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import api from '../../api/api';
import { useAuth } from "../../context/AuthContext"; 

const PaymentReviewModal = ({ isModalOpen, setIsModalOpen, paymentData }) => {
    const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);
    const [isPayment, setIsPayment] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [showPaymentLink, setShowPaymentLink] = useState(false);
    const [paymentId, setPaymentId] = useState(null);
    const [activeBookingId, setActiveBookingId] = useState(null); // New state to track ID
    
    const router = useRouter();
    const { refreshUser } = useAuth();
    const pollingRef = useRef(null);
    const appState = useRef(AppState.currentState);

    const { 
        guide, agency, accommodation,
        accommodationId,
        tourPackageId,
        startDate, endDate, 
        firstName, lastName, phoneNumber, country, email, 
        basePrice, 
        
        totalPrice, 
        downPayment, 
        balanceDue,
        
        paymentMethod, 
        groupType, numberOfPeople, validIdImage, bookingId, // This comes from props (might be null for new bookings)
        placeId, isNewKycImage,
        userSelfieImage,
        tourCost, accomCost, extraPersonFee
    } = paymentData || {};

    const calculateDays = () => {
        if (!startDate || !endDate) return 1;
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.max(Math.round((endDate - startDate) / oneDay), 1);
    };
    const days = calculateDays();

    // ... (Keep Polling Logic same as before) ...
    const checkPaymentStatus = useCallback(async (id) => {
        if (!id) return;
        try {
            const statusResp = await api.get(`/api/payments/status/${id}/`);
            const status = statusResp.data.status;
            if (status === "succeeded" || status === "paid") {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setPaymentId(null);
                setShowPaymentLink(false);
                if (refreshUser) refreshUser();
                setIsPayment(true);
                setShowConfirmationScreen(true);
            } else if (status === "failed") {
                if (pollingRef.current) clearInterval(pollingRef.current);
                setPaymentId(null);
                setShowPaymentLink(false);
                Alert.alert("Payment Failed", "The payment process failed. Please try again.");
            }
        } catch (err) {
            console.error("Check payment status failed:", err);
        }
    }, [refreshUser]);

    const startPolling = useCallback((id) => {
        if (!id) return;
        if (pollingRef.current) clearInterval(pollingRef.current);
        checkPaymentStatus(id);
        pollingRef.current = setInterval(() => {
            checkPaymentStatus(id);
        }, 3000); 
    }, [checkPaymentStatus]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active' && paymentId && showPaymentLink) {
                startPolling(paymentId);
            }
            appState.current = nextAppState;
        });
        return () => subscription.remove();
    }, [paymentId, showPaymentLink, startPolling]);

    useEffect(() => {
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, []);

    // --- HELPER: Function to Create Booking ---
    const createBooking = async () => {
        console.log("Creating new booking...");
        const formatLocalDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        const formData = new FormData();
        formData.append('check_in', formatLocalDate(startDate));
        formData.append('check_out', formatLocalDate(endDate));
        formData.append('num_guests', String(numberOfPeople));
        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
        formData.append('phone_number', phoneNumber);
        formData.append('country', country);
        formData.append('email', email);

        if (guide && guide.id) formData.append('guide', String(guide.id));
        else if (agency && agency.id) formData.append('agency', String(agency.id));
        
        if (accommodationId) formData.append('accommodation', String(accommodationId));
        if (tourPackageId) formData.append('tour_package_id', String(tourPackageId));
        if (placeId) formData.append('destination', placeId);
        
        if (validIdImage && isNewKycImage) {
            const uri = validIdImage;
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;
            formData.append('tourist_valid_id_image', { uri, name: filename, type });
        }

        if (userSelfieImage) {
            const uri = userSelfieImage;
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;
            formData.append('tourist_selfie_image', { uri, name: filename, type });
        }

        const response = await api.post('/api/bookings/', formData, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'multipart/form-data' },
            timeout: 15000
        });
        return response.data; // Returns the full booking object
    };

    // --- HELPER: Function to Initiate Payment ---
    const initiatePayment = async (targetBookingId) => {
        console.log(`Initiating payment for Booking ID: ${targetBookingId}`);
        const payload = {
            booking_id: targetBookingId,
            payment_method: paymentMethod 
        };
        const response = await api.post('/api/payments/initiate/', payload, { timeout: 15000 });
        const { checkout_url, payment_id } = response.data;
        
        if (checkout_url) {
            setCheckoutUrl(checkout_url);
            setPaymentId(payment_id);
            setShowPaymentLink(true);
            await Linking.openURL(checkout_url);
            startPolling(payment_id);
        } else {
            throw new Error("Could not generate payment link.");
        }
    };

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            let targetId = bookingId; // Start with the prop (if it exists)

            // Step 1: Create Booking if it doesn't exist
            if (!targetId) {
                const newBooking = await createBooking();
                targetId = newBooking.id;
                setActiveBookingId(targetId);
                console.log("New Booking Created with ID:", targetId);
            }

            // Step 2: Proceed to Payment (if method selected)
            if (paymentMethod) {
                await initiatePayment(targetId);
            } else {
                // If no payment method (e.g. manual request), just finish
                setIsPayment(false); 
                setShowConfirmationScreen(true);
            }

        } catch (error) {
            console.error("Action failed:", error);
            if (error.response) {
                console.log("Server Response:", error.response.data);
                const msg = JSON.stringify(error.response.data);
                Alert.alert("Request Failed", msg.includes("destination") ? "Please select a destination/place." : "Server error.");
            } else {
                Alert.alert("Request Failed", "Could not complete request.");
            }
        } finally {
            setIsLoading(false);
        }
    };
  
    const handleOpenPaymentLink = async () => {
        if (checkoutUrl) {
            try {
                await Linking.openURL(checkoutUrl);
                if (paymentId) startPolling(paymentId);
            } catch (error) {}
        }
    };

    const handleConfirmationDismiss = () => {
        setShowConfirmationScreen(false);
        setIsModalOpen(false);
        router.replace('/(protected)/home');
    };

    return (
        <Modal visible={isModalOpen} animationType="slide">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScrollView style={styles.container}>
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                            <Ionicons name="close" size={28} color="#1A2332" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>CONFIRM & PAY</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <View style={styles.contentContainer}>
                        {/* Details Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Booking Details</Text>
                            {(accommodation || accommodationId) && (
                                <View style={styles.detailCard}>
                                    <View style={styles.detailHeader}>
                                        <View style={styles.detailIcon}><Ionicons name="home" size={20} color="#fff" /></View>
                                        <View style={styles.detailInfo}>
                                            <Text style={styles.detailLabel}>Accommodation</Text>
                                            <Text style={styles.detailName}>{accommodation?.name || "Selected Stay"}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                            {guide && (
                                <View style={styles.detailCard}>
                                    <View style={styles.detailHeader}>
                                        <View style={styles.detailIcon}><User size={20} color="#fff" /></View>
                                        <View style={styles.detailInfo}>
                                            <Text style={styles.detailLabel}>Tourist Guide</Text>
                                            <Text style={styles.detailName}>{guide.name}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Price Breakdown */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Price Breakdown</Text>
                            <View style={styles.priceCard}>
                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Total Trip Cost</Text>
                                    <Text style={styles.priceValue}>₱ {totalPrice?.toLocaleString() || "0"}</Text>
                                </View>

                                {downPayment > 0 && (
                                    <>
                                        <View style={styles.priceDivider} />
                                        <View style={styles.priceRow}>
                                            <Text style={styles.totalLabel}>Down Payment (Due Now)</Text>
                                            <Text style={[styles.totalValue, { color: '#00A8FF' }]}>
                                                ₱ {downPayment?.toLocaleString() || "0"}
                                            </Text>
                                        </View>
                                        <View style={styles.priceRow}>
                                            <Text style={[styles.priceLabel, {marginTop: 4}]}>Balance (Pay Later)</Text>
                                            <Text style={[styles.priceValue, {marginTop: 4, color: '#666'}]}>
                                                ₱ {balanceDue?.toLocaleString() || "0"}
                                            </Text>
                                        </View>
                                    </>
                                )}
                                
                                {(!downPayment || downPayment === 0) && (
                                    <View style={styles.priceRow}>
                                        <Text style={styles.totalLabel}>Total Due Now</Text>
                                        <Text style={styles.totalValue}>₱ {totalPrice?.toLocaleString() || "0"}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* KYC & Button Section */}
                        {!showPaymentLink ? (
                            <TouchableOpacity 
                                style={[styles.confirmButton, isLoading && { opacity: 0.7 }]} 
                                onPress={handleConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>
                                        {downPayment > 0 
                                            ? `Pay Down Payment (₱${downPayment.toLocaleString()})` 
                                            : `Pay Total (₱${totalPrice?.toLocaleString() || 0})`
                                        }
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.confirmButton} onPress={handleOpenPaymentLink}>
                                <Text style={styles.confirmButtonText}>Go to Payment Link (Processing...)</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalOpen(false)} disabled={isLoading}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                    </View>
                </SafeAreaView>
            </ScrollView>

            <Modal visible={showConfirmationScreen} animationType="fade">
                <SafeAreaView style={styles.confirmationContainer}>
                    <View style={styles.confirmationContent}>
                        <Text style={styles.confirmationHeader}>PAYMENT SUCCESS</Text>
                        <Ionicons name="checkmark-circle" size={100} color="#00C853" style={{ marginBottom: 20 }}/>
                        <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
                        <Text style={styles.confirmationMessage}>
                            You have successfully paid the down payment. Your dates are locked.
                        </Text>
                        <TouchableOpacity style={styles.confirmationButton} onPress={handleConfirmationDismiss}>
                            <Text style={styles.confirmationButtonText}>View My Trips</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </Modal>
    );
};

export default PaymentReviewModal;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: "#F5F7FA",
        borderBottomColor: "#E0E6ED",
        borderBottomWidth: 1
    },
    headerTitle: { fontSize: 16, fontWeight: "700", color: "#1A2332" },
    contentContainer: { padding: 16 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: "700", marginBottom: 12, color: "#1A2332" },
    detailCard: { backgroundColor: "#F5F7FA", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E0E6ED", marginBottom: 10 },
    detailHeader: { flexDirection: "row", alignItems: "center" },
    detailIcon: { width: 45, height: 45, backgroundColor: "#1A2332", borderRadius: 8, justifyContent: "center", alignItems: "center", marginRight: 12 },
    detailInfo: { flex: 1 },
    detailLabel: { fontSize: 10, color: "#8B98A8", fontWeight: "600" },
    detailName: { fontSize: 13, fontWeight: "700", marginTop: 2, color: "#1A2332" },
    priceCard: { backgroundColor: "#fff", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#E0E6ED" },
    priceRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    priceLabel: { fontSize: 12, color: "#1A2332", fontWeight: "500" },
    priceValue: { fontSize: 12, fontWeight: "600" },
    priceDivider: { height: 1, backgroundColor: "#E0E6ED", marginVertical: 10 },
    totalLabel: { fontSize: 13, fontWeight: "700" },
    totalValue: { fontSize: 13, fontWeight: "700", color: "#00A8FF" },
    confirmButton: { backgroundColor: "#00A8FF", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 10 },
    confirmButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    cancelButton: { backgroundColor: "#E0E6ED", paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 10, marginBottom: 30 },
    cancelButtonText: { color: "#1A2332", fontWeight: "700", fontSize: 14 },
    confirmationContainer: { flex: 1, justifyContent: "center", paddingHorizontal: 30 },
    confirmationContent: { alignItems: "center" },
    confirmationHeader: { fontSize: 16, fontWeight: "700", marginBottom: 15 },
    confirmationTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
    confirmationMessage: { fontSize: 13, color: "#555", textAlign: "center", marginBottom: 20 },
    confirmationButton: { backgroundColor: "#00A8FF", paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12 },
    confirmationButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 }
});