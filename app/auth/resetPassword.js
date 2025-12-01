import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, ImageBackground, StatusBar, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../api/api';

const { width } = Dimensions.get('window');

const ResetPassword = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const { uid, token } = params;

    const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); 

    useEffect(() => {
        if (uid) setValue('uid', uid);
        if (token) setValue('token', token);
    }, [uid, token]);

    const onSubmit = async (data) => {
        setMessage('');
        setMessageType('');
        Keyboard.dismiss();

        try {
            await api.post('/api/password-reset/confirm/', {
                uid: data.uid,
                token: data.token,
                password: data.password,
                confirm_password: data.confirm_password
            });

            setMessageType('success');
            setMessage("Your password has been reset successfully.");
            
        } catch (error) {
            console.error("Reset Password Error:", error);
            const msg = error.response?.data?.detail || 
                        error.response?.data?.password?.[0] || 
                        "Failed to reset password. Token might be invalid.";
            
            setMessageType('error');
            setMessage(msg);
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
                                    <Text style={styles.titleText}>Reset Password</Text>
                                    <Text style={styles.subtitleText}>Create a new secure password.</Text>
                                </View>

                                <View style={styles.formCard}>
                                    
                                    {message ? (
                                        <View style={[styles.messageBox, messageType === 'error' ? styles.msgError : styles.msgSuccess]}>
                                            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 5}}>
                                                <Ionicons 
                                                    name={messageType === 'success' ? "checkmark-circle" : "alert-circle"} 
                                                    size={20} 
                                                    color={messageType === 'success' ? "#10B981" : "#EF4444"} 
                                                    style={{marginRight: 6}}
                                                />
                                                <Text style={[styles.messageText, messageType === 'error' ? {color:'#EF4444'} : {color:'#10B981'}]}>
                                                    {messageType === 'success' ? 'Success!' : 'Error'}
                                                </Text>
                                            </View>
                                            <Text style={styles.messageSubText}>{message}</Text>
                                            
                                            {messageType === 'success' && (
                                                <TouchableOpacity style={styles.loginLinkBtn} onPress={() => router.replace('/auth/login')}>
                                                    <Text style={styles.loginLinkText}>Login Now</Text>
                                                    <Ionicons name="arrow-forward" size={14} color="#0072FF" style={{marginLeft: 4}} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ) : null}

                                    {(!uid || !token) && (
                                        <View style={styles.tokenContainer}>
                                            <Text style={styles.helperText}>Enter the codes from your email if not auto-filled:</Text>
                                            <Controller
                                                control={control}
                                                name="uid"
                                                rules={{ required: 'UID is required' }}
                                                render={({ field: { onChange, value } }) => (
                                                    <TextInput 
                                                        placeholder="UID" 
                                                        style={styles.smallInput} 
                                                        value={value} 
                                                        onChangeText={onChange} 
                                                    />
                                                )}
                                            />
                                            <Controller
                                                control={control}
                                                name="token"
                                                rules={{ required: 'Token is required' }}
                                                render={({ field: { onChange, value } }) => (
                                                    <TextInput 
                                                        placeholder="Token" 
                                                        style={styles.smallInput} 
                                                        value={value} 
                                                        onChangeText={onChange} 
                                                    />
                                                )}
                                            />
                                        </View>
                                    )}

                                    <Text style={styles.label}>New Password</Text>
                                    <View style={styles.inputWrapper}>
                                        <Controller
                                            control={control}
                                            name="password"
                                            rules={{ 
                                                required: 'Password is required', 
                                                minLength: { value: 8, message: 'Min 8 characters' } 
                                            }}
                                            render={({ field: { onChange, value } }) => (
                                                <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                                                    <View style={styles.iconContainer}>
                                                        <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                                                    </View>
                                                    <TextInput
                                                        placeholder="New Password"
                                                        placeholderTextColor="#94A3B8"
                                                        style={styles.input}
                                                        secureTextEntry={!showPassword}
                                                        value={value}
                                                        onChangeText={onChange}
                                                    />
                                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                                        <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94A3B8" />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        />
                                        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
                                    </View>

                                    <Text style={styles.label}>Confirm Password</Text>
                                    <View style={styles.inputWrapper}>
                                        <Controller
                                            control={control}
                                            name="confirm_password"
                                            rules={{ 
                                                required: 'Confirm Password is required',
                                                validate: (val) => val === watch('password') || 'Passwords do not match'
                                            }}
                                            render={({ field: { onChange, value } }) => (
                                                <View style={[styles.inputContainer, errors.confirm_password && styles.inputError]}>
                                                    <View style={styles.iconContainer}>
                                                        <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                                                    </View>
                                                    <TextInput
                                                        placeholder="Confirm Password"
                                                        placeholderTextColor="#94A3B8"
                                                        style={styles.input}
                                                        secureTextEntry={!showConfirmPassword}
                                                        value={value}
                                                        onChangeText={onChange}
                                                    />
                                                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                                        <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94A3B8" />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        />
                                        {errors.confirm_password && <Text style={styles.errorText}>{errors.confirm_password.message}</Text>}
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
                                            <Text style={styles.mainButtonText}>
                                                {isSubmitting ? 'Resetting...' : 'Set New Password'}
                                            </Text>
                                        </LinearGradient>
                                    </TouchableOpacity>

                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </LinearGradient>
                </ImageBackground>
            </View>
        </TouchableWithoutFeedback>
    );
};

export default ResetPassword;

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
    tokenContainer: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 8
    },
    helperText: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 8
    },
    smallInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 6,
        padding: 8,
        fontSize: 12,
        marginBottom: 8
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
    iconContainer: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        height: '100%',
    },
    eyeIcon: {
        padding: 10,
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
    
    messageBox: {
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    msgError: { 
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA' 
    },
    msgSuccess: { 
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0' 
    },
    messageText: {
        fontSize: 14, 
        fontWeight: '700', 
    },
    messageSubText: {
        fontSize: 13,
        color: '#334155',
        textAlign: 'center',
        marginBottom: 8
    },
    loginLinkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        padding: 8
    },
    loginLinkText: {
        color: '#0072FF',
        fontWeight: '700',
        fontSize: 14,
    }
});