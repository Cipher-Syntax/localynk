import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView, StyleSheet } from 'react-native';
import api from '../../api/api'; // Your api wrapper
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

const UpdateGuideInfoForm = () => {
    const [languages, setLanguages] = useState([]);
    const [specialty, setSpecialty] = useState('');
    const [tourItinerary, setTourItinerary] = useState('');
    const [experience, setExperience] = useState('');
    const [price, setPrice] = useState('');
    const [availableDays, setAvailableDays] = useState([]);
    const [markedDates, setMarkedDates] = useState({});

    const daysOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMapping = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };

    useEffect(() => {
        api.get('/api/profile/')
            .then(response => {
                const data = response.data;
                setLanguages(data.languages || []);
                setSpecialty(data.specialty || '');
                setTourItinerary(data.tour_itinerary || '');
                setExperience(data.experience_years?.toString() || '');
                setPrice(data.price_per_day?.toString() || '');
                setAvailableDays(data.available_days || []);
                const existingMarkedDates = (data.specific_available_dates || []).reduce((acc, dateString) => {
                    acc[dateString] = { selected: true, marked: true, selectedColor: 'blue' };
                    return acc;
                }, {});
                setMarkedDates(existingMarkedDates);
            })
            .catch(error => console.error(error.response?.data || error.message));
    }, []);

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
            newMarkedDates[dateString] = { selected: true, marked: true, selectedColor: 'blue' };
        }
        setMarkedDates(newMarkedDates);
    };

    const disabledDays = useMemo(() => {
        const enabledDayNumbers = availableDays.map(day => dayMapping[day]);
        const disabled = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Disable all past dates
        for (let i = 0; i < 365; i++) {
            const date = new Date(today.getFullYear(), 0, i + 1);
            if (date < today) {
                const dateString = date.toISOString().split('T')[0];
                disabled[dateString] = { disabled: true, disableTouchEvent: true };
            }
        }
        
        // Disable days of the week that are not selected
        const currentYear = today.getFullYear();
        const nextYear = currentYear + 1;
        for (let year = currentYear; year <= nextYear; year++) {
            for (let month = 0; month < 12; month++) {
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    if (!enabledDayNumbers.includes(date.getDay())) {
                        const dateString = date.toISOString().split('T')[0];
                        if (!disabled[dateString]) {
                             disabled[dateString] = { disabled: true, disableTouchEvent: true };
                        }
                    }
                }
            }
        }

        return disabled;
    }, [availableDays]);

    const resetForm = () => {
    setLanguages([]);
        setSpecialty('');
        setExperience('');
        setTourItinerary('');
        setPrice('');
        setAvailableDays([]);
        setMarkedDates({});
    };


    const handleSubmit = () => {
        const specific_dates = Object.keys(markedDates);

        api.patch('/api/guide/update-info/', {
            languages,
            specialty,
            tour_itinerary: tourItinerary,
            experience: parseInt(experience, 10),
            price: parseFloat(price),
            available_days: availableDays,
            specific_dates: specific_dates
        })
        .then(() => {
            Alert.alert('Success', 'Guide info updated successfully!');
            resetForm();
        })
        .catch(error => {
            console.error(error.response?.data || error.message);
            Alert.alert('Error', 'Failed to update guide info.');
        });
    };

    return (
        <ScrollView>
            <SafeAreaView style={styles.container}>
            <Text style={styles.label}>Languages (comma separated)</Text>
            <TextInput
                value={languages.join(', ')}
                onChangeText={text => setLanguages(text.split(',').map(l => l.trim()))}
                style={styles.input}
            />

            <Text style={styles.label}>Specialty</Text>
            <TextInput
                value={specialty}
                onChangeText={setSpecialty}
                style={styles.input}
            />

            <Text style={styles.label}>Tour Itinerary</Text>
            <TextInput
                value={tourItinerary}
                onChangeText={setTourItinerary}
                multiline
                numberOfLines={4}
                style={[styles.input, { height: 100 }]}
            />

            <Text style={styles.label}>Experience (years)</Text>
            <TextInput
                value={experience}
                onChangeText={setExperience}
                keyboardType="numeric"
                style={styles.input}
            />

            <Text style={styles.label}>Price per Day (₱)</Text>
            <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={styles.input}
            />

            <Text style={styles.label}>Select Available Days of the Week</Text>
            <View style={styles.daysContainer}>
                {daysOptions.map(day => (
                    <Button
                        key={day}
                        title={`${availableDays.includes(day) ? '✅ ' : ''}${day}`}
                        onPress={() => toggleDay(day)}
                    />
                ))}
            </View>

            <Text style={styles.label}>Select Specific Available Dates</Text>
            <Calendar
                onDayPress={onDayPress}
                markedDates={{...markedDates, ...disabledDays}}
                minDate={new Date().toISOString().split('T')[0]}
            />

            <View style={styles.buttonContainer}>
              <Button title="Update Info" onPress={handleSubmit} />
            </View>
        </SafeAreaView>
        </ScrollView>

    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
        justifyContent: 'center',
    },
    buttonContainer: {
        marginTop: 20,
    }
});

export default UpdateGuideInfoForm;

