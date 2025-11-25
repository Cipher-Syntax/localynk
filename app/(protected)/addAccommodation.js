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
    ActivityIndicator,
    Platform
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

    // --- OPTIONS ---
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

    // --- FORM STATE ---
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
    
    // Images
    const [accommodationImage, setAccommodationImage] = useState(null);
    const [roomImage, setRoomImage] = useState(null);
    const [transportImage, setTransportImage] = useState(null);

    // --- HELPERS ---
    const pickImage = async (type) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'We need access to your photos to upload an image.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
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

    // --- SUBMIT ---
    const handleSubmit = async () => {
        if (!formData.name || !formData.address || !formData.pricePerNight) {
            Alert.alert('Validation Error', 'Please fill in Name, Address, and Price.');
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            
            // 1. Basic Info
            data.append('title', formData.name);
            data.append('description', formData.description);
            data.append('location', formData.address);
            data.append('price', formData.pricePerNight);
            
            // 2. Type Info (Matches Backend Fields)
            data.append('accommodation_type', formData.type);
            data.append('room_type', formData.roomType);
            
            // 3. Amenities (Convert Object to JSON String)
            data.append('amenities', JSON.stringify(formData.offerings));

            // 4. Transportation
            // Convert boolean to string "true"/"false" for FormData
            data.append('offer_transportation', formData.transportation ? "true" : "false");
            if (formData.transportation) {
                data.append('vehicle_type', formData.vehicleType);
                data.append('transport_capacity', formData.capacity || 0);
            }

            // 5. Images
            const appendImage = (uri, fieldName) => {
                if (uri) {
                    const filename = uri.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image/jpeg`;
                    data.append(fieldName, {
                        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                        name: filename,
                        type: type,
                    });
                }
            };

            appendImage(accommodationImage, 'photo');
            appendImage(roomImage, 'room_image');
            if (formData.transportation) {
                appendImage(transportImage, 'transport_image');
            }

            // API CALL (Matches router 'accommodations')
            await api.post('/api/accommodations/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert('Success', 'Accommodation added successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
            
        } catch (error) {
            console.error("Submit Error:", error);
            const errorMsg = error.response?.data?.detail || "Failed to add accommodation.";
            Alert.alert('Error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <SafeAreaView>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                {/* HEADER */}
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
                        placeholder="e.g. Sunny Beach Resort"
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />

                    <Text style={styles.label}>Type of Accommodation</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                            {accommodationTypes.map((item) => (
                                <Picker.Item key={item.id} label={item.label} value={item.value} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="Describe the amenities, vibe, etc."
                        multiline
                        numberOfLines={4}
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                    />

                    <Text style={styles.label}>Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Santa Cruz Island"
                        value={formData.address}
                        onChangeText={(text) => setFormData({ ...formData, address: text })}
                    />

                    <Text style={styles.label}>Main Photo</Text>
                    <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('accommodation')}>
                        {accommodationImage ? (
                            <Image source={{ uri: accommodationImage }} style={styles.image} />
                        ) : (
                            <View style={{alignItems:'center'}}>
                                <Ionicons name="camera-outline" size={30} color="#ccc" />
                                <Text style={{fontSize:12, color:'#999', marginTop:5}}>Upload Cover Photo</Text>
                            </View>
                        )}
                        {accommodationImage && (
                            <TouchableOpacity style={styles.removeIcon} onPress={() => setAccommodationImage(null)}>
                                <Ionicons name="close" size={16} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ROOM DETAILS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ROOM DETAILS</Text>

                    <Text style={styles.label}>Room Type</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={formData.roomType}
                            onValueChange={(value) => setFormData({ ...formData, roomType: value })}
                        >
                            {roomTypes.map((item) => (
                                <Picker.Item key={item.id} label={item.label} value={item.value} />
                            ))}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Price per Night (₱)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        keyboardType="numeric"
                        value={formData.pricePerNight}
                        onChangeText={(text) => setFormData({ ...formData, pricePerNight: text })}
                    />

                    <Text style={styles.label}>Amenities & Inclusions</Text>
                    {Object.keys(formData.offerings).map((offering) => (
                        <TouchableOpacity
                            key={offering}
                            style={styles.checkboxRow}
                            onPress={() => handleOfferingToggle(offering)}
                        >
                            <Text style={styles.checkboxLabel}>
                                {offering.charAt(0).toUpperCase() + offering.slice(1)}
                            </Text>
                            <View style={[styles.checkbox, formData.offerings[offering] && styles.checked]}>
                                {formData.offerings[offering] && <Ionicons name="checkmark" size={14} color="#fff" />}
                            </View>
                        </TouchableOpacity>
                    ))}

                    <Text style={[styles.label, { marginTop: 20 }]}>Room Image (Optional)</Text>
                    <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('room')}>
                        {roomImage ? (
                            <Image source={{ uri: roomImage }} style={styles.image} />
                        ) : (
                            <View style={{alignItems:'center'}}>
                                <Ionicons name="camera-outline" size={30} color="#ccc" />
                                <Text style={{fontSize:12, color:'#999', marginTop:5}}>Upload Room Photo</Text>
                            </View>
                        )}
                        {roomImage && (
                            <TouchableOpacity style={styles.removeIcon} onPress={() => setRoomImage(null)}>
                                <Ionicons name="close" size={16} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </View>

                {/* TRANSPORTATION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TRANSPORTATION</Text>

                    <Text style={styles.label}>Do you offer transportation?</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={formData.transportation}
                            onValueChange={(value) => setFormData({ ...formData, transportation: value })}
                        >
                            <Picker.Item label="No" value={false} />
                            <Picker.Item label="Yes" value={true} />
                        </Picker>
                    </View>

                    {formData.transportation && (
                        <>
                            <Text style={styles.label}>Vehicle Type</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Van, Boat, Tricycle"
                                value={formData.vehicleType}
                                onChangeText={(text) => setFormData({ ...formData, vehicleType: text })}
                            />

                            <Text style={styles.label}>Capacity (Pax)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. 10"
                                value={formData.capacity}
                                onChangeText={(text) => setFormData({ ...formData, capacity: text })}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Transportation Image</Text>
                            <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('transport')}>
                                {transportImage ? (
                                    <Image source={{ uri: transportImage }} style={styles.image} />
                                ) : (
                                    <View style={{alignItems:'center'}}>
                                        <Ionicons name="camera-outline" size={30} color="#ccc" />
                                        <Text style={{fontSize:12, color:'#999', marginTop:5}}>Upload Vehicle Photo</Text>
                                    </View>
                                )}
                                {transportImage && (
                                    <TouchableOpacity style={styles.removeIcon} onPress={() => setTransportImage(null)}>
                                        <Ionicons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* BUTTONS */}
                <View style={{paddingHorizontal: 15, paddingBottom: 40}}>
                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
                        <LinearGradient colors={['#00B2FF', '#006AFF']} style={styles.gradientButton}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>SUBMIT LISTING</Text>}
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F4F7' },
    header: { position: 'relative', height: 120, justifyContent: 'center', marginBottom: 15 },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 1 },
    
    section: { backgroundColor: '#fff', marginVertical: 10, borderRadius: 10, padding: 20, marginHorizontal: 15, elevation: 2 },
    sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 15, color: '#333', letterSpacing: 0.5 },
    
    label: { fontSize: 12, fontWeight: '600', marginBottom: 6, color: '#555' },
    input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 15, backgroundColor: '#FAFAFA', fontSize: 14 },
    
    pickerWrapper: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginBottom: 15, backgroundColor: '#FAFAFA', justifyContent: 'center' },
    
    imagePicker: { borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 8, height: 150, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', backgroundColor: '#F9FAFB' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    addIcon: { position: 'absolute', bottom: 5, right: 5 },
    removeIcon: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 },

    checkboxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingVertical: 5 },
    checkboxLabel: { flex: 1, fontSize: 14, color: '#333' },
    checkbox: { width: 24, height: 24, borderWidth: 1, borderColor: '#007AFF', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    checked: { backgroundColor: '#007AFF' },

    submitButton: { borderRadius: 12, overflow: 'hidden', elevation: 4 },
    gradientButton: { paddingVertical: 15, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 16 },
    
    cancelButton: { marginTop: 15, borderRadius: 8, paddingVertical: 14, backgroundColor: '#E5E5EA' },
    cancelText: { color: '#333', fontWeight: '600', textAlign: 'center', fontSize: 14 },
});