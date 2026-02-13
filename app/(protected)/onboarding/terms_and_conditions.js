import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../../api/api';
// [1] IMPORT useAuth
import { useAuth } from '../../../context/AuthContext'; 

const CustomCheckbox = ({ value, onValueChange }) => {
    return (
        <TouchableOpacity 
            onPress={() => onValueChange(!value)} 
            style={[styles.checkboxBase, value && styles.checkboxChecked]}
            activeOpacity={0.8}
        >
            {value && <Ionicons name="checkmark" size={16} color="#fff" />}
        </TouchableOpacity>
    );
};

const OnboardingTerms = () => {
    const [isChecked, setIsChecked] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    // [2] DESTRUCTURE refreshUser
    const { refreshUser } = useAuth(); 

    const handleContinue = async () => {
        if (!isChecked) {
            Alert.alert("Agreement Required", "You must agree to the terms and conditions to continue.");
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post('/api/accept-terms/');
            
            // [3] CRITICAL: Update local user state before navigating
            await refreshUser(); 
            
            // Navigate to home; _layout.js will automatically redirect to Personalization
            // because isOnboardingComplete is false.
            router.replace('/(protected)/home');
        } 
        catch (error) {
            console.error("Failed to accept terms:", error);
            Alert.alert("Error", "An error occurred. Please try again.");
        } 
        finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView 
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerContainer}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="document-text-outline" size={32} color="#007AFF" />
                    </View>
                    <Text style={styles.mainTitle}>Terms of Service</Text>
                    <Text style={styles.subTitle}>Please review our policies below</Text>
                </View>
                
                <View style={styles.card}>
                    <Text style={styles.cardHeader}>MFLG Agreement</Text>
                    <Text style={styles.cardDate}>Last Updated: November 2025</Text>

                    <View style={styles.divider} />

                    <View style={styles.section}>
                        <Text style={styles.paragraphTitle}>1. Introduction</Text>
                        <Text style={styles.bodyText}>
                            By using the MFLG (My Friendly Local Guide) application you agree to these terms. MFLG connects travelers with local tour guides for tours, accommodations, and services.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.paragraphTitle}>2. User Responsibilities</Text>
                        <Text style={styles.bodyText}>
                            Users must provide accurate info, respect local laws, and take responsibility for personal safety and belongings during tours.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.paragraphTitle}>3. Payments & Liability</Text>
                        <Text style={styles.bodyText}>
                            MFLG is a connecting platform and is not liable for accidents or losses. Payments and cancellations must follow platform policies.
                        </Text>
                    </View>
                </View>

                <View style={styles.footerContainer}>
                    <TouchableOpacity 
                        style={styles.checkboxContainer} 
                        onPress={() => setIsChecked(!isChecked)}
                        activeOpacity={0.7}
                    >
                        <CustomCheckbox
                            value={isChecked}
                            onValueChange={setIsChecked}
                        />
                        <Text style={styles.checkboxLabel}>
                            I have read and agree to the <Text style={styles.linkText}>Terms and Conditions</Text>.
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, !isChecked && styles.buttonDisabled]}
                        onPress={handleContinue}
                        disabled={!isChecked || isSubmitting}
                        activeOpacity={0.8}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Accept & Continue</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    mainTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1A1D1E',
        marginBottom: 8,
        textAlign: 'center',
    },
    subTitle: {
        fontSize: 15,
        color: '#6C757D',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    cardHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1D1E',
        textAlign: 'center',
    },
    cardDate: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginBottom: 16,
    },
    section: {
        marginBottom: 16,
    },
    paragraphTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    bodyText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 22,
        textAlign: 'left',
    },
    footerContainer: {
        alignItems: 'center',
        width: '100%',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    checkboxBase: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#007AFF',
        marginRight: 12,
        backgroundColor: '#fff',
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#495057',
        flex: 1,
        lineHeight: 20,
    },
    linkText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        width: '100%',
        shadowColor: "#007AFF",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonDisabled: {
        backgroundColor: '#CFD8DC',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});

export default OnboardingTerms;