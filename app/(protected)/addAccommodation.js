import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    View,
    Text,
    Image,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import api from '../../api/api';

const AddAccommodation = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const accommodationTypes = [
        { id: 1, label: 'Room', value: 'Room' },
        { id: 2, label: 'Hostel', value: 'Hostel' },
        { id: 3, label: 'Hotel', value: 'Hotel' },
        { id: 4, label: 'Apartment', value: 'Apartment' },
    ];

    const roomTypes = [
        { id: 1, label: 'Single', value: 'Single' },
        { id: 2, label: 'Double', value: 'Double' },
        { id: 3, label: 'Suite', value: 'Suite' },
    ];

    const yesNoOptions = [
        { id: 1, label: 'Yes', value: true },
        { id: 2, label: 'No', value: false },
    ];

    const initialFormState = {
        name: '',
        type: 'Room',
        description: '',
        address: '',
        roomType: 'Single',
        pricePerNight: '',
        offerings: {
            wifi: false,
            breakfast: false,
            ac: false,
            parking: false,
            pool: false,
        },
        transportation: false,
        vehicleType: '',
        capacity: '',
    };

    const [formData, setFormData] = useState(initialFormState);
    const [accommodationImage, setAccommodationImage] = useState(null);
    const [roomImage, setRoomImage] = useState(null);
    const [transportImage, setTransportImage] = useState(null);

    const pickImage = async (type) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.canceled) {
            const uri = result.assets[0].uri;
            if (type === 'accommodation') setAccommodationImage(uri);
            else if (type === 'room') setRoomImage(uri);
            else if (type === 'transport') setTransportImage(uri);
        }
    };

    const handleOfferingToggle = (offering) => {
        setFormData({
            ...formData,
            offerings: {
                ...formData.offerings,
                [offering]: !formData.offerings[offering],
            },
        });
    };

    const handleCancel = () => {
        router.back();
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setAccommodationImage(null);
        setRoomImage(null);
        setTransportImage(null);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.address) {
            Alert.alert('Validation Error', 'Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.name);
            data.append('description', formData.description);
            data.append('location', formData.address);
            data.append('price', formData.pricePerNight || 0);

            if (accommodationImage) {
                data.append('photo', {
                    uri: accommodationImage,
                    type: 'image/jpeg',
                    name: 'accommodation.jpg',
                });
            }

            await api.post('api/accommodations/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert('Success', 'Accommodation added successfully!');
            resetForm();
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add accommodation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <SafeAreaView>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    <Text style={styles.headerTitle}>ADD ACCOMMODATION</Text>
                </View>

                {/* BASIC DETAILS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>BASIC ACCOMMODATION DETAILS</Text>

                    <Text style={styles.label}>Accommodation Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter accommodation name"
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />

                    <Text style={styles.label}>Type of Accommodation</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={formData.type}
                            onValueChange={(value) =>
                                setFormData({ ...formData, type: value })
                            }
                        >
                            {accommodationTypes.map((item) => (
                                <Picker.Item key={item.id} label={item.label} value={item.value} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, { height: 80 }]}
                        placeholder="Enter description"
                        multiline
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                    />

                    <Text style={styles.label}>Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter address"
                        value={formData.address}
                        onChangeText={(text) => setFormData({ ...formData, address: text })}
                    />

                    <Text style={styles.label}>Accommodation Image</Text>
                    <TouchableOpacity
                        style={styles.imagePicker}
                        onPress={() => pickImage('accommodation')}
                    >
                        {accommodationImage && <Image source={{ uri: accommodationImage }} style={styles.image} />}
                        <Ionicons name="add-circle" size={28} color="#007AFF" style={styles.addIcon} />
                    </TouchableOpacity>
                </View>

                {/* ROOM DETAILS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ROOM DETAILS</Text>

                    <Text style={styles.label}>Room Type</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={formData.roomType}
                            onValueChange={(value) =>
                                setFormData({ ...formData, roomType: value })
                            }
                        >
                            {roomTypes.map((item) => (
                                <Picker.Item key={item.id} label={item.label} value={item.value} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Price per Night</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter price"
                        keyboardType="numeric"
                        value={formData.pricePerNight}
                        onChangeText={(text) => setFormData({ ...formData, pricePerNight: text })}
                    />

                    <Text style={styles.label}>Inclusions</Text>
                    {Object.keys(formData.offerings).map((offering) => (
                        <TouchableOpacity
                            key={offering}
                            style={styles.checkboxRow}
                            onPress={() => handleOfferingToggle(offering)}
                        >
                            <Text style={styles.checkboxLabel}>
                                {offering.charAt(0).toUpperCase() + offering.slice(1)}
                            </Text>
                            <View style={[styles.checkbox, formData.offerings[offering] && styles.checked]} />
                        </TouchableOpacity>
                    ))}

                    <Text style={[styles.label, { marginTop: 20 }]}>Room Image</Text>
                    <TouchableOpacity
                        style={styles.imagePicker}
                        onPress={() => pickImage('room')}
                    >
                        {roomImage && <Image source={{ uri: roomImage }} style={styles.image} />}
                        <Ionicons name="add-circle" size={28} color="#007AFF" style={styles.addIcon} />
                    </TouchableOpacity>
                </View>

                {/* TRANSPORTATION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TRANSPORTATION</Text>

                    <Text style={styles.label}>Do you offer transportation?</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={formData.transportation}
                            onValueChange={(value) =>
                                setFormData({ ...formData, transportation: value })
                            }
                        >
                            {yesNoOptions.map((item) => (
                                <Picker.Item key={item.id} label={item.label} value={item.value} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Vehicle Type</Text>
                    <TextInput
                        style={[styles.input, !formData.transportation && { backgroundColor: '#ddd' }]}
                        value={formData.vehicleType}
                        onChangeText={(text) => setFormData({ ...formData, vehicleType: text })}
                        editable={formData.transportation}
                    />

                    <Text style={styles.label}>Capacity</Text>
                    <TextInput
                        style={[styles.input, !formData.transportation && { backgroundColor: '#ddd' }]}
                        value={formData.capacity}
                        onChangeText={(text) => setFormData({ ...formData, capacity: text })}
                        editable={formData.transportation}
                        keyboardType="numeric"
                    />

                    <Text style={[styles.label, { marginTop: 20 }]}>Transportation Image</Text>
                    <TouchableOpacity
                        style={styles.imagePicker}
                        onPress={() => pickImage('transport')}
                    >
                        {transportImage && <Image source={{ uri: transportImage }} style={styles.image} />}
                        <Ionicons name="add-circle" size={28} color="#007AFF" style={styles.addIcon} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                        <LinearGradient colors={['#00B2FF', '#006AFF']} style={styles.gradientButton}>
                            <Text style={styles.submitText}>{loading ? 'Submitting...' : 'Submit'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <Text style={styles.cancelText}>CANCEL</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </ScrollView>
    );
};

export default AddAccommodation;

// Styles (same as before, plus a picker wrapper)
const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { position: 'relative', height: 120, justifyContent: 'center', marginBottom: 15 },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
    section: { backgroundColor: '#fff', marginVertical: 10, borderRadius: 10, padding: 15, marginHorizontal: 10 },
    sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
    label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10, backgroundColor: '#f8f8f8' },
    imagePicker: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, height: 120, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
    image: { width: '100%', height: '100%', borderRadius: 8 },
    addIcon: { position: 'absolute', bottom: 5, right: 5 },
    submitButton: { marginVertical: 20, width: '100%' },
    gradientButton: { borderRadius: 10, paddingVertical: 12 },
    submitText: { color: '#fff', fontWeight: '600', textAlign: 'center', fontSize: 16 },
    cancelButton: { marginBottom: 30, borderRadius: 8, paddingVertical: 14, backgroundColor: '#E5E5EA' },
    cancelText: { color: '#333', fontWeight: '600', textAlign: 'center', fontSize: 14 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    checkboxLabel: { flex: 1, fontSize: 12 },
    checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: '#007AFF', borderRadius: 4 },
    checked: { backgroundColor: '#007AFF' },
    pickerWrapper: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 10 },
});
