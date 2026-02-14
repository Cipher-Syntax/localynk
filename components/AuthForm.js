import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground, StyleSheet, Dimensions,  Alert, KeyboardAvoidingView, Platform,TouchableWithoutFeedback, Keyboard, ActivityIndicator } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext'; 
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const { width, height } = Dimensions.get('window');

const AuthForm = ({ method }) => {
    // Get googleLogin from context
    const { login, register, googleLogin, resendVerificationEmail, message, messageType, clearMessage } = useAuth(); 

    const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
    const [remember, setRemember] = useState(false);
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Google Loading state
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const router = useRouter();

    const bgImage = method === 'login'
        ? require('../assets/localynk_images/login_background.png')
        : require('../assets/localynk_images/register_background.png');

    const titleText = method === 'login' ? 'Welcome Back' : 'Start Journey';
    const subtitleText = method === 'login' ? 'Continue your adventure' : 'Join the community of explorers';

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
            offlineAccess: true,
            scopes: ['profile', 'email']
        });
    }, []); 

    const handleNavigation = (user) => {
        if (user) {
            const isFirstNameMissing = !user.first_name || String(user.first_name).trim() === "";
            const isLastNameMissing = !user.last_name || String(user.last_name).trim() === "";

            if (isFirstNameMissing || isLastNameMissing) {
                router.replace('/onboarding/profile_setup');
            } else {
                router.replace('/home'); 
            }
        }
    };

    const onSubmit = async (data) => {
        clearMessage(); 

        if (method === 'login') {
            const successUser = await login(data.username, data.password); 
            if (successUser) handleNavigation(successUser);

        } else {
            const userData = {
                username: data.username,
                email: data.email,
                password: data.password,
                confirm_password: data.confirm_password
            };

            const result = await register(userData);

            if (result && result.success) {
                router.replace('/auth/login')
            }
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        clearMessage();
        try {
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const tokens = await GoogleSignin.getTokens(); // Ensure we get the tokens

            if (tokens?.idToken) {
                const successUser = await googleLogin(tokens.idToken);
                if (successUser) handleNavigation(successUser);
            } else {
                Alert.alert("Error", "Could not get ID token from Google.");
            }

        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log("User cancelled login");
            } else if (error.code === statusCodes.IN_PROGRESS) {
                console.log("Sign in is in progress");
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert("Error", "Google Play Services not available");
            } else {
                console.error(error);
                Alert.alert("Login Error", error.message);
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleResendVerification = async () => {
        const usernameOrEmail = watch('username'); 
        if (!usernameOrEmail) {
            clearMessage();
            Alert.alert("Error", "Please enter your email in the username field to resend verification.");
            return;
        }
        clearMessage(); 
        await resendVerificationEmail(usernameOrEmail);
    };

    const renderInput = (controlName, placeholder, iconName, isPassword = false, showPassState = false, setShowPassState = null, rules = {}) => (
        <View style={styles.inputWrapper}>
            <Controller
                control={control}
                name={controlName}
                defaultValue=""
                rules={rules}
                render={({ field: { onChange, value } }) => (
                    <View style={[styles.inputContainer, errors[controlName] && styles.inputError]}>
                        <View style={styles.iconContainer}>
                            <FontAwesome name={iconName} size={20} color="#94A3B8" />
                        </View>
                        <TextInput
                            placeholder={placeholder}
                            placeholderTextColor="#94A3B8"
                            style={styles.input}
                            secureTextEntry={isPassword && !showPassState}
                            value={value}
                            onChangeText={onChange}
                            autoCapitalize="none"
                        />
                        {isPassword && (
                            <TouchableOpacity onPress={() => setShowPassState(!showPassState)} style={styles.eyeIcon}>
                                <Ionicons name={showPassState ? "eye-off-outline" : "eye-outline"} size={22} color="#94A3B8" />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />
            {errors[controlName] && <Text style={styles.errorText}>{errors[controlName].message}</Text>}
        </View>
    );

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <ImageBackground source={bgImage} style={styles.bgImage} resizeMode="cover">
                    <LinearGradient
                        colors={['rgba(0,0,0,0.1)', 'rgba(15, 23, 42, 0.85)']}
                        style={styles.gradientOverlay}
                    >
                        <KeyboardAvoidingView 
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            style={styles.keyboardView}
                        >
                            <View style={styles.contentContainer}>
                                
                                <View style={styles.headerContainer}>
                                    <Text style={styles.welcomeText}>{titleText}</Text>
                                    <Text style={styles.subtitleText}>{subtitleText}</Text>
                                </View>

                                <View style={styles.formCard}>
                                    
                                    {message ? (
                                        <View style={[styles.messageBox, messageType === 'error' ? styles.msgError : styles.msgSuccess]}>
                                            <Text style={[styles.messageText, messageType === 'error' ? {color:'#EF4444'} : {color:'#10B981'}]}>
                                                {message}
                                            </Text>
                                            {message.includes('verify your email') && method === 'login' && (
                                                <TouchableOpacity onPress={handleResendVerification}>
                                                    <Text style={styles.resendText}>Resend Email</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ) : null}

                                    {renderInput('username', 'Username', 'user', false, null, null, { required: 'Username is required' })}
                                    
                                    {method === 'register' && renderInput('email', 'Email Address', 'envelope', false, null, null, { 
                                        required: 'Email is required', 
                                        pattern: { value: /^\S+@\S+$/i, message: "Invalid email format" } 
                                    })}

                                    {renderInput('password', 'Password', 'lock', true, showPassword, setShowPassword, { 
                                        required: 'Password is required', 
                                        minLength: { value: 8, message: 'Min 8 characters' } 
                                    })}

                                    {method === 'register' && renderInput('confirm_password', 'Confirm Password', 'lock', true, showConfirmPassword, setShowConfirmPassword, {
                                        required: 'Confirm your password',
                                        validate: (val) => val === watch('password') || 'Passwords do not match'
                                    })}

                                    {method === 'login' && (
                                        <View style={styles.optionsRow}>
                                            <TouchableOpacity 
                                                style={styles.rememberRow} 
                                                activeOpacity={0.8}
                                                onPress={() => setRemember(!remember)}
                                            >
                                                <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                                                    {remember && <FontAwesome name="check" size={10} color="#fff" />}
                                                </View>
                                                <Text style={styles.rememberText}>Remember me</Text>
                                            </TouchableOpacity>
                                            
                                            <TouchableOpacity onPress={() => router.push('/auth/forgotPassword')}>
                                                <Text style={styles.forgotText}>Forgot Password?</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

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
                                                {isSubmitting ? 'Please wait...' : (method === 'login' ? 'Log In' : 'Sign Up')}
                                            </Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                                        </LinearGradient>
                                    </TouchableOpacity>

                                    <View style={styles.footerContainer}>
                                        <View style={styles.dividerRow}>
                                            <View style={styles.divider} />
                                            <Text style={styles.orText}>OR</Text>
                                            <View style={styles.divider} />
                                        </View>

                                        {/* MODIFIED GOOGLE BUTTON */}
                                        <TouchableOpacity 
                                            style={styles.googleButton} 
                                            onPress={handleGoogleLogin}
                                            disabled={isGoogleLoading}
                                        >
                                            {isGoogleLoading ? (
                                                <ActivityIndicator size="small" color="#DB4437" />
                                            ) : (
                                                <>
                                                    <ImageBackground 
                                                        source={{uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg'}} 
                                                        style={{width: 20, height: 20}} 
                                                    />
                                                    <FontAwesome name="google" size={20} color="#DB4437" />
                                                    <Text style={styles.googleText}>Continue with Google</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>

                                        <View style={styles.switchContainer}>
                                            <Text style={styles.switchText}>
                                                {method === 'login' ? "Don't have an account? " : "Already have an account? "}
                                            </Text>
                                            <TouchableOpacity onPress={() => router.push(method === 'login' ? '/auth/register' : '/auth/login')}>
                                                <Text style={styles.switchLink}>
                                                    {method === 'login' ? 'Sign Up' : 'Log In'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </LinearGradient>
                </ImageBackground>
            </View>
        </TouchableWithoutFeedback>
    );
};

export default AuthForm;

const styles = StyleSheet.create({
    container: { flex: 1 },
    bgImage: { flex: 1, width: '100%', height: '100%' },
    gradientOverlay: { flex: 1, justifyContent: 'flex-end' },
    keyboardView: { flex: 1, justifyContent: 'flex-end' },
    
    contentContainer: {
        width: '100%',
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },

    headerContainer: {
        width: '100%',
        marginBottom: 25,
        paddingHorizontal: 10,
    },
    welcomeText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitleText: {
        fontSize: 16,
        color: '#E2E8F0',
        marginTop: 5,
        fontWeight: '500',
    },

    formCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingVertical: 30,
        paddingHorizontal: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },

    inputWrapper: { marginBottom: 15 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        height: 56,
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

    messageBox: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },
    msgError: { backgroundColor: '#FEF2F2' },
    msgSuccess: { backgroundColor: '#ECFDF5' },
    messageText: { fontSize: 13, textAlign: 'center', fontWeight: '600' },
    resendText: { color: '#0072FF', fontWeight: 'bold', marginTop: 5, textDecorationLine: 'underline' },

    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        marginTop: 5,
    },
    rememberRow: { flexDirection: 'row', alignItems: 'center' },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#0072FF',
        borderColor: '#0072FF',
    },
    rememberText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
    forgotText: { color: '#0072FF', fontSize: 14, fontWeight: '600' },

    mainButtonShadow: {
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        borderRadius: 16,
    },
    mainButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginRight: 10,
    },

    footerContainer: { marginTop: 25, alignItems: 'center' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
    divider: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    orText: { marginHorizontal: 15, color: '#94A3B8', fontSize: 14, fontWeight: '600' },
    
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    googleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
        marginLeft: 12,
    },

    switchContainer: { flexDirection: 'row', alignItems: 'center' },
    switchText: { color: '#64748B', fontSize: 15 },
    switchLink: { color: '#0072FF', fontSize: 15, fontWeight: '700' },
});