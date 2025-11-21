import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons'; // For icons in input fields

const { height } = Dimensions.get('window');

const EditProfileScreen = () => {
    const { user, updateUserProfile, isLoading: isAuthLoading } = useAuth(); 
    const router = useRouter();
    
    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            phone_number: user?.phone_number || '',
            location: user?.location || '',
            bio: user?.bio || '',
            // Potentially add profile_picture here if it becomes editable
        }
    });
    const [apiError, setApiError] = useState('');

    const onSubmit = async (data) => {
        setApiError('');
        
        const success = await updateUserProfile(data); 

        if (success) {
            Alert.alert("Success", "Profile updated successfully!", [
                { text: "OK", onPress: () => router.replace('/profile') } // Redirect to home or back to profile view
            ]);
        } else {
            setApiError("Failed to update profile. Please check the information and try again.");
        }
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    <View style={styles.container}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Edit Your Profile</Text>
                        <Text style={styles.subtitle}>
                            Update your personal information to keep your profile current.
                        </Text>

                        {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}
                        
                        {/* First Name */}
                        <Controller
                            control={control}
                            name="first_name"
                            rules={{ required: 'First Name is required' }}
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="First Name"
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                </View>
                            )}
                        />
                        {errors.first_name && <Text style={styles.errorText}>{errors.first_name.message}</Text>}

                        {/* Last Name */}
                        <Controller
                            control={control}
                            name="last_name"
                            rules={{ required: 'Last Name is required' }}
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Last Name"
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                </View>
                            )}
                        />
                        {errors.last_name && <Text style={styles.errorText}>{errors.last_name.message}</Text>}

                        {/* Phone Number */}
                        <Controller
                            control={control}
                            name="phone_number"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Phone Number (Optional)"
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            )}
                        />

                        {/* Location */}
                        <Controller
                            control={control}
                            name="location"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Location (e.g., City, Province)"
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                </View>
                            )}
                        />

                        {/* Bio */}
                        <Controller
                            control={control}
                            name="bio"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="information-circle-outline" size={20} color="#666" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Bio/About Me (Optional)"
                                        style={[styles.input, styles.bioInput]}
                                        value={value}
                                        onChangeText={onChange}
                                        multiline
                                    />
                                </View>
                            )}
                        />

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.button, (isSubmitting || isAuthLoading) && { opacity: 0.6 }]}
                            onPress={handleSubmit(onSubmit)}
                            disabled={isSubmitting || isAuthLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

export default EditProfileScreen;

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#F5F7FA', // Consistent background
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
    backButton: {
        position: 'absolute',
        top: 15,
        left: 15,
        zIndex: 10,
        padding: 5,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#0F172A',
        marginBottom: 10,
        textAlign: 'center',
        marginTop: 20, // Adjust for back button
    },
    subtitle: {
        fontSize: 15,
        color: '#555',
        marginBottom: 25,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderColor: '#E0E6ED',
        borderWidth: 1,
        marginVertical: 8,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 15,
        color: '#333',
    },
    bioInput: {
        height: 100,
        paddingTop: 15,
        textAlignVertical: 'top',
    },
    errorText: {
        color: '#FF5A5F', // A more aesthetic red
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