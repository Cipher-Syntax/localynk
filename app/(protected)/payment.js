import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, StyleSheet, Image, TextInput, TouchableOpacity, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { PaymentReviewModal } from '../../components/payment';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker'; // 1. Import Image Picker
import { useAuth } from '../../context/AuthContext'; 

const Payment = () => {
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { user } = useAuth(); 

    const guide = {
        name: "Juan Dela Cruz",
        purpose: "Mountain Guiding",
        address: "Baliwasan",
        basePrice: 500,
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
    
    // 2. New State for ID Image
    const [validIdImage, setValidIdImage] = useState(null);

    const [totalPrice, setTotalPrice] = useState(guide.basePrice - guide.serviceFee);

    // Auto-fill
    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setEmail(user.email || '');
            setPhoneNumber(user.phone_number || ''); 
            setCountry(user.location || ''); 
        }
    }, [user]);

    useEffect(() => {
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.max(Math.round(Math.abs((endDate - startDate) / oneDay)) + 1, 1);
        let groupSize = parseInt(numPeople) || 0;
        let multiplier = selectedOption === 'solo' ? 1 : (groupSize < 2 ? 2 : groupSize);
        const baseCost = diffDays * guide.basePrice * multiplier;
        setTotalPrice(baseCost);
    }, [startDate, endDate, selectedOption, numPeople]);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    // 3. Image Picker Function
    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setValidIdImage(result.assets[0].uri);
        }
    };

    const handleReviewPress = () => {
        // Simple validation to ensure ID is uploaded
        if (!validIdImage) {
            Alert.alert("Valid ID Required", "Please upload a valid government ID for verification purposes before proceeding.");
            return;
        }
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
                <ActivityIndicator size="large" color="#00A8FF" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
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
                    <Text style={styles.headerTitle}>REQUEST TO BOOK</Text>
                </View>

                <View style={styles.contentContainer}>
                    {/* Guide Info */}
                    <View style={styles.guideInfoCard}>
                        <View style={styles.guideHeader}>
                            <View style={styles.guideIcon}>
                                <User size={40} color="#fff" />
                            </View>
                            <View style={styles.guideInfo}>
                                <Text style={styles.guideName}>{guide.name}</Text>
                                <Text style={styles.guideDetail}>{guide.purpose}</Text>
                                <Text style={styles.guideDetail}>{guide.address}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Set Dates */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Set Dates</Text>
                        <View style={styles.dateRow}>
                            <Pressable style={styles.dateInput} onPress={() => setStartPickerVisible(true)}>
                                <Text style={styles.dateInputText}>{startDate.toLocaleDateString()}</Text>
                                <Ionicons name="calendar-outline" size={18} color="#8B98A8" />
                            </Pressable>
                            <Pressable style={styles.dateInput} onPress={() => setEndPickerVisible(true)}>
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
                            <Text style={styles.priceValue}>₱ {guide.basePrice.toLocaleString()}</Text>
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
                            <Text style={styles.priceLabel}>Guide Earnings (after fee)</Text>
                            <Text style={styles.priceValue}>₱ {(totalPrice - guide.serviceFee).toLocaleString()}</Text>
                        </View>
                        <View style={styles.priceRow}>
                            <Text style={styles.priceLabel}>App Service Fee</Text>
                            <Text style={styles.priceValue}>₱ {guide.serviceFee.toLocaleString()}</Text>
                        </View>
                        <View style={styles.priceDivider} />
                        <View style={styles.priceRow}>
                            <Text style={styles.totalLabel}>Total to Pay</Text>
                            <Text style={styles.totalValue}>₱ {totalPrice.toLocaleString()}</Text>
                        </View>
                    </View>

                    {/* Billing Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Billing Information</Text>
                        <View style={styles.billingRow}>
                            <TextInput style={styles.billingInput} placeholder="First Name" placeholderTextColor="#8B98A8" value={firstName} onChangeText={setFirstName} />
                            <TextInput style={styles.billingInput} placeholder="Last Name" placeholderTextColor="#8B98A8" value={lastName} onChangeText={setLastName} />
                        </View>
                        <View style={styles.billingRow}>
                            <TextInput style={styles.billingInput} placeholder="Phone Number" placeholderTextColor="#8B98A8" value={phoneNumber} onChangeText={setPhoneNumber} />
                            <TextInput style={styles.billingInput} placeholder="Country" placeholderTextColor="#8B98A8" value={country} onChangeText={setCountry} />
                        </View>
                        <TextInput style={[styles.billingInput, styles.fullWidthInput]} placeholder="Email" placeholderTextColor="#8B98A8" value={email} onChangeText={setEmail} />
                    </View>

                    {/* 4. NEW SECTION: Identity Verification */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Identity Verification</Text>
                        <Text style={styles.helperText}>
                            For the safety and comfort of your guide, please upload a valid government-issued ID.
                        </Text>
                        
                        <TouchableOpacity style={styles.uploadContainer} onPress={pickImage}>
                            {validIdImage ? (
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
                                    <Text style={styles.uploadSubText}>(Passport, Driver's License, National ID)</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Button */}
                    <TouchableOpacity style={styles.confirmButton} onPress={handleReviewPress}>
                        <Text style={styles.confirmButtonText}>Review Booking Request</Text>
                    </TouchableOpacity>
                </View>

                {isModalOpen && (
                    <PaymentReviewModal 
                        isModalOpen={isModalOpen} 
                        setIsModalOpen={setIsModalOpen}
                        paymentData={{
                            guide: guide,
                            startDate: startDate,
                            endDate: endDate,
                            firstName: firstName,
                            lastName: lastName,
                            phoneNumber: phoneNumber,
                            country: country,
                            email: email,
                            basePrice: guide.basePrice,
                            serviceFee: guide.serviceFee,
                            totalPrice: totalPrice,
                            paymentMethod: null,
                            groupType: selectedOption,
                            numberOfPeople: selectedOption === 'group' ? (parseInt(numPeople) < 2 ? 2 : parseInt(numPeople)) : 1,
                            validIdImage: validIdImage, // Pass the ID image to the modal
                        }}
                    />
                )}
            </SafeAreaView>
        </ScrollView>
    );
};

export default Payment;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    contentContainer: { padding: 16, paddingBottom: 30 },
    guideInfoCard: { backgroundColor: '#F5F7FA', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#E0E6ED', marginBottom: 20 },
    guideHeader: { flexDirection: 'row', alignItems: 'flex-start' },
    guideIcon: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#1A2332', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    guideInfo: { flex: 1 },
    guideName: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    guideDetail: { fontSize: 12, color: '#8B98A8', marginTop: 2 },
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

    // --- NEW Verification Styles ---
    helperText: { fontSize: 12, color: '#8B98A8', marginBottom: 12, lineHeight: 18 },
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
    uploadPlaceholder: { alignItems: 'center' },
    uploadText: { marginTop: 10, fontSize: 13, fontWeight: '600', color: '#00A8FF' },
    uploadSubText: { fontSize: 11, color: '#8B98A8', marginTop: 4 },
    imagePreviewContainer: { width: '100%', height: '100%', position: 'relative' },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    reuploadOverlay: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 6
    },
    reuploadText: { color: '#fff', fontSize: 12, fontWeight: '600' }
});