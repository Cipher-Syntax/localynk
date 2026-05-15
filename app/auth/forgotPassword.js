import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground, StatusBar, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import api from '../../api/api';
import { EMAIL_REGEX, EMAIL_ERROR_MESSAGE } from '../../utils/validation';
import { styles } from './styles/forgotPassword.styles';

const ForgotPassword = () => {
    const router = useRouter();
    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const [successMessage, setSuccessMessage] = useState('');
    const [submitError, setSubmitError] = useState('');

    const onSubmit = async (data) => {
        setSuccessMessage('');
        setSubmitError('');
        try {
            await api.post('/api/password-reset/', { email: data.email });
            setSuccessMessage(`Reset link sent to ${data.email}. Check your inbox!`);
            
            // Optional: Redirect after delay
            // setTimeout(() => router.replace('/auth/login'), 3000);
        } catch (error) {
            console.error("Forgot Password Error:", error);
            const msg = error.response?.data?.detail || "Something went wrong. Please try again.";
            setSubmitError(msg);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <ImageBackground 
                    source={require('../../assets/localynk_images/login_background.jpg')} 
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
                                            {!!submitError && (
                                                <View style={styles.submitErrorBox}>
                                                    <Text style={styles.submitErrorText}>{submitError}</Text>
                                                </View>
                                            )}

                                            <Text style={styles.label}>Email Address</Text>
                                            <View style={styles.inputWrapper}>
                                                <Controller
                                                    control={control}
                                                    name="email"
                                                    rules={{ 
                                                        required: 'Email is required',
                                                        pattern: { value: EMAIL_REGEX, message: EMAIL_ERROR_MESSAGE }
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
