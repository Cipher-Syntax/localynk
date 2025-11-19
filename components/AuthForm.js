import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground, StyleSheet, Pressable, Switch, ScrollView, Dimensions, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext'; 

const { height } = Dimensions.get('window');

const AuthForm = ({ method }) => {

    // --- Context Hook ---
    const { login, register } = useAuth();

    const { control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
    const [remember, setRemember] = useState(false);
    const [authError, setAuthError] = useState('');
    const router = useRouter();

    const bgImage = method === 'login'
        ? require('../assets/localynk_images/login_background.png')
        : require('../assets/localynk_images/register_background.png');

    const status = method === 'login' ? 'Welcome Back Adventurer' : 'Join The Adventure';

    const onSubmit = async (data) => {
        setAuthError('');

        if (method === 'login') {
            const successUser = await login(data.username, data.password); 

            if (successUser) {
                // ⭐ CRITICAL CHECK: Robust check for null, undefined, or empty/whitespace strings
                const isFirstNameMissing = !successUser.first_name || String(successUser.first_name).trim() === "";
                const isLastNameMissing = !successUser.last_name || String(successUser.last_name).trim() === "";

                if (isFirstNameMissing || isLastNameMissing) {
                    console.log("Login success: First-time user detected (Missing KYC), redirecting to profile setup.");
                    // ⭐ FIXED: Removed (protected) - using the file path relative to the root group
                    router.replace('/onboarding/profile_setup');
                } else {
                    console.log("Login success: Profile complete, redirecting to home.");
                    router.replace('/home'); 
                }
            } else {
                // Login failed (handled by AuthContext setting error state)
                setAuthError("Login failed. Check your username and password or verify your email.");
            }
        } else {
            const userData = {
                username: data.username,
                email: data.email,
                password: data.password,
                confirm_password: data.confirm_password
            };

            const result = await register(userData);

            if (result.success) {
                setAuthError(result.message)
                router.replace('/auth/login')
            } else {
                setAuthError(result.message);
            }
        }
    };


    useEffect(() => {
        if (authError) {
            const timer = setTimeout(() => setAuthError(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [authError]);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <ImageBackground source={bgImage} style={styles.topHalf} resizeMode="cover" />

                <View style={styles.formContainer}>

                    <MaskedView
                        maskElement={<Text style={[styles.title, { backgroundColor: 'transparent' }]}>{status}</Text>}
                    >
                        <LinearGradient colors={['#0F172A', '#007AAD']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={[styles.title, { opacity: 0 }]}>{status}</Text>
                        </LinearGradient>
                    </MaskedView>

                    {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

                    {/* Username */}
                    <Controller
                        control={control}
                        name="username"
                        defaultValue=""
                        rules={{ required: 'Username is required' }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                placeholder="Username"
                                style={styles.input}
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                    {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}

                    {/* Email */}
                    {method === 'register' && (
                        <>
                            <Controller
                                control={control}
                                name="email"
                                defaultValue=""
                                rules={{
                                    required: 'Email is required',
                                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        placeholder="Email"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={value}
                                        onChangeText={onChange}
                                        style={styles.input}
                                    />
                                )}
                            />
                            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                        </>
                    )}

                    {/* Password */}
                    <Controller
                        control={control}
                        name="password"
                        defaultValue=""
                        rules={{ required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                placeholder="Password"
                                secureTextEntry
                                value={value}
                                onChangeText={onChange}
                                style={styles.input}
                            />
                        )}
                    />
                    {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

                    {/* Confirm Password */}
                    {method === 'register' && (
                        <>
                            <Controller
                                control={control}
                                name="confirm_password"
                                rules={{
                                    required: 'Please confirm your password',
                                    validate: (value) => value === watch('password') || 'Passwords do not match',
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        placeholder="Confirm Password"
                                        secureTextEntry
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                )}
                            />
                            {errors.confirm_password && <Text style={styles.errorText}>{errors.confirm_password.message}</Text>}
                        </>
                    )}

                    {/* Only for login */}
                    {method === 'login' && (
                        <View style={styles.optionsRow}>
                            <View style={styles.rememberRow}>
                                <Switch
                                    value={remember}
                                    onValueChange={setRemember}
                                    thumbColor={remember ? '#007AAD' : '#ccc'}
                                    trackColor={{ false: '#ccc', true: '#007AAD55' }}
                                />
                                <Text style={styles.rememberText}>Keep me signed in</Text>
                            </View>
                            <Pressable onPress={() => console.log('Forgot password')}>
                                <Text style={styles.forgotText}>Forgot?</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.button, isSubmitting && { opacity: 0.6 }]}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.buttonText}>
                            {method === 'login' ? 'Login' : 'Register'}
                        </Text>
                    </TouchableOpacity>

                    {/* Switch login/register */}
                    <View style={{ marginTop: 15 }}>
                        <Text style={styles.smallText}>
                            {method === 'login' ? `New to LocaLynk? ` : `Already have an account? `}
                            <Text
                                style={styles.link}
                                onPress={() => router.push(method === 'login' ? '/auth/register' : '/auth/login')}
                            >
                                {method === 'login' ? 'Create an account' : 'Login'}
                            </Text>
                        </Text>
                    </View>

                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.divider} />
                    </View>

                    <TouchableOpacity
                        style={styles.googleButton}
                        onPress={() => console.log('Sign in with Google')}
                    >
                        <FontAwesome name="google" size={25} />
                        <Text style={styles.googleText}>Continue with Google</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </View>
    );
};

export default AuthForm;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#D9E2E9' },
    topHalf: { height: height * 0.4, width: '100%' },
    formContainer: {
        flex: 1,
        marginTop: -40,
        backgroundColor: '#D9E2E9',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 20,
        paddingTop: 50,
        alignItems: 'center',
        zIndex: 10,
    },
    title: { fontSize: 30, fontWeight: '900', color: '#0F172A', marginBottom: 20, textAlign: 'center' },
    input: {
        width: '100%',
        height: 55,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderColor: '#0F172A',
        borderWidth: 1,
        marginVertical: 5,
        paddingHorizontal: 10,
        fontSize: 14,
        marginBottom: 10,
    },
    errorText: { color: 'red', fontSize: 12, marginBottom: 5, textAlign: 'left', alignSelf: 'flex-start', width: '100%' },
    optionsRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
    rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    rememberText: { fontSize: 12, color: '#444' },
    forgotText: { fontSize: 12, color: '#0F172A', textDecorationLine: 'underline', fontWeight: '500' },
    button: {
        backgroundColor: '#0072FF',
        padding: 15,
        borderRadius: 8,
        width: '100%',
        marginTop: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    buttonText: { color: '#fff', fontWeight: '900' },
    smallText: { color: '#555', fontSize: 14, textAlign: 'center' },
    link: { color: '#007AAD', fontWeight: '900' },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 10, width: '100%', justifyContent: 'space-between' },
    divider: { flex: 1, height: 1, backgroundColor: '#0F172A' },
    dividerText: { marginHorizontal: 10, color: '#444', fontSize: 13 },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        width: '100%',
        paddingVertical: 10,
        marginTop: 5,
    },
    googleText: { marginLeft: 10, color: '#444', fontSize: 14, fontWeight: '900' },
});