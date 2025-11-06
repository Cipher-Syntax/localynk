import React, { useState } from 'react';
import { ScrollView, StatusBar, View, Text, Image, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'

const AddTour = () => {
    const [featuredPlaces, setFeaturedPlaces] = useState([null, null]);

    const router = useRouter();
    const [formData, setFormData] = useState({
        description: '',
        duration: '',
        maxGroupSize: '',
        whatToBring: '',
        pricePerDay: '',
        soloPricePerDay: '',
        additionalPerHeadPerDay: '',
    });

    const pickImage = async (index) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission to access media library is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const newPlaces = [...featuredPlaces];
            newPlaces[index] = { ...newPlaces[index], uri: result.assets[0].uri };
            setFeaturedPlaces(newPlaces);
        }
    };

    const addPlace = () => {
        setFeaturedPlaces([...featuredPlaces, null]);
    };

    const removePlace = (index) => {
        const newPlaces = [...featuredPlaces];
        newPlaces.splice(index, 1);
        setFeaturedPlaces(newPlaces);
    };

    const handleCancel = () => {
        router.back();
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
                    <Text style={styles.headerTitle}>ADD TOUR</Text>
                </View>

                {/* TOUR PACKAGE INFORMATION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TOUR PACKAGE INFORMATION</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tour Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Enter tour description"
                            multiline
                            numberOfLines={4}
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Featured Places</Text>
                            <TouchableOpacity style={styles.addButton} onPress={addPlace}>
                                <Text style={styles.addButtonText}>+ Add Place</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.placesGrid}>
                            {featuredPlaces.map((place, index) => (
                                <View key={index} style={styles.placeCard}>
                                    <TouchableOpacity
                                        style={styles.imagePicker}
                                        onPress={() => pickImage(index)}
                                    >
                                        {place?.uri ? (
                                            <Image source={{ uri: place.uri }} style={styles.uploadedImage} />
                                        ) : (
                                            <Ionicons name="add-circle" size={28} color="#007AFF" />
                                        )}
                                        <TouchableOpacity
                                            style={styles.removeIcon}
                                            onPress={() => removePlace(index)}
                                        >
                                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </TouchableOpacity>

                                    <TextInput
                                        style={styles.placeNameInput}
                                        placeholder={`Place ${index + 1} name`}
                                    />
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* TOUR DETAILS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TOUR DETAILS</Text>

                    <View style={styles.twoColumn}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Duration</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 3 days"
                                value={formData.duration}
                                onChangeText={(text) => setFormData({ ...formData, duration: text })}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
                            <Text style={styles.label}>Max Group Size</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter max size"
                                keyboardType="numeric"
                                value={formData.maxGroupSize}
                                onChangeText={(text) => setFormData({ ...formData, maxGroupSize: text })}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>What to Bring</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Enter items to bring"
                            multiline
                            numberOfLines={3}
                            value={formData.whatToBring}
                            onChangeText={(text) => setFormData({ ...formData, whatToBring: text })}
                        />
                    </View>
                </View>

                {/* PRICING */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PRICING</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Price per Day</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter price"
                            keyboardType="numeric"
                            value={formData.pricePerDay}
                            onChangeText={(text) => setFormData({ ...formData, pricePerDay: text })}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Solo Price per Day</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter solo price"
                            keyboardType="numeric"
                            value={formData.soloPricePerDay}
                            onChangeText={(text) => setFormData({ ...formData, soloPricePerDay: text })}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Additional per Head per Day</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter additional price"
                            keyboardType="numeric"
                            value={formData.additionalPerHeadPerDay}
                            onChangeText={(text) => setFormData({ ...formData, additionalPerHeadPerDay: text })}
                        />
                    </View>
                </View>

                {/* BUTTONS */}
                <TouchableOpacity style={styles.submitButton}>
                    <LinearGradient colors={['#00B2FF', '#006AFF']} style={styles.gradientButton}>
                        <Text style={styles.submitText}>SUBMIT</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelText}>CANCEL</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </ScrollView>
    );
};

export default AddTour;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D9E2E9',
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
        marginHorizontal: 15,
        marginVertical: 10,
        borderRadius: 10,
        padding: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
        letterSpacing: 0.5,
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    addButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        backgroundColor: '#f8f8f8',
    },
    textArea: {
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    twoColumn: {
        flexDirection: 'row',
        gap: 10,
    },
    placesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    placeCard: {
        width: '48%',
        marginBottom: 10,
    },
    imagePicker: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 6,
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeIcon: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 3,
        elevation: 2,
    },
    placeNameInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 12,
        backgroundColor: '#f8f8f8',
    },
    submitButton: {
        marginHorizontal: 15,
        marginTop: 20,
        borderRadius: 8,
        overflow: 'hidden',
    },
    gradientButton: {
        borderRadius: 8,
        paddingVertical: 14,
    },
    submitText: {
        color: '#fff',
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 14,
    },
    cancelButton: {
        marginHorizontal: 15,
        marginTop: 10,
        marginBottom: 30,
        borderRadius: 8,
        paddingVertical: 14,
        backgroundColor: '#E5E5EA',
    },
    cancelText: {
        color: '#333',
        fontWeight: '600',
        textAlign: 'center',
        fontSize: 14,
    },
});
