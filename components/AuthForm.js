import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, ImageBackground, 
    KeyboardAvoidingView, TouchableWithoutFeedback, 
    Keyboard, ActivityIndicator, ScrollView, Platform
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking'; 
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth, useAuthMessage } from '../context/AuthContext'; 
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import {
    NAME_REGEX,
    NAME_ERROR_MESSAGE,
    EMAIL_REGEX,
    EMAIL_ERROR_MESSAGE,
    validateAdultBirthDate,
    parseYyyyMmDdToLocalDate,
    formatDateAsYyyyMmDd,
} from '../utils/validation';
import { styles } from './styles/AuthForm.styles';

const AuthForm = ({ method }) => {
    const { login, register, googleLogin, resendVerificationEmail, reactivateAccount } = useAuth(); 
    const { message, messageType, clearMessage, setMessage } = useAuthMessage(); 

    const { control, handleSubmit, watch, trigger, formState: { errors, isSubmitting } } = useForm();
    const [remember, setRemember] = useState(false);
    const [registerStep, setRegisterStep] = useState(1);
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showBirthdatePicker, setShowBirthdatePicker] = useState(false);
    
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isReactivating, setIsReactivating] = useState(false); 

    const router = useRouter();

    const bgImage = method === 'login'
        ? require('../assets/localynk_images/login_background.jpg')
        : require('../assets/localynk_images/register_background.jpg');

    const titleText = method === 'login' ? 'Welcome Back' : 'Start Journey';
    const subtitleText = method === 'login' ? 'Continue your adventure' : 'Join the community of explorers';
    const usernamePlaceholder = method === 'login' ? 'Username/Email' : 'Username';
    const usernameRequiredMessage = method === 'login' ? 'Username or email is required' : 'Username is required';
    const normalizedMessage = typeof message === 'string' ? message.toLowerCase() : '';

    // Check if the current error means we need to reactivate
    const isDeactivatedError = message && (
        message.includes('inactive') || 
        message.toLowerCase().includes('deactivated') || 
        message.toLowerCase().includes('reactivate')
    ) && method === 'login' && messageType === 'error';

    const shouldShowResendButton =
        method === 'login' &&
        messageType === 'error' &&
        (normalizedMessage.includes('verify') ||
            normalizedMessage.includes('verification') ||
            normalizedMessage.includes('resend'));

    const registerStepTitles = {
        1: 'Account Basics',
        2: 'Personal Details',
        3: 'Security Setup',
    };

    const getRegisterStepFields = (step) => {
        if (step === 1) return ['username', 'email'];
        if (step === 2) return ['first_name', 'middle_name', 'last_name', 'date_of_birth'];
        return ['password', 'confirm_password'];
    };

    useEffect(() => {
        if (method !== 'login') return;

        const handleDeepLink = (event) => {
            if (!event.url) return;
            
            let data = Linking.parse(event.url);
            
            if (data.queryParams?.status === 'success') {
                setMessage(
                    data.queryParams?.message || "Your account has been successfully verified. You can now log in.",
                    'success'
                );
            } else if (data.queryParams?.status === 'error') {
                setMessage(
                    data.queryParams?.message || "Invalid or expired verification link.",
                    'error'
                );
            }
        };

        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink({ url });
        });

        const subscription = Linking.addEventListener('url', handleDeepLink);

        return () => subscription.remove();
    }, [method, setMessage]);

    useEffect(() => {
        if (method !== 'register') {
            setRegisterStep(1);
            setShowBirthdatePicker(false);
            return;
        }

        if (registerStep !== 2) {
            setShowBirthdatePicker(false);
        }
    }, [method, registerStep]);

    const handleNavigation = (user) => {
        if (user) {
            const isFirstNameMissing = !user.first_name || String(user.first_name).trim() === "";
            const isLastNameMissing = !user.last_name || String(user.last_name).trim() === "";
            const isPhoneMissing = !user.phone_number || String(user.phone_number).trim() === "";
            const isLocationMissing = !user.location || String(user.location).trim() === "";
            const isGenderMissing = !user.gender || String(user.gender).trim() === "";
            const isBirthdateMissing = !user.date_of_birth || String(user.date_of_birth).trim() === "";
            const isReligionMissing = !user.religion || String(user.religion).trim() === "";
            const isDialectMissing = !user.dialect || String(user.dialect).trim() === "";

            if (user.has_accepted_terms === false) {
                router.replace('/(protected)/onboarding/terms_and_conditions');
            } 
            else if (
                isFirstNameMissing
                || isLastNameMissing
                || isPhoneMissing
                || isLocationMissing
                || isGenderMissing
                || isBirthdateMissing
                || isReligionMissing
                || isDialectMissing
            ) {
                router.replace('/(protected)/onboarding/profile_setup');
            } 
            else {
                router.replace('/(protected)/home'); 
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
                first_name: String(data.first_name || '').trim(),
                middle_name: String(data.middle_name || '').trim(),
                last_name: String(data.last_name || '').trim(),
                password: data.password,
                confirm_password: data.confirm_password,
                date_of_birth: String(data.date_of_birth || '').trim(),
            };

            const result = await register(userData);

            if (result && result.success) {
                router.replace('/auth/login')
            }
        }
    };

    const getDefaultBirthdate = () => {
        const fallback = new Date();
        fallback.setFullYear(fallback.getFullYear() - 18);
        return fallback;
    };

    const handleBirthdateChange = (onChange) => (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowBirthdatePicker(false);
        }

        if (event?.type === 'dismissed' || !selectedDate) {
            return;
        }

        onChange(formatDateAsYyyyMmDd(selectedDate));
    };

    const goToNextRegisterStep = async () => {
        const fieldsToValidate = getRegisterStepFields(registerStep);
        const isStepValid = await trigger(fieldsToValidate);
        if (!isStepValid) return;

        setRegisterStep((prev) => Math.min(3, prev + 1));
    };

    const goToPreviousRegisterStep = () => {
        setRegisterStep((prev) => Math.max(1, prev - 1));
    };

    const handleReactivate = async () => {
        const username = watch('username');
        const password = watch('password');
        
        if (!username || !password) {
            clearMessage();
            setMessage("Please type your username and password, then click 'Reactivate Account' again.", "error");
            return;
        }
        
        setIsReactivating(true);
        clearMessage();
        
        // Step 1: Reactivate the account on the backend
        const reactivateResult = await reactivateAccount(username, password);
        
        // Step 2: If successful, navigate directly using the returned user.
        if (reactivateResult) {
             setIsReactivating(false);
             handleNavigation(reactivateResult);
        } else {
             setIsReactivating(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        clearMessage();
        try {
            const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_ACTUAL_GOOGLE_CLIENT_ID_HERE";
            
            GoogleSignin.configure({
                webClientId: clientId,
                offlineAccess: true,
                scopes: ['profile', 'email']
            });

            await GoogleSignin.hasPlayServices();
            await GoogleSignin.signIn();
            const tokens = await GoogleSignin.getTokens();

            if (tokens?.idToken) {
                const successUser = await googleLogin(tokens.idToken);
                if (successUser) handleNavigation(successUser);
            } else {
                setMessage("Could not get ID token from Google.", "error");
            }

        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log("User cancelled login");
            } else if (error.code === statusCodes.IN_PROGRESS) {
                console.log("Sign in is in progress");
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                setMessage("Google Play Services not available", "error");
            } else {
                console.error(error);
                setMessage(error.message || "Google Login failed", "error");
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleResendVerification = async () => {
        const usernameOrEmail = String(watch('username') || '').trim();
        if (!usernameOrEmail) {
            clearMessage();
            setMessage("Please enter your username or email to resend verification.", "error");
            return;
        }

        clearMessage(); 
        await resendVerificationEmail(usernameOrEmail);
    };

    // Determine what the main button should do and say
    let mainButtonAction = handleSubmit(onSubmit);
    let mainButtonText = method === 'login' ? 'Log In' : (registerStep === 3 ? 'Sign Up' : 'Next Step');

    if (method === 'register' && registerStep < 3) {
        mainButtonAction = goToNextRegisterStep;
    }

    if (isDeactivatedError) {
        mainButtonAction = handleReactivate;
        mainButtonText = 'Reactivate Account';
    }

    if (isSubmitting || isReactivating) {
        mainButtonText = 'Please wait...';
    }

    const renderRegisterProgressBar = () => (
        <View style={styles.progressContainer}>
            <View style={styles.progressInner}>
                {[1, 2, 3].map((step, index) => (
                    <React.Fragment key={`register-step-${step}`}>
                        <View style={[styles.stepDot, registerStep >= step && styles.stepDotActive]}>
                            <Text style={[styles.stepNumber, registerStep >= step && styles.stepNumberActive]}>
                                {step}
                            </Text>
                        </View>
                        {index < 2 && <View style={[styles.stepLine, registerStep > step && styles.stepLineActive]} />}
                    </React.Fragment>
                ))}
            </View>
            <Text style={styles.stepCaption}>
                {`Step ${registerStep} of 3 - ${registerStepTitles[registerStep]}`}
            </Text>
        </View>
    );

    const renderInput = (
        controlName,
        placeholder,
        iconName,
        isPassword = false,
        showPassState = false,
        setShowPassState = null,
        rules = {},
        inputProps = {}
    ) => (
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
                            autoCapitalize={inputProps.autoCapitalize ?? "none"}
                            keyboardType={inputProps.keyboardType}
                            maxLength={inputProps.maxLength}
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
        <View style={styles.container}>
            <ImageBackground source={bgImage} style={styles.bgImage} resizeMode="cover">
                <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'rgba(15, 23, 42, 0.85)']}
                    style={styles.gradientOverlay}
                >
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior="padding"
                        keyboardVerticalOffset={8}
                    >
                        <ScrollView 
                            style={{ flex: 1 }}
                            contentContainerStyle={styles.scrollContentContainer}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                <View style={styles.innerContentWrapper}>
                                    
                                    <View style={styles.headerContainer}>
                                        <Text style={styles.welcomeText}>{titleText}</Text>
                                        <Text style={styles.subtitleText}>{subtitleText}</Text>
                                    </View>

                                    <View style={styles.formCard}>
                                        {method === 'register' && renderRegisterProgressBar()}
                                        
                                        {message ? (
                                            <View style={[styles.messageBox, messageType === 'error' ? styles.msgError : styles.msgSuccess]}>
                                                <Text style={[styles.messageText, messageType === 'error' ? {color:'#EF4444'} : {color:'#10B981'}]}>
                                                    {message}
                                                </Text>
                                                
                                                {shouldShowResendButton && (
                                                    <View style={styles.actionButtonsRow}>
                                                        <TouchableOpacity onPress={handleResendVerification} style={styles.actionButton}>
                                                            <Text style={styles.actionText}>Resend Email</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                )}
                                            </View>
                                        ) : null}

                                        {(method === 'login' || (method === 'register' && registerStep === 1)) &&
                                            renderInput('username', usernamePlaceholder, 'user', false, null, null, { required: usernameRequiredMessage })
                                        }
                                        
                                        {method === 'register' && registerStep === 1 && renderInput('email', 'Email Address', 'envelope', false, null, null, { 
                                            required: 'Email is required', 
                                            pattern: { value: EMAIL_REGEX, message: EMAIL_ERROR_MESSAGE } 
                                        })}

                                        {method === 'register' && registerStep === 2 && renderInput('first_name', 'First Name', 'user', false, null, null, {
                                            validate: (value) => {
                                                const trimmed = String(value || '').trim();
                                                if (!trimmed) return 'First name is required';
                                                return NAME_REGEX.test(trimmed) || NAME_ERROR_MESSAGE;
                                            }
                                        }, {
                                            autoCapitalize: 'words'
                                        })}

                                        {method === 'register' && registerStep === 2 && renderInput('middle_name', 'Middle Name (Optional)', 'user', false, null, null, {
                                            validate: (value) => {
                                                const trimmed = String(value || '').trim();
                                                if (!trimmed) return true;
                                                return NAME_REGEX.test(trimmed) || NAME_ERROR_MESSAGE;
                                            }
                                        }, {
                                            autoCapitalize: 'words'
                                        })}

                                        {method === 'register' && registerStep === 2 && renderInput('last_name', 'Last Name', 'user', false, null, null, {
                                            validate: (value) => {
                                                const trimmed = String(value || '').trim();
                                                if (!trimmed) return 'Last name is required';
                                                return NAME_REGEX.test(trimmed) || NAME_ERROR_MESSAGE;
                                            }
                                        }, {
                                            autoCapitalize: 'words'
                                        })}

                                        {method === 'register' && registerStep === 2 && (
                                            <View style={styles.inputWrapper}>
                                                <Controller
                                                    control={control}
                                                    name="date_of_birth"
                                                    defaultValue=""
                                                    rules={{
                                                        validate: (value) => validateAdultBirthDate(value, { required: true })
                                                    }}
                                                    render={({ field: { onChange, value } }) => {
                                                        const pickerValue = parseYyyyMmDdToLocalDate(value) || getDefaultBirthdate();

                                                        return (
                                                            <>
                                                                <TouchableOpacity
                                                                    activeOpacity={0.85}
                                                                    onPress={() => setShowBirthdatePicker(true)}
                                                                >
                                                                    <View style={[styles.inputContainer, errors.date_of_birth && styles.inputError]}>
                                                                        <View style={styles.iconContainer}>
                                                                            <FontAwesome name="calendar" size={20} color="#94A3B8" />
                                                                        </View>
                                                                        <Text style={[styles.dateValueText, !value && styles.datePlaceholderText]}>
                                                                            {value || 'Birthdate'}
                                                                        </Text>
                                                                    </View>
                                                                </TouchableOpacity>

                                                                {showBirthdatePicker && (
                                                                    <View style={styles.birthdatePickerWrap}>
                                                                        <DateTimePicker
                                                                            value={pickerValue}
                                                                            mode="date"
                                                                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                                                            maximumDate={new Date()}
                                                                            onChange={handleBirthdateChange(onChange)}
                                                                        />

                                                                        {Platform.OS === 'ios' && (
                                                                            <TouchableOpacity
                                                                                style={styles.birthdateDoneButton}
                                                                                onPress={() => setShowBirthdatePicker(false)}
                                                                            >
                                                                                <Text style={styles.birthdateDoneText}>Done</Text>
                                                                            </TouchableOpacity>
                                                                        )}
                                                                    </View>
                                                                )}
                                                            </>
                                                        );
                                                    }}
                                                />
                                                {errors.date_of_birth && <Text style={styles.errorText}>{errors.date_of_birth.message}</Text>}
                                            </View>
                                        )}

                                        {(method === 'login' || (method === 'register' && registerStep === 3)) &&
                                            renderInput('password', 'Password', 'lock', true, showPassword, setShowPassword, { 
                                                required: 'Password is required', 
                                                minLength: { value: 8, message: 'Min 8 characters' } 
                                            })
                                        }

                                        {method === 'register' && registerStep === 3 && renderInput('confirm_password', 'Confirm Password', 'lock', true, showConfirmPassword, setShowConfirmPassword, {
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

                                        {method === 'register' && registerStep > 1 && (
                                            <TouchableOpacity
                                                style={styles.secondaryActionButton}
                                                onPress={goToPreviousRegisterStep}
                                                disabled={isSubmitting}
                                            >
                                                <Text style={styles.secondaryActionText}>Back</Text>
                                            </TouchableOpacity>
                                        )}

                                        <TouchableOpacity
                                            style={styles.mainButtonShadow}
                                            onPress={mainButtonAction}
                                            disabled={isSubmitting || isReactivating}
                                        >
                                            <LinearGradient
                                                colors={['#0072FF', '#00C6FF']}
                                                start={{ x: 0, y: 0 }} 
                                                end={{ x: 1, y: 0 }}
                                                style={styles.mainButton}
                                            >
                                                <Text style={styles.mainButtonText}>
                                                    {mainButtonText}
                                                </Text>
                                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        <View style={styles.footerContainer}>
                                            {(method === 'login' || (method === 'register' && registerStep === 3)) && (
                                                <>
                                                    <View style={styles.dividerRow}>
                                                        <View style={styles.divider} />
                                                        <Text style={styles.orText}>OR</Text>
                                                        <View style={styles.divider} />
                                                    </View>

                                                    <TouchableOpacity 
                                                        style={styles.googleButton} 
                                                        onPress={handleGoogleLogin}
                                                        disabled={isGoogleLoading || isReactivating}
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
                                                </>
                                            )}

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
                            </TouchableWithoutFeedback>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </LinearGradient>
            </ImageBackground>
        </View>
    );
};

export default AuthForm;
