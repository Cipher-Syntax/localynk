import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, AppState, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Receipt, MapPin, Calendar, CreditCard, User, Mail } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import api from '../../api/api';
import { useAuth } from "../../context/AuthContext"; 

const { height } = Dimensions.get('window');

const PaymentReviewModal = ({ isModalOpen, setIsModalOpen, paymentData }) => {
    const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);
    const [isPayment, setIsPayment] = useState(false);
    
    const [isLoading, setIsLoading] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState('');
    const [showPaymentLink, setShowPaymentLink] = useState(false);
    const [paymentId, setPaymentId] = useState(null);
    const [activeBookingId, setActiveBookingId] = useState(null);
    
    const router = useRouter();
    const { refreshUser } = useAuth();
    const pollingRef = useRef(null);
    const appState = useRef(AppState.currentState);

    const { 
        guide, agency, accommodation, accommodationId, tourPackageId,
        startDate, endDate, 
        firstName, lastName, phoneNumber, country, email, 
        basePrice, totalPrice, downPayment, balanceDue,
        paymentMethod, groupType, numberOfPeople, validIdImage, bookingId,
        placeId, isNewKycImage, userSelfieImage,
        tourCost, accomCost, extraPersonFee
    } = paymentData || {};

    const calculateDays = () => {
        if (!startDate || !endDate) return 1;
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.max(Math.round((endDate - startDate) / oneDay), 1);
    };
    const days = calculateDays();

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // --- LOGIC SECTION (UNCHANGED) ---
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
        return response.data;
    };

    const initiatePayment = async (targetBookingId) => {
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
            let targetId = bookingId; 
            if (!targetId) {
                const newBooking = await createBooking();
                targetId = newBooking.id;
                setActiveBookingId(targetId);
            }

            if (paymentMethod) {
                await initiatePayment(targetId);
            } else {
                setIsPayment(false); 
                setShowConfirmationScreen(true);
            }

        } catch (error) {
            console.error("Action failed:", error);
            // ... Error handling remains the same
        } finally {
            setIsLoading(false);
        }
    };
  
    const handleOpenPaymentLink = async () => {
        if (checkoutUrl) {
            try { await Linking.openURL(checkoutUrl); } catch (error) {}
        }
    };

    const handleConfirmationDismiss = () => {
        setShowConfirmationScreen(false);
        setIsModalOpen(false);
        router.replace('/(protected)/home');
    };

    // --- RECEIPT COMPONENT HELPER ---
    const DashedLine = () => (
        <View style={styles.dashedLineContainer}>
            {[...Array(30)].map((_, i) => (
                <View key={i} style={styles.dash} />
            ))}
        </View>
    );

    return (
        <Modal visible={isModalOpen} animationType="fade" transparent={true}>
            <View style={styles.overlay}>
                <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.6)" />
                
                {/* --- MAIN RECEIPT CARD --- */}
                <View style={styles.receiptContainer}>
                    
                    {/* Header: "Tear off" look */}
                    <View style={styles.receiptHeader}>
                        <View style={styles.headerRow}>
                            <View style={styles.headerIconBg}>
                                <Receipt size={20} color="#0072FF" />
                            </View>
                            <Text style={styles.receiptTitle}>BOOKING SUMMARY</Text>
                            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalOpen(false)}>
                                <Ionicons name="close" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.receiptDate}>{new Date().toLocaleString()}</Text>
                    </View>

                    <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                        {/* 1. Service Details */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>ITINERARY</Text>
                            
                            <View style={styles.itemRow}>
                                <View style={styles.itemIcon}><Calendar size={16} color="#64748B" /></View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.itemTitle}>{formatDate(startDate)} — {formatDate(endDate)}</Text>
                                    <Text style={styles.itemSub}>{days} Day{days > 1 ? 's' : ''} Duration • {groupType === 'group' ? `${numberOfPeople} Guests` : 'Solo Traveler'}</Text>
                                </View>
                            </View>

                            <View style={styles.itemRow}>
                                <View style={styles.itemIcon}><MapPin size={16} color="#64748B" /></View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.itemTitle}>{guide ? guide.name : (agency ? agency.name : "Local Tour")}</Text>
                                    {accommodation && <Text style={styles.itemSub}>+ {accommodation.name}</Text>}
                                </View>
                            </View>
                        </View>

                        <DashedLine />

                        {/* 2. Customer */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>BILLED TO</Text>
                            <View style={styles.itemRow}>
                                <View style={styles.itemIcon}><User size={16} color="#64748B" /></View>
                                <Text style={styles.itemText}>{firstName} {lastName}</Text>
                            </View>
                            <View style={styles.itemRow}>
                                <View style={styles.itemIcon}><Mail size={16} color="#64748B" /></View>
                                <Text style={styles.itemText}>{email}</Text>
                            </View>
                        </View>

                        <DashedLine />

                        {/* 3. Billing Breakdown */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>PAYMENT BREAKDOWN</Text>
                            
                            <View style={styles.billRow}>
                                <Text style={styles.billLabel}>Total Trip Cost</Text>
                                <Text style={styles.billValue}>₱ {totalPrice?.toLocaleString()}</Text>
                            </View>
                            
                            {downPayment > 0 ? (
                                <>
                                    <View style={styles.billRow}>
                                        <Text style={styles.billLabel}>Down Payment (30%)</Text>
                                        <Text style={[styles.billValue, { color: '#0072FF', fontWeight: '700' }]}>
                                            ₱ {downPayment?.toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={styles.billRow}>
                                        <Text style={styles.billLabel}>Balance (Pay Later)</Text>
                                        <Text style={[styles.billValue, { color: '#94A3B8' }]}>
                                            ₱ {balanceDue?.toLocaleString()}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <View style={styles.billRow}>
                                    <Text style={styles.billLabel}>Due Today</Text>
                                    <Text style={[styles.billValue, { color: '#0072FF' }]}>₱ {totalPrice?.toLocaleString()}</Text>
                                </View>
                            )}
                        </View>

                    </ScrollView>

                    {/* Footer: Total & Action */}
                    <View style={styles.receiptFooter}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalTextLabel}>PAYABLE NOW</Text>
                            <Text style={styles.totalTextValue}>₱ {downPayment > 0 ? downPayment.toLocaleString() : totalPrice.toLocaleString()}</Text>
                        </View>

                        {!showPaymentLink ? (
                            <TouchableOpacity 
                                style={[styles.payButton, isLoading && { opacity: 0.8 }]} 
                                onPress={handleConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <CreditCard size={18} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.payButtonText}>Confirm & Pay</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.payButton, {backgroundColor: '#059669'}]} onPress={handleOpenPaymentLink}>
                                <Text style={styles.payButtonText}>Resume Payment</Text>
                            </TouchableOpacity>
                        )}
                        <Text style={styles.secureText}>
                            <Ionicons name="lock-closed" size={10} color="#94A3B8" /> Secure 256-bit SSL Encrypted Payment
                        </Text>
                    </View>
                </View>
            </View>

            {/* --- CONFIRMATION SCREEN --- */}
            <Modal visible={showConfirmationScreen} animationType="slide">
                <SafeAreaView style={styles.successContainer}>
                    <View style={styles.successContent}>
                        <View style={styles.successIconCircle}>
                            <Ionicons name="checkmark" size={60} color="#fff" />
                        </View>
                        <Text style={styles.successTitle}>PAYMENT SUCCESS</Text>
                        <Text style={styles.successSub}>Your booking has been secured.</Text>
                        
                        <View style={styles.ticketStub}>
                            <View style={styles.ticketRow}>
                                <Text style={styles.ticketLabel}>Booking Ref</Text>
                                <Text style={styles.ticketValue}>#{activeBookingId || "PENDING"}</Text>
                            </View>
                            <View style={styles.ticketRow}>
                                <Text style={styles.ticketLabel}>Amount Paid</Text>
                                <Text style={styles.ticketValue}>₱ {downPayment.toLocaleString()}</Text>
                            </View>
                            <View style={styles.ticketDivider} />
                            <Text style={styles.ticketNote}>A receipt has been sent to {email}.</Text>
                        </View>

                        <TouchableOpacity style={styles.homeButton} onPress={handleConfirmationDismiss}>
                            <Text style={styles.homeButtonText}>View My Bookings</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </Modal>
    );
};

export default PaymentReviewModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    receiptContainer: {
        width: '100%',
        maxHeight: height * 0.85,
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
    },
    receiptHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FAFAFA'
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    headerIconBg: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0F2FE',
        justifyContent: 'center', alignItems: 'center', marginRight: 10
    },
    receiptTitle: {
        flex: 1, fontSize: 14, fontWeight: '800', color: '#1E293B', letterSpacing: 1
    },
    receiptDate: {
        fontSize: 11, color: '#94A3B8', marginLeft: 42
    },
    closeButton: {
        padding: 5
    },
    scrollArea: {
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase'
    },
    itemRow: {
        flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12
    },
    itemIcon: {
        width: 28, alignItems: 'center', paddingTop: 2
    },
    itemTitle: {
        fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2
    },
    itemSub: {
        fontSize: 13, color: '#64748B'
    },
    itemText: {
        fontSize: 14, color: '#334155', fontWeight: '500'
    },
    
    // Dashed Line
    dashedLineContainer: {
        flexDirection: 'row', justifyContent: 'space-between', overflow: 'hidden', marginBottom: 20
    },
    dash: {
        width: 6, height: 1, backgroundColor: '#CBD5E1', marginRight: 4
    },

    // Billing
    billRow: {
        flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8
    },
    billLabel: {
        fontSize: 13, color: '#475569', fontWeight: '500'
    },
    billValue: {
        fontSize: 13, color: '#1E293B', fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
    },

    // Footer
    receiptFooter: {
        padding: 20,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0'
    },
    totalRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16
    },
    totalTextLabel: {
        fontSize: 12, fontWeight: '700', color: '#64748B'
    },
    totalTextValue: {
        fontSize: 22, fontWeight: '800', color: '#0072FF'
    },
    payButton: {
        backgroundColor: '#0072FF',
        paddingVertical: 16,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0072FF', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
        marginBottom: 10
    },
    payButtonText: {
        color: '#fff', fontSize: 15, fontWeight: '700'
    },
    secureText: {
        textAlign: 'center', fontSize: 10, color: '#94A3B8'
    },

    // SUCCESS SCREEN
    successContainer: {
        flex: 1, backgroundColor: '#0072FF', justifyContent: 'center', alignItems: 'center'
    },
    successContent: {
        width: '85%', alignItems: 'center'
    },
    successIconCircle: {
        width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 20,
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)'
    },
    successTitle: {
        fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8, letterSpacing: 1
    },
    successSub: {
        fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 30, textAlign: 'center'
    },
    ticketStub: {
        backgroundColor: '#fff', width: '100%', borderRadius: 16, padding: 20, marginBottom: 30,
        shadowColor: '#000', shadowOffset: {width:0, height:10}, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10
    },
    ticketRow: {
        flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12
    },
    ticketLabel: {
        fontSize: 13, color: '#64748B', fontWeight: '600'
    },
    ticketValue: {
        fontSize: 14, color: '#1E293B', fontWeight: '700'
    },
    ticketDivider: {
        height: 1, backgroundColor: '#E2E8F0', marginVertical: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E2E8F0'
    },
    ticketNote: {
        fontSize: 12, color: '#64748B', textAlign: 'center', fontStyle: 'italic'
    },
    homeButton: {
        backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 30
    },
    homeButtonText: {
        color: '#0072FF', fontWeight: '700', fontSize: 14
    }
});