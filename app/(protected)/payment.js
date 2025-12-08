import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StatusBar, StyleSheet, Image, TextInput, TouchableOpacity, Pressable, ActivityIndicator, Alert, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PaymentReviewModal } from '../../components/payment';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const { width } = Dimensions.get('window');

const Payment = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const {
        entityName,
        guideName,
        placeName,
        bookingId,
        entityId,
        guideId,
        bookingType,
        assignedGuides, 
        basePrice,
        soloPrice,
        accommodationPrice,
        accommodationId,
        accommodationName,
        additionalFee,
        placeId,
        tourPackageId // <--- 1. ADDED THIS
    } = params;

    const isConfirmed = !!bookingId;
    const isAgency = bookingType === 'agency';
    const resolvedName = entityName || guideName || (isAgency ? "Selected Agency" : "Selected Guide");
    const resolvedId = entityId || guideId;

    const [guideAvailability, setGuideAvailability] = useState(null);
    
    const [assignedGuidesList, setAssignedGuidesList] = useState(() => {
        try {
            return assignedGuides && typeof assignedGuides === 'string' ? JSON.parse(assignedGuides) : [];
        } catch (e) {
            return [];
        }
    });

    const [assignedAgencyGuidesList, setAssignedAgencyGuidesList] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [selectingType, setSelectingType] = useState('start');
    const [isLoadingImage, setIsLoadingImage] = useState(false);

    // --- PRICE COMPONENTS ---
    const tourCostGroup = basePrice ? parseFloat(basePrice) : 500;
    const tourCostSolo = soloPrice ? parseFloat(soloPrice) : tourCostGroup; // Fallback to group if no solo price
    
    const accomCost = accommodationPrice ? parseFloat(accommodationPrice) : 0;
    const extraPersonFee = additionalFee ? parseFloat(additionalFee) : 0;
    
    // --- UPDATED BOOKING ENTITY FOR DISPLAY ---
    const bookingEntity = {
        id: resolvedId,
        name: resolvedName,
        purpose: placeName ? `Tour at ${placeName}` : "Private Tour",
        address: isAgency ? "Verified Agency" : "Local Guide",
        basePrice: tourCostGroup, 
        serviceFee: 50,
    };
    
    const accomEntity = accommodationId ? {
        name: accommodationName || "Selected Accommodation",
        price: accomCost
    } : null;

    const formatDateForCalendar = (date) => date.toISOString().split('T')[0];

    const getImageUrl = (imgPath) => {
        if (!imgPath || imgPath.startsWith('http') || imgPath.startsWith('file://')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000';
        return `${base}${imgPath}`;
    };

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [selectedOption, setSelectedOption] = useState('solo');
    const [numPeople, setNumPeople] = useState('1');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [country, setCountry] = useState('');
    const [email, setEmail] = useState('');
    
    const [validIdImage, setValidIdImage] = useState(null);
    const [userSelfieImage, setUserSelfieImage] = useState(null);

    const [totalPrice, setTotalPrice] = useState(0);
    const [currentGuideFee, setCurrentGuideFee] = useState(0);

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('gcash');
    const paymentOptions = [
        { key: 'gcash', name: 'GCash' },
        { key: 'paymaya', name: 'Maya' },
        { key: 'card', name: 'Card' },
        { key: 'grab_pay', name: 'GrabPay' },
        { key: 'shopeepay', name: 'Shopee' },
    ];

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setEmail(user.email || '');
            setPhoneNumber(user.phone_number || '');
            setCountry(user.location || '');
            if (user.valid_id_image) {
                setValidIdImage(getImageUrl(user.valid_id_image));
            }
        }
    }, [user]);

    useEffect(() => {
        const fetchGuideAvailability = async () => {
            if (!isAgency && resolvedId) {
                try {
                    const response = await api.get(`/api/guides/${resolvedId}/`);
                    setGuideAvailability(response.data);
                } catch (error) {
                    console.error("Failed to fetch guide availability:", error);
                }
            }
        };
        fetchGuideAvailability();
    }, [resolvedId, isAgency]);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (isConfirmed && bookingId) {
                try {
                    const response = await api.get(`/api/bookings/${bookingId}/`);
                    const bookingDetails = response.data;
                    
                    if (bookingDetails.check_in) setStartDate(new Date(bookingDetails.check_in));
                    if (bookingDetails.check_out) setEndDate(new Date(bookingDetails.check_out));
                    if (bookingDetails.num_guests) {
                        setNumPeople(String(bookingDetails.num_guests));
                        setSelectedOption(bookingDetails.num_guests > 1 ? 'group' : 'solo');
                    }
                    
                    if (bookingDetails.assigned_guides_detail) {
                        setAssignedGuidesList(bookingDetails.assigned_guides_detail);
                    }
                    
                    if (isAgency && bookingDetails.assigned_agency_guides_detail) {
                        setAssignedAgencyGuidesList(bookingDetails.assigned_agency_guides_detail);
                    }

                } catch (error) {
                    console.error("Failed to fetch booking details:", error);
                }
            }
        };
        fetchBookingDetails();
    }, [isConfirmed, bookingId, isAgency]);

    const getMarkedDates = useMemo(() => {
        const marked = {};
        const startCalc = new Date();
        const endCalc = new Date();
        endCalc.setFullYear(startCalc.getFullYear() + 1);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const specificDates = guideAvailability?.specific_available_dates || [];
        const recurringDays = guideAvailability?.available_days || [];

        for (let d = new Date(startCalc); d <= endCalc; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (dateStr < new Date().toISOString().split('T')[0]) {
                marked[dateStr] = { disabled: true, disableTouchEvent: true, textColor: '#d9d9d9' };
                continue;
            }
            if (isAgency) {
                marked[dateStr] = { disabled: false, textColor: '#1A2332' };
            } else {
                const dayName = dayNames[d.getDay()];
                const isSpecific = specificDates.includes(dateStr);
                const isRecurring = recurringDays.includes("All") || recurringDays.includes(dayName);
                if (isSpecific || isRecurring) {
                    marked[dateStr] = { disabled: false, textColor: '#1A2332' };
                } else {
                    marked[dateStr] = { disabled: true, disableTouchEvent: true, textColor: '#d9d9d9', color: '#f9f9f9' };
                }
            }
        }
        const startStr = formatDateForCalendar(startDate);
        const endStr = formatDateForCalendar(endDate);
        if (marked[startStr]) marked[startStr] = { ...marked[startStr], selected: true, selectedColor: '#00A8FF', textColor: '#fff' };
        if (marked[endStr]) marked[endStr] = { ...marked[endStr], selected: true, selectedColor: '#00A8FF', textColor: '#fff' };
        return marked;
    }, [guideAvailability, startDate, endDate, isAgency]);

    const openCalendar = (type) => {
        setSelectingType(type);
        setCalendarVisible(true);
    };

    const onDayPress = (day) => {
        const selectedDate = new Date(day.dateString);
        if (selectingType === 'start') {
            setStartDate(selectedDate);
            if (selectedDate > endDate) setEndDate(selectedDate);
        } else {
            if (selectedDate < startDate) {
                Alert.alert("Invalid Date", "End date cannot be before start date.");
                return;
            }
            setEndDate(selectedDate);
        }
        setCalendarVisible(false);
    };

    const pickImage = async () => {
        setIsLoadingImage(true);
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            aspect: [4, 3],
            quality: 1
        });
        if (!result.canceled) setValidIdImage(result.assets[0].uri);
        setIsLoadingImage(false);
    };

    const takeSelfie = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert("Permission Denied", "Camera permission is required to take a selfie.");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            cameraType: ImagePicker.CameraType.front,
        });

        if (!result.canceled) {
            setUserSelfieImage(result.assets[0].uri);
        }
    };

    const handleReviewPress = () => {
        // --- 🟢 DEBUGGING ---
        console.log("\n--- 🛠️ DEBUG: Payment.js - Review Pressed ---");
        console.log("3. Financials:", { 
            totalPrice, 
            currentGuideFee, 
            extraPersonFee, 
            accomCost 
        });
        console.log("4. Accommodation:", { 
            id: accommodationId, 
            name: accommodationName 
        });
        console.log("5. Tour Package:", {
            id: tourPackageId
        });
        // --- 🟢 DEBUGGING END ---

        if (!isConfirmed) {
            if (!validIdImage) {
                Alert.alert("KYC Required", "Please upload a valid government ID to proceed.");
                return;
            }
            if (!userSelfieImage) {
                Alert.alert("KYC Required", "Please take a selfie for identity verification.");
                return;
            }
        }
        setIsModalOpen(true);
    };

    // --- REVISED CALCULATION LOGIC ---
    useEffect(() => {
        const oneDay = 24 * 60 * 60 * 1000;
        const numDays = Math.max(Math.round(Math.abs((endDate - startDate) / oneDay)), 1);
        let groupSize = parseInt(numPeople) || 1;
        
        let guideFee = 0;
        let extraFees = 0;

        if (selectedOption === 'solo') {
            groupSize = 1;
            guideFee = tourCostSolo;
            extraFees = 0;
        } else {
            if (groupSize < 2) groupSize = 2;
            guideFee = tourCostSolo;
            const extraPeople = Math.max(0, groupSize - 1);
            extraFees = extraPeople * extraPersonFee;
        }

        setCurrentGuideFee(guideFee);
        
        const dailyTotal = guideFee + extraFees + accomCost;
        const grandTotal = dailyTotal * numDays;
        setTotalPrice(grandTotal);
    }, [startDate, endDate, selectedOption, numPeople, tourCostGroup, tourCostSolo, accomCost, extraPersonFee]);

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <SafeAreaView>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                <View style={styles.header}>
                    <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    <Text style={styles.headerTitle}>
                        {isConfirmed ? "COMPLETE PAYMENT" : "REQUEST TO BOOK"}
                    </Text>
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.guideInfoCard}>
                        <View style={styles.guideHeader}>
                            <View style={[styles.guideIcon, isAgency && styles.agencyIconBg]}>
                                {isAgency ? <Ionicons name="business" size={32} color="#fff" /> : <User size={32} color="#fff" />}
                            </View>
                            <View style={styles.guideInfo}>
                                <Text style={styles.guideName}>{bookingEntity.name}</Text>
                                <Text style={styles.guideDetail}>{bookingEntity.purpose}</Text>
                                <Text style={styles.guideDetail}>{bookingEntity.address}</Text>
                                {isAgency && (
                                    <View style={styles.verifiedBadge}>
                                        <Ionicons name="checkmark-circle" size={12} color="#00C853" />
                                        <Text style={styles.verifiedText}>Agency Verified</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {!isConfirmed && (
                        <>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Select Dates</Text>
                                <View style={styles.dateRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>Start Date</Text>
                                        <Pressable style={styles.dateInput} onPress={() => openCalendar('start')}>
                                            <Text style={styles.dateInputText}>{startDate.toLocaleDateString()}</Text>
                                            <Ionicons name="calendar-outline" size={18} color="#8B98A8" />
                                        </Pressable>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.inputLabel}>End Date</Text>
                                        <Pressable style={styles.dateInput} onPress={() => openCalendar('end')}>
                                            <Text style={styles.dateInputText}>{endDate.toLocaleDateString()}</Text>
                                            <Ionicons name="calendar-outline" size={18} color="#8B98A8" />
                                        </Pressable>
                                    </View>
                                </View>
                            </View>

                            <Modal visible={isCalendarVisible} transparent={true} animationType="slide">
                                <View style={styles.modalContainer}>
                                    <View style={styles.modalContent}>
                                        <View style={styles.modalHeader}>
                                            <Text style={styles.modalTitle}>Select Date</Text>
                                            <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                                                <Ionicons name="close" size={24} color="#333" />
                                            </TouchableOpacity>
                                        </View>
                                        <Calendar
                                            current={new Date().toISOString().split('T')[0]}
                                            minDate={new Date().toISOString().split('T')[0]}
                                            markedDates={getMarkedDates}
                                            onDayPress={onDayPress}
                                            theme={{ todayTextColor: '#00A8FF', arrowColor: '#00A8FF', textMonthFontWeight: 'bold', textDayHeaderFontWeight: '600' }}
                                        />
                                    </View>
                                </View>
                            </Modal>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Booking Type</Text>
                                <View style={styles.selectionButtons}>
                                    <TouchableOpacity
                                        style={[styles.selectionButton, selectedOption === 'solo' && styles.selectionButtonActive]}
                                        onPress={() => { setSelectedOption('solo'); setNumPeople('1'); }}
                                    >
                                        <Text style={[styles.selectionText, selectedOption === 'solo' && styles.selectionTextActive]}>Solo</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.selectionButton, selectedOption === 'group' && styles.selectionButtonActive]}
                                        onPress={() => { setSelectedOption('group'); setNumPeople('2'); }}
                                    >
                                        <Text style={[styles.selectionText, selectedOption === 'group' && styles.selectionTextActive]}>Group</Text>
                                    </TouchableOpacity>
                                </View>
                                {selectedOption === 'group' && (
                                    <View style={styles.peopleInputContainer}>
                                        <Text style={styles.inputLabel}>Number of people:</Text>
                                        <TextInput
                                            style={styles.peopleInput}
                                            value={numPeople}
                                            onChangeText={(text) => { if (text === '' || /^[0-9]+$/.test(text)) setNumPeople(text); }}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                )}
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Billing Information</Text>
                                <View style={styles.billingRow}>
                                    <TextInput style={styles.billingInput} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
                                    <TextInput style={styles.billingInput} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
                                </View>
                                <TextInput style={[styles.billingInput, styles.fullWidthInput]} placeholder="Phone" value={phoneNumber} onChangeText={setPhoneNumber} />
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Identity Verification (KYC)</Text>
                                <Text style={styles.helperText}>For safety, please provide a valid ID and a realtime selfie.</Text>
                                <View style={{flexDirection: 'row', gap: 10}}>
                                    <TouchableOpacity style={[styles.uploadContainer, {flex: 1}]} onPress={pickImage}>
                                        {validIdImage ? <Image source={{ uri: validIdImage }} style={styles.previewImage} /> : <View style={styles.uploadPlaceholder}><Ionicons name="id-card-outline" size={32} color="#00A8FF" /><Text style={styles.uploadText}>Upload ID</Text></View>}
                                        {validIdImage && <View style={styles.checkBadge}><Ionicons name="checkmark-circle" size={20} color="#00C853" /></View>}
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.uploadContainer, {flex: 1}]} onPress={takeSelfie}>
                                        {userSelfieImage ? <Image source={{ uri: userSelfieImage }} style={styles.previewImage} /> : <View style={styles.uploadPlaceholder}><Ionicons name="camera-outline" size={32} color="#00A8FF" /><Text style={styles.uploadText}>Take Selfie</Text></View>}
                                        {userSelfieImage && <View style={styles.checkBadge}><Ionicons name="checkmark-circle" size={20} color="#00C853" /></View>}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}

                    {/* CONFIRMED ONLY: PAYMENT SECTION */}
                    {isConfirmed && (
                         <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Select Payment Method</Text>
                            <View style={styles.paymentGridContainer}>
                                {paymentOptions.map((option) => (
                                    <TouchableOpacity 
                                        key={option.key} 
                                        style={[styles.paymentGridCard, selectedPaymentMethod === option.key && styles.paymentGridCardSelected]} 
                                        onPress={() => setSelectedPaymentMethod(option.key)} 
                                    >
                                        <Ionicons name="wallet-outline" size={24} color={selectedPaymentMethod === option.key ? '#007DFE' : '#1A2332'} />
                                        <Text style={styles.gridMethodTitle}>{option.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.priceCard}>
                        
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>
                                {selectedOption === 'solo' ? 'Guide Fee (Solo Rate)' : 'Guide Base Fee (Group)'}
                            </Text>
                            <Text style={styles.priceValue}>₱ {currentGuideFee.toLocaleString()}</Text>
                        </View>
                        
                        {accomCost > 0 && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Accommodation Fee</Text>
                                <Text style={styles.priceValue}>₱ {accomCost.toLocaleString()}</Text>
                            </View>
                        )}
                        
                        {extraPersonFee > 0 && selectedOption === 'group' && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>
                                    Additional Guest Fee (x{Math.max(0, (parseInt(numPeople) || 1) - 1)})
                                </Text>
                                <Text style={styles.priceValue}>
                                    +₱ {(extraPersonFee * Math.max(0, (parseInt(numPeople) || 1) - 1)).toLocaleString()}
                                </Text>
                            </View>
                        )}

                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Duration</Text>
                            <Text style={styles.priceValue}>
                                {Math.max(Math.floor(Math.abs((endDate - startDate) / (24 * 60 * 60 * 1000))), 1)} day(s)
                            </Text>
                        </View>

                        <View style={styles.priceDivider}>
                            <View style={styles.dashedLine} />
                        </View>

                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Total Amount Due</Text>
                            <View style={styles.totalValueContainer}>
                                <Text style={styles.currency}>₱</Text>
                                <Text style={styles.totalValue}>{totalPrice.toLocaleString()}</Text>
                            </View>
                        </View>
                    </View>

                    {/* 5. ASSIGNED GUIDES */}
                    {isAgency && assignedAgencyGuidesList.length > 0 && (
                        <View style={styles.section}>
                            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 12, marginTop: 10}}>
                                <Text style={styles.sectionTitle}>Assigned Guides</Text>
                                <Text style={styles.subtitleLink}>{assignedAgencyGuidesList.length} Guide(s)</Text>
                            </View>
                            <View style={styles.assignedGuidesContainer}>
                                {assignedAgencyGuidesList.map((guide, index) => (
                                    <View key={index} style={styles.assignedGuideCard}>
                                        <View style={styles.guideCardLeft}>
                                            <Image source={{ uri: guide.profile_picture || '' }} style={styles.guideAvatarLarge} />
                                        </View>
                                        <View style={styles.guideCardRight}>
                                            <Text style={styles.guideCardName}>{guide.full_name}</Text>
                                            <Text style={styles.roleTagText}>Agency Guide</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <TouchableOpacity style={styles.confirmButton} onPress={handleReviewPress}>
                        <Text style={styles.confirmButtonText}>
                            {isConfirmed ? "Proceed to Secure Payment" : "Review Booking Request"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {isModalOpen && (
                    <PaymentReviewModal
                        isModalOpen={isModalOpen}
                        setIsModalOpen={setIsModalOpen}
                        paymentData={{
                            [isAgency ? 'agency' : 'guide']: bookingEntity,
                            // Pass Accommodation Info to Modal
                            accommodation: accomEntity,
                            accommodationId: accommodationId,
                            
                            // 2. PASS TOUR PACKAGE ID
                            tourPackageId: tourPackageId,

                            startDate, endDate, firstName, lastName, phoneNumber, country, email,
                            basePrice: bookingEntity.basePrice,
                            serviceFee: bookingEntity.serviceFee,
                            totalPrice,
                            bookingId: params.bookingId,
                            placeId: params.placeId,
                            paymentMethod: isConfirmed ? selectedPaymentMethod : null,
                            groupType: selectedOption,
                            numberOfPeople: selectedOption === 'group' ? (parseInt(numPeople) < 2 ? 2 : parseInt(numPeople)) : 1,
                            validIdImage,
                            userSelfieImage,
                            isNewKycImage: validIdImage && validIdImage.startsWith('file://'),
                            
                            tourCost: currentGuideFee,
                            accomCost,
                            extraPersonFee
                        }}
                    />
                )}
            </SafeAreaView>
        </ScrollView>
    );
};

export default Payment;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    
    contentContainer: { padding: 16, paddingBottom: 30 },
    
    guideInfoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E0E6ED', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 2 },
    guideHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    guideIcon: { width: 60, height: 60, borderRadius: 16, backgroundColor: '#1A2332', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    agencyIconBg: { backgroundColor: '#00A8FF' },
    guideInfo: { flex: 1, justifyContent: 'center' },
    guideName: { fontSize: 18, fontWeight: '800', color: '#1A2332', marginBottom: 2 },
    guideDetail: { fontSize: 12, color: '#64748B', marginBottom: 2 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4, backgroundColor: '#ECFDF5', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
    verifiedText: { fontSize: 10, color: '#00C853', fontWeight: '700' },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A2332', marginBottom: 12 },
    subtitleLink: { fontSize: 12, color: '#00A8FF', fontWeight: '600' },
    
    dateRow: { flexDirection: 'row', gap: 12 },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff' },
    dateInputText: { fontSize: 14, color: '#1A2332', fontWeight: '500' },
    inputLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginBottom: 6 },
    
    selectionButtons: { flexDirection: 'row', gap: 10 },
    selectionButton: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#fff' },
    selectionButtonActive: { backgroundColor: '#00A8FF', borderColor: '#00A8FF' },
    selectionText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
    selectionTextActive: { color: '#fff' },
    peopleInputContainer: { marginTop: 16 },
    peopleInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#fff', fontSize: 14, color: '#1A2332' },

    priceCard: { 
        backgroundColor: '#fff', 
        borderRadius: 16, 
        padding: 20, 
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    priceRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 12 
    },
    priceLabel: { 
        fontSize: 14, 
        color: '#64748B', 
        fontWeight: '500' 
    },
    priceValue: { 
        fontSize: 14, 
        color: '#1E293B', 
        fontWeight: '600' 
    },
    priceDivider: { 
        marginVertical: 16,
        overflow: 'hidden' 
    },
    dashedLine: {
        height: 1,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 1
    },
    totalLabel: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#1E293B' 
    },
    totalValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline'
    },
    currency: {
        fontSize: 14,
        fontWeight: '600',
        color: '#00A8FF',
        marginRight: 2
    },
    totalValue: { 
        fontSize: 20, 
        fontWeight: '800', 
        color: '#00A8FF' 
    },

    billingRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    billingInput: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A2332', backgroundColor: '#fff' },
    fullWidthInput: { width: '100%' },

    helperText: { fontSize: 12, color: '#64748B', marginBottom: 12, lineHeight: 18, textAlign: 'center' },
    
    // Updated Upload Container for side-by-side
    uploadContainer: { height: 130, borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 16, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
    uploadPlaceholder: { alignItems: 'center' },
    uploadText: { marginTop: 8, fontSize: 13, fontWeight: '600', color: '#00A8FF' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    checkBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#fff', borderRadius: 10 },
    reuploadOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, gap: 8 },
    reuploadText: { color: '#fff', fontSize: 13, fontWeight: '600' },

    confirmButton: { backgroundColor: '#00A8FF', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 10, shadowColor: '#00A8FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    paymentGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    paymentGridCard: {
        width: '31%', 
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative'
    },
    paymentGridCardSelected: {
        borderColor: '#007DFE',
        backgroundColor: '#F0F9FF',
        borderWidth: 2
    },
    gridIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    gridMethodTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748B',
        textAlign: 'center'
    },
    selectedCheckBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#007DFE',
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center'
    },

    assignedGuidesContainer: { 
        flexDirection: 'column', 
        gap: 12 
    },
    assignedGuideCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#fff', 
        borderRadius: 16, 
        padding: 14, 
        borderWidth: 1, 
        borderColor: '#E2E8F0',
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 6, 
        elevation: 2
    },
    guideCardLeft: {
        marginRight: 16,
    },
    avatarContainer: {
        position: 'relative',
    },
    guideAvatarLarge: { 
        width: 56, 
        height: 56, 
        borderRadius: 28, 
        borderWidth: 2, 
        borderColor: '#F1F5F9' 
    },
    badgeIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        backgroundColor: '#00A8FF',
        borderRadius: 10,
        padding: 3,
        borderWidth: 2,
        borderColor: '#fff'
    },
    guideCardRight: {
        flex: 1,
        justifyContent: 'center'
    },
    guideHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    guideCardName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
        flex: 1
    },
    roleTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 6
    },
    roleTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0284C7',
        textTransform: 'uppercase'
    },
    agencyTagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 2
    },
    agencyTagText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500'
    },
    guideContactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    guideContactText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '500'
    },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A2332' },
    modalSubText: { fontSize: 12, color: '#888', marginBottom: 15 },
});