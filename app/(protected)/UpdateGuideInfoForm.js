import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import api from '../../api/api'; 
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import { styles } from './styles/updateGuideInfoForm.styles';

const AVAILABLE_LANGUAGES = [
    'English', 'Tagalog', 'Chavacano', 'Cebuano', 'Ilocano',
    'Hiligaynon', 'Waray', 'Tausug', 'Kapampangan', 'Pangasinan',
    'Bikolano', 'Maranao', 'Maguindanao', 'Yakan', 'Surigaonon'
].sort();

const normalizeTextList = (rawValue) => {
    const source = Array.isArray(rawValue)
        ? rawValue
        : typeof rawValue === 'string'
            ? rawValue.split(',')
            : [];

    const normalized = [];
    const seen = new Set();

    source.forEach((value) => {
        const token = String(value || '').trim();
        if (!token) return;

        const key = token.toLowerCase();
        if (seen.has(key)) return;

        seen.add(key);
        normalized.push(token);
    });

    return normalized;
};

const resolveIncomingSpecialties = (data) => {
    if (Array.isArray(data?.specialties)) {
        return normalizeTextList(data.specialties);
    }
    return normalizeTextList(data?.specialty || '');
};

const UpdateGuideInfoForm = () => {
    const router = useRouter();
    const { user, isLoading: authLoading, refreshUser } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Dynamic Specialty Options
    const [specialtyOptions, setSpecialtyOptions] = useState([]);
    const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false);

    // Form States
    const [languages, setLanguages] = useState([]);
    const [languageSearchTerm, setLanguageSearchTerm] = useState('');
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

    const [selectedSpecialties, setSelectedSpecialties] = useState([]);
    const [specialtySearchTerm, setSpecialtySearchTerm] = useState('');
    const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);

    const [customSpecialty, setCustomSpecialty] = useState('');
    const [experience, setExperience] = useState('');
    const [availableDays, setAvailableDays] = useState([]);
    const [markedDates, setMarkedDates] = useState({});
    
    // Toast State
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const daysOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const buildSpecialtyOptions = useCallback((categories = []) => {
        const normalized = [];
        const seen = new Set();

        categories.forEach((raw) => {
            const category = String(raw || '').trim();
            if (!category) return;

            const key = category.toLowerCase();
            if (seen.has(key)) return;

            seen.add(key);
            normalized.push(category);
        });

        return normalized;
    }, []);

    // 1. Fetch Categories from the Backend API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/api/categories/');
                const categories = Array.isArray(response?.data) ? response.data : [];
                setSpecialtyOptions(buildSpecialtyOptions(categories));
            } catch (error) {
                console.log('Failed to fetch destination categories from API:', error);
                setSpecialtyOptions(buildSpecialtyOptions([]));
            } finally {
                setIsCategoriesLoaded(true);
            }
        };

        fetchCategories();
    }, [buildSpecialtyOptions]);

    // 2. Populate form only after user data AND categories are loaded
    useEffect(() => {
        if (user && isCategoriesLoaded) {
            populateForm(user);
        }
    }, [user, isCategoriesLoaded, populateForm]);

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

    const populateForm = useCallback((data) => {
        setLanguages(normalizeTextList(data.languages));
        setSelectedSpecialties(resolveIncomingSpecialties(data));
        setLanguageSearchTerm('');
        setSpecialtySearchTerm('');
        setShowLanguageDropdown(false);
        setShowSpecialtyDropdown(false);
        setCustomSpecialty('');

        setExperience(data.experience_years ? data.experience_years.toString() : '');
        setAvailableDays(data.available_days || []);

        const existingMarkedDates = (data.specific_available_dates || []).reduce((acc, dateString) => {
            acc[dateString] = { selected: true, marked: true, selectedColor: '#007AFF' };
            return acc;
        }, {});
        setMarkedDates(existingMarkedDates);
    }, []);

    const addLanguage = useCallback((language) => {
        setLanguages((previous) => normalizeTextList([...previous, language]));
        setLanguageSearchTerm('');
        setShowLanguageDropdown(false);
    }, []);

    const removeLanguage = useCallback((language) => {
        setLanguages((previous) => previous.filter((item) => item !== language));
    }, []);

    const addSpecialty = useCallback((specialty) => {
        setSelectedSpecialties((previous) => normalizeTextList([...previous, specialty]));
        setSpecialtySearchTerm('');
        setShowSpecialtyDropdown(false);
    }, []);

    const removeSpecialty = useCallback((specialty) => {
        setSelectedSpecialties((previous) => previous.filter((item) => item !== specialty));
    }, []);

    const addCustomSpecialty = useCallback(() => {
        const customValue = String(customSpecialty || '').trim();
        if (!customValue) {
            showToast('Please enter a custom specialty first.', 'error');
            return;
        }

        setSelectedSpecialties((previous) => normalizeTextList([...previous, customValue]));
        setCustomSpecialty('');
    }, [customSpecialty]);

    const addCustomLanguage = useCallback(() => {
        const customValue = String(languageSearchTerm || '').trim();
        if (!customValue) {
            showToast('Please enter a language first.', 'error');
            return;
        }

        setLanguages((previous) => normalizeTextList([...previous, customValue]));
        setLanguageSearchTerm('');
        setShowLanguageDropdown(false);
    }, [languageSearchTerm]);

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
        const dayMapping = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };
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
                    
                    const yearStr = year;
                    const monthStr = String(month + 1).padStart(2, '0');
                    const dayStr = String(day).padStart(2, '0');
                    const dateString = `${yearStr}-${monthStr}-${dayStr}`;

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

    const filteredLanguages = useMemo(() => {
        const query = String(languageSearchTerm || '').trim().toLowerCase();
        return AVAILABLE_LANGUAGES.filter((language) => {
            if (languages.includes(language)) return false;
            if (!query) return true;
            return language.toLowerCase().includes(query);
        });
    }, [languageSearchTerm, languages]);

    const filteredSpecialties = useMemo(() => {
        const query = String(specialtySearchTerm || '').trim().toLowerCase();
        return specialtyOptions.filter((specialty) => {
            if (selectedSpecialties.includes(specialty)) return false;
            if (!query) return true;
            return specialty.toLowerCase().includes(query);
        });
    }, [specialtyOptions, specialtySearchTerm, selectedSpecialties]);

    const handleSubmit = async () => {
        Keyboard.dismiss();
        setIsSubmitting(true);

        const finalLanguages = normalizeTextList(languages);
        const finalSpecialties = normalizeTextList(selectedSpecialties);

        if (finalLanguages.length === 0) {
            showToast('Please select at least one language.', 'error');
            setIsSubmitting(false);
            return;
        }

        if (finalSpecialties.length === 0) {
            showToast('Please select at least one specialty.', 'error');
            setIsSubmitting(false);
            return;
        }

        const specific_dates = Object.keys(markedDates);

        try {
            await api.patch('api/guide/update-info/', {
                languages: finalLanguages,
                specialties: finalSpecialties,
                specialty: finalSpecialties[0] || '',
                experience_years: parseInt(experience, 10),
                available_days: availableDays,
                specific_available_dates: specific_dates
            });
            
            showToast("Info updated!", "success");
            
            await refreshUser();
            
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

    if (authLoading || !user || !isCategoriesLoaded) {
        return (
            <View style={[styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading your profile data...</Text>
            </View>
        );
    }

    return (
        <ScreenSafeArea style={styles.safeArea} edges={['bottom', 'top']}>
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
                        <View style={styles.multiSelectContainer}>
                            {languages.map((language) => (
                                <View key={language} style={styles.selectedChip}>
                                    <Text style={styles.selectedChipText}>{language}</Text>
                                    <TouchableOpacity onPress={() => removeLanguage(language)}>
                                        <Ionicons name="close" size={14} color="#1F2937" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <TextInput
                                value={languageSearchTerm}
                                onChangeText={(text) => {
                                    setLanguageSearchTerm(text);
                                    setShowLanguageDropdown(true);
                                }}
                                onFocus={() => setShowLanguageDropdown(true)}
                                style={styles.multiSelectInput}
                                placeholder="Type and select languages"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {showLanguageDropdown && (
                            <View style={styles.dropdownContainer}>
                                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 150 }}>
                                    {filteredLanguages.length > 0 && filteredLanguages.map((language) => (
                                        <TouchableOpacity
                                            key={language}
                                            style={styles.dropdownItem}
                                            onPress={() => addLanguage(language)}
                                        >
                                            <Text style={styles.dropdownItemText}>{language}</Text>
                                        </TouchableOpacity>
                                    ))}

                                    <TouchableOpacity style={styles.dropdownItem} onPress={addCustomLanguage}>
                                        <Text style={styles.dropdownAddText}>
                                            Add custom language: {String(languageSearchTerm || '').trim() || 'Type a language above'}
                                        </Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        )}

                        <Text style={styles.inputLabel}>Specialty (Category)</Text>
                        <View style={styles.multiSelectContainer}>
                            {selectedSpecialties.map((specialty) => (
                                <View key={specialty} style={styles.selectedChip}>
                                    <Text style={styles.selectedChipText}>{specialty}</Text>
                                    <TouchableOpacity onPress={() => removeSpecialty(specialty)}>
                                        <Ionicons name="close" size={14} color="#1F2937" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <TextInput
                                value={specialtySearchTerm}
                                onChangeText={(text) => {
                                    setSpecialtySearchTerm(text);
                                    setShowSpecialtyDropdown(true);
                                }}
                                onFocus={() => setShowSpecialtyDropdown(true)}
                                style={styles.multiSelectInput}
                                placeholder="Type and select specialties"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {showSpecialtyDropdown && (
                            <View style={styles.dropdownContainer}>
                                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 150 }}>
                                    {filteredSpecialties.length > 0 ? (
                                        filteredSpecialties.map((specialty) => (
                                            <TouchableOpacity
                                                key={specialty}
                                                style={styles.dropdownItem}
                                                onPress={() => addSpecialty(specialty)}
                                            >
                                                <Text style={styles.dropdownItemText}>{specialty}</Text>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <Text style={styles.dropdownEmptyText}>No specialties found.</Text>
                                    )}
                                </ScrollView>
                            </View>
                        )}

                        <View style={styles.customSpecialtyRow}>
                            <TextInput
                                value={customSpecialty}
                                onChangeText={setCustomSpecialty}
                                style={[styles.input, styles.customSpecialtyInput]}
                                placeholder="Add custom specialty"
                                placeholderTextColor="#9CA3AF"
                            />
                            <TouchableOpacity style={styles.addCustomButton} onPress={addCustomSpecialty}>
                                <Text style={styles.addCustomButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Experience (Yrs)</Text>
                        <TextInput
                            value={experience}
                            onChangeText={setExperience}
                            keyboardType="numeric"
                            style={styles.input}
                            placeholder="0"
                            placeholderTextColor="#9CA3AF"
                        />
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

            <ScreenSafeArea style={[styles.footer]}>
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
            </ScreenSafeArea>

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
        </ScreenSafeArea>
    );
};

export default UpdateGuideInfoForm;