import { Image } from 'expo-image';
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CheckCircle2, UploadCloud, Calendar as CalendarIcon, ShieldCheck, AlertCircle } from 'lucide-react-native'; 
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker'; 
import { useAuth } from '../../context/AuthContext'; 
import { useLocalSearchParams, useRouter } from 'expo-router';
import AgencyPaymentReviewModal from './agencyPaymentReviewModal'; 
import api from '../../api/api'; 
import { formatPHPhoneLocal, normalizePHPhone } from '../../utils/phoneNumber';
import { NAME_REGEX, NAME_ERROR_MESSAGE, EMAIL_REGEX, EMAIL_ERROR_MESSAGE, PHONE_ERROR_MESSAGE } from '../../utils/validation';
import { styles } from './styles/agencyBookingDetails.styles';


const PRIMARY_COLOR = '#0072FF';
const BACKGROUND_COLOR = '#F8F9FC';
const TEXT_PRIMARY = '#1E293B';

const AgencyBookingDetails = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    
    const { agencyName, agencyId, agencyLogo, placeName, bookingId, placeId, agencyDownPayment } = params;
    const isPaymentMode = !!bookingId;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [billingErrors, setBillingErrors] = useState({});

    const agency = {
        id: agencyId,
        name: agencyName || "Selected Agency",
        purpose: placeName ? `Tour at ${placeName}` : "Private Tour", 
        basePrice: 1000, 
    };

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [selectingType, setSelectingType] = useState('start');

    const [selectedOption, setSelectedOption] = useState('solo');
    const [numPeople, setNumPeople] = useState('1');
    
    const [guestNames, setGuestNames] = useState([]);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [country, setCountry] = useState('');
    const [email, setEmail] = useState('');
    
    const [validIdImage, setValidIdImage] = useState(null);
    const [userSelfieImage, setUserSelfieImage] = useState(null);

    const [totalPrice, setTotalPrice] = useState(agency.basePrice);
    const [downPayment, setDownPayment] = useState(0);
    const [balanceDue, setBalanceDue] = useState(0);

    const [dynamicDpRate, setDynamicDpRate] = useState(agencyDownPayment ? (parseFloat(agencyDownPayment) / 100) : 0.30);

    const [concurrentBookings, setConcurrentBookings] = useState([]);
    const [loadingConcurrent, setLoadingConcurrent] = useState(false);
    const [manifestModalVisible, setManifestModalVisible] = useState(false);

    useEffect(() => {
        const count = parseInt(numPeople) || 1;
        if (count > 1) {
            setGuestNames(prev => {
                const newArray = [...prev];
                while (newArray.length < count - 1) newArray.push('');
                return newArray.slice(0, count - 1);
            });
        } else {
            setGuestNames([]);
        }
    }, [numPeople]);

    useEffect(() => {
        const fetchAgencyRate = async () => {
            if (agencyDownPayment) return; 
            try {
                const res = await api.get('/api/agencies/'); 
                const agenciesList = res.data.results || res.data;
                const matchedAgency = agenciesList.find(a => String(a.id) === String(agencyId) || String(a.user) === String(agencyId));
                
                if (matchedAgency && matchedAgency.down_payment_percentage) {
                    setDynamicDpRate(parseFloat(matchedAgency.down_payment_percentage) / 100);
                }
            } catch (error) {
                console.log("Could not fetch explicit agency rate, falling back to default.", error);
            }
        };
        
        if (agencyId) {
            fetchAgencyRate();
        }
    }, [agencyId, agencyDownPayment]);

    useEffect(() => {
        const fetchConcurrentBookings = async () => {
            if (!agencyId) return;
            setLoadingConcurrent(true);
            try {
                const res = await api.get('/api/bookings/');
                const relevant = (res.data || []).filter(b => {
                    if (bookingId && b.id === parseInt(bookingId)) return false; 
                    
                    const isSameProvider = (b.agency === parseInt(agencyId) || b.agency_detail?.id === parseInt(agencyId));
                    if (!isSameProvider) return false;
                    
                    const bStart = new Date(b.check_in);
                    const bEnd = new Date(b.check_out || b.check_in);
                    bStart.setHours(0,0,0,0); bEnd.setHours(0,0,0,0);
                    
                    const selStart = new Date(startDate);
                    const selEnd = new Date(endDate);
                    selStart.setHours(0,0,0,0); selEnd.setHours(0,0,0,0);
                    
                    const overlaps = (bStart <= selEnd && bEnd >= selStart);
                    const isConfirmedStatus = ['confirmed', 'completed', 'pending_payment', 'accepted'].includes((b.status || '').toLowerCase());
                    
                    return overlaps && isConfirmedStatus;
                });
                setConcurrentBookings(relevant);
            } catch (e) {
                console.error("Failed to fetch concurrent bookings", e);
            } finally {
                setLoadingConcurrent(false);
            }
        };
        fetchConcurrentBookings();
    }, [startDate, endDate, agencyId, bookingId]);

    const formatDateForCalendar = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getImageUrl = (imgPath) => {
        if (!imgPath || imgPath.startsWith('http') || imgPath.startsWith('file://')) return imgPath;
        return imgPath; 
    };
    
    const showError = (message) => {
        setErrorMessage(message);
        setErrorModalVisible(true);
    };

    const clearBillingError = (field) => {
        setBillingErrors((prev) => {
            if (!prev[field]) return prev;
            return { ...prev, [field]: '' };
        });
    };

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setEmail(user.email || '');
            setPhoneNumber(formatPHPhoneLocal(user.phone_number || '')); 
            setCountry(user.location || ''); 
            if (user.valid_id_image) setValidIdImage(getImageUrl(user.valid_id_image));
        }
    }, [user]);

    useEffect(() => {
        const oneDay = 24 * 60 * 60 * 1000;
        const diffTime = endDate - startDate;
        const diffDays = Math.max(Math.ceil(diffTime / oneDay), 1);
        
        let groupSize = parseInt(numPeople) || 0;
        let multiplier = selectedOption === 'solo' ? 1 : (groupSize < 2 ? 2 : groupSize);
        
        const baseCost = (diffDays * agency.basePrice * multiplier);
        
        setTotalPrice(baseCost);
        
        const dp = baseCost * dynamicDpRate;
        setDownPayment(dp);
        setBalanceDue(baseCost - dp);

    }, [startDate, endDate, selectedOption, numPeople, dynamicDpRate, agency.basePrice]);

    const getMarkedDates = useMemo(() => {
        const marked = {};
        const startStr = formatDateForCalendar(startDate);
        const endStr = formatDateForCalendar(endDate);
        
        marked[startStr] = { selected: true, startingDay: true, color: PRIMARY_COLOR, textColor: '#fff' };
        marked[endStr] = { selected: true, endingDay: true, color: PRIMARY_COLOR, textColor: '#fff' };
        
        let curr = new Date(startDate);
        curr.setDate(curr.getDate() + 1);
        let safetyCounter = 0;
        while (curr < endDate && safetyCounter < 365) {
             const str = formatDateForCalendar(curr);
             marked[str] = { selected: true, color: '#E0F2FE', textColor: PRIMARY_COLOR };
             curr.setDate(curr.getDate() + 1);
             safetyCounter++;
        }
        return marked;
    }, [startDate, endDate]);

    const openCalendar = (type) => {
        setSelectingType(type);
        setCalendarVisible(true);
    };

    const onDayPress = (day) => {
        const selectedDate = new Date(day.dateString);

        if (selectingType === 'start') {
            setStartDate(selectedDate);
            if (selectedDate > endDate) {
                setEndDate(selectedDate);
            }
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

            setEndDate(selectedDate);
            setCalendarVisible(false);
        }
    };

    const pickImage = async () => {
        setIsLoadingImage(true);
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setValidIdImage(result.assets[0].uri);
        }
        setIsLoadingImage(false);
    };

    const takeSelfie = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showError("Camera permission is required.");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            cameraType: ImagePicker.CameraType.front,
        });

        if (!result.canceled) {
            setUserSelfieImage(result.assets[0].uri);
        }
    };

    const handleReviewPress = () => {
        const trimmedFirstName = String(firstName || '').trim();
        const trimmedLastName = String(lastName || '').trim();
        const trimmedEmail = String(email || '').trim();
        const normalizedPhone = normalizePHPhone(phoneNumber);

        const nextBillingErrors = {};

        if (!NAME_REGEX.test(trimmedFirstName)) {
            nextBillingErrors.firstName = NAME_ERROR_MESSAGE;
        }

        if (!NAME_REGEX.test(trimmedLastName)) {
            nextBillingErrors.lastName = NAME_ERROR_MESSAGE;
        }

        if (!normalizedPhone) {
            nextBillingErrors.phoneNumber = PHONE_ERROR_MESSAGE;
        }

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            nextBillingErrors.email = EMAIL_ERROR_MESSAGE;
        }

        if (selectedOption === 'group' && parseInt(numPeople) > 1) {
            const invalidGuestIndex = guestNames.findIndex((name) => !NAME_REGEX.test(String(name || '').trim()));
            if (invalidGuestIndex >= 0) {
                nextBillingErrors.guestNames = `Guest ${invalidGuestIndex + 2}: ${NAME_ERROR_MESSAGE}`;
            }
        }

        if (Object.values(nextBillingErrors).some(Boolean)) {
            setBillingErrors(nextBillingErrors);
            return;
        }

        setBillingErrors({});

        const startStr = formatDateForCalendar(startDate);
        const endStr = formatDateForCalendar(endDate);

        if (startStr === endStr) {
            showError("You cannot book start and end date on the same day.");
            return;
        }
        if (startDate > endDate) {
            showError("End date cannot be before start date.");
            return;
        }
        
        if (!isPaymentMode) {
            if (!validIdImage) {
                showError("Please upload a valid government ID for verification.");
                return;
            }
            if (!userSelfieImage) {
                showError("Please take a selfie for identity verification.");
                return;
            }
        }
        
        setIsModalOpen(true);
    };

    return (
        <View style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}>
             <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                        
                        <View style={styles.header}>
                            <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.overlay} />
                            <View style={styles.headerContent}>
                                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                    <Ionicons name="arrow-back" size={24} color="#fff" />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>{isPaymentMode ? "COMPLETE YOUR BOOKING" : "REQUEST TO BOOK"}</Text>
                            </View>
                        </View>

                        <View style={styles.contentContainer}>
                             <View style={styles.card}>
                                <View style={styles.guideHeader}>
                                    <View style={[styles.avatarContainer, !agencyLogo && {backgroundColor: '#00A8FF'}]}>
                                        {agencyLogo ? (
                                            <Image 
                                                source={{ uri: agencyLogo.startsWith('http') ? agencyLogo : `${api.defaults.baseURL}${agencyLogo}` }} 
                                                style={{ width: '100%', height: '100%', borderRadius: 28 }} 
                                                contentFit="cover"
                                            />
                                        ) : (
                                            <Ionicons name="business" size={28} color="#fff" />
                                        )}
                                    </View>
                                    <View style={styles.guideInfo}>
                                        <Text style={styles.guideName}>{agency.name}</Text>
                                        <Text style={styles.guideSub}>{agency.purpose}</Text>
                                        <View style={styles.verifiedTag}>
                                            <ShieldCheck size={12} color="#059669" />
                                            <Text style={styles.verifiedText}>Verified Agency Partner</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={[isPaymentMode && {opacity: 0.7}]}>
                                <Text style={styles.sectionTitle}>Trip Details</Text>
                                <View style={styles.datesRow}>
                                    <TouchableOpacity style={styles.dateBox} onPress={() => !isPaymentMode && openCalendar('start')} disabled={isPaymentMode}>
                                        <Text style={styles.dateLabel}>Start Date</Text>
                                        <View style={styles.dateValueRow}>
                                            <CalendarIcon size={18} color={PRIMARY_COLOR} />
                                            <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={styles.connector} />
                                    <TouchableOpacity style={styles.dateBox} onPress={() => !isPaymentMode && openCalendar('end')} disabled={isPaymentMode}>
                                        <Text style={styles.dateLabel}>End Date</Text>
                                        <View style={styles.dateValueRow}>
                                            <CalendarIcon size={18} color={PRIMARY_COLOR} />
                                            <Text style={styles.dateValue}>{endDate.toLocaleDateString()}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.switchContainer}>
                                    <TouchableOpacity style={[styles.switchOption, selectedOption === 'solo' && styles.switchActive]} onPress={() => { setSelectedOption('solo'); setNumPeople('1'); }} disabled={isPaymentMode}>
                                        <Text style={[styles.switchText, selectedOption === 'solo' && styles.switchTextActive]}>Solo Trip</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.switchOption, selectedOption === 'group' && styles.switchActive]} onPress={() => { setSelectedOption('group'); setNumPeople('2'); }} disabled={isPaymentMode}>
                                        <Text style={[styles.switchText, selectedOption === 'group' && styles.switchTextActive]}>Group</Text>
                                    </TouchableOpacity>
                                </View>

                                {selectedOption === 'group' && (
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Total Number of Guests</Text>
                                        <TextInput
                                            style={styles.modernInput}
                                            value={numPeople}
                                            onChangeText={(text) => { if (text === '' || /^[0-9]+$/.test(text)) setNumPeople(text); }}
                                            keyboardType="numeric"
                                            editable={!isPaymentMode}
                                        />

                                        {parseInt(numPeople) > 1 && (
                                            <View style={styles.guestNamesContainer}>
                                                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                                                    <Ionicons name="people-circle-outline" size={18} color={PRIMARY_COLOR} />
                                                    <Text style={[styles.inputLabel, {marginBottom: 0, marginLeft: 6}]}>Additional Guest Names</Text>
                                                </View>
                                                <Text style={{fontSize: 11, color: '#B45309', fontStyle: 'italic', marginBottom: 12}}>
                                                    * Please ensure all guests provide a valid ID upon meetup.
                                                </Text>
                                                {guestNames.map((name, index) => (
                                                    <TextInput
                                                        key={`guest-${index}`}
                                                        style={[styles.modernInput, {marginBottom: 8}]}
                                                        placeholder={`Guest ${index + 2} Full Name`}
                                                        value={name}
                                                        onChangeText={(text) => {
                                                            const newNames = [...guestNames];
                                                            newNames[index] = text;
                                                            setGuestNames(newNames);
                                                            clearBillingError('guestNames');
                                                        }}
                                                        editable={!isPaymentMode}
                                                    />
                                                ))}
                                                {!!billingErrors.guestNames && <Text style={styles.fieldErrorText}>{billingErrors.guestNames}</Text>}
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>

                            {!isPaymentMode && (
                                <>
                                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Billing Details</Text>
                                    <View style={styles.inputRow}>
                                        <View style={{ flex: 1 }}>
                                            <TextInput style={[styles.modernInput, {flex:1}]} placeholder="First Name" value={firstName} onChangeText={(value) => {
                                                setFirstName(value);
                                                clearBillingError('firstName');
                                            }} />
                                            {!!billingErrors.firstName && <Text style={styles.fieldErrorText}>{billingErrors.firstName}</Text>}
                                        </View>
                                        <View style={{width: 10}}/>
                                        <View style={{ flex: 1 }}>
                                            <TextInput style={[styles.modernInput, {flex:1}]} placeholder="Last Name" value={lastName} onChangeText={(value) => {
                                                setLastName(value);
                                                clearBillingError('lastName');
                                            }} />
                                            {!!billingErrors.lastName && <Text style={styles.fieldErrorText}>{billingErrors.lastName}</Text>}
                                        </View>
                                    </View>
                                    <View style={styles.inputRow}>
                                        <View style={{ flex: 1 }}>
                                            <TextInput style={[styles.modernInput, {flex:1}]} placeholder="Phone Number" keyboardType="phone-pad" value={phoneNumber} onChangeText={(value) => {
                                                setPhoneNumber(formatPHPhoneLocal(value));
                                                clearBillingError('phoneNumber');
                                            }} />
                                            {!!billingErrors.phoneNumber && <Text style={styles.fieldErrorText}>{billingErrors.phoneNumber}</Text>}
                                        </View>
                                        <View style={{width: 10}}/>
                                        <TextInput style={[styles.modernInput, {flex:1}]} placeholder="Country" value={country} onChangeText={setCountry} />
                                    </View>
                                    <TextInput style={[styles.modernInput, {marginTop: 10}]} placeholder="Email" keyboardType="email-address" value={email} onChangeText={(value) => {
                                        setEmail(value);
                                        clearBillingError('email');
                                    }} />
                                    {!!billingErrors.email && <Text style={styles.fieldErrorText}>{billingErrors.email}</Text>}

                                    <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Identity Verification</Text>
                                    <View style={styles.kycRow}>
                                        <View style={styles.kycItem}>
                                            <TouchableOpacity style={[styles.kycCard, validIdImage && styles.kycCardDone]} onPress={pickImage}>
                                                {isLoadingImage ? (
                                                    <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                                                ) : validIdImage ? (
                                                    <Image source={{ uri: validIdImage }} style={styles.kycImage} />
                                                ) : (
                                                    <View style={styles.kycPlaceholder}>
                                                        <UploadCloud size={24} color={PRIMARY_COLOR} />
                                                        <Text style={styles.kycText}>Upload ID</Text>
                                                    </View>
                                                )}
                                                {validIdImage && <View style={styles.checkBubble}><CheckCircle2 size={16} color="#fff" /></View>}
                                            </TouchableOpacity>
                                            <Text style={styles.kycItemLabel}>ID</Text>
                                        </View>

                                        <View style={styles.kycItem}>
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
                                            <Text style={styles.kycItemLabel}>Selfie Photo</Text>
                                        </View>
                                    </View>
                                </>
                            )}

                             {/* PAYMENT SUMMARY */}
                            <View style={styles.receiptCard}>
                                <View style={styles.receiptHeader}>
                                    <Text style={styles.receiptTitle}>Payment Summary</Text>
                                </View>
                                <View style={styles.receiptRow}>
                                    <Text style={styles.receiptLabel}>Agency Rate</Text>
                                    <Text style={styles.receiptValue}>₱ {agency.basePrice.toLocaleString()}</Text>
                                </View>
                                <View style={styles.receiptDivider} />
                                <View style={styles.receiptRow}>
                                    <Text style={styles.receiptLabel}>Total Estimated Cost</Text>
                                    <Text style={styles.receiptTotal}>₱ {totalPrice.toLocaleString()}</Text>
                                </View>
                                <View style={styles.receiptDivider} />
                                <View style={styles.receiptRow}>
                                    <Text style={[styles.receiptLabel, {color: TEXT_PRIMARY, fontWeight:'700'}]}>
                                        Down Payment ({(dynamicDpRate * 100).toFixed(0)}%)
                                    </Text>
                                    <Text style={[styles.receiptTotal, {color: PRIMARY_COLOR}]}>₱ {downPayment.toLocaleString()}</Text>
                                </View>
                                <Text style={styles.receiptNote}>
                                    {isPaymentMode ? "Due now to confirm booking" : "Payable after agency approval"}
                                </Text>
                            </View>

                            <TouchableOpacity 
                                style={styles.viewManifestButton}
                                onPress={() => setManifestModalVisible(true)}
                            >
                                <Ionicons name="people" size={20} color={PRIMARY_COLOR} />
                                <Text style={styles.viewManifestButtonText}>See other people on these dates</Text>
                            </TouchableOpacity>

                            <View style={{height: 40}} />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* BOTTOM BAR */}
                <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
                    <View>
                        <Text style={styles.bottomLabel}>
                            {isPaymentMode ? "Total Payable Now" : "Estimated Down Payment"}
                        </Text>
                        <Text style={styles.bottomPrice}>₱{downPayment.toLocaleString()}</Text>
                    </View>
                    <TouchableOpacity style={styles.payButton} onPress={handleReviewPress}>
                        <Text style={styles.payButtonText}>
                            {isPaymentMode ? "Review & Pay" : "Submit Request"}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                </SafeAreaView>

                <Modal visible={manifestModalVisible} transparent={true} animationType="slide">
                    <View style={styles.manifestModalOverlay}>
                        <View style={styles.manifestModalContainer}>
                            <View style={styles.manifestModalHeader}>
                                <Text style={styles.manifestModalTitle}>Daily Manifest</Text>
                                <TouchableOpacity onPress={() => setManifestModalVisible(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={24} color="#333" />
                                </TouchableOpacity>
                            </View>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {loadingConcurrent ? (
                                    <ActivityIndicator size="small" color={PRIMARY_COLOR} style={{marginVertical: 20}} />
                                ) : concurrentBookings.length === 0 ? (
                                    <View style={styles.emptyManifest}>
                                        <Ionicons name="calendar-outline" size={32} color="#CBD5E1" />
                                        <Text style={styles.emptyManifestText}>No other tourists scheduled for these dates.</Text>
                                    </View>
                                ) : (
                                    concurrentBookings.map((b, i) => (
                                        <View key={b.id || i} style={styles.manifestCard}>
                                            <View style={styles.manifestHeader}>
                                                <Ionicons name="person-circle" size={24} color={PRIMARY_COLOR} />
                                                <Text style={styles.manifestGuest}>{b.tourist_username || b.tourist_detail?.username || "Guest"}</Text>
                                                <View style={styles.manifestPaxBadge}>
                                                    <Text style={styles.manifestPaxText}>{b.num_guests} Pax</Text>
                                                </View>
                                            </View>
                                            <View style={styles.manifestRow}>
                                                <Text style={styles.manifestLabel}>Dates:</Text>
                                                <Text style={styles.manifestValue}>{b.check_in} to {b.check_out}</Text>
                                            </View>
                                            {b.meetup_location && (
                                                <View style={styles.manifestRow}>
                                                    <Text style={styles.manifestLabel}>Pickup:</Text>
                                                    <Text style={styles.manifestValue}>{b.meetup_location}</Text>
                                                </View>
                                            )}
                                        </View>
                                    ))
                                )}
                                <View style={{height: 20}} />
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

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
                                current={formatDateForCalendar(startDate)}
                                minDate={formatDateForCalendar(new Date())}
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

                {isModalOpen && (
                    <AgencyPaymentReviewModal 
                        isModalOpen={isModalOpen} 
                        setIsModalOpen={setIsModalOpen}
                        paymentData={{
                            agency: agency,
                            startDate: startDate,
                            endDate: endDate,
                            firstName: firstName,
                            lastName: lastName,
                            phoneNumber: normalizePHPhone(phoneNumber) || phoneNumber,
                            country: country,
                            email: email,
                            basePrice: agency.basePrice,
                            totalPrice: totalPrice,
                            downPayment: downPayment,
                            balanceDue: balanceDue,
                            bookingId: params.bookingId,
                            placeId: placeId,
                            paymentMethod: null, 
                            groupType: selectedOption,
                            numberOfPeople: selectedOption === 'group' ? (parseInt(numPeople) < 2 ? 2 : parseInt(numPeople)) : 1,
                            additionalGuestNames: guestNames,
                            validIdImage: validIdImage,
                            userSelfieImage: userSelfieImage, 
                            isNewKycImage: validIdImage && validIdImage.startsWith('file://')
                        }}
                    />
                )}
            </SafeAreaView>
        </View>
    );
};

export default AgencyBookingDetails;
