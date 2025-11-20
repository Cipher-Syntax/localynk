import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView } from 'react-native';
import api from '../../api/api'; // Your api wrapper

const UpdateGuideInfoForm = () => {
    const [languages, setLanguages] = useState([]);
    const [specialty, setSpecialty] = useState('');
    const [tourItinerary, setTourItinerary] = useState('');
    const [pricePerDay, setPricePerDay] = useState('');
    const [availableDays, setAvailableDays] = useState([]);

    const daysOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Fetch current guide info on mount
    useEffect(() => {
        api.get('/user/profile/')
            .then(response => {
                const data = response.data;
                setLanguages(data.languages || []);
                setSpecialty(data.specialty || '');
                setTourItinerary(data.tour_itinerary || '');
                setPricePerDay(data.price_per_day?.toString() || '');
                setAvailableDays(data.available_days || []);
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

    const handleSubmit = () => {
        api.post('/guide/update-info/', {
            languages,
            specialty,
            tour_itinerary: tourItinerary,
            price_per_day: parseFloat(pricePerDay),
            available_days: availableDays
        })
        .then(() => Alert.alert('Success', 'Guide info updated successfully!'))
        .catch(error => {
            console.error(error.response?.data || error.message);
            Alert.alert('Error', 'Failed to update guide info.');
        });
    };

    return (
        <ScrollView style={{ padding: 20 }}>
            <Text>Languages (comma separated)</Text>
            <TextInput
                value={languages.join(', ')}
                onChangeText={text => setLanguages(text.split(',').map(l => l.trim()))}
                style={{ borderWidth: 1, padding: 8, marginBottom: 15 }}
            />

            <Text>Specialty</Text>
            <TextInput
                value={specialty}
                onChangeText={setSpecialty}
                style={{ borderWidth: 1, padding: 8, marginBottom: 15 }}
            />

            <Text>Tour Itinerary</Text>
            <TextInput
                value={tourItinerary}
                onChangeText={setTourItinerary}
                multiline
                numberOfLines={4}
                style={{ borderWidth: 1, padding: 8, marginBottom: 15, textAlignVertical: 'top' }}
            />

            <Text>Price per Day (₱)</Text>
            <TextInput
                value={pricePerDay}
                onChangeText={setPricePerDay}
                keyboardType="numeric"
                style={{ borderWidth: 1, padding: 8, marginBottom: 15 }}
            />

            <Text>Available Days</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 }}>
                {daysOptions.map(day => (
                    <Button
                        key={day}
                        title={`${availableDays.includes(day) ? '✅ ' : ''}${day}`}
                        onPress={() => toggleDay(day)}
                    />
                ))}
            </View>

            <Button title="Update Info" onPress={handleSubmit} />
        </ScrollView>
    );
};

export default UpdateGuideInfoForm;
