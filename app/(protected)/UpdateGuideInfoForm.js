import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Alert, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import api from '../../api/api'; 
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker'; 
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

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
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [languages, setLanguages] = useState([]);
    
    const [selectedSpecialty, setSelectedSpecialty] = useState(SPECIALTY_OPTIONS[0]);
    const [customSpecialty, setCustomSpecialty] = useState('');

    const [experience, setExperience] = useState('');
    const [price, setPrice] = useState('');
    
    const [availableDays, setAvailableDays] = useState([]);
    const [markedDates, setMarkedDates] = useState({});

    const daysOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMapping = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };

    useEffect(() => {
        if (user) {
            populateForm(user);
        }
    }, [user]);

    const populateForm = (data) => {
        console.log("Populating Form with User Data:", data);
        
        if (Array.isArray(data.languages)) {
            setLanguages(data.languages);
        } else if (typeof data.languages === 'string' && data.languages.length > 0) {
            setLanguages(data.languages.split(',').map(l => l.trim()));
        } else {
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
            } else {
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
        } else {
            setAvailableDays([...availableDays, day]);
        }
    };

    const onDayPress = (day) => {
        const dateString = day.dateString;
        const newMarkedDates = { ...markedDates };

        if (newMarkedDates[dateString]) {
            delete newMarkedDates[dateString];
        } else {
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
        setIsSubmitting(true);
        const finalSpecialty = selectedSpecialty === 'Other' ? customSpecialty : selectedSpecialty;
        
        if (selectedSpecialty === 'Other' && !customSpecialty.trim()) {
            Alert.alert("Missing Info", "Please type your specific specialty.");
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
            Alert.alert('Success', 'Guide info updated successfully!');
        } catch (error) {
            const errorData = error.response?.data || error.message;
            console.log("Update Error:", errorData);
            Alert.alert('Error', 'Failed to update guide info.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authLoading || !user) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading your profile...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                
                <Text style={styles.header}>Update Profile</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Subscription Status</Text>
                    {user.guide_tier === 'paid' ? (
                        <>
                            <Text style={styles.subText}>You are a Paid Member.</Text>
                            <Text style={styles.subText}>Your subscription is valid until: {new Date(user.subscription_end_date).toLocaleDateString()}</Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.subText}>You are on the Free Tier.</Text>
                            <Text style={styles.subText}>You can only accept one booking.</Text>
                            <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/(protected)/upgradeMembership')}>
                                <Text style={styles.upgradeBtnText}>Upgrade to Paid</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Languages</Text>
                    <TextInput
                        value={languages.join(', ')}
                        onChangeText={text => setLanguages(text.split(',').map(l => l.trim()))}
                        style={styles.input}
                        placeholder="e.g. English, Tagalog"
                    />

                    <Text style={styles.label}>Specialty</Text>
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
                        <View style={{marginTop: 10, marginBottom: 5}}>
                            <Text style={styles.label}>Please specify your specialty</Text>
                            <TextInput
                                value={customSpecialty}
                                onChangeText={setCustomSpecialty}
                                style={styles.input}
                                placeholder="e.g. Bird Watching, Extreme Sports"
                            />
                        </View>
                    )}

                    <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
                        <View style={{flex: 1}}>
                            <Text style={styles.label}>Experience (Yrs)</Text>
                            <TextInput
                                value={experience}
                                onChangeText={setExperience}
                                keyboardType="numeric"
                                style={styles.input}
                                placeholder="0"
                            />
                        </View>
                        <View style={{flex: 1}}>
                            <Text style={styles.label}>Price/Day (₱)</Text>
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
                    <Text style={styles.label}>1. Select Available Days</Text>
                    <Text style={styles.helper}>Which days of the week do you usually work?</Text>
                    
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
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>2. Specific Dates</Text>
                    <Text style={styles.helper}>Tap specific dates below to add them to your schedule. (Days not enabled above are grayed out).</Text>
                    
                    
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
                    />
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Update Information</Text>}
                </TouchableOpacity>

                <View style={{height: 40}} /> 
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F2F4F7'
    },
    container: {
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#253347',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 6,
    },
    helper: {
        fontSize: 12,
        color: '#666',
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
    },
    
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        backgroundColor: '#FAFAFA',
        marginBottom: 10,
        justifyContent: 'center',
        height: 50, 
    },
    picker: {
        width: '100%',
        height: 50,
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
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    dayChipSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    dayText: {
        fontSize: 13,
        color: '#555',
        fontWeight: '600',
    },
    dayTextSelected: {
        color: '#fff',
    },

    submitBtn: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    submitBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
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
        marginTop: 10,
    },
    upgradeBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    }
});

export default UpdateGuideInfoForm;