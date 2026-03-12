import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StatusBar, StyleSheet, Image, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal, Dimensions, Platform, KeyboardAvoidingView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User, AlertCircle, CheckCircle2, UploadCloud, Calendar as CalendarIcon, ShieldCheck } from 'lucide-react-native'; 
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PaymentReviewModal } from '../../components/payment';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = '#0072FF';
const SURFACE_COLOR = '#FFFFFF';
const BACKGROUND_COLOR = '#F8F9FC';
const TEXT_PRIMARY = '#1E293B';
const TEXT_SECONDARY = '#64748B';

const Payment = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const {
        entityName, guideName, placeName, bookingId, entityId, guideId, bookingType,
        assignedGuides, basePrice, soloPrice, accommodationPrice, accommodationId,
        accommodationName, additionalFee, placeId, tourPackageId, itineraryTimeline, packageDuration: paramPackageDuration
    } = params;

    const [fetchedBooking, setFetchedBooking] = useState(null);
    const [loadingBooking, setLoadingBooking] = useState(!!bookingId);

    const [guideAvailability, setGuideAvailability] = useState(null);
    const [blockedDates, setBlockedDates] = useState([]); 
    
    // --- MULTI-PACKAGE DYNAMIC STATE ---
    const [guidePackages, setGuidePackages] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);

    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (!bookingId) return;
            try {
                const response = await api.get(`/api/bookings/${bookingId}/`);
                setFetchedBooking(response.data);
            } catch (error) { console.error("Failed to fetch booking details:", error); } 
            finally { setLoadingBooking(false); }
        };
        fetchBookingDetails();
    }, [bookingId]);

    const currentStatus = fetchedBooking?.status || 'Pending_Payment';
    const isConfirmed = currentStatus === 'Confirmed' || currentStatus === 'Completed';
    const isPayable = bookingId && (currentStatus === 'Accepted' || currentStatus === 'Pending_Payment');
    const isRequestMode = !bookingId;

    const isAgency = bookingType === 'agency';
    const resolvedName = fetchedBooking?.guide_detail?.username || fetchedBooking?.agency_detail?.username || entityName || guideName || (isAgency ? "Selected Agency" : "Selected Guide");
    const resolvedId = fetchedBooking?.guide || fetchedBooking?.agency || entityId || guideId;

    useEffect(() => {
        const fetchAvailabilityAndPackages = async () => {
            if (!isAgency && resolvedId) {
                try {
                    const [availRes, blockedRes, toursRes] = await Promise.all([
                        api.get(`/api/guides/${resolvedId}/`),
                        api.get(`/api/bookings/guide_blocked_dates/`, { params: { guide_id: resolvedId } }),
                        placeId ? api.get(`/api/destinations/${placeId}/tours/`) : { data: [] }
                    ]);
                    
                    setGuideAvailability(availRes.data);
                    setBlockedDates(blockedRes.data || []);
                    
                    if (placeId && toursRes.data) {
                        const myTours = toursRes.data.filter(t => t.guide === parseInt(resolvedId));
                        setGuidePackages(myTours);
                        if (myTours.length > 0) {
                            const defaultTour = myTours.find(t => t.id === parseInt(tourPackageId)) || myTours[0];
                            setSelectedPackage(defaultTour);
                        }
                    }
                } catch (error) { console.error("Failed to fetch guide data:", error); }
            }
        };
        fetchAvailabilityAndPackages();
    }, [resolvedId, isAgency, placeId, tourPackageId]);

    const activeDuration = selectedPackage ? (parseInt(selectedPackage.duration_days) || 1) : (parseInt(paramPackageDuration) || 1);
    const activeItinerary = selectedPackage ? selectedPackage.itinerary_timeline : itineraryTimeline;
    const tourCostGroup = selectedPackage ? parseFloat(selectedPackage.price_per_day) : (basePrice ? parseFloat(basePrice) : 500);
    const tourCostSolo = selectedPackage ? parseFloat(selectedPackage.solo_price) : (soloPrice ? parseFloat(soloPrice) : tourCostGroup);
    const extraPersonFee = selectedPackage ? parseFloat(selectedPackage.additional_fee_per_head || 0) : (additionalFee ? parseFloat(additionalFee) : 0);
    const accomCost = accommodationPrice ? parseFloat(accommodationPrice) : 0; 
    
    const parsedItinerary = useMemo(() => {
        try { return activeItinerary ? (typeof activeItinerary === 'string' ? JSON.parse(activeItinerary) : activeItinerary) : []; } 
        catch (e) { return []; }
    }, [activeItinerary]);

    const groupedItinerary = useMemo(() => {
        return parsedItinerary.reduce((acc, item) => {
            const d = parseInt(item.day) || 1;
            if (!acc[d]) acc[d] = [];
            acc[d].push(item);
            return acc;
        }, {});
    }, [parsedItinerary]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [selectingType, setSelectingType] = useState('start');
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const bookingEntity = {
        id: resolvedId,
        name: resolvedName,
        purpose: placeName ? `Tour at ${placeName}` : "Private Tour",
        address: isAgency ? "Verified Agency" : "Local Guide",
        basePrice: tourCostGroup, 
        serviceFee: 50,
    };
    
    const accomEntity = accommodationId ? { name: accommodationName || "Selected Accommodation", price: accomCost } : null;

    const formatDateForCalendar = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

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
    const [downPayment, setDownPayment] = useState(0); 
    const [balanceDue, setBalanceDue] = useState(0); 

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('gcash');
    const paymentOptions = [
        { key: 'gcash', name: 'GCash', icon: 'wallet' },
        { key: 'paymaya', name: 'Maya', icon: 'card' },
        { key: 'card', name: 'Card', icon: 'card-outline' },
    ];

    useEffect(() => {
        if (fetchedBooking) {
            if (fetchedBooking.check_in) setStartDate(new Date(fetchedBooking.check_in));
            if (fetchedBooking.check_out) setEndDate(new Date(fetchedBooking.check_out));
            if (fetchedBooking.num_guests) {
                setNumPeople(String(fetchedBooking.num_guests));
                setSelectedOption(fetchedBooking.num_guests > 1 ? 'group' : 'solo');
            }
        }
    }, [fetchedBooking]);

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setEmail(user.email || '');
            setPhoneNumber(user.phone_number || '');
            setCountry(user.location || '');
            if (user.valid_id_image) setValidIdImage(getImageUrl(user.valid_id_image));
        }
    }, [user]);

    useEffect(() => {
        if (!isPayable && !isConfirmed) {
            const newEndDate = new Date(startDate);
            newEndDate.setDate(newEndDate.getDate() + (activeDuration - 1));
            setEndDate(newEndDate);
        }
    }, [activeDuration, startDate, isPayable, isConfirmed]);

    const getMarkedDates = useMemo(() => {
        const marked = {};
        const startCalc = new Date();
        const endCalc = new Date();
        endCalc.setFullYear(startCalc.getFullYear() + 1);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        const specificDates = guideAvailability?.specific_available_dates || [];
        const recurringDays = guideAvailability?.available_days || [];

        for (let d = new Date(startCalc); d <= endCalc; d.setDate(d.getDate() + 1)) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
            
            if (dateStr < todayStr) {
                marked[dateStr] = { disabled: true, disableTouchEvent: true, textColor: '#d9d9d9' };
                continue;
            }

            if (blockedDates.includes(dateStr)) {
                marked[dateStr] = { disabled: true, disableTouchEvent: true, color: '#FFEBEE', textColor: '#D32F2F', marked: true, dotColor: '#D32F2F' };
                continue;
            }

            if (isAgency) {
                marked[dateStr] = { disabled: false, textColor: TEXT_PRIMARY };
            } else {
                const dayName = dayNames[d.getDay()];
                const isSpecific = specificDates.includes(dateStr);
                const isRecurring = recurringDays.includes("All") || recurringDays.includes(dayName);
                const isAvailable = specificDates.length > 0 ? isSpecific : isRecurring;
                
                if (isAvailable) marked[dateStr] = { disabled: false, textColor: TEXT_PRIMARY };
                else marked[dateStr] = { disabled: true, disableTouchEvent: true, textColor: '#d9d9d9', color: '#f9f9f9' };
            }
        }

        const startStr = formatDateForCalendar(startDate);
        const endStr = formatDateForCalendar(endDate);
        
        if (marked[startStr] && !marked[startStr].disabled) {
            marked[startStr] = { ...marked[startStr], selected: true, selectedColor: PRIMARY_COLOR, textColor: '#fff' };
        }
        if (marked[endStr] && !marked[endStr].disabled) {
            marked[endStr] = { ...marked[endStr], selected: true, selectedColor: PRIMARY_COLOR, textColor: '#fff' };
        }
        
        let curr = new Date(startDate);
        curr.setDate(curr.getDate() + 1);
        while (curr < endDate) {
             const str = formatDateForCalendar(curr);
             if (marked[str] && !marked[str].disabled && !marked[str].color?.includes('FFEBEE')) {
                 marked[str] = { ...marked[str], selected: true, selectedColor: '#E0F2FE', textColor: PRIMARY_COLOR };
             }
             curr.setDate(curr.getDate() + 1);
        }
        
        return marked;
    }, [guideAvailability, startDate, endDate, isAgency, blockedDates]);

    const openCalendar = (type) => { 
        if (type === 'end' && activeDuration > 1) {
            showError(`End date is locked based on the ${activeDuration}-day package you selected.`);
            return;
        }
        setSelectingType(type); 
        setCalendarVisible(true); 
    };
    
    const showError = (message) => { setErrorMessage(message); setErrorModalVisible(true); };

    const checkDateBlockages = (checkStart, checkEnd) => {
        let curr = new Date(checkStart);
        let hasBlock = false;
        while(curr <= checkEnd) {
            const checkStr = formatDateForCalendar(curr);
            if(blockedDates.includes(checkStr)) { hasBlock = true; break; }
            curr.setDate(curr.getDate() + 1);
        }
        if(hasBlock) {
             setCalendarVisible(false);
             setTimeout(() => showError("Your selected package range overlaps with dates that are already booked."), 300);
             return true;
        }
        
        if (!isAgency && guideAvailability) {
            let checkCurr = new Date(checkStart);
            let hasUnavailable = false;
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const specificDates = guideAvailability.specific_available_dates || [];
            const recurringDays = guideAvailability.available_days || [];

            while(checkCurr <= checkEnd) {
                const dStr = formatDateForCalendar(checkCurr);
                const dayName = dayNames[checkCurr.getDay()];
                const isSpecific = specificDates.includes(dStr);
                const isRecurring = recurringDays.includes("All") || recurringDays.includes(dayName);
                const isAvailable = specificDates.length > 0 ? isSpecific : isRecurring;

                if (!isAvailable) { hasUnavailable = true; break; }
                checkCurr.setDate(checkCurr.getDate() + 1);
            }

            if (hasUnavailable) {
                setCalendarVisible(false);
                setTimeout(() => showError("Your multi-day package includes dates the guide is not working."), 300);
                return true;
            }
        }
        return false;
    }

    const onDayPress = (day) => {
        const selectedDate = new Date(day.dateString);
        if (blockedDates.includes(day.dateString)) { 
            showError("This date has already been booked by another traveler."); 
            return; 
        }

        if (selectingType === 'start') {
            const futureEnd = new Date(selectedDate);
            futureEnd.setDate(futureEnd.getDate() + (activeDuration - 1));
            
            if(checkDateBlockages(selectedDate, futureEnd)) return;
            
            setStartDate(selectedDate);
            setCalendarVisible(false);
        } else {
            const startDateString = formatDateForCalendar(startDate);
            if (day.dateString === startDateString) {
                setCalendarVisible(false);
                setTimeout(() => showError("You cannot book start and end date on the same day."), 300); 
                return;
            }
            if (selectedDate < startDate) {
                setCalendarVisible(false);
                setTimeout(() => showError("End date cannot be before start date."), 300);
                return;
            }
            
            if(checkDateBlockages(startDate, selectedDate)) return;
            setEndDate(selectedDate);
            setCalendarVisible(false);
        }
    };

    const pickImage = async () => {
        setIsLoadingImage(true);
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, 
            allowsEditing: false, aspect: [4, 3], quality: 1
        });
        if (!result.canceled) setValidIdImage(result.assets[0].uri);
        setIsLoadingImage(false);
    };

    const takeSelfie = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert("Permission Denied", "Camera permission is required to take a selfie."); return; }
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, aspect: [1, 1], quality: 0.8, cameraType: ImagePicker.CameraType.front,
        });
        if (!result.canceled) setUserSelfieImage(result.assets[0].uri);
    };

    const handleReviewPress = () => {
        const startStr = formatDateForCalendar(startDate);
        const endStr = formatDateForCalendar(endDate);
        if (startStr === endStr && activeDuration > 1) { showError("Multi-day packages cannot start and end on the same day."); return; }
        if (startDate > endDate) { showError("End date cannot be before start date."); return; }
        if (!validIdImage && !isPayable) { showError("Please upload a valid government ID to proceed."); return; }
        if (!userSelfieImage && !isPayable) { showError("Please take a selfie for identity verification."); return; }
        
        setIsModalOpen(true);
    };

    useEffect(() => {
        const oneDay = 24 * 60 * 60 * 1000;
        let numDays = 1;
        
        if (activeDuration > 1 && startDate.getTime() !== endDate.getTime()) {
            numDays = Math.round(Math.abs((endDate - startDate) / oneDay)) + 1;
        } else if (activeDuration === 1 && startDate.getTime() !== endDate.getTime()) {
            numDays = Math.max(Math.round(Math.abs((endDate - startDate) / oneDay)), 1);
        }

        let groupSize = parseInt(numPeople) || 1;
        let guideFee = 0;
        let extraFees = 0;

        if (selectedOption === 'solo') {
            groupSize = 1; 
            // If solo price is 0 or not set, fallback to the standard price per day
            guideFee = tourCostSolo > 0 ? tourCostSolo : tourCostGroup; 
            extraFees = 0;
        } else {
            if (groupSize < 2) groupSize = 2;
            // FIXED: Use the standard Price Per Day (tourCostGroup) for group bookings
            guideFee = tourCostGroup; 
            
            // Assuming the base price covers the 1st person, add extra fee for the 2nd person onwards
            const extraPeople = Math.max(0, groupSize - 1);
            extraFees = extraPeople * extraPersonFee;
        }
        
        setCurrentGuideFee(guideFee);
        
        const dailyTotal = guideFee + extraFees + accomCost;
        const grandTotal = dailyTotal * numDays;
        
        const calculatedDownPayment = grandTotal * 0.30; 
        const calculatedBalance = grandTotal - calculatedDownPayment;

        setTotalPrice(grandTotal);
        setDownPayment(calculatedDownPayment);
        setBalanceDue(calculatedBalance);
    }, [startDate, endDate, selectedOption, numPeople, tourCostGroup, tourCostSolo, accomCost, extraPersonFee, activeDuration]);

    const profileImageSource = useMemo(() => {
        if (!isAgency && guideAvailability && guideAvailability.profile_picture) {
            return { uri: getImageUrl(guideAvailability.profile_picture) };
        }
        return null;
    }, [isAgency, guideAvailability]);

    if (loadingBooking) {
        return (
            <View style={styles.loaderFallback}>
                <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                        
                        <View style={styles.header}>
                            <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.overlay} />
                            <View style={styles.headerContent}>
                                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                    <Ionicons name="arrow-back" size={24} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>
                                    {isConfirmed ? "BOOKING CONFIRMED" : (isPayable ? "COMPLETE PAYMENT" : "SECURE YOUR DATE")}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.contentContainer}>
                            
                            <View style={styles.card}>
                                <View style={styles.guideHeader}>
                                    <View style={[styles.avatarContainer, profileImageSource && styles.avatarHasImage]}>
                                        {profileImageSource ? (
                                            <Image source={profileImageSource} style={styles.avatarImage} />
                                        ) : (
                                            isAgency ? <Ionicons name="business" size={28} color="#fff" /> : <User size={28} color="#fff" />
                                        )}
                                    </View>
                                    <View style={styles.guideInfo}>
                                        <Text style={styles.guideName}>{bookingEntity.name}</Text>
                                        <Text style={styles.guideSub}>{bookingEntity.purpose}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={[isPayable && {opacity: 0.7}]}>
                                
                                {!isPayable && !isConfirmed && guidePackages.length > 0 && (
                                    <>
                                        <Text style={styles.sectionTitle}>Select Package</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.packageScroll}>
                                            {guidePackages.map((pkg) => {
                                                const isSelected = selectedPackage?.id === pkg.id;
                                                const duration = parseInt(pkg.duration_days) || 1;
                                                return (
                                                    <TouchableOpacity 
                                                        key={pkg.id} 
                                                        style={[styles.packagePill, isSelected && styles.packagePillActive]}
                                                        onPress={() => setSelectedPackage(pkg)}
                                                    >
                                                        <Text style={[styles.packagePillText, isSelected && styles.packagePillTextActive]}>
                                                            {duration} Day Package
                                                        </Text>
                                                    </TouchableOpacity>
                                                )
                                            })}
                                        </ScrollView>
                                    </>
                                )}
                                
                                {!isPayable && !isConfirmed && guidePackages.length === 0 && (
                                    <>
                                        <Text style={styles.sectionTitle}>Selected Package</Text>
                                        <View style={{flexDirection: 'row', marginBottom: 20}}>
                                            <View style={[styles.packagePill, styles.packagePillActive]}>
                                                <Text style={[styles.packagePillText, styles.packagePillTextActive]}>{activeDuration} Day Package</Text>
                                            </View>
                                        </View>
                                    </>
                                )}

                                <Text style={styles.sectionTitle}>Trip Details</Text>
                                <View style={styles.datesRow}>
                                    <TouchableOpacity style={styles.dateBox} onPress={() => !isPayable && openCalendar('start')} disabled={isPayable}>
                                        <Text style={styles.dateLabel}>Start Date</Text>
                                        <View style={styles.dateValueRow}>
                                            <CalendarIcon size={18} color={PRIMARY_COLOR} />
                                            <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={styles.connector} />
                                    <TouchableOpacity 
                                        style={[styles.dateBox, activeDuration > 1 && { backgroundColor: '#F1F5F9' }]} 
                                        onPress={() => !isPayable && openCalendar('end')} 
                                        disabled={isPayable || activeDuration > 1}
                                    >
                                        <Text style={styles.dateLabel}>{activeDuration > 1 ? "Locked End" : "End Date"}</Text>
                                        <View style={styles.dateValueRow}>
                                            <CalendarIcon size={18} color={activeDuration > 1 ? '#94A3B8' : PRIMARY_COLOR} />
                                            <Text style={[styles.dateValue, activeDuration > 1 && { color: '#64748B' }]}>{endDate.toLocaleDateString()}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                {/* --- MATCHED ITINERARY SCHEDULE --- */}
                                {Object.keys(groupedItinerary).length > 0 && (
                                    <View style={{ marginBottom: 20 }}>
                                        <Text style={styles.sectionTitle}>Itinerary Schedule</Text>
                                        <View style={styles.timelineContainer}>
                                            {Object.keys(groupedItinerary).sort((a,b)=>a-b).map(day => (
                                                <View key={`seq-day-${day}`} style={{marginBottom: 20}}>
                                                    <Text style={styles.seqDayLabel}>Day {day}</Text>
                                                    
                                                    {groupedItinerary[day].map((act, idx) => (
                                                        <View key={idx} style={styles.timelineItem}>
                                                            <View style={styles.timeColumn}>
                                                                <Text style={styles.timeText}>{act.startTime}</Text>
                                                                {act.endTime && <Text style={styles.timeSubText}>{act.endTime}</Text>}
                                                                <View style={styles.timeConnector} />
                                                            </View>
                                                            <View style={styles.activityCard}>
                                                                <View style={styles.activityHeader}>
                                                                    <View style={[
                                                                        styles.activityDot, 
                                                                        { backgroundColor: act.type === 'accom' ? '#8E44AD' : PRIMARY_COLOR }
                                                                    ]} />
                                                                    <Text style={styles.activityTitle}>{act.activityName}</Text>
                                                                </View>
                                                                <View style={styles.typeBadge}>
                                                                    <Text style={styles.typeText}>
                                                                        {act.type === 'accom' ? 'Accommodation' : 'Stop / Activity'}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                <View style={styles.switchContainer}>
                                    <TouchableOpacity style={[styles.switchOption, selectedOption === 'solo' && styles.switchActive]} onPress={() => { setSelectedOption('solo'); setNumPeople('1'); }} disabled={isPayable}>
                                        <Text style={[styles.switchText, selectedOption === 'solo' && styles.switchTextActive]}>Solo Trip</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.switchOption, selectedOption === 'group' && styles.switchActive]} onPress={() => { setSelectedOption('group'); setNumPeople('2'); }} disabled={isPayable}>
                                        <Text style={[styles.switchText, selectedOption === 'group' && styles.switchTextActive]}>Group</Text>
                                    </TouchableOpacity>
                                </View>

                                {selectedOption === 'group' && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Number of Guests</Text>
                                        <TextInput
                                            style={styles.modernInput}
                                            value={numPeople}
                                            onChangeText={(text) => { if (text === '' || /^[0-9]+$/.test(text)) setNumPeople(text); }}
                                            keyboardType="numeric"
                                            editable={!isPayable}
                                        />
                                    </View>
                                )}
                            </View>

                            {!isPayable && (
                                <>
                                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Billing Details</Text>
                                    <View style={styles.inputRow}>
                                        <TextInput style={[styles.modernInput, {flex:1}]} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
                                        <View style={{width: 10}}/>
                                        <TextInput style={[styles.modernInput, {flex:1}]} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
                                    </View>
                                    <TextInput style={[styles.modernInput, {marginTop: 10}]} placeholder="Phone Number" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />

                                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Identity Verification</Text>
                                    <View style={styles.kycRow}>
                                        <TouchableOpacity style={[styles.kycCard, validIdImage && styles.kycCardDone]} onPress={pickImage}>
                                            {validIdImage ? (
                                                <Image source={{ uri: validIdImage }} style={styles.kycImage} />
                                            ) : (
                                                <View style={styles.kycPlaceholder}>
                                                    <UploadCloud size={24} color={PRIMARY_COLOR} />
                                                    <Text style={styles.kycText}>Upload ID</Text>
                                                </View>
                                            )}
                                            {validIdImage && <View style={styles.checkBubble}><CheckCircle2 size={16} color="#fff" /></View>}
                                        </TouchableOpacity>

                                        <TouchableOpacity style={[styles.kycCard, userSelfieImage && styles.kycCardDone]} onPress={takeSelfie}>
                                            {userSelfieImage ? (
                                                <Image source={{ uri: userSelfieImage }} style={styles.kycImage} />
                                            ) : (
                                                <View style={styles.kycPlaceholder}>
                                                    <Ionicons name="camera-outline" size={28} color={PRIMARY_COLOR} />
                                                    <Text style={styles.kycText}>Take Selfie</Text>
                                                </View>
                                            )}
                                            {userSelfieImage && <View style={styles.checkBubble}><CheckCircle2 size={16} color="#fff" /></View>}
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}

                            {(isRequestMode || isPayable || isConfirmed) && (
                                <>
                                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Payment Method</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paymentScroll}>
                                        {paymentOptions.map((opt) => (
                                            <TouchableOpacity 
                                                key={opt.key} 
                                                style={[styles.paymentOption, selectedPaymentMethod === opt.key && styles.paymentOptionActive]}
                                                onPress={() => !isConfirmed && setSelectedPaymentMethod(opt.key)}
                                                disabled={isConfirmed}
                                            >
                                                <View style={[styles.paymentIconCircle, selectedPaymentMethod === opt.key && styles.paymentIconCircleActive]}>
                                                    <Ionicons name={opt.icon} size={20} color={selectedPaymentMethod === opt.key ? '#fff' : TEXT_SECONDARY} />
                                                </View>
                                                <Text style={[styles.paymentText, selectedPaymentMethod === opt.key && styles.paymentTextActive]}>{opt.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                            <SafeAreaView style={styles.receiptCard}>
                                <View style={styles.receiptHeader}>
                                    <Text style={styles.receiptTitle}>Payment Summary</Text>
                                </View>
                                <View style={styles.receiptRow}>
                                    <Text style={styles.receiptLabel}>Total Trip Cost</Text>
                                    <Text style={styles.receiptValue}>₱ {totalPrice.toLocaleString()}</Text>
                                </View>
                                <View style={styles.receiptDivider} />
                                <View style={styles.receiptRow}>
                                    <Text style={[styles.receiptLabel, {color: TEXT_PRIMARY, fontWeight:'700'}]}>Down Payment (30%)</Text>
                                    <Text style={[styles.receiptTotal, {color: PRIMARY_COLOR}]}>₱ {downPayment.toLocaleString()}</Text>
                                </View>
                                <Text style={styles.receiptNote}>{isConfirmed ? "Paid Successfully" : "Payable now to secure dates"}</Text>
                                <View style={[styles.receiptRow, {marginTop: 12}]}>
                                    <Text style={styles.receiptLabel}>Balance Due Later</Text>
                                    <Text style={styles.receiptValue}>₱ {balanceDue.toLocaleString()}</Text>
                                </View>
                            </SafeAreaView>

                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {!isConfirmed ? (
                    <SafeAreaView style={styles.bottomBar}>
                        <View>
                            <Text style={styles.bottomLabel}>Total Payable Now</Text>
                            <Text style={styles.bottomPrice}>₱{downPayment.toLocaleString()}</Text>
                        </View>
                        <TouchableOpacity style={styles.payButton} onPress={handleReviewPress}>
                            <Text style={styles.payButtonText}>{isPayable ? "Confirm Payment" : "Pay & Book"}</Text>
                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </TouchableOpacity>
                    </SafeAreaView>
                ) : (
                    <SafeAreaView style={styles.bottomBar}>
                        <TouchableOpacity style={[styles.payButton, {backgroundColor: '#059669', width: '100%'}]} onPress={() => router.push('/(protected)/home')}>
                            <Ionicons name="home" size={18} color="#fff" style={{marginRight:8}}/>
                            <Text style={styles.payButtonText}>Return Home</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                )}

                <Modal visible={isCalendarVisible} transparent={true} animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.calendarCard}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select {selectingType === 'start' ? 'Start' : 'End'} Date</Text>
                                <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={20} color="#333" />
                                </TouchableOpacity>
                            </View>
                            <Calendar
                                current={new Date().toISOString().split('T')[0]}
                                minDate={new Date().toISOString().split('T')[0]}
                                markedDates={getMarkedDates}
                                onDayPress={onDayPress}
                                theme={{ 
                                    todayTextColor: PRIMARY_COLOR, 
                                    arrowColor: PRIMARY_COLOR, 
                                    textMonthFontWeight: '800', 
                                    textDayHeaderFontWeight: '600' 
                                }}
                            />
                        </View>
                    </View>
                </Modal>

                <Modal visible={errorModalVisible} transparent={true} animationType="fade">
                    <View style={styles.errorOverlay}>
                        <View style={styles.errorCard}>
                            <View style={styles.errorIconBox}><AlertCircle size={32} color="#EF4444" /></View>
                            <Text style={styles.errorTitle}>Oops!</Text>
                            <Text style={styles.errorMessage}>{errorMessage}</Text>
                            <TouchableOpacity style={styles.errorButton} onPress={() => setErrorModalVisible(false)}>
                                <Text style={styles.errorButtonText}>Okay, Got it</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {isModalOpen && (
                    <PaymentReviewModal
                        isModalOpen={isModalOpen}
                        setIsModalOpen={setIsModalOpen}
                        paymentData={{
                            [isAgency ? 'agency' : 'guide']: bookingEntity,
                            accommodation: accomEntity, accommodationId, 
                            tourPackageId: selectedPackage ? selectedPackage.id : tourPackageId,
                            startDate, endDate, firstName, lastName, phoneNumber, country, email,
                            basePrice: bookingEntity.basePrice, serviceFee: bookingEntity.serviceFee,
                            totalPrice, downPayment, balanceDue, bookingId, placeId,
                            paymentMethod: selectedPaymentMethod, groupType: selectedOption,
                            numberOfPeople: selectedOption === 'group' ? (parseInt(numPeople) < 2 ? 2 : parseInt(numPeople)) : 1,
                            validIdImage, userSelfieImage, isNewKycImage: validIdImage && validIdImage.startsWith('file://'),
                            tourCost: currentGuideFee, accomCost, extraPersonFee,
                            status: currentStatus 
                        }}
                    />
                )}
            </SafeAreaView>
        </View>
    );
};

export default Payment;

const styles = StyleSheet.create({
    container: { flex: 1 },
    loaderFallback: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    header: { height: 100, position: 'relative', marginBottom: 20 },
    headerImage: { width: '100%', height: '100%', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { position: 'absolute', bottom: 15, left: 20, right: 20, flexDirection: 'row', alignItems: 'center' },
    backButton: { marginRight: 15, padding: 5 },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
    contentContainer: { paddingHorizontal: 20 },
    card: { backgroundColor: SURFACE_COLOR, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
    guideHeader: { flexDirection: 'row', alignItems: 'center' },
    avatarContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    avatarHasImage: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', padding: 1 },
    avatarImage: { width: '100%', height: '100%', borderRadius: 28 },
    guideName: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY },
    guideSub: { fontSize: 13, color: TEXT_SECONDARY },
    verifiedTag: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4, backgroundColor: '#ECFDF5', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    verifiedText: { fontSize: 11, color: '#059669', fontWeight: '600' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 12 },
    
    packageScroll: { flexDirection: 'row', marginBottom: 20 },
    packagePill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    packagePillActive: { backgroundColor: '#EFF6FF', borderColor: PRIMARY_COLOR },
    packagePillText: { fontSize: 14, fontWeight: '600', color: TEXT_SECONDARY },
    packagePillTextActive: { color: PRIMARY_COLOR },
    
    // --- EXACT MATCH ITINERARY STYLES ---
    seqDayLabel: { fontSize: 15, fontWeight: '800', color: PRIMARY_COLOR, marginBottom: 10 },
    timelineContainer: { marginTop: 10 },
    timelineItem: { flexDirection: 'row', marginBottom: 15 },
    timeColumn: { width: 85, alignItems: 'center', paddingRight: 10 },
    timeText: { fontSize: 12, fontWeight: '700', color: TEXT_PRIMARY },
    timeSubText: { fontSize: 10, color: TEXT_SECONDARY, marginTop: 2 },
    timeConnector: { flex: 1, width: 1, backgroundColor: '#E2E8F0', marginTop: 4 },
    
    activityCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E2E8F0' },
    activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    activityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    activityTitle: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
    
    typeBadge: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
    typeText: { fontSize: 10, color: TEXT_SECONDARY, fontWeight: '600' },
    
    datesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    dateBox: { flex: 1, backgroundColor: SURFACE_COLOR, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    dateLabel: { fontSize: 12, color: TEXT_SECONDARY, marginBottom: 4 },
    dateValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dateValue: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
    connector: { width: 10, height: 1, backgroundColor: '#CBD5E1', marginHorizontal: 10 },
    switchContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 16 },
    switchOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    switchActive: { backgroundColor: PRIMARY_COLOR, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    switchText: { fontSize: 14, fontWeight: '600', color: TEXT_SECONDARY },
    switchTextActive: { color: '#FFFFFF', fontWeight: '700' },
    modernInput: { backgroundColor: SURFACE_COLOR, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: TEXT_PRIMARY },
    inputRow: { flexDirection: 'row' },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY, marginBottom: 8 },
    kycRow: { flexDirection: 'row', gap: 12 },
    kycCard: { flex: 1, height: 120, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    kycCardDone: { borderStyle: 'solid', borderColor: '#22C55E' },
    kycPlaceholder: { alignItems: 'center', gap: 8 },
    kycText: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY },
    kycImage: { width: '100%', height: '100%' },
    checkBubble: { position: 'absolute', top: 8, right: 8, backgroundColor: '#22C55E', borderRadius: 12, padding: 2 },
    paymentScroll: { flexDirection: 'row', marginBottom: 24 },
    paymentOption: { marginRight: 12, width: 80, height: 80, backgroundColor: SURFACE_COLOR, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', gap: 8 },
    paymentOptionActive: { borderColor: PRIMARY_COLOR, backgroundColor: '#EFF6FF' },
    paymentIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    paymentIconCircleActive: { backgroundColor: PRIMARY_COLOR },
    paymentText: { fontSize: 12, fontWeight: '600', color: TEXT_SECONDARY },
    paymentTextActive: { color: PRIMARY_COLOR },
    receiptCard: { backgroundColor: SURFACE_COLOR, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', marginBottom: 40 },
    receiptHeader: { alignItems: 'center', marginBottom: 16 },
    receiptTitle: { fontSize: 14, fontWeight: '700', color: TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: 1 },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    receiptLabel: { fontSize: 14, color: TEXT_SECONDARY },
    receiptValue: { fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
    receiptTotal: { fontSize: 18, fontWeight: '800' },
    receiptDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
    receiptNote: { fontSize: 11, color: PRIMARY_COLOR, fontStyle: 'italic', textAlign: 'right' },
    
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: SURFACE_COLOR, paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:-2}, shadowOpacity:0.05, shadowRadius:10, elevation:10 },
    bottomLabel: { fontSize: 12, color: TEXT_SECONDARY, fontWeight: '600' },
    bottomPrice: { fontSize: 20, color: TEXT_PRIMARY, fontWeight: '800' },
    payButton: { backgroundColor: PRIMARY_COLOR, flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center', gap: 8, shadowColor: PRIMARY_COLOR, shadowOffset: {width:0, height:4}, shadowOpacity:0.3, shadowRadius:8, elevation:4 },
    payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    calendarCard: { backgroundColor: SURFACE_COLOR, borderRadius: 24, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY },
    closeBtn: { padding: 4, backgroundColor: '#F1F5F9', borderRadius: 20 },
    errorOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    errorCard: { width: '85%', backgroundColor: SURFACE_COLOR, borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10 },
    errorIconBox: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    errorTitle: { fontSize: 20, fontWeight: '800', color: TEXT_PRIMARY, marginBottom: 8 },
    errorMessage: { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    errorButton: { backgroundColor: '#EF4444', paddingVertical: 12, width: '100%', alignItems: 'center', borderRadius: 12 },
    errorButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});