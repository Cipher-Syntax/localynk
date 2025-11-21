import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, StyleSheet, Image, TextInput, TouchableOpacity, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { PaymentReviewModal } from '../../components/payment';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext'; 
import { useLocalSearchParams } from 'expo-router';
import api from '../../api/api'; 

const Payment = () => {
    const params = useLocalSearchParams();
    
    // Debugging logs to check data arrival
    console.log("--- PAYMENT SCREEN INIT ---");
    console.log("Params Received:", params);

    // FIX: Destructure both specific (guide) and generic (entity) param names
    const { 
        entityName, guideName, // Check for both
        basePrice, placeName, bookingId, 
        entityId, guideId,     // Check for both
        checkInDate, checkOutDate, numGuests, bookingType, assignedGuides 
    } = params;
    
    const isConfirmed = !!bookingId;
    const isAgency = bookingType === 'agency';

    // FIX: Resolve the actual Name and ID
    const resolvedName = entityName || guideName || (isAgency ? "Selected Agency" : "Selected Guide");
    const resolvedId = entityId || guideId;

    // 1. Initialize Guides State safely
    const [assignedGuidesList, setAssignedGuidesList] = useState(() => {
        try {
            if (assignedGuides && typeof assignedGuides === 'string') {
                const parsed = JSON.parse(assignedGuides);
                return Array.isArray(parsed) ? parsed : [];
            }
            return [];
        } catch (e) {
            console.error("Error parsing initial guides param:", e);
            return [];
        }
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth(); 
    const [isLoadingImage, setIsLoadingImage] = useState(false);

    const numericBasePrice = basePrice ? parseFloat(basePrice) : 500;

    // Create a generic "Booking Entity" object using the RESOLVED values
    const bookingEntity = {
        id: resolvedId, // This ensures the ID is passed correctly to the modal
        name: resolvedName,
        purpose: placeName ? `Tour at ${placeName}` : "Private Tour", 
        address: isAgency ? "Verified Agency" : "Local Guide",
        basePrice: numericBasePrice,
        serviceFee: 50,
    };

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);

    const [selectedOption, setSelectedOption] = useState('solo');
    const [numPeople, setNumPeople] = useState('1');

    // Billing State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [country, setCountry] = useState('');
    const [email, setEmail] = useState('');
    
    const [validIdImage, setValidIdImage] = useState(null);
    const [totalPrice, setTotalPrice] = useState(bookingEntity.basePrice - bookingEntity.serviceFee);

    // Auto-fill user info
    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setEmail(user.email || '');
            setPhoneNumber(user.phone_number || ''); 
            setCountry(user.location || ''); 
        }
    }, [user]);

    // Pre-fill booking specific details
    useEffect(() => {
        if (isConfirmed && checkInDate && checkOutDate && numGuests) {
            setStartDate(new Date(checkInDate));
            setEndDate(new Date(checkOutDate));
            setNumPeople(String(numGuests)); 
            setSelectedOption(parseInt(numGuests) > 1 ? 'group' : 'solo');
        }
    }, [isConfirmed, checkInDate, checkOutDate, numGuests]);

    // Fetch full booking details (Logic includes fallback for Image AND Guides)
    useEffect(() => {
        const fetchBookingDetails = async () => {
            if (isConfirmed && bookingId) {
                try {
                    console.log("Fetching fresh booking details for ID:", bookingId);
                    const response = await api.get(`/api/bookings/${bookingId}/`);
                    const bookingDetails = response.data;
                    
                    // 2. Set Image if exists
                    if (bookingDetails.tourist_valid_id_image) {
                        setValidIdImage(bookingDetails.tourist_valid_id_image);
                    }

                    // 3. FAILSAFE: If params failed to pass guides, fetch them from API response
                    if (isAgency && assignedGuidesList.length === 0 && bookingDetails.assigned_guides_detail) {
                        console.log("Recovered guides from API:", bookingDetails.assigned_guides_detail.length);
                        setAssignedGuidesList(bookingDetails.assigned_guides_detail);
                    }

                } catch (error) {
                    console.error("Failed to fetch booking details:", error);
                }
            }
        };
        fetchBookingDetails();
    }, [isConfirmed, bookingId]); 

    // Calculate Price
    useEffect(() => {
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.max(Math.round(Math.abs((endDate - startDate) / oneDay)) + 1, 1);
        let groupSize = parseInt(numPeople) || 0;
        let multiplier = selectedOption === 'solo' ? 1 : (groupSize < 2 ? 2 : groupSize);
        
        const baseCost = diffDays * bookingEntity.basePrice * multiplier;
        setTotalPrice(baseCost);
    }, [startDate, endDate, selectedOption, numPeople]);

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

    const handleReviewPress = () => {
        if (!validIdImage) {
            Alert.alert("Valid ID Required", "Please upload a valid government ID.");
            return;
        }
        setIsModalOpen(true);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <SafeAreaView>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    <Text style={styles.headerTitle}>
                        {isConfirmed ? "COMPLETE PAYMENT" : "REQUEST TO BOOK"}
                    </Text>
                </View>

                <View style={styles.contentContainer}>
                    {/* Guide/Agency Header */}
                    <View style={styles.guideInfoCard}>
                        <View style={styles.guideHeader}>
                            <View style={[styles.guideIcon, isAgency && styles.agencyIconBg]}>
                                {isAgency ? (
                                    <Ionicons name="business" size={32} color="#fff" />
                                ) : (
                                    <User size={32} color="#fff" />
                                )}
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

                    {/* Dates */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Set Dates</Text>
                        <View style={styles.dateRow}>
                            <Pressable style={styles.dateInput} onPress={() => setStartPickerVisible(true)} disabled={isConfirmed}>
                                <Text style={styles.dateInputText}>{startDate.toLocaleDateString()}</Text>
                                <Ionicons name="calendar-outline" size={18} color="#8B98A8" />
                            </Pressable>
                            <Pressable style={styles.dateInput} onPress={() => setEndPickerVisible(true)} disabled={isConfirmed}>
                                <Text style={styles.dateInputText}>{endDate.toLocaleDateString()}</Text>
                                <Ionicons name="calendar-outline" size={18} color="#8B98A8" />
                            </Pressable>
                        </View>
                        <DateTimePickerModal
                            isVisible={isStartPickerVisible}
                            mode="date"
                            onConfirm={(date) => { setStartDate(date); setStartPickerVisible(false); }}
                            onCancel={() => setStartPickerVisible(false)}
                        />
                        <DateTimePickerModal
                            isVisible={isEndPickerVisible}
                            mode="date"
                            onConfirm={(date) => { setEndDate(date); setEndPickerVisible(false); }}
                            onCancel={() => setEndPickerVisible(false)}
                        />
                    </View>

                    {/* Booking Type */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Booking Type</Text>
                        <View style={styles.selectionButtons}>
                            <TouchableOpacity
                                style={[styles.selectionButton, selectedOption === 'solo' && styles.selectionButtonActive]}
                                onPress={() => { setSelectedOption('solo'); setNumPeople('1'); }}
                                disabled={isConfirmed}
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
                                    editable={!isConfirmed}
                                    onChangeText={(text) => { if (text === '' || /^[0-9]+$/.test(text)) setNumPeople(text); }}
                                    onBlur={() => { const val = parseInt(numPeople); if (!val || val < 2) setNumPeople('2'); }}
                                    keyboardType="numeric"
                                />
                            </View>
                        )}
                    </View>

                    {/* Price Card */}
                    <View style={styles.priceCard}>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Base Price</Text>
                            <Text style={styles.priceValue}>₱ {bookingEntity.basePrice.toLocaleString()}</Text>
                        </View>
                        {selectedOption === 'group' && (
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Group Size</Text>
                                <Text style={styles.priceValue}>{(parseInt(numPeople) < 2 ? 2 : parseInt(numPeople)) || 2} person(s)</Text>
                            </View>
                        )}
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>Days</Text>
                            <Text style={styles.priceValue}>{Math.max(Math.round(Math.abs((endDate - startDate) / (24 * 60 * 60 * 1000))) + 1, 1)} day(s)</Text>
                        </View>
                        <View style={styles.priceDivider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Total to Pay</Text>
                            <Text style={styles.totalValue}>₱ {totalPrice.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* Billing */}
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

                    {/* ID Verification */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Identity Verification</Text>
                        <TouchableOpacity style={styles.uploadContainer} onPress={pickImage}>
                            {isLoadingImage ? (
                                <ActivityIndicator size="large" color="#00A8FF" />
                            ) : validIdImage ? (
                                <View style={styles.imagePreviewContainer}>
                                    <Image source={{ uri: validIdImage }} style={styles.previewImage} />
                                    <View style={styles.reuploadOverlay}>
                                        <Ionicons name="camera" size={20} color="#fff" />
                                        <Text style={styles.reuploadText}>Change ID</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <Ionicons name="cloud-upload-outline" size={40} color="#8B98A8" />
                                    <Text style={styles.uploadText}>Tap to upload Valid ID</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* --- NEW: ASSIGNED GUIDES SECTION (Using State Variable) --- */}
                    {isAgency && assignedGuidesList.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Assigned Guides</Text>
                            <Text style={styles.helperText}>
                                The agency has assigned the following guides for your trip:
                            </Text>
                            
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

                    {/* Confirm */}
                    <TouchableOpacity style={styles.confirmButton} onPress={handleReviewPress}>
                        <Text style={styles.confirmButtonText}>
                            {isConfirmed ? "Proceed to Payment" : "Review Booking Request"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {isModalOpen && (
                    <PaymentReviewModal 
                        isModalOpen={isModalOpen} 
                        setIsModalOpen={setIsModalOpen}
                        paymentData={{
                            // Pass the bookingEntity as 'agency' or 'guide' based on type
                            [isAgency ? 'agency' : 'guide']: bookingEntity, 
                            startDate, endDate, firstName, lastName, phoneNumber, country, email,
                            basePrice: bookingEntity.basePrice,
                            serviceFee: bookingEntity.serviceFee,
                            totalPrice,
                            bookingId: params.bookingId,
                            paymentMethod: isConfirmed ? 'gcash' : null,
                            groupType: selectedOption,
                            numberOfPeople: selectedOption === 'group' ? (parseInt(numPeople) < 2 ? 2 : parseInt(numPeople)) : 1,
                            validIdImage,
                        }}
                    />
                )}
            </SafeAreaView>
        </ScrollView>
    );
};

export default Payment;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    contentContainer: { padding: 16, paddingBottom: 30 },
    
    // Guide/Agency Card
    guideInfoCard: { backgroundColor: '#F5F7FA', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#E0E6ED', marginBottom: 20 },
    guideHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    guideIcon: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#1A2332', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    agencyIconBg: { backgroundColor: '#00A8FF' }, 
    guideInfo: { flex: 1 },
    guideName: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    guideDetail: { fontSize: 12, color: '#8B98A8', marginTop: 2 },
    verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    verifiedText: { fontSize: 11, color: '#00C853', fontWeight: '600' },

    // Sections
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A2332', marginBottom: 12 },
    dateRow: { flexDirection: 'row', gap: 12 },
    dateInput: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1A2332', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
    dateInputText: { fontSize: 13, color: '#1A2332', fontWeight: '500' },
    selectionButtons: { flexDirection: 'row', gap: 10 },
    selectionButton: { flex: 1, borderWidth: 1, borderColor: '#E0E6ED', paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#F5F7FA' },
    selectionButtonActive: { backgroundColor: '#00A8FF', borderColor: '#00A8FF' },
    selectionText: { fontSize: 13, color: '#1A2332', fontWeight: '600' },
    selectionTextActive: { color: '#fff' },
    peopleInputContainer: { marginTop: 12 },
    inputLabel: { fontSize: 13, color: '#1A2332', fontWeight: '600', marginBottom: 5 },
    peopleInput: { borderWidth: 1, borderColor: '#1A2332', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', fontSize: 13, color: '#1A2332' },
    
    // Price
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
    
    // Verification
    helperText: { fontSize: 12, color: '#8B98A8', marginBottom: 12, lineHeight: 18 },
    uploadContainer: { height: 150, borderWidth: 1, borderColor: '#E0E6ED', borderStyle: 'dashed', borderRadius: 12, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    uploadPlaceholder: { alignItems: 'center' },
    uploadText: { marginTop: 10, fontSize: 13, fontWeight: '600', color: '#00A8FF' },
    imagePreviewContainer: { width: '100%', height: '100%', position: 'relative' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    reuploadOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, gap: 6 },
    reuploadText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    // Assigned Guides
    assignedGuidesContainer: {
        flexDirection: 'column', 
        gap: 10,
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        alignItems: 'center', 
    },
    assignedGuideImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 10, 
    },
    assignedGuideName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A2332',
        textAlign: 'center', 
        marginBottom: 4,
    },
    assignedGuideRole: {
        fontSize: 11,
        color: '#8B98A8',
        textAlign: 'center', 
    },
    
    confirmButton: { backgroundColor: '#00A8FF', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    confirmButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});