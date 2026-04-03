import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, TextInput, Platform, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Receipt, MapPin, Calendar, CreditCard, User, Mail, Users, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api'; 
import { useAuth } from '../../context/AuthContext'; // NEW: Imported useAuth
import { buildPricingBreakdown } from '../../utils/pricingBreakdown';

const { height } = Dimensions.get('window');

const PRIMARY_COLOR = '#0072FF';
const SURFACE_COLOR = '#FFFFFF';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';

const PaymentReviewModal = ({ isModalOpen, setIsModalOpen, paymentData }) => {
    const router = useRouter();
    const { refreshUser } = useAuth();
    
    const { 
        bookingId, guide, agency, startDate, endDate,
        firstName, lastName, email, phoneNumber, country,
        basePrice, serviceFee, totalPrice: initialConfirmedPrice, 
        downPayment, balanceDue, tourCost, accomCost, extraPersonFee,
        accommodation, accommodationId, tourPackageId,
        paymentMethod, groupType, numberOfPeople,
        validIdImage, userSelfieImage, isNewKycImage,
        placeId,
        additionalGuestNames,
        packageDurationDays,
        itineraryTimeline,   
        accommodationName    
    } = paymentData || {};
    
    const isPaymentMode = !!bookingId;
    const isAgencyRequestMode = !isPaymentMode && !!agency && !guide;
    const [numPeople, setNumPeople] = useState(String(paymentData.numberOfPeople || '1')); 
    const [currentTotalPrice, setCurrentTotalPrice] = useState(parseFloat(initialConfirmedPrice || '0'));
    
    const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); 
    const [isLoading, setIsLoading] = useState(false);
    const [createdBookingId, setCreatedBookingId] = useState(null);
    const [paymentId, setPaymentId] = useState(null);
    const [isAwaitingExternalPayment, setIsAwaitingExternalPayment] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const pollingRef = useRef(null);

    const priceFloat = parseFloat(initialConfirmedPrice || '0');
    const serviceFeeFloat = parseFloat(serviceFee || '0');
    const accomCostFloat = parseFloat(accomCost || '0');
    const baseGuideFeeFloat = parseFloat(tourCost || '0');
    const dpFloat = parseFloat(downPayment || '0');
    const balFloat = parseFloat(balanceDue || '0');
    
    const calculateDays = () => {
        if (packageDurationDays) return Number(packageDurationDays);
        if (!startDate || !endDate) return 1;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.max(Math.round((end - start) / oneDay) + 1, 1);
    };
    const days = calculateDays();
    const parsedGuests = Math.max(1, Number.parseInt(numPeople, 10) || Number(numberOfPeople) || 1);

    const pricingBreakdown = React.useMemo(() => {
        return buildPricingBreakdown({
            totalPrice: currentTotalPrice,
            startDate,
            endDate,
            packageDurationDays: days,
            groupType,
            numberOfPeople: parsedGuests,
            tourCostPerDay: baseGuideFeeFloat,
            extraPersonFeePerHead: extraPersonFee,
            accommodationCostPerNight: accomCostFloat,
        });
    }, [
        currentTotalPrice,
        startDate,
        endDate,
        days,
        groupType,
        parsedGuests,
        baseGuideFeeFloat,
        extraPersonFee,
        accomCostFloat,
    ]);

    const parsedItinerary = React.useMemo(() => {
        try {
            return itineraryTimeline 
                ? (typeof itineraryTimeline === 'string' ? JSON.parse(itineraryTimeline) : itineraryTimeline) 
                : [];
        } catch (e) { return []; }
    }, [itineraryTimeline]);

    const getItineraryDisplay = () => {
        if (!startDate) return '';
        if (days <= 1) return formatDate(startDate);
        return `${formatDate(startDate)} — ${formatDate(endDate)}`;
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    useEffect(() => {
        setCurrentTotalPrice(priceFloat);
    }, [priceFloat]);
    
    const handleNumPeopleChange = (value) => {
        const num = Number(value.replace(/[^0-9]/g, '')) || 1;
        setNumPeople(num > 0 ? num.toString() : '1');
    };
    
    const showError = (message) => {
        setErrorMessage(message);
        setErrorModalVisible(true);
    };

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const startPollingPaymentStatus = (id) => {
        stopPolling();

        pollingRef.current = setInterval(async () => {
            try {
                const statusResp = await api.get(`/api/payments/status/${id}/`);
                const status = statusResp.data?.status;

                if (status === 'succeeded') {
                    stopPolling();
                    setIsAwaitingExternalPayment(false);
                    setIsSuccess(true);
                    setShowConfirmationScreen(true);
                } else if (status === 'failed' || status === 'refund_required') {
                    stopPolling();
                    setIsAwaitingExternalPayment(false);
                    setIsSuccess(false);
                    showError('Transaction Failed: The payment could not be completed.');
                }
            } catch (err) {
                console.error('Payment status polling failed:', err);
            }
        }, 3000);
    };

    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, []);

    const createBooking = async () => {
        if (!placeId) {
            throw new Error("Missing Destination (Place ID). Please go back and select a destination.");
        }

        const getExtensionFromMime = (mimeType = 'image/jpeg') => {
            const normalized = String(mimeType || 'image/jpeg').toLowerCase();
            if (normalized.includes('png')) return 'png';
            if (normalized.includes('webp')) return 'webp';
            return 'jpg';
        };

        const toUploadFile = (uri, preferredName, fallbackPrefix = 'upload', mimeType = 'image/jpeg') => {
            if (!uri || String(uri).startsWith('data:')) return null;

            const normalizedMime = mimeType || 'image/jpeg';
            const ext = getExtensionFromMime(normalizedMime);
            const hasExtension = preferredName && /\.[A-Za-z0-9]+$/.test(preferredName);
            const fileName = hasExtension ? preferredName : `${fallbackPrefix}_${Date.now()}.${ext}`;

            return {
                uri: Platform.OS === 'ios' ? String(uri).replace('file://', '') : String(uri),
                name: fileName,
                type: normalizedMime,
            };
        };

        const formatLocalDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        };

        const formData = new FormData();
        formData.append('check_in', formatLocalDate(startDate));
        formData.append('check_out', formatLocalDate(endDate));
        formData.append('num_guests', String(numPeople));
        
        if (additionalGuestNames && additionalGuestNames.length > 0) {
            formData.append('additional_guest_names', JSON.stringify(additionalGuestNames));
        }

        formData.append('total_price', String(currentTotalPrice));
        formData.append('down_payment', String(dpFloat));
        formData.append('balance_due', String(balFloat));
        
        if (guide && guide.id) {
            formData.append('guide', String(guide.id));
        } else if (agency && agency.id) {
            formData.append('agency', String(agency.id));
        } else {
             throw new Error("Guide or Agency information is missing.");
        }
        
        formData.append('destination', String(placeId));

        if (tourPackageId && tourPackageId !== 'null') {
            formData.append('tour_package_id', String(tourPackageId));
        }
        
        if (accommodationId) {
            formData.append('accommodation', String(accommodationId));
        }

        if (validIdImage && isNewKycImage) {
            const uri = String(validIdImage);
            const rawName = uri.split('/').pop() || 'tourist_valid_id';
            const uploadFile = toUploadFile(uri, rawName, 'tourist_valid_id', 'image/jpeg');
            if (!uploadFile) {
                throw new Error('Please reselect your ID image and try again.');
            }
            formData.append('tourist_valid_id_image', uploadFile);
        }

        if (userSelfieImage) {
            const uri = String(userSelfieImage);
            const rawName = uri.split('/').pop() || 'tourist_selfie';
            const uploadFile = toUploadFile(uri, rawName, 'tourist_selfie', 'image/jpeg');
            if (uploadFile) {
                formData.append('tourist_selfie_image', uploadFile);
            }
        }

        const response = await api.post('/api/bookings/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    };

    const initiateDownPayment = async (targetBookingId, amountToPay) => {
        const response = await api.post(`/api/payments/initiate/`, {
            payment_type: "Booking",
            booking_id: targetBookingId,
            payment_method: paymentMethod || 'gcash',
            final_amount: amountToPay,
        });

        if (response.data && response.data.checkout_url) {
            const id = response.data.payment_id;
            if (id) {
                setPaymentId(id);
                setIsAwaitingExternalPayment(true);
                startPollingPaymentStatus(id);
            }

            await Linking.openURL(response.data.checkout_url);
            return;
        }

        throw new Error('No checkout URL was returned for this payment.');
    };

    const handleConfirm = async () => {
        setIsLoading(true);

        try {
            if (!isPaymentMode) {
                const newBooking = await createBooking();
                setCreatedBookingId(newBooking.id);

                // Refresh profile so persisted KYC fields are available in the next booking flow.
                if (refreshUser) {
                    await refreshUser();
                }

                if (isAgencyRequestMode) {
                    setIsSuccess(true);
                    setShowConfirmationScreen(true);
                } else {
                    const payableNow = parseFloat(newBooking.down_payment || dpFloat || 0);
                    await initiateDownPayment(newBooking.id, payableNow);
                }
            } else {
                if (!bookingId) {
                    throw new Error("Missing booking ID for payment.");
                }
                await initiateDownPayment(bookingId, dpFloat);
            }
        } catch (error) {
            console.error('Payment/Booking error:', error);
            const msg = error.response?.data?.detail 
                        || error.response?.data?.message 
                        || (error.response?.data ? JSON.stringify(error.response.data) : error.message);
            showError("Transaction Failed: " + msg);
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmationDismiss = () => {
        stopPolling();
        setShowConfirmationScreen(false);
        if(setIsModalOpen) setIsModalOpen(false);
        router.replace(isSuccess ? '/(protected)/home' : '/(protected)/bookings');
    };

    const DashedLine = () => (
        <View style={styles.dashedLineContainer}>
            {[...Array(30)].map((_, i) => (
                <View key={i} style={styles.dash} />
            ))}
        </View>
    );

    const dpPercent = (currentTotalPrice > 0 && dpFloat > 0) 
        ? ((dpFloat / currentTotalPrice) * 100).toFixed(0) 
        : "30";

    return (
        <Modal visible={isModalOpen} animationType="fade" transparent={true} onRequestClose={() => setIsModalOpen(false)}>
            <View style={styles.overlay}>
                <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.6)" />
                
                <View style={styles.receiptContainer}>
                    <View style={styles.receiptHeader}>
                        <View style={styles.headerRow}>
                            <View style={styles.headerIconBg}>
                                <Receipt size={20} color="#0072FF" />
                            </View>
                            <Text style={styles.receiptTitle}>
                                {isPaymentMode ? "PAYMENT REVIEW" : "BOOKING SUMMARY"}
                            </Text>
                            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalOpen(false)}>
                                <Ionicons name="close" size={20} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.receiptDate}>{new Date().toLocaleString()}</Text>
                    </View>

                    <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>ITINERARY</Text>
                            <View style={styles.itemRow}>
                                <View style={styles.itemIcon}><Calendar size={16} color="#64748B" /></View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.itemTitle}>{getItineraryDisplay()}</Text>
                                    <Text style={styles.itemSub}>{days} Day{days > 1 ? 's' : ''} Duration</Text>
                                </View>
                            </View>
                            <View style={styles.itemRow}>
                                <View style={styles.itemIcon}><MapPin size={16} color="#64748B" /></View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.itemTitle}>{guide?.name || agency?.name || 'Selected Provider'}</Text>
                                    <Text style={styles.itemSub}>{guide ? 'Private Tour Guide' : 'Agency Partner'}</Text>
                                </View>
                            </View>

                            {(accommodation || accommodationName) && (
                                <View style={styles.itemRow}>
                                    <View style={styles.itemIcon}><Ionicons name="bed" size={16} color="#64748B" /></View>
                                    <View style={{flex: 1}}>
                                        <Text style={styles.itemTitle}>{accommodation?.title || accommodation?.name || accommodationName || 'Included Stay'}</Text>
                                        <Text style={styles.itemSub}>Accommodation</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <DashedLine />

                        {parsedItinerary && parsedItinerary.length > 0 && (
                            <>
                                <View style={styles.section}>
                                    <Text style={styles.sectionLabel}>TOUR SCHEDULE</Text>
                                    {parsedItinerary.map((dayPlan, index) => (
                                        <View key={index} style={{marginBottom: 10}}>
                                            <Text style={{fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 4}}>
                                                Day {dayPlan.day || (index + 1)}
                                            </Text>
                                            <Text style={{fontSize: 13, color: '#475569', lineHeight: 18}}>
                                                {dayPlan.activityName || dayPlan.activities || dayPlan.title || 'Tour activities for this day.'}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                                <DashedLine />
                            </>
                        )}

                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>GUEST CONFIGURATION</Text>
                            <View style={styles.interactiveRow}>
                                <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                                    <View style={styles.itemIcon}><Users size={16} color="#64748B" /></View>
                                    <Text style={styles.itemText}>Total Guests</Text>
                                </View>
                                <TextInput 
                                    style={styles.smallInput}
                                    value={numPeople}
                                    onChangeText={handleNumPeopleChange}
                                    keyboardType="numeric"
                                    editable={!isPaymentMode} 
                                />
                            </View>

                            {additionalGuestNames && additionalGuestNames.length > 0 && (
                                <View style={{marginTop: 10, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0'}}>
                                    <Text style={{fontSize: 11, color: '#64748B', fontWeight: '700', marginBottom: 6, letterSpacing: 0.5}}>ADDITIONAL GUESTS</Text>
                                    {additionalGuestNames.map((name, idx) => (
                                        <Text key={idx} style={{fontSize: 13, color: '#1E293B', fontWeight: '500', marginBottom: 2}}>
                                            • {name || `Guest ${idx + 2}`}
                                        </Text>
                                    ))}
                                    <Text style={{fontSize: 10, color: '#F59E0B', fontStyle: 'italic', marginTop: 6}}>* Valid ID required upon meetup</Text>
                                </View>
                            )}
                        </View>

                        <DashedLine />

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

                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>PAYMENT BREAKDOWN</Text>
                            
                            <View style={styles.billRow}>
                                <Text style={styles.billLabel}>Total Trip Cost</Text>
                                <Text style={styles.billValue}>₱ {currentTotalPrice.toLocaleString()}</Text>
                            </View>

                            {pricingBreakdown.hasBreakdownItems && (
                                <>
                                    <View style={styles.billSubRow}>
                                        <Text style={styles.billSubLabel}>
                                            Package ({pricingBreakdown.days} day{pricingBreakdown.days > 1 ? 's' : ''} x ₱ {pricingBreakdown.packageRatePerDay.toLocaleString()}/day)
                                        </Text>
                                        <Text style={styles.billSubValue}>₱ {pricingBreakdown.packageSubtotal.toLocaleString()}</Text>
                                    </View>

                                    {pricingBreakdown.extraGuests > 0 && pricingBreakdown.extraGuestSubtotal > 0 && (
                                        <View style={styles.billSubRow}>
                                            <Text style={styles.billSubLabel}>
                                                Extra guests ({pricingBreakdown.extraGuests} x ₱ {pricingBreakdown.extraFeePerHead.toLocaleString()} x {pricingBreakdown.days} day{pricingBreakdown.days > 1 ? 's' : ''})
                                            </Text>
                                            <Text style={styles.billSubValue}>₱ {pricingBreakdown.extraGuestSubtotal.toLocaleString()}</Text>
                                        </View>
                                    )}

                                    {pricingBreakdown.accommodationSubtotal > 0 && (
                                        <View style={styles.billSubRow}>
                                            <Text style={styles.billSubLabel}>
                                                Accommodation ({pricingBreakdown.nights} night{pricingBreakdown.nights > 1 ? 's' : ''} x ₱ {pricingBreakdown.accommodationRatePerNight.toLocaleString()}/night)
                                            </Text>
                                            <Text style={styles.billSubValue}>₱ {pricingBreakdown.accommodationSubtotal.toLocaleString()}</Text>
                                        </View>
                                    )}

                                    {pricingBreakdown.hasAdjustment && (
                                        <View style={styles.billSubRow}>
                                            <Text style={styles.billSubLabel}>Adjustment</Text>
                                            <Text style={styles.billSubValue}>
                                                {pricingBreakdown.adjustmentAmount >= 0 ? '₱ ' : '- ₱ '}
                                                {Math.abs(pricingBreakdown.adjustmentAmount).toLocaleString()}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}

                            {dpFloat > 0 && (
                                <>
                                    <View style={styles.billRow}>
                                        <Text style={styles.billLabel}>Down Payment ({dpPercent}%)</Text>
                                        <Text style={[styles.billValue, { color: '#0072FF', fontWeight: '700' }]}>
                                            ₱ {dpFloat.toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={styles.billRow}>
                                        <Text style={styles.billLabel}>Balance (Pay Later)</Text>
                                        <Text style={[styles.billValue, { color: '#94A3B8' }]}>
                                            ₱ {balFloat.toLocaleString()}
                                        </Text>
                                    </View>
                                </>
                            )}
                            
                            {!isPaymentMode && (
                                <Text style={{fontSize: 11, color: TEXT_SECONDARY, marginTop: 12, fontStyle: 'italic', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8}}>
                                    {isAgencyRequestMode
                                        ? '* Completing this step submits your request to the agency for approval.'
                                        : '* Completing this step confirms your booking and securely processes your down payment.'}
                                </Text>
                            )}
                        </View>

                    </ScrollView>

                    <View style={styles.receiptFooter}>
                        {isAwaitingExternalPayment && (
                            <View style={styles.pendingInfoBox}>
                                <Text style={styles.pendingInfoTitle}>Waiting for payment confirmation...</Text>
                                <Text style={styles.pendingInfoText}>
                                    Return to this app after paying in PayMongo. We will auto-update this screen once the payment is verified.
                                </Text>
                                {paymentId && (
                                    <Text style={styles.pendingInfoRef}>Payment Ref: #{paymentId}</Text>
                                )}
                            </View>
                        )}
                        <TouchableOpacity 
                            style={[styles.payButton, isLoading && { opacity: 0.8 }]} 
                            onPress={handleConfirm}
                            disabled={isLoading || isAwaitingExternalPayment}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <CreditCard size={18} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.payButtonText}>
                                        {isAwaitingExternalPayment
                                            ? 'Processing Payment...'
                                            : (isAgencyRequestMode
                                                ? 'Submit Request'
                                                : `Pay ₱ ${dpFloat.toLocaleString()} Now`)}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.secureText}>
                            <Ionicons name="lock-closed" size={10} color="#94A3B8" /> Secure 256-bit SSL Encrypted Payment
                        </Text>
                    </View>
                </View>
            </View>

            <Modal visible={errorModalVisible} transparent={true} animationType="fade">
                <View style={styles.errorOverlay}>
                    <View style={styles.errorCard}>
                        <View style={styles.errorIconBox}>
                            <AlertCircle size={32} color="#EF4444" />
                        </View>
                        <Text style={styles.errorTitle}>Oops!</Text>
                        <Text style={styles.errorMessage}>{errorMessage}</Text>
                        <TouchableOpacity style={styles.errorButton} onPress={() => setErrorModalVisible(false)}>
                            <Text style={styles.errorButtonText}>Okay, Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

             <Modal visible={showConfirmationScreen} animationType="slide">
                <SafeAreaView style={[styles.successContainer, !isSuccess && {backgroundColor: '#EF4444'}]}>
                    <View style={styles.successContent}>
                        <View style={styles.successIconCircle}>
                            <Ionicons name={isSuccess ? "checkmark" : "close"} size={60} color="#fff" />
                        </View>
                        <Text style={styles.successTitle}>
                            {isSuccess
                                ? (isAgencyRequestMode ? "REQUEST SUBMITTED" : "PAYMENT SUCCESS")
                                : "PAYMENT FAILED"}
                        </Text>
                        <Text style={styles.successSub}>
                            {isSuccess
                                ? (isAgencyRequestMode
                                    ? "Your agency booking request has been sent successfully."
                                    : "Your booking has been secured.")
                                : "Please check your details and try again."}
                        </Text>
                        
                        {isSuccess && (
                            <View style={styles.ticketStub}>
                                <View style={styles.ticketRow}>
                                    <Text style={styles.ticketLabel}>Ref Number</Text>
                                    <Text style={styles.ticketValue}>#{bookingId || createdBookingId}</Text>
                                </View>
                                <View style={styles.ticketRow}>
                                    <Text style={styles.ticketLabel}>Amount Paid</Text>
                                    <Text style={styles.ticketValue}>
                                        {isAgencyRequestMode ? "Pending agency approval" : `₱${dpFloat.toLocaleString()}`}
                                    </Text>
                                </View>
                                <View style={styles.ticketRow}>
                                    <Text style={styles.ticketLabel}>Status</Text>
                                    <Text style={[styles.ticketValue, {color: '#22C55E'}]}>
                                        {isAgencyRequestMode ? 'Requested' : 'Confirmed'}
                                    </Text>
                                </View>
                                <View style={styles.ticketDivider} />
                                <Text style={styles.ticketNote}>A copy of this receipt has been sent to your email.</Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.homeButton} onPress={handleConfirmationDismiss}>
                            <Text style={[styles.homeButtonText, !isSuccess && {color: '#EF4444'}]}>
                                {isSuccess ? "Return Home" : "Try Again"}
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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    receiptContainer: { width: '100%', maxHeight: height * 0.85, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
    receiptHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FAFAFA' },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    headerIconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    receiptTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: '#1E293B', letterSpacing: 1 },
    receiptDate: { fontSize: 11, color: '#94A3B8', marginLeft: 42 },
    closeButton: { padding: 5 },
    scrollArea: { padding: 20 },
    section: { marginBottom: 20 },
    sectionLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' },
    itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    interactiveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    itemIcon: { width: 28, alignItems: 'center', paddingTop: 2 },
    itemTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
    itemSub: { fontSize: 13, color: '#64748B' },
    itemText: { fontSize: 14, color: '#334155', fontWeight: '500' },
    smallInput: { width: 60, height: 36, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, textAlign: 'center', fontSize: 14, fontWeight: '700', color: '#1E293B', backgroundColor: '#F8FAFC' },
    dashedLineContainer: { flexDirection: 'row', justifyContent: 'space-between', overflow: 'hidden', marginBottom: 20 },
    dash: { width: 6, height: 1, backgroundColor: '#CBD5E1', marginRight: 4 },
    billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    billLabel: { fontSize: 13, color: '#475569', fontWeight: '500' },
    billValue: { fontSize: 13, color: '#1E293B', fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    billSubRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingLeft: 20 },
    billSubLabel: { flex: 1, marginRight: 10, fontSize: 12, color: '#64748B', fontWeight: '500' },
    billSubValue: { fontSize: 12, color: '#1E293B', fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    receiptFooter: { padding: 20, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    pendingInfoBox: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 12, padding: 12, marginBottom: 10 },
    pendingInfoTitle: { fontSize: 12, fontWeight: '700', color: '#1D4ED8', marginBottom: 4 },
    pendingInfoText: { fontSize: 11, color: '#1E3A8A', lineHeight: 16 },
    pendingInfoRef: { marginTop: 6, fontSize: 11, color: '#1E40AF', fontWeight: '700' },
    payButton: { backgroundColor: '#0072FF', paddingVertical: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#0072FF', shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginBottom: 10 },
    payButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    secureText: { textAlign: 'center', fontSize: 10, color: '#94A3B8' },
    successContainer: { flex: 1, backgroundColor: '#0072FF', justifyContent: 'center', alignItems: 'center' },
    successContent: { width: '85%', alignItems: 'center' },
    successIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
    successTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8, letterSpacing: 1 },
    successSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 30, textAlign: 'center' },
    ticketStub: { backgroundColor: '#fff', width: '100%', borderRadius: 16, padding: 20, marginBottom: 30, shadowColor: '#000', shadowOffset: {width:0, height:10}, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
    ticketRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    ticketLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
    ticketValue: { fontSize: 14, color: '#1E293B', fontWeight: '700' },
    ticketDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E2E8F0' },
    ticketNote: { fontSize: 12, color: '#64748B', textAlign: 'center', fontStyle: 'italic' },
    homeButton: { backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 30 },
    homeButtonText: { color: '#0072FF', fontWeight: '700', fontSize: 14 },
    errorOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    errorCard: { width: '85%', backgroundColor: SURFACE_COLOR, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10 },
    errorIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    errorTitle: { fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 8 },
    errorMessage: { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    errorButton: { backgroundColor: '#EF4444', paddingVertical: 12, width: '100%', alignItems: 'center', borderRadius: 12 },
    errorButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});