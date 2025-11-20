import React, { useState, useEffect } from 'react';
import { ScrollView, StatusBar, View, Text, Image, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../api/api';

const AddTour = () => {
    const router = useRouter();
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingDest, setIsFetchingDest] = useState(true);

    // --- 1. Destination Selection State ---
    const [destinations, setDestinations] = useState([]);
    const [selectedDest, setSelectedDest] = useState(null); 
    const [modalVisible, setModalVisible] = useState(false);

    // --- 2. Tour Data State ---
    const [featuredPlaces, setFeaturedPlaces] = useState([null]); // Image URIs
    const [placeNames, setPlaceNames] = useState(['']); // Text Names

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        duration: '',
        maxGroupSize: '',
        whatToBring: '',
        pricePerDay: '',
        soloPricePerDay: '',
        additionalPerHeadPerDay: '',
    });

    // --- 3. Fetch Global Destinations on Mount ---
    useEffect(() => {
        fetchDestinations();
    }, []);

    const fetchDestinations = async () => {
        try {
            // Axios uses the baseURL from .env automatically
            const response = await api.get('/api/destinations/');
            setDestinations(response.data);
        } catch (error) {
            console.error("Failed to fetch destinations:", error);
            Alert.alert("Error", "Could not load destinations. Please check your connection.");
        } finally {
            setIsFetchingDest(false);
        }
    };

    // --- 4. Image Picker Logic ---
    const pickImage = async (index) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'We need access to your photos to upload tour stops.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            const newPlaces = [...featuredPlaces];
            newPlaces[index] = result.assets[0].uri;
            setFeaturedPlaces(newPlaces);
        }
    };

    const handlePlaceNameChange = (text, index) => {
        const newNames = [...placeNames];
        newNames[index] = text;
        setPlaceNames(newNames);
    };

    const addPlace = () => {
        setFeaturedPlaces([...featuredPlaces, null]);
        setPlaceNames([...placeNames, '']);
    };

    const removePlace = (index) => {
        const newPlaces = [...featuredPlaces];
        const newNames = [...placeNames];
        newPlaces.splice(index, 1);
        newNames.splice(index, 1);
        setFeaturedPlaces(newPlaces);
        setPlaceNames(newNames);
    };

    // --- 5. Submit Logic ---
    const handleSubmit = async () => {
        // A. Validation
        if (!selectedDest) {
            Alert.alert("Missing Info", "Please select a Destination (e.g., Zamboanga City).");
            return;
        }
        if (!formData.name || !formData.pricePerDay || !formData.duration) {
            Alert.alert("Missing Info", "Please fill in Tour Name, Duration, and Price.");
            return;
        }

        setIsLoading(true);

        try {
            // B. Construct FormData
            const data = new FormData();
            
            // Basic Fields
            data.append('destination_id', selectedDest.id);
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('duration', formData.duration);
            data.append('max_group_size', formData.maxGroupSize);
            data.append('what_to_bring', formData.whatToBring);
            data.append('price_per_day', formData.pricePerDay);
            data.append('solo_price', formData.soloPricePerDay);
            data.append('additional_fee_per_head', formData.additionalPerHeadPerDay || 0);

            // Featured Places Arrays
            featuredPlaces.forEach((uri, index) => {
                const name = placeNames[index];
                
                // Append Name
                data.append('stops_names', name || `Stop ${index + 1}`);

                // Append Image
                if (uri) {
                    const filename = uri.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image/jpeg`;

                    data.append('stops_images', {
                        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                        name: filename,
                        type: type,
                    });
                }
            });

            // C. Send Request via Axios
            // Note: Content-Type: multipart/form-data is usually handled automatically by Axios when it sees FormData,
            // but explicitly setting it ensures compatibility with the backend parser.
            const response = await api.post('/api/create/', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 201) {
                Alert.alert("Success", "Tour Created Successfully!", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            }

        } catch (error) {
            console.error("Submit Error:", error);
            const errorMessage = error.response?.data?.error || "Failed to create tour. Please try again.";
            Alert.alert("Error", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <SafeAreaView>
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                {/* HEADER */}
                <View style={styles.header}>
                    <Image source={require('../../assets/localynk_images/header.png')} style={styles.headerImage} />
                    <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.overlay} />
                    <Text style={styles.headerTitle}>CREATE NEW TOUR</Text>
                </View>

                {/* SECTION 1: DESTINATION SELECTOR */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DESTINATION</Text>
                    <Text style={styles.helperText}>Select the city or region for this tour.</Text>
                    
                    <TouchableOpacity 
                        style={styles.dropdownSelector} 
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={selectedDest ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                            {selectedDest ? selectedDest.name : (isFetchingDest ? "Loading locations..." : "Select a Destination")}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* SECTION 2: BASIC INFO */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TOUR DETAILS</Text>
                    
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tour Name (Title)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., Grand Heritage Walk"
                            value={formData.name}
                            onChangeText={(t) => setFormData({ ...formData, name: t })}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Describe the experience..."
                            multiline
                            numberOfLines={4}
                            value={formData.description}
                            onChangeText={(t) => setFormData({ ...formData, description: t })}
                        />
                    </View>
                </View>

                {/* SECTION 3: FEATURED STOPS (DYNAMIC ARRAY) */}
                <View style={styles.section}>
                    <View style={styles.labelRow}>
                        <Text style={styles.sectionTitle}>ITINERARY STOPS</Text>
                        <TouchableOpacity onPress={addPlace}>
                            <Text style={{color:'#007AFF', fontWeight:'600'}}>+ Add Stop</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.placesGrid}>
                        {featuredPlaces.map((uri, index) => (
                            <View key={index} style={styles.placeCard}>
                                <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(index)}>
                                    {uri ? (
                                        <Image source={{ uri: uri }} style={styles.uploadedImage} />
                                    ) : (
                                        <View style={{alignItems:'center'}}>
                                            <Ionicons name="camera-outline" size={30} color="#ccc" />
                                            <Text style={{fontSize:10, color:'#999', marginTop:5}}>Add Photo</Text>
                                        </View>
                                    )}
                                    <TouchableOpacity style={styles.removeIcon} onPress={() => removePlace(index)}>
                                        <Ionicons name="close" size={16} color="white" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                                <TextInput 
                                    style={styles.placeNameInput}
                                    placeholder={`Stop ${index + 1} Name`}
                                    value={placeNames[index]}
                                    onChangeText={(t) => handlePlaceNameChange(t, index)}
                                />
                            </View>
                        ))}
                    </View>
                </View>

                {/* SECTION 4: LOGISTICS & PRICE */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>LOGISTICS & PRICING</Text>
                    
                    <View style={styles.twoColumn}>
                        <View style={{flex:1, marginRight:10}}>
                            <Text style={styles.label}>Duration</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="e.g. 8 Hours" 
                                value={formData.duration}
                                onChangeText={(t) => setFormData({ ...formData, duration: t })}
                            />
                        </View>
                        <View style={{flex:1}}>
                            <Text style={styles.label}>Max Group</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="e.g. 10" 
                                keyboardType="numeric"
                                value={formData.maxGroupSize}
                                onChangeText={(t) => setFormData({ ...formData, maxGroupSize: t })}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Standard Price (per Group/Day)</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="PHP 0.00" 
                            keyboardType="numeric"
                            value={formData.pricePerDay}
                            onChangeText={(t) => setFormData({ ...formData, pricePerDay: t })}
                        />
                    </View>
                    
                    <View style={styles.twoColumn}>
                         <View style={{flex:1, marginRight:10}}>
                            <Text style={styles.label}>Solo Price</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="PHP 0.00" 
                                keyboardType="numeric"
                                value={formData.soloPricePerDay}
                                onChangeText={(t) => setFormData({ ...formData, soloPricePerDay: t })}
                            />
                        </View>
                        <View style={{flex:1}}>
                            <Text style={styles.label}>Extra Person Fee</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="PHP 0.00" 
                                keyboardType="numeric"
                                value={formData.additionalPerHeadPerDay}
                                onChangeText={(t) => setFormData({ ...formData, additionalPerHeadPerDay: t })}
                            />
                        </View>
                    </View>

                     <View style={styles.formGroup}>
                        <Text style={styles.label}>What to Bring</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Water, Sunscreen, Hat..."
                            value={formData.whatToBring}
                            onChangeText={(t) => setFormData({ ...formData, whatToBring: t })}
                        />
                    </View>
                </View>

                {/* BUTTONS */}
                <TouchableOpacity 
                    style={styles.submitButton} 
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    <LinearGradient colors={['#00B2FF', '#006AFF']} style={styles.gradientButton}>
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitText}>PUBLISH TOUR</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                    <Text style={styles.cancelText}>CANCEL</Text>
                </TouchableOpacity>

                {/* --- MODAL FOR SELECTING DESTINATION --- */}
                <Modal visible={modalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Destination</Text>
                            
                            {destinations.length === 0 ? (
                                <Text style={{textAlign:'center', padding: 20, color:'#666'}}>
                                    No destinations found. Please try again later.
                                </Text>
                            ) : (
                                <FlatList
                                    data={destinations}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity 
                                            style={styles.modalItem}
                                            onPress={() => {
                                                setSelectedDest(item);
                                                setModalVisible(false);
                                            }}
                                        >
                                            <Text style={styles.modalItemText}>{item.name}</Text>
                                            {item.location && <Text style={styles.modalItemSub}>{item.location}</Text>}
                                        </TouchableOpacity>
                                    )}
                                />
                            )}

                            <TouchableOpacity 
                                style={styles.modalClose} 
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={{color: '#FF3B30', fontWeight:'600'}}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </SafeAreaView>
        </ScrollView>
    );
};

export default AddTour;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F4F7' },
    header: { height: 100, justifyContent: 'center', marginBottom: 10 },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 20, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3 },
    
    section: { backgroundColor: '#fff', marginHorizontal: 15, marginVertical: 8, borderRadius: 12, padding: 15, shadowColor: "#000", shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 5, letterSpacing: 0.5, textTransform:'uppercase' },
    helperText: { fontSize: 12, color: '#888', marginBottom: 10 },
    
    label: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    formGroup: { marginBottom: 12 },
    twoColumn: { flexDirection: 'row', marginBottom: 12 },
    input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#FAFAFA', fontSize: 14, color: '#333' },
    textArea: { height: 80, textAlignVertical: 'top' },
    
    // Dropdown
    dropdownSelector: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAFA' },
    dropdownTextPlaceholder: { color: '#999' },
    dropdownTextSelected: { color: '#000', fontWeight: '600' },

    // Place Cards
    placesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    placeCard: { width: '48%', marginBottom: 10, backgroundColor: '#fff', borderRadius: 8, padding: 5, borderWidth: 1, borderColor: '#eee' },
    imagePicker: { height: 100, backgroundColor: '#F9FAFB', borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 5, overflow: 'hidden' },
    uploadedImage: { width: '100%', height: '100%' },
    removeIcon: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 4 },
    placeNameInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 8, fontSize: 12, textAlign: 'center' },

    // Buttons
    submitButton: { marginHorizontal: 15, marginTop: 10, borderRadius: 12, overflow: 'hidden', shadowColor: "#00A8FF", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    gradientButton: { padding: 16, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
    cancelButton: { margin: 15, alignItems: 'center', padding: 15 },
    cancelText: { color: '#666', fontWeight: '600' },

    // Modal
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
    modalItemText: { fontSize: 16, color: '#333' },
    modalItemSub: { fontSize: 12, color: '#888', marginTop: 2 },
    modalClose: { marginTop: 15, alignItems: 'center', padding: 10, backgroundColor: '#F2F4F7', borderRadius: 10 },
});