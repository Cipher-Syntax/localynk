import React, { useState, useEffect, useRef } from 'react';
import { 
    View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, 
    StatusBar, Image, Alert, ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import api from '../../api/api';
import { useAuth } from "../../context/AuthContext"; 

const PaymentReviewModal = ({ isModalOpen, setIsModalOpen, paymentData }) => {
    // UI State
    const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);
    const [isPayment, setIsPayment] = useState(false); // Controls success message (Payment vs Request)
    
    // Polling & Payment State
    const [isLoading, setIsLoading] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [showPaymentLink, setShowPaymentLink] = useState(false);
    const [paymentId, setPaymentId] = useState(null);
    
    // Hooks
    const router = useRouter();
    const { refreshUser } = useAuth(); // Refresh user context if payment succeeds
    const pollingRef = useRef(null);

    // Destructure Data
    const { 
        guide, agency, accommodation, startDate, endDate, 
        firstName, lastName, phoneNumber, country, email, 
        basePrice, totalPrice, paymentMethod, 
        groupType, numberOfPeople, validIdImage, bookingId,
        isNewKycImage // <--- ADDED THIS FLAG
    } = paymentData || {};

    const calculateDays = () => {
        if (!startDate || !endDate) return 1;
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.max(Math.round((endDate - startDate) / oneDay) + 1, 1);
    };
    const days = calculateDays();

    // --- Cleanup Polling on Unmount ---
    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    // --- Main Action Handler ---
    // --- Main Action Handler ---
    const handleConfirm = async () => {
        setIsLoading(true);

        try {
            if (paymentMethod) {
                console.log("Initiating payment for Booking ID:", bookingId);

                // 1. Initiate Payment
                const response = await api.post('/api/payments/initiate/', {
                    booking_id: bookingId,
                    payment_method: paymentMethod 
                }, {
                    timeout: 15000 // <--- CHANGE 1: 15 Second Timeout
                });

                const { checkout_url, payment_id } = response.data;
                console.log("Payment Initiated:", response.data);

                if (checkout_url) {
                    setCheckoutUrl(checkout_url);
                    setPaymentId(payment_id);
                    setShowPaymentLink(true);
                    await Linking.openURL(checkout_url);
                    startPolling(payment_id);
                } else {
                    Alert.alert("Error", "Could not generate payment link.");
                }

            } else {
                console.log("Preparing Booking Request Data...", paymentData);

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

                if (guide && guide.id) {
                    formData.append('guide', String(guide.id));
                } else if (agency && agency.id) {
                    formData.append('agency', String(agency.id));
                }
                
                if (validIdImage && isNewKycImage) {
                    const uri = validIdImage;
                    const filename = uri.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image/jpeg`;
                    formData.append('tourist_valid_id_image', { uri, name: filename, type });
                }

                const response = await api.post('/api/bookings/', formData, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'multipart/form-data', 
                    },
                    timeout: 15000
                });

                console.log("Booking Request Created:", response.data);
                setIsPayment(false); 
                setShowConfirmationScreen(true);
            }

        } catch (error) {
            console.error("Action failed:", error);

            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                Alert.alert(
                    "Request Timeout", 
                    "The server took too long to respond. Please check your internet connection and try again."
                );
            } 
            else if (error.response) {
                console.log("Backend Error Details:", error.response.data);
                const msg = typeof error.response.data === 'object' 
                    ? JSON.stringify(error.response.data) 
                    : error.response.data;
                Alert.alert("Request Failed", msg);
            } else {
                Alert.alert("Failed", "Network error or server not reachable.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const startPolling = (id) => {
        if (!id) return;
        if (pollingRef.current) clearInterval(pollingRef.current);

        console.log(`Starting polling for Payment ID: ${id}`);

        pollingRef.current = setInterval(async () => {
            try {
                const statusResp = await api.get(`/api/payments/status/${id}/`);
                const status = statusResp.data.status;
                console.log(`Polling status: ${status}`);

                if (status === "succeeded") {
                    clearInterval(pollingRef.current);
                    if (refreshUser) refreshUser();
                    
                    setIsPayment(true);
                    setShowConfirmationScreen(true); 
                } else if (status === "failed") {
                    clearInterval(pollingRef.current);
                    Alert.alert("Payment Failed", "The payment process failed. Please try again.");
                    setShowPaymentLink(false);
                }
            } catch (err) {
                console.error("Polling payment status failed:", err);
            }
        }, 3000); 
    };

  
    const handleOpenPaymentLink = async () => {
        if (checkoutUrl) {
            try {
                await Linking.openURL(checkoutUrl);
                Alert.alert("Redirecting", "Opening payment gateway...");
            } catch (error) {
                Alert.alert("Error", "Could not open link.");
            }
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

                            {agency && (
                                <View style={styles.detailCard}>
                                    <View style={styles.detailHeader}>
                                        <View style={styles.detailIcon}>
                                            <Ionicons name="business" size={20} color="#fff" />
                                        </View>
                                        <View style={styles.detailInfo}>
                                            <Text style={styles.detailLabel}>Agency</Text>
                                            <Text style={styles.detailName}>{agency.name}</Text>
                                            <Text style={styles.detailText}>{agency.purpose}</Text>
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
                                        ₱ {basePrice?.toLocaleString() || "0"}
                                    </Text>
                                </View>

                                {groupType === "group" && (
                                    <View style={styles.priceRow}>
                                        <Text style={styles.priceLabel}>Group Size</Text>
                                        <Text style={styles.priceValue}>{numberOfPeople}</Text>
                                    </View>
                                )}

                                <View style={styles.priceRow}>
                                    <Text style={styles.priceLabel}>Days</Text>
                                    <Text style={styles.priceValue}>{days}</Text>
                                </View>

                                <View style={styles.priceDivider} />

                                <View style={styles.priceRow}>
                                    <Text style={styles.totalLabel}>Total to Pay</Text>
                                    <Text style={styles.totalValue}>
                                        ₱ {totalPrice?.toLocaleString() || "0"}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {validIdImage && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Identity Verification</Text>
                                <View style={styles.idCard}>
                                    <Image 
                                        source={{ uri: validIdImage }}
                                        style={styles.idImage}
                                    />
                                    <View style={styles.idOverlay}>
                                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                        <Text style={styles.idText}>ID Attached</Text>
                                    </View>
                                </View>
                            </View>
                        )}

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
                                        <Text style={styles.billingLabel}>Phone</Text>
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
                                        {paymentMethod ? "Confirm & Pay" : "Send Booking Request"}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.confirmButton} onPress={handleOpenPaymentLink}>
                                <Text style={styles.confirmButtonText}>Go to Payment Link (Processing...)</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity 
                            style={styles.cancelButton} 
                            onPress={() => setIsModalOpen(false)}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelButtonText}>Edit Details</Text>
                        </TouchableOpacity>

                    </View>
                </SafeAreaView>
            </ScrollView>

            <Modal visible={showConfirmationScreen} animationType="fade">
                <SafeAreaView style={styles.confirmationContainer}>
                    <View style={styles.confirmationContent}>
                        <Text style={styles.confirmationHeader}>
                            {isPayment ? "CONFIRMATION" : "REQUEST SENT"}
                        </Text>

                        <Ionicons 
                            name={isPayment ? "checkmark-circle" : "hourglass-outline"} 
                            size={100}
                            style={{ color: isPayment ? "#00A8FF" : "#F5A623", marginBottom: 20 }}
                        />

                        <Text style={styles.confirmationTitle}>
                            {isPayment ? "Successful!" : "Request Sent!"}
                        </Text>

                        <Text style={styles.confirmationMessage}>
                            {isPayment
                                ? "Your booking is confirmed. Thank you!"
                                : "Please wait for the guide to approve your request."
                            }
                        </Text>

                        <TouchableOpacity 
                            style={styles.confirmationButton}
                            onPress={handleConfirmationDismiss}
                        >
                            <Text style={styles.confirmationButtonText}>
                                {isPayment ? "Done" : "OK"}
                            </Text>
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
    headerTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1A2332"
    },
    contentContainer: {
        padding: 16
    },

    section: { marginBottom: 20 },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 12,
        color: "#1A2332"
    },

    detailCard: {
        backgroundColor: "#F5F7FA",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: "#E0E6ED",
        marginBottom: 10
    },
    detailHeader: { flexDirection: "row", alignItems: "center" },
    detailIcon: {
        width: 45,
        height: 45,
        backgroundColor: "#1A2332",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    },
    detailInfo: { flex: 1 },
    detailLabel: { fontSize: 10, color: "#8B98A8", fontWeight: "600" },
    detailName: { fontSize: 13, fontWeight: "700", marginTop: 2, color: "#1A2332" },
    detailText: { fontSize: 11, color: "#8B98A8", marginTop: 1 },

    dateCard: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E0E6ED"
    },
    dateItem: { paddingVertical: 6 },
    dateLabel: { fontSize: 11, color: "#8B98A8", fontWeight: "600" },
    dateValue: { fontSize: 13, fontWeight: "700", marginTop: 3 },

    dateDivider: { height: 1, backgroundColor: "#E0E6ED", marginVertical: 8 },

    priceCard: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E0E6ED"
    },
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10
    },
    priceLabel: { fontSize: 12, color: "#1A2332", fontWeight: "500" },
    priceValue: { fontSize: 12, fontWeight: "600" },

    priceDivider: { height: 1, backgroundColor: "#E0E6ED", marginVertical: 10 },

    totalLabel: { fontSize: 13, fontWeight: "700" },
    totalValue: { fontSize: 13, fontWeight: "700", color: "#00A8FF" },

    idCard: {
        height: 150,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E0E6ED",
        backgroundColor: "#F5F7FA"
    },
    idImage: { width: "100%", height: "100%" },
    idOverlay: {
        position: "absolute",
        bottom: 10,
        right: 10,
        backgroundColor: "rgba(0, 168, 255, 0.9)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center"
    },
    idText: { color: "#fff", fontSize: 11, fontWeight: "700" },

    paymentCard: {
        backgroundColor: "#F5F7FA",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E0E6ED"
    },
    paymentMethod: { fontSize: 13, fontWeight: "700" },

    billingCard: {
        backgroundColor: "#F5F7FA",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E0E6ED"
    },
    billingRow: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12
    },
    billingFullRow: { marginTop: 6 },
    billingItem: { flex: 1 },
    billingLabel: { fontSize: 10, color: "#8B98A8", fontWeight: "600" },
    billingValue: { fontSize: 12, fontWeight: "600", color: "#1A2332", marginTop: 2 },

    confirmButton: {
        backgroundColor: "#00A8FF",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10
    },
    confirmButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

    cancelButton: {
        backgroundColor: "#E0E6ED",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 30
    },
    cancelButtonText: { color: "#1A2332", fontWeight: "700", fontSize: 14 },

    confirmationContainer: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 30
    },
    confirmationContent: { alignItems: "center" },

    confirmationHeader: { fontSize: 16, fontWeight: "700", marginBottom: 15 },

    confirmationTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
    confirmationMessage: {
        fontSize: 13,
        color: "#555",
        textAlign: "center",
        marginBottom: 20
    },

    confirmationButton: {
        backgroundColor: "#00A8FF",
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 12
    },
    confirmationButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 }
});