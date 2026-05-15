import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Receipt, Calendar, CreditCard, User, Mail, Users, AlertCircle, Phone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api'; 
import { useAuth } from '../../context/AuthContext';
import { buildPricingBreakdown } from '../../utils/pricingBreakdown';
import { styles } from './styles/paymentReviewModal.styles';

const TEXT_SECONDARY = '#64748B';

const PaymentReviewModal = ({ isModalOpen, setIsModalOpen, paymentData }) => {
    const router = useRouter();
    const { refreshUser } = useAuth();
    
    const { 
        bookingId, guide, agency, startDate, endDate,
        firstName, lastName, email, phoneNumber, totalPrice: initialConfirmedPrice, 
        downPayment, balanceDue, tourCost, accomCost, extraPersonFee,
        accommodation, accommodationId, tourPackageId,
        paymentMethod, groupType, numberOfPeople,
        validIdImage, userSelfieImage, isNewKycImage,
        placeId,
        additionalGuestNames,
        packageDurationDays,
        itineraryTimeline,   
        accommodationName,
        isSkipProviderMode
    } = paymentData || {};
    
    const isPaymentMode = !!bookingId;
    const isAgencyRequestMode = !isPaymentMode && !!agency && !guide && !isSkipProviderMode;
    const [numPeople, setNumPeople] = useState(String(paymentData?.numberOfPeople || '1')); 
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
        } catch (_e) { return []; }
    }, [itineraryTimeline]);

    const groupedItinerary = React.useMemo(() => {
        if (!Array.isArray(parsedItinerary) || parsedItinerary.length === 0) return [];

        const dayBuckets = new Map();

        const getDayNumber = (value, fallbackDay) => {
            const parsed = Number.parseInt(value, 10);
            return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackDay;
        };

        const pushActivity = (day, activity) => {
            const label = String(activity || '').trim();
            if (!label) return;
            if (!dayBuckets.has(day)) {
                dayBuckets.set(day, []);
            }
            dayBuckets.get(day).push(label);
        };

        parsedItinerary.forEach((entry, index) => {
            const day = getDayNumber(entry?.day, index + 1);

            if (Array.isArray(entry?.activities)) {
                entry.activities.forEach((item) => {
                    if (typeof item === 'string') {
                        pushActivity(day, item);
                    } else if (item && typeof item === 'object') {
                        pushActivity(day, item.activityName || item.title || item.name || item.activity);
                    }
                });
            }

            if (typeof entry?.activities === 'string') {
                pushActivity(day, entry.activities);
            }

            if (typeof entry === 'string') {
                pushActivity(day, entry);
            } else {
                pushActivity(day, entry?.activityName);
                pushActivity(day, entry?.title);
            }
        });

        return Array.from(dayBuckets.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([day, activities]) => {
                const uniqueActivities = [...new Set(activities)];
                return {
                    day,
                    activities: uniqueActivities.length > 0
                        ? uniqueActivities
                        : ['Tour activities for this day.'],
                };
            });
    }, [parsedItinerary]);

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

    const handleCloseModal = () => {
        stopPolling();
        setIsModalOpen(false);
        if (createdBookingId && !isPaymentMode) {
            router.replace('/(protected)/bookings');
        }
    };

    const startPollingPaymentStatus = (id) => {
        stopPolling();

        pollingRef.current = setInterval(async () => {
            try {
                const statusResp = await api.get(`/api/payments/status/${id}/`);
                const status = statusResp.data?.status;

                if (status === 'succeeded' || status === 'paid') {
                    stopPolling();
                    setIsAwaitingExternalPayment(false);
                    setIsSuccess(true);
                    setShowConfirmationScreen(true);
                } else if (status === 'failed' || status === 'refund_required' || status === 'cancelled' || status === 'expired') {
                    stopPolling();
                    setIsAwaitingExternalPayment(false);
                    setIsSuccess(false);
                    setShowConfirmationScreen(true); 
                }
            } catch (err) {
                console.error('Payment status polling failed:', err);
            }
        }, 1000);
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
        } else if (!isSkipProviderMode) {
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
            if (isAgencyRequestMode || isSkipProviderMode) {
                if (!createdBookingId) {
                    const newBooking = await createBooking();
                    setCreatedBookingId(newBooking.id);
                    if (refreshUser) await refreshUser();
                }
                setIsSuccess(true);
                setShowConfirmationScreen(true);
                return;
            }

            // Figure out which Booking ID to pay for
            let targetBookingId = bookingId;

            if (!isPaymentMode) {
                if (!createdBookingId) {
                    // Create booking for the FIRST TIME
                    const newBooking = await createBooking();
                    setCreatedBookingId(newBooking.id);
                    targetBookingId = newBooking.id;
                    if (refreshUser) await refreshUser();
                } else {
                    // Booking was already created, but payment failed earlier and they clicked "Pay" again
                    targetBookingId = createdBookingId;
                }
            }

            if (!targetBookingId) {
                throw new Error("Missing booking ID for payment.");
            }

            await initiateDownPayment(targetBookingId, dpFloat);
            
        } catch (error) {
            console.error('Payment/Booking error:', error);
            
            let errorMsg = "An unexpected error occurred.";
            
            if (error.response?.data) {
                const responseData = error.response.data;
                
                // Check if Django sent back a massive HTML debug page
                if (typeof responseData === 'string' && responseData.includes('DEBUG = True')) {
                    // Extract the specific Python exception from the HTML title
                    const titleMatch = responseData.match(/<title>(.*?)<\/title>/i);
                    if (titleMatch && titleMatch[1]) {
                        errorMsg = "Backend Crash: " + titleMatch[1].replace('Django Error', '').trim();
                    } else {
                        errorMsg = "Server crashed (500 Error). Please check your Django terminal.";
                    }
                } else {
                    // It's a normal JSON error
                    errorMsg = responseData.detail || responseData.message || JSON.stringify(responseData);
                }
            } else {
                errorMsg = error.message;
            }
            
            showError("Transaction Failed: \n" + errorMsg);
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    // Redirects user properly based on success/fail
    const handleConfirmationDismiss = () => {
        stopPolling();
        setShowConfirmationScreen(false);
        if(setIsModalOpen) setIsModalOpen(false);
        
        if (isSuccess) {
            router.replace('/(protected)/home');
        } else {
            // If failed, but we DID save the booking, go to Bookings
            if (createdBookingId || isPaymentMode) {
                router.replace('/(protected)/bookings');
            }
        }
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
        <Modal visible={isModalOpen} animationType="fade" transparent={true} onRequestClose={handleCloseModal}>
            <View style={styles.overlay}>
                
                <View style={styles.receiptContainer}>
                    <View style={styles.receiptHeader}>
                        <View style={styles.headerRow}>
                            <View style={styles.headerIconBg}>
                                <Receipt size={20} color="#0072FF" />
                            </View>
                            <Text style={styles.receiptTitle}>
                                {isPaymentMode ? "PAYMENT REVIEW" : "BOOKING SUMMARY"}
                            </Text>
                            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
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
                            <View style={styles.ticketRow}>
                                <Text style={styles.ticketLabel}>Amount Paid</Text>
                                <Text style={styles.ticketValue}>
                                    {isSkipProviderMode ? "Free" : (isAgencyRequestMode ? "Pending agency approval" : `₱${dpFloat.toLocaleString()}`)}
                                </Text>
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

                        {groupedItinerary.length > 0 && (
                            <>
                                <View style={styles.section}>
                                    <Text style={styles.sectionLabel}>TOUR SCHEDULE</Text>
                                    {groupedItinerary.map((dayPlan) => (
                                        <View key={`day-${dayPlan.day}`} style={styles.scheduleDayGroup}>
                                            <Text style={styles.scheduleDayTitle}>
                                                Day {dayPlan.day}
                                            </Text>
                                            {dayPlan.activities.map((activity, index) => (
                                                <Text key={`day-${dayPlan.day}-activity-${index}`} style={styles.scheduleActivity}>
                                                    - {activity}
                                                </Text>
                                            ))}
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
                            <View style={styles.itemRow}>
                                <View style={styles.itemIcon}><Phone size={16} color="#64748B" /></View>
                                <Text style={styles.itemText}>{phoneNumber || 'No phone number provided'}</Text>
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
                                
                                {/* I'll Pay Later Button */}
                                <TouchableOpacity 
                                    style={styles.payLaterButton}
                                    onPress={handleCloseModal}
                                >
                                    <Text style={styles.payLaterText}>I&apos;ll pay later / Cancel</Text>

                                    <Text style={{ fontSize: 10, color: '#1D4ED8', fontWeight: '600' }}>Note: You only have 30 minutes to pay before this is cancelled</Text>
                                </TouchableOpacity>
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
                                            : (isAgencyRequestMode || isSkipProviderMode
                                                ? 'Confirm Booking'
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
                <SafeAreaView edges={['bottom']} style={[styles.successContainer, !isSuccess && {backgroundColor: '#EF4444'}]}>
                    <View style={styles.successContent}>
                        <View style={styles.successIconCircle}>
                            <Ionicons name={isSuccess ? "checkmark" : "close"} size={60} color="#fff" />
                        </View>
                        <Text style={styles.successTitle}>
                            {isSuccess
                                ? (isAgencyRequestMode ? "REQUEST SUBMITTED" : (isSkipProviderMode ? "BOOKING CONFIRMED" : "PAYMENT SUCCESS"))
                                : "PAYMENT FAILED"}
                        </Text>
                        <Text style={styles.successSub}>
                            {isSuccess
                                ? (isAgencyRequestMode
                                    ? "Your agency booking request has been sent successfully."
                                    : "Your booking has been secured.")
                                : ((createdBookingId || isPaymentMode) 
                                    ? "Payment failed or was cancelled. Your booking is saved as 'Pending'. You can retry paying from your Bookings." 
                                    : "Please check your details and try again.")}
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
                                        {isSkipProviderMode ? "Free" : (isAgencyRequestMode ? "Pending agency approval" : `₱${dpFloat.toLocaleString()}`)}
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
                                {isSuccess ? "Return Home" : ((createdBookingId || isPaymentMode) ? "View Bookings" : "Try Again")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </Modal>
    );
};

export default PaymentReviewModal;
