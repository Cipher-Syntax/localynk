import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../api/api';
import Toast from '../../../components/Toast';
import { formatPHPhoneLocal, normalizePHPhone } from '../../../utils/phoneNumber';
import {
    NAME_REGEX,
    NAME_ERROR_MESSAGE,
    PHONE_ERROR_MESSAGE,
    validateAdultBirthDate,
    parseYyyyMmDdToLocalDate,
    formatDateAsYyyyMmDd,
} from '../../../utils/validation';
import { findCoordinatesForLocation } from '../../../utils/locationSearch';
import ProfileLocationMapPicker from '../../../components/location/ProfileLocationMapPicker';
import LocationSearchBar from '../../../components/location/LocationSearchBar';

const ProfileSetupScreen = () => {
    const { user, refreshUser } = useAuth(); 
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [showBirthdatePicker, setShowBirthdatePicker] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
    const locationLookupRef = useRef({ timerId: null, requestId: 0 });

    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            first_name: user?.first_name || '',
            middle_name: user?.middle_name ||  '',
            last_name: user?.last_name || '',
            gender: user?.gender || '',
            date_of_birth: user?.date_of_birth || '',
            religion: user?.religion || '',
            dialect: user?.dialect || '',
            phone_number: formatPHPhoneLocal(user?.phone_number || ''),
            location: user?.location || '',
            latitude: user?.latitude ?? null,
            longitude: user?.longitude ?? null,
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

    useEffect(() => {
        return () => {
            if (locationLookupRef.current.timerId) {
                clearTimeout(locationLookupRef.current.timerId);
            }
        };
    }, []);

    const setCoordinatePair = (latitude, longitude) => {
        setValue('latitude', latitude, { shouldDirty: true });
        setValue('longitude', longitude, { shouldDirty: true });
    };

    const clearCoordinatePair = () => {
        setCoordinatePair(null, null);
    };

    const hasCoordinatePair = (latitudeValue, longitudeValue) => {
        const latitude = Number.parseFloat(latitudeValue);
        const longitude = Number.parseFloat(longitudeValue);
        return Number.isFinite(latitude) && Number.isFinite(longitude);
    };

    const syncCoordinatesFromLocation = async (locationText) => {
        if (locationLookupRef.current.timerId) {
            clearTimeout(locationLookupRef.current.timerId);
            locationLookupRef.current.timerId = null;
        }

        const requestId = locationLookupRef.current.requestId + 1;
        locationLookupRef.current.requestId = requestId;

        const query = String(locationText || '').trim();
        if (!query) {
            clearCoordinatePair();
            return null;
        }

        if (query.length < 2) {
            return null;
        }

        const resolved = await findCoordinatesForLocation(query);
        if (locationLookupRef.current.requestId !== requestId) return null;
        if (!resolved) return null;

        setCoordinatePair(resolved.latitude, resolved.longitude);
        return resolved;
    };

    const scheduleCoordinatesSyncFromLocation = (locationText) => {
        if (locationLookupRef.current.timerId) {
            clearTimeout(locationLookupRef.current.timerId);
            locationLookupRef.current.timerId = null;
        }

        const query = String(locationText || '').trim();
        const requestId = locationLookupRef.current.requestId + 1;
        locationLookupRef.current.requestId = requestId;

        if (!query) {
            clearCoordinatePair();
            return;
        }

        if (query.length < 2) {
            return;
        }

        locationLookupRef.current.timerId = setTimeout(async () => {
            const resolved = await findCoordinatesForLocation(query);
            if (locationLookupRef.current.requestId !== requestId) return;

            if (!resolved) return;

            setCoordinatePair(resolved.latitude, resolved.longitude);
        }, 280);
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const formData = new FormData();
            
            formData.append('first_name', data.first_name);
            formData.append('last_name', data.last_name);
            if (data.middle_name) formData.append('middle_name', data.middle_name);
            formData.append('gender', String(data.gender || '').trim());
            formData.append('date_of_birth', String(data.date_of_birth || '').trim());
            formData.append('religion', String(data.religion || '').trim());
            formData.append('dialect', String(data.dialect || '').trim());
            const normalizedPhone = normalizePHPhone(data.phone_number);
            if (!normalizedPhone) {
                setToast({ visible: true, message: 'Please enter a valid PH mobile number.', type: 'error' });
                setIsLoading(false);
                return;
            }
            formData.append('phone_number', normalizedPhone);
            formData.append('location', data.location);

            let latitudeToSubmit = data.latitude;
            let longitudeToSubmit = data.longitude;

            if (!hasCoordinatePair(latitudeToSubmit, longitudeToSubmit)) {
                const resolved = await syncCoordinatesFromLocation(data.location);
                if (resolved) {
                    latitudeToSubmit = resolved.latitude;
                    longitudeToSubmit = resolved.longitude;
                }
            }

            if (hasCoordinatePair(latitudeToSubmit, longitudeToSubmit)) {
                formData.append('latitude', String(latitudeToSubmit));
                formData.append('longitude', String(longitudeToSubmit));
            }

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

            setToast({ visible: true, message: 'Profile updated! Welcome to LocaLynk.', type: 'success' });
            setTimeout(() => {
                // Navigate to Personalization
                router.replace('/(protected)/onboarding/personalization');
            }, 1500);

        } catch (error) {
            console.error("Profile Update Error:", error);
            const msg = error.response?.data?.detail || "Failed to update profile. Please try again.";
            setToast({ visible: true, message: msg, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
                <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.headerContainer}>
                            <Text style={styles.headerTitle}>Complete Your Profile</Text>
                            <Text style={styles.headerSubtitle}>Let&apos;s get to know you better.</Text>
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
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. John"
                                        value={value}
                                        onChangeText={onChange}
                                        placeholderTextColor="#6B7280"
                                    />
                                )}
                            />
                            {errors.first_name && <Text style={styles.errorText}>{errors.first_name.message}</Text>}

                            <Text style={styles.label}>Middle Name (Optional)</Text>
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
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Quincy"
                                        value={value}
                                        onChangeText={onChange}
                                        placeholderTextColor="#6B7280"
                                    />
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
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Doe"
                                        value={value}
                                        onChangeText={onChange}
                                        placeholderTextColor="#6B7280"
                                    />
                                )}
                            />
                            {errors.last_name && <Text style={styles.errorText}>{errors.last_name.message}</Text>}

                            <Text style={styles.label}>Gender</Text>
                            <Controller
                                control={control}
                                name="gender"
                                rules={{
                                    validate: (value) => {
                                        const trimmed = String(value || '').trim();
                                        if (!trimmed) return 'Gender is required';
                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Male, Female, Non-binary"
                                        value={value}
                                        onChangeText={onChange}
                                        placeholderTextColor="#6B7280"
                                    />
                                )}
                            />
                            {errors.gender && <Text style={styles.errorText}>{errors.gender.message}</Text>}

                            <Text style={styles.label}>Birthdate</Text>
                            <Controller
                                control={control}
                                name="date_of_birth"
                                rules={{
                                    validate: (value) => validateAdultBirthDate(value, { required: true })
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <>
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            onPress={() => setShowBirthdatePicker(true)}
                                            style={[styles.birthdateInputButton, errors.date_of_birth && styles.inputError]}
                                        >
                                            <Text style={[styles.birthdateInputText, !value && styles.birthdatePlaceholderText]}>
                                                {value || 'Select birthdate'}
                                            </Text>
                                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                        </TouchableOpacity>

                                        {showBirthdatePicker && (
                                            <View style={styles.birthdatePickerWrap}>
                                                <DateTimePicker
                                                    value={parseYyyyMmDdToLocalDate(value) || getDefaultBirthdate()}
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
                                )}
                            />
                            {errors.date_of_birth && <Text style={styles.errorText}>{errors.date_of_birth.message}</Text>}

                            <Text style={styles.label}>Religion</Text>
                            <Controller
                                control={control}
                                name="religion"
                                rules={{
                                    validate: (value) => {
                                        const trimmed = String(value || '').trim();
                                        if (!trimmed) return 'Religion is required';
                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Roman Catholic"
                                        value={value}
                                        onChangeText={onChange}
                                        placeholderTextColor="#6B7280"
                                    />
                                )}
                            />
                            {errors.religion && <Text style={styles.errorText}>{errors.religion.message}</Text>}

                            <Text style={styles.label}>Dialect</Text>
                            <Controller
                                control={control}
                                name="dialect"
                                rules={{
                                    validate: (value) => {
                                        const trimmed = String(value || '').trim();
                                        if (!trimmed) return 'Dialect is required';
                                        return true;
                                    }
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Cebuano"
                                        value={value}
                                        onChangeText={onChange}
                                        placeholderTextColor="#6B7280"
                                    />
                                )}
                            />
                            {errors.dialect && <Text style={styles.errorText}>{errors.dialect.message}</Text>}

                            <Text style={styles.label}>Phone Number</Text>
                            <Controller
                                control={control}
                                name="phone_number"
                                rules={{
                                    validate: (value) => {
                                        const trimmed = String(value || '').trim();
                                        if (!trimmed) return 'Phone Number is required';
                                        return normalizePHPhone(trimmed) ? true : PHONE_ERROR_MESSAGE;
                                    }
                                }}
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={styles.input}
                                        placeholder="0912 345 6789"
                                        keyboardType="phone-pad"
                                        value={value}
                                        onChangeText={(text) => onChange(formatPHPhoneLocal(text))}
                                        placeholderTextColor="#6B7280"
                                    />
                                )}
                            />
                            {errors.phone_number && <Text style={styles.errorText}>{errors.phone_number.message}</Text>}

                            <Text style={styles.label}>Location</Text>
                            <View style={{ zIndex: 9999, elevation: 9999, position: 'relative' }}>
                                <Controller
                                    control={control}
                                    name="location"
                                    rules={{
                                        validate: (value) => {
                                            const trimmed = String(value || '').trim();
                                            if (!trimmed) return 'Location is required';
                                            return true;
                                        }
                                    }}
                                    render={({ field: { onChange, onBlur, value } }) => (
                                        <LocationSearchBar
                                            value={value}
                                            onChangeText={(text) => {
                                                onChange(text);
                                                scheduleCoordinatesSyncFromLocation(text);

                                                if (!String(text || '').trim()) {
                                                    clearCoordinatePair();
                                                }
                                            }}
                                            onBlur={(text) => {
                                                onBlur();
                                                void syncCoordinatesFromLocation(text);
                                            }}
                                            onSelectLocation={(loc) => {
                                                onChange(loc.address);
                                                setCoordinatePair(loc.latitude, loc.longitude);
                                            }}
                                            placeholder="Search for a location..."
                                        />
                                    )}
                                />
                            </View>
                            {errors.location && <Text style={styles.errorText}>{errors.location.message}</Text>}

                            <ProfileLocationMapPicker
                                latitude={watch('latitude')}
                                longitude={watch('longitude')}
                                onChangeCoordinates={({ latitude, longitude }) => {
                                    setValue('latitude', latitude, { shouldDirty: true });
                                    setValue('longitude', longitude, { shouldDirty: true });
                                }}
                            />

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
                                        placeholderTextColor="#6B7280"
                                    />
                                )}
                            />
                        </View>

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
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    headerContainer: { marginBottom: 30, alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 5 },
    headerSubtitle: { fontSize: 14, color: '#6B7280' },
    avatarContainer: { alignItems: 'center', marginBottom: 25 },
    avatarWrapper: { position: 'relative' },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#DBEAFE', borderStyle: 'dashed' },
    avatarImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#0072FF' },
    avatarText: { fontSize: 10, color: '#6B7280', marginTop: 4, fontWeight: '600' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0072FF', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    formContainer: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 5 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: '#1F2937', marginBottom: 10 },
    inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    birthdateInputButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    birthdateInputText: { fontSize: 15, color: '#1F2937' },
    birthdatePlaceholderText: { color: '#6B7280' },
    birthdatePickerWrap: {
        marginTop: -4,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    birthdateDoneButton: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingHorizontal: 12,
        paddingVertical: 10,
        alignItems: 'flex-end',
    },
    birthdateDoneText: { color: '#0072FF', fontWeight: '700', fontSize: 14 },
    textArea: { height: 100 },
    errorText: { color: '#EF4444', fontSize: 12, marginTop: -5, marginBottom: 10, marginLeft: 5 },
    submitButtonContainer: { marginTop: 10, height: 50, borderRadius: 12, overflow: 'hidden', shadowColor: '#0072FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    submitButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});