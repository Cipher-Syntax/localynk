import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StatusBar, StyleSheet, Image, TextInput, TouchableOpacity, Pressable, ActivityIndicator, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker'; 
import { useAuth } from '../../context/AuthContext'; 
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PaymentReviewModal } from '../../components/payment';

const AgencyBookingDetails = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const { agencyName, agencyId, placeName, bookingId, placeId } = params;
    
    const isConfirmed = !!bookingId;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingImage, setIsLoadingImage] = useState(false);

    const agency = {
        id: agencyId,
        name: agencyName || "Selected Agency",
        purpose: placeName ? `Tour at ${placeName}` : "Private Tour", 
        address: "Verified Agency Partner",
        basePrice: 1000, 
        serviceFee: 100,
    };

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [selectingType, setSelectingType] = useState('start');

    const [selectedOption, setSelectedOption] = useState('solo');
    const [numPeople, setNumPeople] = useState('1');

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [country, setCountry] = useState('');
    const [email, setEmail] = useState('');
    
    const [validIdImage, setValidIdImage] = useState(null);
    const [userSelfieImage, setUserSelfieImage] = useState(null);

    const [totalPrice, setTotalPrice] = useState(agency.basePrice + agency.serviceFee);

    const formatDateForCalendar = (date) => date.toISOString().split('T')[0];

    const getImageUrl = (imgPath) => {
        if (!imgPath || imgPath.startsWith('http') || imgPath.startsWith('file://')) return imgPath;
        return imgPath; 
    };

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
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.max(Math.round(Math.abs((endDate - startDate) / oneDay)) + 1, 1);
        let groupSize = parseInt(numPeople) || 0;
        
        let multiplier = selectedOption === 'solo' ? 1 : (groupSize < 2 ? 2 : groupSize);
        const baseCost = (diffDays * agency.basePrice * multiplier) + agency.serviceFee;
        
        setTotalPrice(baseCost);
    }, [startDate, endDate, selectedOption, numPeople]);

    const getMarkedDates = useMemo(() => {
        const marked = {};
        const startStr = formatDateForCalendar(startDate);
        const endStr = formatDateForCalendar(endDate);
        marked[startStr] = { selected: true, startingDay: true, color: '#00A8FF', textColor: '#fff' };
        marked[endStr] = { selected: true, endingDay: true, color: '#00A8FF', textColor: '#fff' };
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
            Alert.alert("Permission Denied", "Camera permission is required.");
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
        if (!validIdImage) {
            Alert.alert("Valid ID Required", "Please upload a valid government ID for verification purposes before proceeding.");
            return;
        }
        if (!userSelfieImage) {
            Alert.alert("Selfie Required", "Please take a selfie for identity verification.");
            return;
        }
        setIsModalOpen(true);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <SafeAreaView>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                <View style={styles.header}>
                    <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']} style={styles.overlay} />
                    <Text style={styles.headerTitle}>REQUEST TO BOOK</Text>
                </View>

                <View style={styles.contentContainer}>
                    {/* Agency Info Card */}
                    <View style={styles.guideInfoCard}>
                        <View style={styles.guideHeader}>
                            <View style={[styles.guideIcon, styles.agencyIconBg]}>
                                <Ionicons name="business" size={32} color="#fff" />
                            </View>
                            <View style={styles.guideInfo}>
                                <Text style={styles.guideName}>{agency.name}</Text>
                                <Text style={styles.guideDetail}>{agency.purpose}</Text>
                                <Text style={styles.guideDetail}>{agency.address}</Text>
                                <View style={styles.verifiedBadge}>
                                    <Ionicons name="checkmark-circle" size={12} color="#00C853" />
                                    <Text style={styles.verifiedText}>Agency Verified</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Date Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Dates</Text>
                        <View style={styles.dateRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>Start Date</Text>
                                <Pressable style={styles.dateInput} onPress={() => openCalendar('start')} disabled={isConfirmed}>
                                    <Text style={styles.dateInputText}>{startDate.toLocaleDateString()}</Text>
                                    <Ionicons name="calendar-outline" size={18} color="#8B98A8" />
                                </Pressable>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.inputLabel}>End Date</Text>
                                <Pressable style={styles.dateInput} onPress={() => openCalendar('end')} disabled={isConfirmed}>
                                    <Text style={styles.dateInputText}>{endDate.toLocaleDateString()}</Text>
                                    <Ionicons name="calendar-outline" size={18} color="#8B98A8" />
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    {/* Calendar Modal */}
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

                    {/* Booking Type */}
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
                                disabled={isConfirmed}
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

                    {/* UPDATED Price Breakdown */}
                    <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Agency Daily Rate</Text>
                            <Text style={styles.priceValue}>₱ {agency.basePrice.toLocaleString()}</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Platform Service Fee</Text>
                            <Text style={styles.priceValue}>₱ {agency.serviceFee.toLocaleString()}</Text>
                        </View>
                        <View style={styles.priceDivider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Estimated Total Cost</Text>
                            <Text style={styles.totalValue}>₱ {totalPrice.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* Billing Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Billing Information</Text>
                        <View style={styles.billingRow}>
                            <TextInput style={styles.billingInput} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
                            <TextInput style={styles.billingInput} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
                        </View>
                        <View style={styles.billingRow}>
                            <TextInput style={styles.billingInput} placeholder="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} />
                            <TextInput style={styles.billingInput} placeholder="Country" value={country} onChangeText={setCountry} />
                        </View>
                        <TextInput style={[styles.billingInput, styles.fullWidthInput]} placeholder="Email" value={email} onChangeText={setEmail} />
                    </View>

                    {/* KYC Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Identity Verification (KYC)</Text>
                        <Text style={styles.helperText}>For safety, please provide a valid ID and a realtime selfie.</Text>
                        
                        <View style={{flexDirection: 'row', gap: 10}}>
                             {/* Valid ID */}
                             <TouchableOpacity style={[styles.uploadContainer, {flex: 1}]} onPress={pickImage}>
                                {isLoadingImage ? (
                                    <ActivityIndicator size="large" color="#00A8FF" />
                                ) : validIdImage ? (
                                    <Image source={{ uri: validIdImage }} style={styles.previewImage} />
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Ionicons name="id-card-outline" size={32} color="#00A8FF" />
                                        <Text style={styles.uploadText}>Upload ID</Text>
                                    </View>
                                )}
                                {validIdImage && (
                                     <View style={styles.checkBadge}>
                                        <Ionicons name="checkmark-circle" size={20} color="#00C853" />
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Selfie Camera */}
                            <TouchableOpacity style={[styles.uploadContainer, {flex: 1}]} onPress={takeSelfie}>
                                {userSelfieImage ? (
                                    <Image source={{ uri: userSelfieImage }} style={styles.previewImage} />
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Ionicons name="camera-outline" size={32} color="#00A8FF" />
                                        <Text style={styles.uploadText}>Take Selfie</Text>
                                    </View>
                                )}
                                {userSelfieImage && (
                                     <View style={styles.checkBadge}>
                                        <Ionicons name="checkmark-circle" size={20} color="#00C853" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.confirmButton} onPress={handleReviewPress}>
                        <Text style={styles.confirmButtonText}>Review Booking Request</Text>
                    </TouchableOpacity>
                </View>

                {isModalOpen && (
                    <PaymentReviewModal 
                        isModalOpen={isModalOpen} 
                        setIsModalOpen={setIsModalOpen}
                        paymentData={{
                            agency: agency,
                            startDate: startDate,
                            endDate: endDate,
                            firstName: firstName,
                            lastName: lastName,
                            phoneNumber: phoneNumber,
                            country: country,
                            email: email,
                            basePrice: agency.basePrice,
                            serviceFee: agency.serviceFee,
                            totalPrice: totalPrice,
                            bookingId: params.bookingId,
                            placeId: placeId,
                            paymentMethod: null, 
                            groupType: selectedOption,
                            numberOfPeople: selectedOption === 'group' ? (parseInt(numPeople) < 2 ? 2 : parseInt(numPeople)) : 1,
                            validIdImage: validIdImage,
                            userSelfieImage: userSelfieImage, 
                            isNewKycImage: validIdImage && validIdImage.startsWith('file://')
                        }}
                    />
                )}
            </SafeAreaView>
        </ScrollView>
    );
};

export default AgencyBookingDetails;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    contentContainer: { padding: 16, paddingBottom: 30 },
    guideInfoCard: { backgroundColor: '#F5F7FA', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#E0E6ED', marginBottom: 20 },
    guideHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    guideIcon: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#1A2332', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    agencyIconBg: { backgroundColor: '#00A8FF' }, 
    guideInfo: { flex: 1 },
    guideName: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    guideDetail: { fontSize: 12, color: '#8B98A8', marginTop: 2 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    verifiedText: { fontSize: 11, color: '#00C853', fontWeight: '600' },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A2332', marginBottom: 12 },
    dateRow: { flexDirection: 'row', gap: 12 },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1A2332', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
    dateInputText: { fontSize: 13, color: '#1A2332', fontWeight: '500' },
    inputLabel: { fontSize: 13, color: '#1A2332', fontWeight: '600', marginBottom: 5 },
    selectionButtons: { flexDirection: 'row', gap: 10 },
    selectionButton: { flex: 1, borderWidth: 1, borderColor: '#E0E6ED', paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#F5F7FA' },
    selectionButtonActive: { backgroundColor: '#00A8FF', borderColor: '#00A8FF' },
    selectionText: { fontSize: 13, color: '#1A2332', fontWeight: '600' },
    selectionTextActive: { color: '#fff' },
    peopleInputContainer: { marginTop: 12 },
    peopleInput: { borderWidth: 1, borderColor: '#1A2332', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', fontSize: 13, color: '#1A2332' },
    priceCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#1A2332', borderRadius: 12, padding: 16, marginBottom: 20 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    priceLabel: { fontSize: 13, color: '#1A2332', fontWeight: '500' },
    priceValue: { fontSize: 13, color: '#1A2332', fontWeight: '600' },
    priceDivider: { height: 1, backgroundColor: '#1A2332', marginVertical: 10 },
    totalLabel: { fontSize: 13, fontWeight: '700', color: '#1A2332' },
    totalValue: { fontSize: 13, fontWeight: '700', color: '#1A2332' },
    billingRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    billingInput: { flex: 1, borderWidth: 1, borderColor: '#1A2332', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1A2332', backgroundColor: '#fff' },
    fullWidthInput: { width: '100%' },
    confirmButton: { backgroundColor: '#00A8FF', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    confirmButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    
    // Updated Upload Container for side-by-side
    uploadContainer: { height: 130, borderWidth: 1, borderColor: '#E0E6ED', borderStyle: 'dashed', borderRadius: 12, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' },
    uploadPlaceholder: { alignItems: 'center' },
    uploadText: { marginTop: 10, fontSize: 13, fontWeight: '600', color: '#00A8FF' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    reuploadOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, gap: 6 },
    reuploadText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    checkBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: '#fff', borderRadius: 10 },
    helperText: { fontSize: 12, color: '#8B98A8', marginBottom: 12 },

    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A2332' },
    modalSubText: { fontSize: 12, color: '#888', marginBottom: 15 },
});