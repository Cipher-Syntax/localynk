import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../api/api';
import Toast from '../../../components/Toast';
import { formatPHPhoneLocal, normalizePHPhone } from '../../../utils/phoneNumber';
import { NAME_REGEX, NAME_ERROR_MESSAGE, PHONE_ERROR_MESSAGE } from '../../../utils/validation';
import ScreenSafeArea from '../../../components/ScreenSafeArea';

const EditProfile = () => {
    const { user, refreshUser } = useAuth(); 
    const router = useRouter();
    
    const [isLoading, setIsLoading] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });

    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            first_name: user?.first_name || '',
            middle_name: user?.middle_name || '',
            last_name: user?.last_name || '',
            phone_number: formatPHPhoneLocal(user?.phone_number || ''),
            payout_account_type: user?.payout_account_type || '',
            payout_account_name: user?.payout_account_name || '',
            payout_account_number: user?.payout_account_number || '',
            payout_account_notes: user?.payout_account_notes || '',
            location: user?.location || '',
            bio: user?.bio || '',
        }
    });

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setToast({ visible: true, message: 'We need access to your photos to upload a profile picture.', type: 'error' });
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
            const normalizedPhone = normalizePHPhone(data.phone_number);
            if (data.phone_number && !normalizedPhone) {
                setToast({ visible: true, message: 'Please enter a valid PH mobile number.', type: 'error' });
                setIsLoading(false);
                return;
            }
            formData.append('phone_number', normalizedPhone || '');
            formData.append('payout_account_type', String(data.payout_account_type || '').trim());
            formData.append('payout_account_name', String(data.payout_account_name || '').trim());
            formData.append('payout_account_number', String(data.payout_account_number || '').trim());
            formData.append('payout_account_notes', String(data.payout_account_notes || '').trim());
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

            setToast({ visible: true, message: 'Profile updated successfully!', type: 'success' });
            setTimeout(() => {
                router.back();
            }, 1500);

        } catch (error) {
            console.error("Edit Profile Error:", error);
            const msg = error.response?.data?.detail || "Failed to update profile. Please try again.";
            setToast({ visible: true, message: msg, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const displayImage = profileImage || user?.profile_picture;

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScreenSafeArea edges={['bottom', 'top']} style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
                <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                    
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Edit Profile</Text>
                        <View style={{ width: 40 }} /> 
                    </View>

                    <View style={styles.avatarContainer}>
                        <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                            {displayImage ? (
                                <Image source={{ uri: displayImage }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="camera" size={32} color="#9CA3AF" />
                                    <Text style={styles.avatarText}>Upload</Text>
                                </View>
                            )}
                            <View style={styles.editBadge}>
                                <Ionicons name="camera" size={14} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formContainer}>
                        
                        <Text style={styles.label}>First Name</Text>
                        <Controller
                            control={control}
                            name="first_name"
                            rules={{
                                validate: (value) => {
                                    const trimmed = String(value || '').trim();
                                    if (!trimmed) return 'First Name is required';
                                    return NAME_REGEX.test(trimmed) || NAME_ERROR_MESSAGE;
                                }
                            }}
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
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

                        <Text style={styles.label}>Middle Name</Text>
                        <Controller
                            control={control}
                            name="middle_name"
                            rules={{
                                validate: (value) => {
                                    const trimmed = String(value || '').trim();
                                    if (!trimmed) return true;
                                    return NAME_REGEX.test(trimmed) || NAME_ERROR_MESSAGE;
                                }
                            }}
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Middle Name (Optional)"
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                </View>
                            )}
                        />
                        {errors.middle_name && <Text style={styles.errorText}>{errors.middle_name.message}</Text>}

                        <Text style={styles.label}>Last Name</Text>
                        <Controller
                            control={control}
                            name="last_name"
                            rules={{
                                validate: (value) => {
                                    const trimmed = String(value || '').trim();
                                    if (!trimmed) return 'Last Name is required';
                                    return NAME_REGEX.test(trimmed) || NAME_ERROR_MESSAGE;
                                }
                            }}
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
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

                        <Text style={styles.label}>Phone Number</Text>
                        <Controller
                            control={control}
                            name="phone_number"
                            rules={{
                                validate: (value) => {
                                    const trimmed = String(value || '').trim();
                                    if (!trimmed) return true;
                                    return normalizePHPhone(trimmed) ? true : PHONE_ERROR_MESSAGE;
                                }
                            }}
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Phone Number"
                                        style={styles.input}
                                        value={value}
                                        onChangeText={(text) => onChange(formatPHPhoneLocal(text))}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            )}
                        />
                        {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number.message}</Text>}

                        <Text style={styles.sectionLabel}>Payout Account (For Guide Earnings)</Text>

                        <Text style={styles.label}>Payout Channel</Text>
                        <Controller
                            control={control}
                            name="payout_account_type"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="wallet-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="GCash, Bank, Maya, or Other"
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                </View>
                            )}
                        />

                        <Text style={styles.label}>Account Name</Text>
                        <Controller
                            control={control}
                            name="payout_account_name"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-circle-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Name on account"
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                </View>
                            )}
                        />

                        <Text style={styles.label}>Account Number</Text>
                        <Controller
                            control={control}
                            name="payout_account_number"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="card-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="GCash/Bank account number"
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                </View>
                            )}
                        />

                        <Text style={styles.label}>Payout Notes</Text>
                        <Controller
                            control={control}
                            name="payout_account_notes"
                            render={({ field: { onChange, value } }) => (
                                <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
                                    <Ionicons name="document-text-outline" size={20} color="#6B7280" style={[styles.inputIcon, { marginTop: 12 }]} />
                                    <TextInput
                                        placeholder="Optional payout instructions"
                                        style={[styles.input, styles.notesInput]}
                                        value={value}
                                        onChangeText={onChange}
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                    />
                                </View>
                            )}
                        />

                        <Text style={styles.label}>Location</Text>
                        <Controller
                            control={control}
                            name="location"
                            render={({ field: { onChange, value } }) => (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="location-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="City, Province"
                                        style={styles.input}
                                        value={value}
                                        onChangeText={onChange}
                                    />
                                </View>
                            )}
                        />

                        <Text style={styles.label}>Bio</Text>
                        <Controller
                            control={control}
                            name="bio"
                            render={({ field: { onChange, value } }) => (
                                <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
                                    <Ionicons name="information-circle-outline" size={20} color="#6B7280" style={[styles.inputIcon, { marginTop: 12 }]} />
                                    <TextInput
                                        placeholder="Tell us about yourself..."
                                        style={[styles.input, styles.bioInput]}
                                        value={value}
                                        onChangeText={onChange}
                                        multiline
                                        numberOfLines={4}
                                        textAlignVertical="top"
                                    />
                                </View>
                            )}
                        />

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
                                    <Text style={styles.submitButtonText}>Save Changes</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </ScreenSafeArea>
        </KeyboardAvoidingView>
    );
}

export default EditProfile;

const styles = StyleSheet.create({
    scrollContainer: { flexGrow: 1, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    avatarContainer: { alignItems: 'center', marginVertical: 25 },
    avatarWrapper: { position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#DBEAFE', borderStyle: 'dashed' },
    avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#0072FF' },
    avatarText: { fontSize: 10, color: '#6B7280', marginTop: 4, fontWeight: '600' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0072FF', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    formContainer: { paddingHorizontal: 20, backgroundColor: '#fff', marginHorizontal: 15, borderRadius: 16, paddingVertical: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: '#1E40AF', marginTop: 8, marginBottom: 8, textTransform: 'uppercase' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, paddingHorizontal: 12 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, height: 48, fontSize: 15, color: '#1F2937' },
    bioInput: { height: 100, paddingTop: 12 },
    notesInput: { height: 82, paddingTop: 12 },
    errorText: { color: '#EF4444', fontSize: 12, marginTop: -8, marginBottom: 10, marginLeft: 4 },
    submitButtonContainer: { marginTop: 20, height: 50, borderRadius: 12, overflow: 'hidden', shadowColor: '#0072FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});