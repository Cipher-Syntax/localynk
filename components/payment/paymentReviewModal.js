import React, { useState } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Animated, Easing, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const PaymentReviewModal = ({ isModalOpen, setIsModalOpen, paymentData }) => {
    const [showAlert, setShowAlert] = useState(false);
    const [slideAnim] = useState(new Animated.Value(200));
    const router = useRouter();

    const handleConfirm = () => {
        setShowAlert(true);
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    };

    const handleAlertOk = () => {
        Animated.timing(slideAnim, {
            toValue: 200,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
        }).start(() => {
            setShowAlert(false);
            setIsModalOpen(false);
            router.replace('/(protected)/home');
        });
    };

    const { guide, accommodation, startDate, endDate, firstName, lastName, phoneNumber, country, email, basePrice, serviceFee, totalPrice, paymentMethod,} = paymentData || {};
    const calculateDays = () => {
        if (!startDate || !endDate) return 1;
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.max(Math.round(Math.abs((endDate - startDate) / oneDay)) + 1, 1);
    };

    const days = calculateDays();

    return (
        <Modal visible={isModalOpen} animationType="slide">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                        <Ionicons name="close" size={28} color="#1A2332" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>BOOKING SUMMARY</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Booking Details</Text>

                        {accommodation && (
                            <View style={styles.detailCard}>
                                <View style={styles.detailHeader}>
                                    <View style={styles.detailIcon}>
                                        <Ionicons name="home" size={20} color="#fff" />
                                    </View>
                                    <View style={styles.detailInfo}>
                                        <Text style={styles.detailLabel}>Accommodation</Text>
                                        <Text style={styles.detailName}>{accommodation.name}</Text>
                                        <Text style={styles.detailText}>{accommodation.location}</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {guide && (
                            <View style={styles.detailCard}>
                                <View style={styles.detailHeader}>
                                    <View style={styles.detailIcon}>
                                        <User size={20} color="#fff" />
                                    </View>
                                    <View style={styles.detailInfo}>
                                        <Text style={styles.detailLabel}>Tourist Guide</Text>
                                        <Text style={styles.detailName}>{guide.name}</Text>
                                        <Text style={styles.detailText}>{guide.purpose}</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Booking Dates</Text>
                        <View style={styles.dateCard}>
                            <View style={styles.dateItem}>
                                <Text style={styles.dateLabel}>Check-in</Text>
                                <Text style={styles.dateValue}>{startDate?.toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.dateDivider} />
                            <View style={styles.dateItem}>
                                <Text style={styles.dateLabel}>Check-out</Text>
                                <Text style={styles.dateValue}>{endDate?.toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.dateDivider} />
                            <View style={styles.dateItem}>
                                <Text style={styles.dateLabel}>Duration</Text>
                                <Text style={styles.dateValue}>{days} day(s)</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Price Breakdown</Text>
                        <View style={styles.priceCard}>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Base Price ({days} day(s))</Text>
                                <Text style={styles.priceValue}>₱{basePrice * days}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Service Fee</Text>
                                <Text style={styles.priceValue}>₱{serviceFee}</Text>
                            </View>
                            <View style={styles.priceDivider} />
                            <View style={styles.priceRow}>
                                <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                                <Text style={styles.totalValue}>₱{totalPrice}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                        <View style={styles.paymentCard}>
                            <Text style={styles.paymentMethod}>{paymentMethod?.toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Billing Information</Text>
                        <View style={styles.billingCard}>
                            <View style={styles.billingRow}>
                                <View style={styles.billingItem}>
                                    <Text style={styles.billingLabel}>First Name</Text>
                                    <Text style={styles.billingValue}>{firstName}</Text>
                                </View>
                                <View style={styles.billingItem}>
                                    <Text style={styles.billingLabel}>Last Name</Text>
                                    <Text style={styles.billingValue}>{lastName}</Text>
                                </View>
                            </View>
                            <View style={styles.billingRow}>
                                <View style={styles.billingItem}>
                                    <Text style={styles.billingLabel}>Phone Number</Text>
                                    <Text style={styles.billingValue}>{phoneNumber}</Text>
                                </View>
                                <View style={styles.billingItem}>
                                    <Text style={styles.billingLabel}>Country</Text>
                                    <Text style={styles.billingValue}>{country}</Text>
                                </View>
                            </View>
                            <View style={styles.billingFullRow}>
                                <Text style={styles.billingLabel}>Email</Text>
                                <Text style={styles.billingValue}>{email}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleConfirm}
                    >
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setIsModalOpen(false)}
                    >
                        <Text style={styles.cancelButtonText}>Edit Details</Text>
                    </TouchableOpacity>
                </View>

                <Modal transparent visible={showAlert} animationType="none">
                    <View style={styles.alertOverlay}>
                        <Animated.View
                            style={[
                                styles.alertBox,
                                { transform: [{ translateY: slideAnim }] },
                            ]}
                        >
                            <Text style={styles.alertTitle}>Booking Confirmed!</Text>
                            <Text style={styles.alertMessage}>
                                Your booking has been successfully confirmed.
                            </Text>
                            <TouchableOpacity
                                style={styles.alertButton}
                                onPress={handleAlertOk}
                            >
                                <Text style={styles.alertButtonText}>OK</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </Modal>
            </ScrollView>
        </Modal>
    );
};

export default PaymentReviewModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D9E2E9',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F5F7FA',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E6ED',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A2332',
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 30,
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
    detailCard: {
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E0E6ED',
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIcon: {
        width: 45,
        height: 45,
        borderRadius: 8,
        backgroundColor: '#1A2332',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailInfo: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 10,
        color: '#8B98A8',
        fontWeight: '600',
    },
    detailName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A2332',
        marginTop: 2,
    },
    detailText: {
        fontSize: 11,
        color: '#8B98A8',
        marginTop: 1,
    },
    dateCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E6ED',
    },
    dateItem: {
        paddingVertical: 8,
    },
    dateLabel: {
        fontSize: 11,
        color: '#8B98A8',
        fontWeight: '600',
    },
    dateValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A2332',
        marginTop: 4,
    },
    dateDivider: {
        height: 1,
        backgroundColor: '#E0E6ED',
        marginVertical: 8,
    },
    priceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E6ED',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    priceLabel: {
        fontSize: 12,
        color: '#1A2332',
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 12,
        color: '#1A2332',
        fontWeight: '600',
    },
    priceDivider: {
        height: 1,
        backgroundColor: '#E0E6ED',
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
        color: '#00A8FF',
    },
    paymentCard: {
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        alignItems: 'center',
    },
    paymentMethod: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A2332',
    },
    billingCard: {
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E6ED',
    },
    billingRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    billingFullRow: {
        paddingVertical: 8,
    },
    billingItem: {
        flex: 1,
    },
    billingLabel: {
        fontSize: 10,
        color: '#8B98A8',
        fontWeight: '600',
    },
    billingValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1A2332',
        marginTop: 3,
    },
    confirmButton: {
        backgroundColor: '#00A8FF',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    cancelButton: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#00A8FF',
    },
    cancelButtonText: {
        color: '#00A8FF',
        fontSize: 14,
        fontWeight: '700',
    },
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    alertBox: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 30,
        alignItems: 'center',
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
        color: '#1A2332',
    },
    alertMessage: {
        fontSize: 13,
        color: '#8B98A8',
        textAlign: 'center',
        marginBottom: 16,
    },
    alertButton: {
        backgroundColor: '#00A8FF',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 8,
    },
    alertButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});
