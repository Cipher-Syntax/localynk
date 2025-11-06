import React, { useState } from 'react'
import { ScrollView, StatusBar, View, Text, Image, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const AddAccommodation = () => {
    const [accommodationImage, setAccommodationImage] = useState(null);
    const [roomImage, setRoomImage] = useState(null);
    const [transportImage, setTransportImage] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Room',
        description: '',
        location: '',
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
        vehicleType: 'Van',
        capacity: '',
        transportation: false,
    });

    const pickImage = async (type) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.canceled) {
            if (type === 'accommodation') setAccommodationImage(result.assets[0].uri);
            else if (type === 'room') setRoomImage(result.assets[0].uri);
            else if (type === 'transport') setTransportImage(result.assets[0].uri);
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
                    <TextInput
                        style={styles.input}
                        value={formData.type}
                        onChangeText={(text) => setFormData({ ...formData, type: text })}
                    />

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter description"
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
                    <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('accommodation')}>
                        {accommodationImage && <Image source={{ uri: accommodationImage }} style={styles.image} />}
                        <Ionicons name="add-circle" size={28} color="#007AFF" style={styles.addIcon} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ROOM DETAILS</Text>

                    <Text style={styles.label}>Room Type</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.roomType}
                        onChangeText={(text) => setFormData({ ...formData, roomType: text })}
                    />

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
                        <TouchableOpacity key={offering} style={styles.checkboxRow} onPress={() => handleOfferingToggle(offering)}>
                            <Text style={styles.checkboxLabel}>{offering.charAt(0).toUpperCase() + offering.slice(1)}</Text>
                            <View style={[styles.checkbox, formData.offerings[offering] && styles.checked]} />
                        </TouchableOpacity>
                    ))}

                    <Text style={[styles.label, { marginTop: 20 }]}>Room Image</Text>
                    <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('room')}>
                        {roomImage && <Image source={{ uri: roomImage }} style={styles.image} />}
                        <Ionicons name="add-circle" size={28} color="#007AFF" style={styles.addIcon} />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TRANSPORTATION</Text>

                    <Text style={styles.label}>Do you offer transportation?</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.transportation ? 'Yes' : 'No'}
                        onChangeText={(text) => setFormData({ ...formData, transportation: text.toLowerCase() === 'yes' })}
                    />

                    <Text style={styles.label}>Vehicle Type</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.vehicleType}
                        onChangeText={(text) => setFormData({ ...formData, vehicleType: text })}
                    />

                    <Text style={styles.label}>Capacity</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter capacity"
                        keyboardType="numeric"
                        value={formData.capacity}
                        onChangeText={(text) => setFormData({ ...formData, capacity: text })}
                    />

                    <Text style={[styles.label, { marginTop: 20 }]}>Transportation Image</Text>
                    <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('transport')}>
                        {transportImage && <Image source={{ uri: transportImage }} style={styles.image} />}
                        <Ionicons name="add-circle" size={28} color="#007AFF" style={styles.addIcon} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.submitButton} onPress={() => console.log('Submit pressed')}>
                        <LinearGradient colors={['#00B2FF', '#006AFF']} style={styles.gradientButton}>
                            <Text style={styles.submitText}>Submit</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </ScrollView>
    )
}

export default AddAccommodation;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: '#D9E2E9',
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
        marginBottom: 15,
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTitle: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
    },
    section: {
        backgroundColor: '#fff',
        marginVertical: 10,
        borderRadius: 10,
        padding: 15,
        marginHorizontal: 10
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 10,
        backgroundColor: '#f8f8f8',
    },
    imagePicker: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    addIcon: {
        position: 'absolute',
        bottom: 5,
        right: 5,
    },
    submitButton: {
        marginVertical: 20,
        width: '100%',
    },
    gradientButton: {
        borderRadius: 10,
        paddingVertical: 12,
    },
    submitText: {
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 16,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 12,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 4,
    },
    checked: {
        backgroundColor: '#007AFF',
    },
});
