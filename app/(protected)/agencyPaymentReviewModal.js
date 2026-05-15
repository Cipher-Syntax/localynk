import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Receipt, MapPin, Calendar, CreditCard, User, Mail, Users, AlertCircle, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api'; 

import { styles } from './styles/agencyPaymentReviewModal';

const TEXT_SECONDARY = '#64748B';

const AgencyPaymentReviewModal = ({ isModalOpen, setIsModalOpen, paymentData }) => {
    const router = useRouter();
    const { 
        bookingId, guideName,
        agency, startDate, endDate,
        firstName, lastName, email,
        totalPrice: initialConfirmedPrice, 
        downPayment, balanceDue, 
        additionalGuestNames,
        validIdImage, userSelfieImage, isNewKycImage,
        placeId
    } = paymentData || {};
    
    const isPaymentMode = !!bookingId;
    const [numPeople, setNumPeople] = useState(String(paymentData.numberOfPeople || '1')); 
    const [currentTotalPrice, setCurrentTotalPrice] = useState(parseFloat(initialConfirmedPrice || '0'));
    
    const [showConfirmationScreen, setShowConfirmationScreen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); 
    const [isLoading, setIsLoading] = useState(false);
    const [createdBookingId, setCreatedBookingId] = useState(null);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const priceFloat = parseFloat(initialConfirmedPrice || '0');
    
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

    const createBooking = async () => {
        if (!placeId) {
            throw new Error("Missing Destination (Place ID). Please go back and select a destination.");
        }

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
        
        // --- NEW: Add guest names ---
        if (additionalGuestNames && additionalGuestNames.length > 0) {
            formData.append('additional_guest_names', JSON.stringify(additionalGuestNames));
        }

        if (agency && agency.id) {
            formData.append('agency', String(agency.id));
        } else {
             throw new Error("Agency information is missing.");
        }
        
        formData.append('destination', String(placeId));

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
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    };

    const handleConfirm = async () => {
        setIsLoading(true);

        try {
            if (!isPaymentMode) {
                const newBooking = await createBooking();
                setCreatedBookingId(newBooking.id);
                setIsSuccess(true);
                setShowConfirmationScreen(true);
            } else {
                if (!bookingId) {
                    throw new Error("Missing booking ID for payment.");
                }
                await new Promise(resolve => setTimeout(resolve, 2000));
                setIsSuccess(true);
                setShowConfirmationScreen(true);
            }
        } catch (error) {
            console.error('Operation error:', error);
            const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            showError("Request Failed: " + msg);
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmationDismiss = () => {
        setShowConfirmationScreen(false);
        if(setIsModalOpen) setIsModalOpen(false);
        router.replace(isSuccess ? '/(protected)/home' : '/(protected)/notifications');
    };

    const DashedLine = () => (
        <View style={styles.dashedLineContainer}>
            {[...Array(30)].map((_, i) => (
                <View key={i} style={styles.dash} />
            ))}
        </View>
    );

    const dpPercent = (currentTotalPrice > 0 && downPayment > 0)
        ? ((downPayment / currentTotalPrice) * 100).toFixed(0) 
        : "30";

    return (
        <Modal visible={isModalOpen} animationType="fade" transparent={true} onRequestClose={() => setIsModalOpen(false)}>
            <View style={styles.overlay}>
                
                <View style={styles.receiptContainer}>
                    <View style={styles.receiptHeader}>
                        <View style={styles.headerRow}>
                            <View style={styles.headerIconBg}>
                                {isPaymentMode ? <Receipt size={20} color="#0072FF" /> : <Send size={20} color="#0072FF" />}
                            </View>
                            <Text style={styles.receiptTitle}>
                                {isPaymentMode ? "PAYMENT REVIEW" : "CONFIRM REQUEST"}
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
                                    <Text style={styles.itemTitle}>{formatDate(startDate)} — {formatDate(endDate)}</Text>
                                    <Text style={styles.itemSub}>{days} Day{days > 1 ? 's' : ''} Duration</Text>
                                </View>
                            </View>
                            <View style={styles.itemRow}>
                                <View style={styles.itemIcon}><MapPin size={16} color="#64748B" /></View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.itemTitle}>{agency?.name || 'Selected Agency'}</Text>
                                    <Text style={styles.itemSub}>{guideName ? `Guide: ${guideName}` : 'Agency Team Assigned'}</Text>
                                </View>
                            </View>
                        </View>

                        <DashedLine />

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

                            {/* --- NEW: RENDER ADDITIONAL GUEST NAMES --- */}
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
                            <Text style={styles.sectionLabel}>{isPaymentMode ? "BILLED TO" : "REQUESTER"}</Text>
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
                            
                            {downPayment > 0 && (
                                <>
                                    <View style={styles.billRow}>
                                        <Text style={styles.billLabel}>Down Payment ({dpPercent}%)</Text>
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
                            )}

                            {!isPaymentMode && (
                                <Text style={{fontSize: 11, color: TEXT_SECONDARY, marginTop: 12, fontStyle: 'italic', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8}}>
                                    * Payment is collected only after the agency accepts your request.
                                </Text>
                            )}
                        </View>

                    </ScrollView>

                    <View style={styles.receiptFooter}>
                        <TouchableOpacity 
                            style={[styles.payButton, isLoading && { opacity: 0.8 }]} 
                            onPress={handleConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    {isPaymentMode ? <CreditCard size={18} color="#fff" style={{ marginRight: 8 }} /> : <Send size={18} color="#fff" style={{ marginRight: 8 }} />}
                                    <Text style={styles.payButtonText}>
                                        {isPaymentMode ? `Pay ₱${downPayment.toLocaleString()}` : "Submit Request"}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.secureText}>
                            {isPaymentMode 
                                ? <><Ionicons name="lock-closed" size={10} color="#94A3B8" /> Secure 256-bit SSL Encrypted Payment</>
                                : "Your request will be sent to the agency immediately."
                            }
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
                            {isSuccess ? (isPaymentMode ? "PAYMENT SUCCESS" : "REQUEST SUBMITTED") : "FAILED"}
                        </Text>
                        <Text style={styles.successSub}>
                            {isSuccess 
                                ? (isPaymentMode ? "Your booking has been secured." : "The agency will review your request.") 
                                : "Please check your details and try again."}
                        </Text>
                        
                        {isSuccess && (
                            <View style={styles.ticketStub}>
                                <View style={styles.ticketRow}>
                                    <Text style={styles.ticketLabel}>Ref Number</Text>
                                    <Text style={styles.ticketValue}>#{bookingId || createdBookingId || "PENDING"}</Text>
                                </View>
                                <View style={styles.ticketRow}>
                                    <Text style={styles.ticketLabel}>Status</Text>
                                    <Text style={[styles.ticketValue, {color: isPaymentMode ? '#22C55E' : '#EAB308'}]}>
                                        {isPaymentMode ? "Confirmed" : "Pending Approval"}
                                    </Text>
                                </View>
                                <View style={styles.ticketDivider} />
                                <Text style={styles.ticketNote}>
                                    {isPaymentMode ? "Receipt sent to email." : "You will be notified once approved."}
                                </Text>
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

export default AgencyPaymentReviewModal;
