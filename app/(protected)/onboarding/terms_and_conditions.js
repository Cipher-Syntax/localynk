import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../../api/api';
import { useAuth } from '../../../context/AuthContext'; 
import Toast from '../../../components/Toast';
import { styles } from './styles/terms_and_conditions.styles';

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
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
    const router = useRouter();
    const { user, refreshUser } = useAuth(); // ADDED `user` HERE

    const handleContinue = async () => {
        if (!isChecked) {
            setToast({ visible: true, message: "You must agree to the terms and conditions to continue.", type: 'error' });
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post('/api/accept-terms/');
            await refreshUser(); 
            
            // Check if profile is incomplete
            const isPhoneMissing = !user?.phone_number || String(user.phone_number).trim() === "";
            const isLocationMissing = !user?.location || String(user.location).trim() === "";
            const isFirstNameMissing = !user?.first_name || String(user.first_name).trim() === "";

            if (isFirstNameMissing || isPhoneMissing || isLocationMissing) {
                router.replace('/(protected)/onboarding/profile_setup');
            } else {
                router.replace('/(protected)/onboarding/personalization');
            }
        } 
        catch (error) {
            console.error("Failed to accept terms:", error);
            setToast({ visible: true, message: "An error occurred. Please try again.", type: 'error' });
        } 
        finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
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

export default OnboardingTerms;