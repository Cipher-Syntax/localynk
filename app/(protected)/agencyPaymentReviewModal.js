import React, { useState, useEffect } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, TextInput, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Receipt, MapPin, Calendar, CreditCard, User, Mail, Users, AlertCircle, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api'; 

const { height } = Dimensions.get('window');

const BASE_PEOPLE_INCLUDED = 1; 
const ADDITIONAL_PER_PERSON_FEE = 50.00;
const PRIMARY_COLOR = '#0072FF';
const SURFACE_COLOR = '#FFFFFF';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';

const AgencyPaymentReviewModal = ({ isModalOpen, setIsModalOpen, paymentData }) => {
    const router = useRouter();
    const { 
        bookingId, guideName,
        agency, startDate, endDate,
        firstName, lastName, email, phoneNumber, country,
        totalPrice: initialConfirmedPrice, 
        numberOfPeople,
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
        const peopleCount = parseInt(numPeople);
        const extraPeople = Math.max(0, peopleCount - BASE_PEOPLE_INCLUDED);
        const addedFee = extraPeople * ADDITIONAL_PER_PERSON_FEE;
        const newTotal = priceFloat + addedFee;
        setCurrentTotalPrice(newTotal);
    }, [numPeople, priceFloat]);
    
    const extraPeopleCount = Math.max(0, parseInt(numPeople) - BASE_PEOPLE_INCLUDED);
    const addedFeeAmount = extraPeopleCount * ADDITIONAL_PER_PERSON_FEE;
    
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
                // --- MODE 1: CREATE REQUEST ---
                const newBooking = await createBooking();
                setCreatedBookingId(newBooking.id);
                setIsSuccess(true);
                setShowConfirmationScreen(true);
            } else {
                // --- MODE 2: PROCESS PAYMENT ---
                if (!bookingId) {
                    throw new Error("Missing booking ID for payment.");
                }
                // Simulate Payment processing
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

    return (
        <Modal visible={isModalOpen} animationType="fade" transparent={true} onRequestClose={() => setIsModalOpen(false)}>
            <View style={styles.overlay}>
                <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.6)" />
                
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
                                <Text style={styles.billLabel}>Agency Base Price</Text>
                                <Text style={styles.billValue}>₱ {priceFloat.toLocaleString()}</Text>
                            </View>

                            {addedFeeAmount > 0 && (
                                <View style={styles.billRow}>
                                    <Text style={[styles.billLabel, {color:'#EF4444'}]}>Extra Guest Fee</Text>
                                    <Text style={[styles.billValue, {color:'#EF4444'}]}>+ ₱ {addedFeeAmount.toLocaleString()}</Text>
                                </View>
                            )}
                            
                            <View style={[styles.billRow, {marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9'}]}>
                                <Text style={[styles.billLabel, {fontWeight: '700', color: TEXT_PRIMARY}]}>Total Amount</Text>
                                <Text style={[styles.billValue, {fontSize: 16, color: PRIMARY_COLOR}]}>₱ {currentTotalPrice.toLocaleString()}</Text>
                            </View>

                            {!isPaymentMode && (
                                <Text style={{fontSize: 11, color: TEXT_SECONDARY, marginTop: 8, fontStyle: 'italic'}}>
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
                                        {isPaymentMode ? "Confirm & Pay" : "Submit Request"}
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
                <SafeAreaView style={[styles.successContainer, !isSuccess && {backgroundColor: '#EF4444'}]}>
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
    receiptFooter: { padding: 20, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
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