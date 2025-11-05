import React, { useState, useEffect, } from 'react';
import { View, Text, ScrollView, StatusBar, StyleSheet, Image, TextInput, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { PaymentReviewModal } from '../../components/payment';

const Payment = () => {
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const guide = {
        name: "Juan Dela Cruz",
        purpose: "Mountain Guiding",
        address: "Baliwasan",
        basePrice: 1500,
        serviceFee: 150,
    };

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isStartPickerVisible, setStartPickerVisible] = useState(false);
    const [isEndPickerVisible, setEndPickerVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('gcash');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [country, setCountry] = useState('');
    const [email, setEmail] = useState('');
    const [totalPrice, setTotalPrice] = useState(guide.basePrice + guide.serviceFee);

    useEffect(() => {
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.max(Math.round(Math.abs((endDate - startDate) / oneDay)) + 1, 1);
        setTotalPrice(diffDays * guide.basePrice + guide.serviceFee);
    }, [startDate, endDate]);

    

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#fff"
            }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
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
                <Text style={styles.headerTitle}>PROCESS YOUR PAYMENT HERE</Text>
            </View>

            <View style={styles.contentContainer}>
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
                        onConfirm={(date) => {
                            setStartDate(date);
                            setStartPickerVisible(false);
                        }}
                        onCancel={() => setStartPickerVisible(false)}
                    />

                    <DateTimePickerModal
                        isVisible={isEndPickerVisible}
                        mode="date"
                        onConfirm={(date) => {
                            setEndDate(date);
                            setEndPickerVisible(false);
                        }}
                        onCancel={() => setEndPickerVisible(false)}
                    />
                </View>

                <View style={styles.priceCard}>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Base Price ({Math.max(Math.round(Math.abs((endDate - startDate) / (24*60*60*1000))) + 1, 1)} day(s))</Text>
                        <Text style={styles.priceValue}>₱{Math.max(Math.round(Math.abs((endDate - startDate) / (24*60*60*1000))) + 1, 1) * guide.basePrice}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Service Fee</Text>
                        <Text style={styles.priceValue}>₱{guide.serviceFee}</Text>
                    </View>
                    <View style={styles.priceDivider} />
                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>TOTAL</Text>
                        <Text style={styles.totalValue}>₱{totalPrice}</Text>
                    </View>
                </View>

                {/* Payment Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Options</Text>
                    <TouchableOpacity
                        style={styles.paymentOption}
                        onPress={() => setPaymentMethod('gcash')}
                    >
                        <View style={[styles.radioButton, paymentMethod === 'gcash' && styles.radioButtonActive]} />
                        <Text style={styles.paymentOptionText}>Gcash</Text>
                    </TouchableOpacity>
                </View>

                {/* Billing Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Billing Information</Text>
                    <View style={styles.billingRow}>
                        <TextInput
                            style={styles.billingInput}
                            placeholder="First Name"
                            placeholderTextColor="#8B98A8"
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                        <TextInput
                            style={styles.billingInput}
                            placeholder="Last Name"
                            placeholderTextColor="#8B98A8"
                            value={lastName}
                            onChangeText={setLastName}
                        />
                    </View>
                    <View style={styles.billingRow}>
                        <TextInput
                            style={styles.billingInput}
                            placeholder="Phone Number"
                            placeholderTextColor="#8B98A8"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                        />
                        <TextInput
                            style={styles.billingInput}
                            placeholder="Country"
                            placeholderTextColor="#8B98A8"
                            value={country}
                            onChangeText={setCountry}
                        />
                    </View>
                    <TextInput
                        style={[styles.billingInput, styles.fullWidthInput]}
                        placeholder="Email"
                        placeholderTextColor="#8B98A8"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <TouchableOpacity style={styles.confirmButton} onPress={() => setIsModalOpen(true)}>
                    <Text style={styles.confirmButtonText}>Review and Confirm</Text>
                </TouchableOpacity>
            </View>


            {
                isModalOpen && (
                    <PaymentReviewModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}/>
                )
            }
        </ScrollView>
    );
};

export default Payment;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D9E2E9',
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTitle: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 30,
    },
    guideInfoCard: {
        backgroundColor: '#F5F7FA',
        borderRadius: 15,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        marginBottom: 20,
    },
    guideHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    guideIcon: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: '#1A2332',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    guideInfo: {
        flex: 1,
    },
    guideName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A2332',
    },
    guideDetail: {
        fontSize: 12,
        color: '#8B98A8',
        marginTop: 2,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A2332',
        marginBottom: 12,
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateInput: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1A2332',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    dateInputText: {
        fontSize: 13,
        color: '#1A2332',
        fontWeight: '500',
    },
    priceCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#1A2332',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    priceLabel: {
        fontSize: 13,
        color: '#1A2332',
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 13,
        color: '#1A2332',
        fontWeight: '600',
    },
    priceDivider: {
        height: 1,
        backgroundColor: '#1A2332',
        marginVertical: 10,
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A2332',
    },
    totalValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A2332',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1A2332',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#1A2332',
        marginRight: 12,
    },
    radioButtonActive: {
        backgroundColor: '#1A2332',
    },
    paymentOptionText: {
        fontSize: 13,
        color: '#1A2332',
        fontWeight: '500',
    },
    billingRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
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
        backgroundColor: '#fff',
    },
    fullWidthInput: {
        width: '100%',
    },
    confirmButton: {
        backgroundColor: '#00A8FF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});