import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Alert, ImageBackground, StatusBar, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import api from '../../api/api';

const { width } = Dimensions.get('window');

const ForgotPassword = () => {
    const router = useRouter();
    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const [successMessage, setSuccessMessage] = useState('');

    const onSubmit = async (data) => {
        setSuccessMessage('');
        try {
            await api.post('/api/password-reset/', { email: data.email });
            setSuccessMessage(`Reset link sent to ${data.email}. Check your inbox!`);
            
            // Optional: Redirect after delay
            // setTimeout(() => router.replace('/auth/login'), 3000);
        } catch (error) {
            console.error("Forgot Password Error:", error);
            const msg = error.response?.data?.detail || "Something went wrong. Please try again.";
            Alert.alert("Error", msg);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <ImageBackground 
                    source={require('../../assets/localynk_images/login_background.png')} 
                    style={styles.bgImage} 
                    resizeMode="cover"
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.1)', 'rgba(15, 23, 42, 0.9)']}
                        style={styles.gradientOverlay}
                    >
                        <KeyboardAvoidingView 
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={styles.keyboardView}
                        >
                            <View style={styles.contentContainer}>
                                
                                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                                    <Ionicons name="arrow-back" size={24} color="#fff" />
                                </TouchableOpacity>

                                <View style={styles.headerContainer}>
                                    <Text style={styles.titleText}>Forgot Password?</Text>
                                    <Text style={styles.subtitleText}>Enter your email to receive a reset link.</Text>
                                </View>

                                <View style={styles.formCard}>
                                    {successMessage ? (
                                        <View style={styles.successBox}>
                                            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                            <Text style={styles.successText}>{successMessage}</Text>
                                            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
                                                <Text style={styles.loginLink}>Go back to Login</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <>
                                            <Text style={styles.label}>Email Address</Text>
                                            <View style={styles.inputWrapper}>
                                                <Controller
                                                    control={control}
                                                    name="email"
                                                    rules={{ 
                                                        required: 'Email is required',
                                                        pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" } 
                                                    }}
                                                    render={({ field: { onChange, value } }) => (
                                                        <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                                                            <Ionicons name="mail-outline" size={20} color="#94A3B8" style={{marginRight: 10}} />
                                                            <TextInput
                                                                placeholder="john@example.com"
                                                                placeholderTextColor="#94A3B8"
                                                                style={styles.input}
                                                                value={value}
                                                                onChangeText={onChange}
                                                                autoCapitalize="none"
                                                                keyboardType="email-address"
                                                            />
                                                        </View>
                                                    )}
                                                />
                                                {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                                            </View>

                                            <TouchableOpacity
                                                style={styles.mainButtonShadow}
                                                onPress={handleSubmit(onSubmit)}
                                                disabled={isSubmitting}
                                            >
                                                <LinearGradient
                                                    colors={['#0072FF', '#00C6FF']}
                                                    start={{ x: 0, y: 0 }} 
                                                    end={{ x: 1, y: 0 }}
                                                    style={styles.mainButton}
                                                >
                                                    {isSubmitting ? (
                                                        <Text style={styles.mainButtonText}>Sending...</Text>
                                                    ) : (
                                                        <Text style={styles.mainButtonText}>Send Reset Link</Text>
                                                    )}
                                                </LinearGradient>
                                            </TouchableOpacity>
                                            
                                            <View style={styles.footerLink}>
                                                <Text style={styles.footerText}>Already have the code? </Text>
                                                <TouchableOpacity onPress={() => router.push('/auth/resetPassword')}>
                                                    <Text style={styles.linkText}>Enter it here</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </>
                                    )}
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </LinearGradient>
                </ImageBackground>
            </View>
        </TouchableWithoutFeedback>
    );
};

export default ForgotPassword;

const styles = StyleSheet.create({
    container: { flex: 1 },
    bgImage: { flex: 1, width: '100%', height: '100%' },
    gradientOverlay: { flex: 1, justifyContent: 'center' },
    keyboardView: { flex: 1, justifyContent: 'center' },
    
    contentContainer: {
        width: '100%',
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 20,
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    headerContainer: {
        width: '100%',
        marginBottom: 25,
        paddingHorizontal: 10,
    },
    titleText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8
    },
    subtitleText: {
        fontSize: 16,
        color: '#E2E8F0',
        fontWeight: '500',
    },
    formCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 30,
        paddingHorizontal: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    inputWrapper: { marginBottom: 20 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        height: '100%',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginLeft: 5,
        marginTop: 4,
        fontWeight: '500'
    },
    mainButtonShadow: {
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        borderRadius: 16,
        marginTop: 10
    },
    mainButton: {
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    successBox: {
        alignItems: 'center',
        padding: 20,
    },
    successText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#065F46',
        marginTop: 10,
        marginBottom: 20,
    },
    loginLink: {
        color: '#0072FF',
        fontWeight: '700',
        fontSize: 16,
    },
    footerLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#64748B',
        fontSize: 14,
    },
    linkText: {
        color: '#0072FF',
        fontWeight: '700',
        fontSize: 14,
    }
});