import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { KeyboardAvoidingView, Platform } from 'react-native';

const { height } = Dimensions.get('window');

const ProfileSetupScreen = () => {
    // We assume the user object is already populated from the successful login redirect
    const { user, updateUserProfile, isLoading: isAuthLoading } = useAuth(); 
    const router = useRouter();
    
    // Default values are pre-filled with existing user data if available
    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            // Use existing user data for pre-filling/editing
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            phone_number: user?.phone_number || '',
            location: user?.location || '',
            bio: user?.bio || '',
        }
    });
    const [apiError, setApiError] = useState('');

    const onSubmit = async (data) => {
        setApiError('');
        
        // Data contains: { first_name, last_name, phone_number, location, bio }
        // The API only expects fields that can be updated (PATCH).

        // You might need to adjust the path to the AuthContext update function
        const success = await updateUserProfile(data); 

        if (success) {
            Alert.alert("Success", "Profile updated! Welcome to LocaLynk.", [
                { text: "OK", onPress: () => router.replace('/home') }
            ]);
        } else {
            // The AuthContext will handle setting the error state/message
            // We can just show a general error here or rely on the global message system
            setApiError("Failed to update profile. Please check the information and try again.");
        }
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                <View style={styles.container}>
                    <Text style={styles.title}>👋 Complete Your Profile</Text>
                    <Text style={styles.subtitle}>
                        We just need a few more details for KYC and a personalized experience.
                    </Text>

                    {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
                    
                    {/* First Name (Mandatory for first-time onboarding) */}
                    <Controller
                        control={control}
                        name="first_name"
                        rules={{ required: 'First Name is required' }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                placeholder="First Name"
                                style={styles.input}
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                    {errors.first_name && <Text style={styles.errorText}>{errors.first_name.message}</Text>}

                    {/* Last Name (Mandatory for first-time onboarding) */}
                    <Controller
                        control={control}
                        name="last_name"
                        rules={{ required: 'Last Name is required' }}
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                placeholder="Last Name"
                                style={styles.input}
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />
                    {errors.last_name && <Text style={styles.errorText}>{errors.last_name.message}</Text>}

                    {/* Phone Number (Optional) */}
                    <Controller
                        control={control}
                        name="phone_number"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                placeholder="Phone Number (Optional)"
                                style={styles.input}
                                value={value}
                                onChangeText={onChange}
                                keyboardType="phone-pad"
                            />
                        )}
                    />

                    {/* Location (Optional) */}
                    <Controller
                        control={control}
                        name="location"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                placeholder="Location (e.g., City, Province)"
                                style={styles.input}
                                value={value}
                                onChangeText={onChange}
                            />
                        )}
                    />

                    {/* Bio (Optional) */}
                    <Controller
                        control={control}
                        name="bio"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                placeholder="Bio/About Me (Optional)"
                                style={[styles.input, styles.bioInput]}
                                value={value}
                                onChangeText={onChange}
                                multiline
                            />
                        )}
                    />

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.button, (isSubmitting || isAuthLoading) && { opacity: 0.6 }]}
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting || isAuthLoading}
                    >
                        <Text style={styles.buttonText}>
                            {isSubmitting ? 'Saving...' : 'Continue to App'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

export default ProfileSetupScreen;

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#D9E2E9',
    },
    container: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#555',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderColor: '#ccc',
        borderWidth: 1,
        marginVertical: 8,
        paddingHorizontal: 15,
        fontSize: 14,
    },
    bioInput: {
        height: 100,
        paddingTop: 15,
        textAlignVertical: 'top',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginBottom: 5,
        textAlign: 'left',
        alignSelf: 'flex-start',
        width: '100%',
    },
    button: {
        backgroundColor: '#0072FF',
        padding: 15,
        borderRadius: 8,
        width: '100%',
        marginTop: 20,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});