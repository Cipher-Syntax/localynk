import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    StatusBar,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    Pressable,
    ActivityIndicator,
    Alert,
    Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

// Internal Imports
import { PaymentReviewModal } from '../../components/payment';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const Payment = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user, refreshUser } = useAuth();

    const {
        entityName,
        guideName,
        placeName,
        bookingId,
        entityId,
        guideId,
        checkInDate,
        checkOutDate,
        numGuests,
        bookingType,
        assignedGuides,
        basePrice,
        accommodationPrice,
        additionalFee,
        placeId
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [selectingType, setSelectingType] = useState('start');
    const [isLoadingImage, setIsLoadingImage] = useState(false);

    const tourCost = basePrice ? parseFloat(basePrice) : 500;
    const accomCost = accommodationPrice ? parseFloat(accommodationPrice) : 0;
    const combinedBasePrice = tourCost + accomCost;
    const extraPersonFee = additionalFee ? parseFloat(additionalFee) : 0;

    const bookingEntity = {
        id: resolvedId,
        name: resolvedName,
        purpose: placeName ? `Tour at ${placeName}` : "Private Tour",
        address: isAgency ? "Verified Agency" : "Local Guide",
        basePrice: combinedBasePrice,
        serviceFee: 50,
    };

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
    const [totalPrice, setTotalPrice] = useState(0);

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('gcash');
    const paymentOptions = [
        { key: 'gcash', name: 'GCash' },
        { key: 'paymaya', name: 'Maya' },
        { key: 'card', name: 'Card' },
        { key: 'grab_pay', name: 'GrabPay' },
        { key: 'shopeepay', name: 'ShopeePay' },
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

    const handleReviewPress = () => {
        if (!isConfirmed && !validIdImage) {
            Alert.alert("KYC Required", "Please upload a valid government ID to proceed.");
            return;
        }
        setIsModalOpen(true);
    };

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
                    if (isAgency && bookingDetails.assigned_guides_detail) {
                        setAssignedGuidesList(bookingDetails.assigned_guides_detail);
                    }
                } catch (error) {
                    console.error("Failed to fetch booking details:", error);
                }
            }
        };
        fetchBookingDetails();
    }, [isConfirmed, bookingId]);

    useEffect(() => {
        const oneDay = 24 * 60 * 60 * 1000;
        const numDays = Math.max(Math.round(Math.abs((endDate - startDate) / oneDay)) + 1, 1);
        let groupSize = parseInt(numPeople) || 1;
        if (selectedOption === 'solo') groupSize = 1;
        else if (groupSize < 2) groupSize = 2;
        const extraPeople = Math.max(0, groupSize - 1);
        const totalExtraFee = extraPeople * extraPersonFee;
        const dailyTotal = combinedBasePrice + totalExtraFee;
        const grandTotal = dailyTotal * numDays;
        setTotalPrice(grandTotal);
    }, [startDate, endDate, selectedOption, numPeople, combinedBasePrice, extraPersonFee]);

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
                                            <Text style={styles.modalTitle}>
                                                Select {selectingType === 'start' ? 'Start' : 'End'} Date
                                            </Text>
                                            <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                                                <Ionicons name="close" size={24} color="#333" />
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.modalSubText}>Gray dates are unavailable.</Text>
                                        <Calendar
                                            current={new Date().toISOString().split('T')[0]}
                                            minDate={new Date().toISOString().split('T')[0]}
                                            markedDates={getMarkedDates}
                                            onDayPress={onDayPress}
                                            theme={{
                                                todayTextColor: '#00A8FF',
                                                arrowColor: '#00A8FF',
                                                textMonthFontWeight: 'bold',
                                                textDayHeaderFontWeight: '600'
                                            }}
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
                                        <Text style={[styles.selectionText, selectedOption === 'solo' && styles.selectionTextActive]}>
                                            Solo
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.selectionButton, selectedOption === 'group' && styles.selectionButtonActive]}
                                        onPress={() => { setSelectedOption('group'); setNumPeople('2'); }}
                                    >
                                        <Text style={[styles.selectionText, selectedOption === 'group' && styles.selectionTextActive]}>
                                            Group
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {selectedOption === 'group' && (
                                    <View style={styles.peopleInputContainer}>
                                        <Text style={styles.inputLabel}>Number of people:</Text>
                                        <TextInput
                                            style={styles.peopleInput}
                                            value={numPeople}
                                            editable={!isConfirmed}
                                            onChangeText={(text) => { if (text === '' || /^[0-9]+$/.test(text)) setNumPeople(text); }}
                                            onBlur={() => { const val = parseInt(numPeople); if (!val || val < 2) setNumPeople('2'); }}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                )}
                            </View>
                        </>
                    )}

                    {isConfirmed && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Select Payment Method</Text>
                            <View style={styles.paymentListContainer}>
                                {paymentOptions.map((option) => {
                                    // Helper for Icons & Colors based on option key
                                    let iconName = 'wallet-outline';
                                    let iconColor = '#1A2332';
                                    let subLabel = 'E-Wallet';

                                    switch (option.key) {
                                        case 'gcash':
                                            iconName = 'phone-portrait-outline';
                                            iconColor = '#007DFE'; // GCash Blue
                                            subLabel = 'Pay via GCash App';
                                            break;
                                        case 'paymaya':
                                            iconName = 'card-outline';
                                            iconColor = '#2ECC71'; // Maya Greenish
                                            subLabel = 'Pay via Maya';
                                            break;
                                        case 'card':
                                            iconName = 'card';
                                            iconColor = '#F39C12'; // Gold/Orange
                                            subLabel = 'Visa / Mastercard';
                                            break;
                                        case 'grab_pay':
                                            iconName = 'car-sport-outline';
                                            iconColor = '#00B14F'; // Grab Green
                                            subLabel = 'Pay via Grab';
                                            break;
                                        case 'shopeepay':
                                            iconName = 'bag-handle-outline';
                                            iconColor = '#EE4D2D'; // Shopee Orange
                                            subLabel = 'Pay via Shopee';
                                            break;
                                    }

                                    const isSelected = selectedPaymentMethod === option.key;

                                    return (
                                        <TouchableOpacity
                                            key={option.key}
                                            style={[
                                                styles.paymentMethodCard,
                                                isSelected && styles.paymentMethodCardSelected
                                            ]}
                                            onPress={() => setSelectedPaymentMethod(option.key)}
                                            activeOpacity={0.9}
                                        >
                                            <View style={styles.paymentMethodLeft}>
                                                <View style={[styles.iconContainer, { backgroundColor: isSelected ? iconColor : '#F5F7FA' }]}>
                                                    <Ionicons
                                                        name={iconName}
                                                        size={24}
                                                        color={isSelected ? '#FFF' : iconColor}
                                                    />
                                                </View>
                                                <View>
                                                    <Text style={styles.methodTitle}>{option.name}</Text>
                                                    <Text style={styles.methodSubtitle}>{subLabel}</Text>
                                                </View>
                                            </View>

                                            {/* Radio Button Indicator */}
                                            <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                                                {isSelected && <View style={styles.radioButtonInner} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Base Price</Text>
                            <Text style={styles.priceValue}>₱ {combinedBasePrice.toLocaleString()}</Text>
                        </View>
                        {extraPersonFee > 0 && selectedOption === 'group' && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>
                                    Extra Fee (₱{extraPersonFee} x {Math.max(0, (parseInt(numPeople) || 1) - 1)} people)
                                </Text>
                                <Text style={styles.priceValue}>
                                    ₱ {(extraPersonFee * Math.max(0, (parseInt(numPeople) || 1) - 1)).toLocaleString()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Number of Days</Text>
                            <Text style={styles.priceValue}>
                                {Math.max(Math.floor(Math.abs((endDate - startDate) / (24 * 60 * 60 * 1000))) + 1, 1)} day(s)
                            </Text>
                        </View>
                        <View style={styles.priceDivider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Total to Pay</Text>
                            <Text style={styles.totalValue}>₱ {totalPrice.toLocaleString()}</Text>
                        </View>
                    </View>

                    {!isConfirmed && (
                        <>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Billing Information</Text>
                                <View style={styles.billingRow}>
                                    <TextInput
                                        style={styles.billingInput}
                                        placeholder="First Name"
                                        value={firstName}
                                        onChangeText={setFirstName}
                                    />
                                    <TextInput
                                        style={styles.billingInput}
                                        placeholder="Last Name"
                                        value={lastName}
                                    />
                                </View>
                                <View style={styles.billingRow}>
                                    <TextInput
                                        style={styles.billingInput}
                                        placeholder="Phone Number"
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                    />
                                    <TextInput
                                        style={styles.billingInput}
                                        placeholder="Country"
                                        value={country}
                                        onChangeText={setCountry}
                                    />
                                </View>
                                <TextInput
                                    style={[styles.billingInput, styles.fullWidthInput]}
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Identity Verification (KYC)</Text>
                                <TouchableOpacity style={styles.uploadContainer} onPress={pickImage}>
                                    {isLoadingImage ? (
                                        <ActivityIndicator size="large" color="#00A8FF" />
                                    ) : validIdImage ? (
                                        <View style={styles.imagePreviewContainer}>
                                            <Image source={{ uri: validIdImage }} style={styles.previewImage} />
                                            <View style={styles.reuploadOverlay}>
                                                <Ionicons
                                                    name={validIdImage.startsWith('http') ? "checkmark-circle" : "camera"}
                                                    size={20}
                                                    color="#fff"
                                                />
                                                <Text style={styles.reuploadText}>
                                                    {validIdImage.startsWith('http') ? "KYC Verified" : "Change ID"}
                                                </Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <View style={styles.uploadPlaceholder}>
                                            <Ionicons name="cloud-upload-outline" size={40} color="#8B98A8" />
                                            <Text style={styles.uploadText}>Upload Valid ID</Text>
                                            <Text style={styles.helperText}>This will be saved to your profile.</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {isAgency && assignedGuidesList.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Assigned Guides</Text>
                            <View style={styles.assignedGuidesContainer}>
                                {assignedGuidesList.map((guide, index) => (
                                    <View key={index} style={styles.assignedGuideCard}>
                                        <Image
                                            source={{ uri: guide.profile_picture || 'https://via.placeholder.com/50' }}
                                            style={styles.assignedGuideImage}
                                        />
                                        <Text style={styles.assignedGuideName}>
                                            {guide.first_name} {guide.last_name}
                                        </Text>
                                        <Text style={styles.assignedGuideRole}>Licensed Local Guide</Text>
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
                            startDate,
                            endDate,
                            firstName,
                            lastName,
                            phoneNumber,
                            country,
                            email,
                            basePrice: bookingEntity.basePrice,
                            serviceFee: bookingEntity.serviceFee,
                            totalPrice,
                            bookingId: params.bookingId,
                            placeId: params.placeId,
                            paymentMethod: isConfirmed ? selectedPaymentMethod : null,
                            groupType: selectedOption,
                            numberOfPeople: selectedOption === 'group' ? (parseInt(numPeople) < 2 ? 2 : parseInt(numPeople)) : 1,
                            validIdImage,
                            isNewKycImage: validIdImage && validIdImage.startsWith('file://')
                        }}
                    />
                )}
            </SafeAreaView>
        </ScrollView>
    );
};

export default Payment;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center'
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25
    },
    headerTitle: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 30
    },
    guideInfoCard: {
        backgroundColor: '#F5F7FA',
        borderRadius: 15,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        marginBottom: 20
    },
    guideHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    guideIcon: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#1A2332',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    agencyIconBg: {
        backgroundColor: '#00A8FF'
    },
    guideInfo: {
        flex: 1
    },
    guideName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A2332'
    },
    guideDetail: {
        fontSize: 12,
        color: '#8B98A8',
        marginTop: 2
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4
    },
    verifiedText: {
        fontSize: 11,
        color: '#00C853',
        fontWeight: '600'
    },
    section: {
        marginBottom: 20
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A2332',
        marginBottom: 12
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1A2332',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff'
    },
    dateInputText: {
        fontSize: 13,
        color: '#1A2332',
        fontWeight: '500'
    },
    inputLabel: {
        fontSize: 13,
        color: '#1A2332',
        fontWeight: '600',
        marginBottom: 5
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        elevation: 5
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A2332'
    },
    modalSubText: {
        fontSize: 12,
        color: '#888',
        marginBottom: 15
    },
    selectionButtons: {
        flexDirection: 'row',
        gap: 10
    },
    selectionButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#F5F7FA'
    },
    selectionButtonActive: {
        backgroundColor: '#00A8FF',
        borderColor: '#00A8FF'
    },
    selectionText: {
        fontSize: 13,
        color: '#1A2332',
        fontWeight: '600'
    },
    selectionTextActive: {
        color: '#fff'
    },
    peopleInputContainer: {
        marginTop: 12
    },
    peopleInput: {
        borderWidth: 1,
        borderColor: '#1A2332',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fff',
        fontSize: 13,
        color: '#1A2332'
    },
    priceCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#1A2332',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    priceLabel: {
        fontSize: 13,
        color: '#1A2332',
        fontWeight: '500'
    },
    priceValue: {
        fontSize: 13,
        color: '#1A2332',
        fontWeight: '600'
    },
    priceDivider: {
        height: 1,
        backgroundColor: '#1A2332',
        marginVertical: 10
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A2332'
    },
    totalValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A2332'
    },
    billingRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12
    },
    billingInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#1A2332',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        color: '#1A2332',
        backgroundColor: '#fff'
    },
    fullWidthInput: {
        width: '100%'
    },
    helperText: {
        fontSize: 12,
        color: '#8B98A8',
        marginBottom: 12,
        lineHeight: 18,
        textAlign: 'center'
    },
    uploadContainer: {
        height: 150,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        borderStyle: 'dashed',
        borderRadius: 12,
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    uploadPlaceholder: {
        alignItems: 'center'
    },
    uploadText: {
        marginTop: 10,
        fontSize: 13,
        fontWeight: '600',
        color: '#00A8FF'
    },
    imagePreviewContainer: {
        width: '100%',
        height: '100%',
        position: 'relative'
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    reuploadOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 6
    },
    reuploadText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    assignedGuidesContainer: {
        flexDirection: 'column',
        gap: 10
    },
    assignedGuideCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center'
    },
    assignedGuideImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 10
    },
    assignedGuideName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A2332',
        textAlign: 'center',
        marginBottom: 4
    },
    assignedGuideRole: {
        fontSize: 11,
        color: '#8B98A8',
        textAlign: 'center'
    },
    confirmButton: {
        backgroundColor: '#00A8FF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700'
    },
    // --- New Payment Method Styles ---
    paymentListContainer: {
        flexDirection: 'column',
        gap: 12,
    },
    paymentMethodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        // subtle shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    paymentMethodCardSelected: {
        borderColor: '#00A8FF',
        backgroundColor: '#F0F9FF', // Very light blue bg when selected
    },
    paymentMethodLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A2332',
    },
    methodSubtitle: {
        fontSize: 12,
        color: '#8B98A8',
        marginTop: 2,
    },
    radioButton: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: '#00A8FF',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#00A8FF',
    },
});