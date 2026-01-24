import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import api from '../../api/api'; 
import { Calendar } from 'react-native-calendars';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker'; 
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SPECIALTY_OPTIONS = [
    'History & Culture',
    'Food & Culinary',
    'Nature & Wildlife',
    'Hiking & Trekking',
    'Water Sports',
    'Nightlife & Parties',
    'Photography',
    'Spiritual & Wellness',
    'Shopping & Fashion',
    'Other'
];

const UpdateGuideInfoForm = () => {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const insets = useSafeAreaInsets(); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form States
    const [languages, setLanguages] = useState([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState(SPECIALTY_OPTIONS[0]);
    const [customSpecialty, setCustomSpecialty] = useState('');
    const [experience, setExperience] = useState('');
    const [price, setPrice] = useState('');
    const [availableDays, setAvailableDays] = useState([]);
    const [markedDates, setMarkedDates] = useState({});
    
    // Toast State
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const daysOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMapping = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };

    useEffect(() => {
        if (user) {
            populateForm(user);
        }
    }, [user]);

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

    const populateForm = (data) => {
        if (Array.isArray(data.languages)) {
            setLanguages(data.languages);
        } 
        else if (typeof data.languages === 'string' && data.languages.length > 0) {
            setLanguages(data.languages.split(',').map(l => l.trim()));
        } 
        else {
            setLanguages([]);
        }

        setExperience(data.experience_years ? data.experience_years.toString() : '');
        setPrice(data.price_per_day ? data.price_per_day.toString() : '');
        setAvailableDays(data.available_days || []);
        
        const incomingSpecialty = data.specialty || '';
        if (incomingSpecialty) {
            if (SPECIALTY_OPTIONS.includes(incomingSpecialty)) {
                setSelectedSpecialty(incomingSpecialty);
                setCustomSpecialty('');
            } 
            else {
                setSelectedSpecialty('Other');
                setCustomSpecialty(incomingSpecialty);
            }
        }

        const existingMarkedDates = (data.specific_available_dates || []).reduce((acc, dateString) => {
            acc[dateString] = { selected: true, marked: true, selectedColor: '#007AFF' };
            return acc;
        }, {});
        setMarkedDates(existingMarkedDates);
    };

    const toggleDay = (day) => {
        if (availableDays.includes(day)) {
            setAvailableDays(availableDays.filter(d => d !== day));
        } 
        else {
            setAvailableDays([...availableDays, day]);
        }
    };

    const onDayPress = (day) => {
        const dateString = day.dateString;
        const newMarkedDates = { ...markedDates };

        if (newMarkedDates[dateString]) {
            delete newMarkedDates[dateString];
        } 
        else {
            newMarkedDates[dateString] = { selected: true, marked: true, selectedColor: '#007AFF' };
        }
        setMarkedDates(newMarkedDates);
    };

    const disabledDays = useMemo(() => {
        const enabledDayNumbers = availableDays.map(day => dayMapping[day]);
        const disabled = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startYear = today.getFullYear();
        const endYear = startYear + 1;

        for (let year = startYear; year <= endYear; year++) {
            for (let month = 0; month < 12; month++) {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const dateString = date.toISOString().split('T')[0];

                    if (date < today) {
                        disabled[dateString] = { disabled: true, disableTouchEvent: true, color: '#f0f0f0', textColor: '#d9d9d9' };
                    } else if (!enabledDayNumbers.includes(date.getDay())) {
                        disabled[dateString] = { disabled: true, disableTouchEvent: true, color: '#f9f9f9', textColor: '#d9d9d9' };
                    }
                }
            }
        }
        return disabled;
    }, [availableDays]);

    const handleSubmit = async () => {
        Keyboard.dismiss();
        setIsSubmitting(true);
        const finalSpecialty = selectedSpecialty === 'Other' ? customSpecialty : selectedSpecialty;
        
        if (selectedSpecialty === 'Other' && !customSpecialty.trim()) {
            showToast("Please type your specific specialty.", "error");
            setIsSubmitting(false);
            return;
        }

        const specific_dates = Object.keys(markedDates);

        try {
            await api.patch('api/guide/update-info/', {
                languages, 
                specialty: finalSpecialty,
                experience_years: parseInt(experience, 10),
                price_per_day: parseFloat(price),
                available_days: availableDays,
                specific_available_dates: specific_dates
            });
            
            showToast("Info updated!", "success");
            
            // Navigate back to Dashboard (IsTourist) instead of next step
            setTimeout(() => {
                router.back(); 
            }, 1500);

        } catch (error) {
            const errorData = error.response?.data || error.message;
            console.log("Update Error:", errorData);
            showToast("Failed to update guide info.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    if (authLoading || !user) {
        return (
            <View style={[styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading your profile...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Guide Profile</Text>
                <View style={{ width: 24 }} /> 
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.card}>
                        <View style={styles.cardHeaderRow}>
                            <Ionicons name="ribbon-outline" size={20} color="#007AFF" />
                            <Text style={styles.label}>Subscription Status</Text>
                        </View>
                        {user.guide_tier === 'paid' ? (
                            <View style={styles.statusBox}>
                                <Text style={styles.subTextPaid}>You are a Paid Member</Text>
                                <Text style={styles.subTextDate}>Expires: {new Date(user.subscription_end_date).toLocaleDateString()}</Text>
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.subText}>Free Tier: 1 Booking Limit</Text>
                                <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/(protected)/upgradeMembership')}>
                                    <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>General Information</Text>
                        
                        <Text style={styles.inputLabel}>Languages</Text>
                        <TextInput
                            value={languages.join(', ')}
                            onChangeText={text => setLanguages(text.split(',').map(l => l.trim()))}
                            style={styles.input}
                            placeholder="e.g. English, Tagalog"
                            placeholderTextColor="#A0AEC0"
                        />

                        <Text style={styles.inputLabel}>Specialty</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedSpecialty}
                                onValueChange={(itemValue) => setSelectedSpecialty(itemValue)}
                                style={styles.picker}
                            >
                                {SPECIALTY_OPTIONS.map((opt) => (
                                    <Picker.Item key={opt} label={opt} value={opt} style={{fontSize: 14}} />
                                ))}
                            </Picker>
                        </View>

                        {selectedSpecialty === 'Other' && (
                            <View style={{marginTop: 10}}>
                                <Text style={styles.inputLabel}>Specify Specialty</Text>
                                <TextInput
                                    value={customSpecialty}
                                    onChangeText={setCustomSpecialty}
                                    style={styles.input}
                                    placeholder="e.g. Bird Watching"
                                />
                            </View>
                        )}

                        <View style={styles.rowInputs}>
                            <View style={{flex: 1}}>
                                <Text style={styles.inputLabel}>Experience (Yrs)</Text>
                                <TextInput
                                    value={experience}
                                    onChangeText={setExperience}
                                    keyboardType="numeric"
                                    style={styles.input}
                                    placeholder="0"
                                />
                            </View>
                            <View style={{flex: 1}}>
                                <Text style={styles.inputLabel}>Price/Day (₱)</Text>
                                <TextInput
                                    value={price}
                                    onChangeText={setPrice}
                                    keyboardType="numeric"
                                    style={styles.input}
                                    placeholder="0.00"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Schedule</Text>
                        
                        <Text style={styles.inputLabel}>1. Recurring Days</Text>
                        <Text style={styles.helper}>Which days do you usually work?</Text>
                        
                        <View style={styles.daysContainer}>
                            {daysOptions.map(day => {
                                const isSelected = availableDays.includes(day);
                                return (
                                    <TouchableOpacity
                                        key={day}
                                        style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                                        onPress={() => toggleDay(day)}
                                    >
                                        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={[styles.inputLabel, {marginTop: 20}]}>2. Specific Dates</Text>
                        <Text style={styles.helper}>Tap to add/remove specific availability.</Text>
                        
                        <Calendar
                            onDayPress={onDayPress}
                            markedDates={{...disabledDays, ...markedDates}}
                            minDate={new Date().toISOString().split('T')[0]}
                            theme={{
                                todayTextColor: '#007AFF',
                                selectedDayBackgroundColor: '#007AFF',
                                arrowColor: '#007AFF',
                                textDayFontWeight: '500',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600'
                            }}
                            style={styles.calendar}
                        />
                    </View>

                    <View style={{height: 40}} /> 
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
                <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={handleCancel}
                    disabled={isSubmitting}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                </TouchableOpacity>
            </View>

            {toast.visible && (
                <View style={[
                    styles.toastContainer, 
                    toast.type === 'error' ? styles.toastError : styles.toastSuccess
                ]}>
                    <Ionicons 
                        name={toast.type === 'error' ? "alert-circle" : "checkmark-circle"} 
                        size={24} color="#fff" 
                    />
                    <Text style={styles.toastText}>{toast.message}</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F2F4F7'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F4F7'
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },

    scrollContent: {
        padding: 20,
        paddingBottom: 150,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 6,
    },
    helper: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        backgroundColor: '#FAFAFA',
        fontSize: 14,
        color: '#1F2937'
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 12
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        backgroundColor: '#FAFAFA',
        marginBottom: 15,
        justifyContent: 'center',
        height: 50, 
    },
    picker: {
        width: '100%',
        height: 50,
    },
    statusBox: {
        backgroundColor: '#F0F9FF',
        padding: 10,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF'
    },
    subTextPaid: {
        color: '#007AFF',
        fontWeight: '700',
        fontSize: 14
    },
    subTextDate: {
        color: '#666',
        fontSize: 12,
        marginTop: 2
    },
    subText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    upgradeBtn: {
        backgroundColor: '#28a745',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 5,
    },
    upgradeBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 5,
    },
    dayChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    dayChipSelected: {
        backgroundColor: '#E0F2FE',
        borderColor: '#007AFF',
    },
    dayText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    dayTextSelected: {
        color: '#007AFF',
    },
    calendar: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 15,
        flexDirection: 'row',
        gap: 15,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 10,
        zIndex: 100,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563',
    },
    saveButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    toastContainer: { 
        position: 'absolute', 
        bottom: 80, 
        left: 20, 
        right: 20, 
        borderRadius: 12, 
        padding: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 8, 
        elevation: 10, 
        zIndex: 1000 
    },
    toastSuccess: { backgroundColor: '#00c853' },
    toastError: { backgroundColor: '#ff5252' },
    toastText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 12 },
});

export default UpdateGuideInfoForm;