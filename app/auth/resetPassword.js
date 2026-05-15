import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground, StatusBar, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../api/api';
import { styles } from './styles/resetPassword.styles';

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
    }, [uid, token, setValue]);

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

            setShowPassword("");
            setShowConfirmPassword("")
            
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
