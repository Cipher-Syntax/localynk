import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    ScrollView, 
    Alert, 
    Image, 
    Platform,
    ActivityIndicator,
    KeyboardAvoidingView 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../api/api';

const ProfileSetupScreen = () => {
    const { user, refreshUser } = useAuth(); 
    const router = useRouter();
    
    const [isLoading, setIsLoading] = useState(false);
    const [profileImage, setProfileImage] = useState(null);

    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            first_name: user?.first_name || '',
            middle_name: user?.middle_name ||  '',
            last_name: user?.last_name || '',
            phone_number: user?.phone_number || '',
            location: user?.location || '',
            bio: user?.bio || '',
        }
    });

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'We need access to your photos to upload a profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            
            formData.append('first_name', data.first_name);
            formData.append('last_name', data.last_name);
            if (data.middle_name) formData.append('middle_name', data.middle_name);
            formData.append('phone_number', data.phone_number);
            formData.append('location', data.location);
            formData.append('bio', data.bio);

            if (profileImage) {
                const filename = profileImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                formData.append('profile_picture', {
                    uri: Platform.OS === 'ios' ? profileImage.replace('file://', '') : profileImage,
                    name: filename,
                    type: type,
                });
            }

            await api.patch('/api/profile/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            await refreshUser();

            Alert.alert("Success", "Profile updated! Welcome to LocaLynk.", [
                { text: "Let's Go", onPress: () => router.replace('/(protected)/onboarding/terms_and_conditions') }
            ]);

        } catch (error) {
            console.error("Profile Update Error:", error);
            const msg = error.response?.data?.detail || "Failed to update profile. Please try again.";
            Alert.alert("Error", msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header Text */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.headerTitle}>Complete Your Profile</Text>
                            <Text style={styles.headerSubtitle}>Let's get to know you better.</Text>
                        </View>

                        <View style={styles.avatarContainer}>
                            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                                {profileImage ? (
                                    <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Ionicons name="camera" size={32} color="#9CA3AF" />
                                        <Text style={styles.avatarText}>Upload Photo</Text>
                                    </View>
                                )}
                                <View style={styles.editBadge}>
                                    <Ionicons name="pencil" size={12} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formContainer}>
                            <Text style={styles.label}>First Name</Text>
                            <Controller
                                control={control}
                                name="first_name"
                                rules={{ required: 'First Name is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. John"
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                )}
                            />
                            {errors.first_name && <Text style={styles.errorText}>{errors.first_name.message}</Text>}

                            <Text style={styles.label}>Middle Name (Optional)</Text>
                            <Controller
                                control={control}
                                name="middle_name"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Quincy"
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                )}
                            />

                            <Text style={styles.label}>Last Name</Text>
                            <Controller
                                control={control}
                                name="last_name"
                                rules={{ required: 'Last Name is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Doe"
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                )}
                            />
                            {errors.last_name && <Text style={styles.errorText}>{errors.last_name.message}</Text>}

                            <Text style={styles.label}>Phone Number</Text>
                            <Controller
                                control={control}
                                name="phone_number"
                                rules={{ required: 'Phone Number is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0912 345 6789"
                                        keyboardType="phone-pad"
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                )}
                            />
                            {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number.message}</Text>}

                            <Text style={styles.label}>Location</Text>
                            <Controller
                                control={control}
                                name="location"
                                rules={{ required: 'Location is required' }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="City, Province"
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                )}
                            />
                            {errors.location && <Text style={styles.errorText}>{errors.location.message}</Text>}

                            <Text style={styles.label}>Bio</Text>
                            <Controller
                                control={control}
                                name="bio"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        placeholder="I love hiking and exploring hidden gems..."
                                        multiline
                                        numberOfLines={4}
                                        value={value}
                                        onChangeText={onChange}
                                        textAlignVertical="top"
                                    />
                                )}
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity 
                            style={styles.submitButtonContainer} 
                            onPress={handleSubmit(onSubmit)}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#0072FF', '#00C6FF']}
                                style={styles.gradientBtn}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Complete Setup</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

export default ProfileSetupScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    headerContainer: {
        marginBottom: 30,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    
    // Avatar Styles
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    avatarWrapper: {
        position: 'relative',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#DBEAFE',
        borderStyle: 'dashed',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#0072FF',
    },
    avatarText: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 4,
        fontWeight: '600',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#0072FF',
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },

    // Form
    formContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 5,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
        marginBottom: 10,
    },
    textArea: {
        height: 100,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: -5,
        marginBottom: 10,
        marginLeft: 5,
    },

    // Submit Button
    submitButtonContainer: {
        marginTop: 10,
        height: 50,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    gradientBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});