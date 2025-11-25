import React, { useState, useEffect } from 'react';
import { 
    ScrollView, StatusBar, View, Text, Image, StyleSheet, TextInput, 
    TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker'; 
import api from '../../api/api';

const AddTour = () => {
    const router = useRouter();
    
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true);

    // --- 1. Data Sources ---
    const [destinations, setDestinations] = useState([]);
    const [accommodations, setAccommodations] = useState([]); 
    
    // --- 2. Selection States ---
    const [selectedDest, setSelectedDest] = useState(null); 
    const [destModalVisible, setDestModalVisible] = useState(false);
    const [itineraryModalVisible, setItineraryModalVisible] = useState(false);

    // --- 3. Tour Data State ---
    const [featuredPlaces, setFeaturedPlaces] = useState([null]); // Image URIs for Stops
    const [placeNames, setPlaceNames] = useState(['']); // Text Names for Stops

    // --- 4. The Itinerary Timeline State ---
    const [timeline, setTimeline] = useState([]); 
    const [tempTimelineRow, setTempTimelineRow] = useState({
        startTime: '',
        endTime: '',
        selectedActivityIndex: '', // Format: "stop|0" or "accom|5"
    });

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

    // --- 5. Initial Fetch ---
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            console.log("Starting fetchInitialData...");
            console.log("Fetching destinations from: /api/destinations/");
            
            const destRes = await api.get('/api/destinations/');
            console.log("Destinations fetched successfully:", destRes.data);
            setDestinations(destRes.data);
            
            console.log("📍 Fetching accommodations from: /api/accommodations/list/");
            const accomRes = await api.get('/api/accommodations/list/');
            console.log("Accommodations fetched successfully:", accomRes.data);
            setAccommodations(accomRes.data);
            
            console.log("All data loaded successfully");
        } catch (error) {
            console.error("Failed to fetch data");
            console.error("Error message:", error.message);
            console.error("Error response status:", error.response?.status);
            console.error("Error response data:", error.response?.data);
            console.error("Full error:", error);
            Alert.alert("Connection Error", "Could not load destinations or accommodations.");
        } finally {
            setIsFetchingData(false);
        }
    };

    // --- 6. Helper Functions for Images ---
    const pickImage = async (index) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'We need access to your photos.');
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

    // --- 7. Timeline Logic ---
    const addToTimeline = () => {
        const { startTime, endTime, selectedActivityIndex } = tempTimelineRow;

        if (!startTime || !endTime || !selectedActivityIndex) {
            Alert.alert("Incomplete", "Please fill Start Time, End Time, and select an Activity.");
            return;
        }

        const [type, index] = selectedActivityIndex.split('|');
        let activityName = '';
        let activityId = null;

        if (type === 'stop') {
            // It's a stop defined in this form
            activityName = placeNames[parseInt(index)] || `Stop ${parseInt(index) + 1}`;
        } else if (type === 'accom') {
            // It's an existing accommodation
            const accom = accommodations[parseInt(index)];
            activityName = accom.title; // Using 'title' from your Accommodation model
            activityId = accom.id;
        }

        const newRow = {
            startTime,
            endTime,
            activityName,
            type, // 'stop' or 'accom'
            refId: activityId 
        };

        setTimeline([...timeline, newRow]);
        setTempTimelineRow({ ...tempTimelineRow, selectedActivityIndex: '' }); 
    };

    const removeTimelineRow = (index) => {
        const newTimeline = [...timeline];
        newTimeline.splice(index, 1);
        setTimeline(newTimeline);
    };

    // --- 8. Final Submit Logic ---
    const handleFinalSubmit = async () => {
        if (!selectedDest || !formData.name || !formData.pricePerDay) {
            Alert.alert("Missing Info", "Please check basic details.");
            return;
        }
        if (timeline.length === 0) {
            Alert.alert("Empty Schedule", "Please build your itinerary timeline before publishing.");
            return;
        }

        setIsLoading(true);

        try {
            const data = new FormData();
            
            // Map to TourPackageSerializer fields
            data.append('destination_id', selectedDest.id);
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('duration', formData.duration);
            data.append('max_group_size', formData.maxGroupSize);
            data.append('what_to_bring', formData.whatToBring);
            data.append('price_per_day', formData.pricePerDay);
            data.append('solo_price', formData.soloPricePerDay);
            data.append('additional_fee_per_head', formData.additionalPerHeadPerDay || 0);

            // SEND THE TIMELINE AS JSON STRING
            data.append('itinerary_timeline', JSON.stringify(timeline));

            // Append Stops (Images and Names)
            featuredPlaces.forEach((uri, index) => {
                const name = placeNames[index];
                data.append('stops_names', name || `Stop ${index + 1}`);

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

            // Post to your new endpoint
            const response = await api.post('/api/create/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.status === 201) {
                setItineraryModalVisible(false);
                Alert.alert("Success", "Tour and Itinerary Created!", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            }

        } catch (error) {
            console.error("Submit Error:", error);
            const errorMessage = error.response?.data?.error || "Failed to create tour.";
            Alert.alert("Error", typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
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

                {/* SECTION 1: DESTINATION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>DESTINATION</Text>
                    <TouchableOpacity 
                        style={styles.dropdownSelector} 
                        onPress={() => setDestModalVisible(true)}
                    >
                        <Text style={selectedDest ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                            {selectedDest ? selectedDest.name : (isFetchingData ? "Loading locations..." : "Select a Destination")}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                {/* SECTION 2: BASIC INFO */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>TOUR DETAILS</Text>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tour Name</Text>
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

                {/* SECTION 3: UPLOAD STOPS (Images & Names) */}
                <View style={styles.section}>
                    <View style={styles.labelRow}>
                        <Text style={styles.sectionTitle}>UPLOAD STOPS</Text>
                        <TouchableOpacity onPress={addPlace}>
                            <Text style={{color:'#007AFF', fontWeight:'600'}}>+ Add Stop</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.helperText}>Upload photos and name your stops here. You will schedule them in the next step.</Text>
                    
                    <View style={styles.placesGrid}>
                        {featuredPlaces.map((uri, index) => (
                            <View key={index} style={styles.placeCard}>
                                <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(index)}>
                                    {uri ? (
                                        <Image source={{ uri: uri }} style={styles.uploadedImage} />
                                    ) : (
                                        <View style={{alignItems:'center'}}>
                                            <Ionicons name="camera-outline" size={30} color="#ccc" />
                                            <Text style={{fontSize:10, color:'#999', marginTop:5}}>Photo</Text>
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
                    <Text style={styles.sectionTitle}>PRICING & LOGISTICS</Text>
                    <View style={styles.twoColumn}>
                        <View style={{flex:1, marginRight:10}}>
                            <Text style={styles.label}>Duration</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="e.g. 8h" 
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
                        <Text style={styles.label}>Price (per Group/Day)</Text>
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
                                placeholder="PHP" 
                                keyboardType="numeric"
                                value={formData.soloPricePerDay}
                                onChangeText={(t) => setFormData({ ...formData, soloPricePerDay: t })}
                            />
                        </View>
                         <View style={{flex:1}}>
                            <Text style={styles.label}>Extra Head Fee</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="PHP" 
                                keyboardType="numeric"
                                value={formData.additionalPerHeadPerDay}
                                onChangeText={(t) => setFormData({ ...formData, additionalPerHeadPerDay: t })}
                            />
                        </View>
                    </View>
                    <TextInput 
                        style={styles.input} 
                        placeholder="What to bring (Water, Hat...)"
                        value={formData.whatToBring}
                        onChangeText={(t) => setFormData({ ...formData, whatToBring: t })}
                    />
                </View>

                {/* NEXT BUTTON (Opens Itinerary Builder) */}
                <TouchableOpacity 
                    style={styles.submitButton} 
                    onPress={() => setItineraryModalVisible(true)}
                >
                    <LinearGradient colors={['#00B2FF', '#006AFF']} style={styles.gradientButton}>
                        <Text style={styles.submitText}>NEXT: BUILD ITINERARY</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* --- MODAL 1: SELECT DESTINATION --- */}
                <Modal visible={destModalVisible} animationType="slide" transparent={true}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Destination</Text>
                            <FlatList
                                data={destinations}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity 
                                        style={styles.modalItem}
                                        onPress={() => { setSelectedDest(item); setDestModalVisible(false); }}
                                    >
                                        <Text style={styles.modalItemText}>{item.name}</Text>
                                        <Text style={styles.modalItemSub}>{item.location}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                            <TouchableOpacity style={styles.modalClose} onPress={() => setDestModalVisible(false)}>
                                <Text style={{color: '#FF3B30'}}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* --- MODAL 2: ITINERARY BUILDER --- */}
                <Modal visible={itineraryModalVisible} animationType="slide" presentationStyle="pageSheet">
                    <SafeAreaView style={{flex: 1, backgroundColor:'#F2F4F7'}}>
                        <View style={styles.builderHeader}>
                            <Text style={styles.builderTitle}>Build Tour Schedule</Text>
                            <TouchableOpacity onPress={() => setItineraryModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{padding: 15}}>
                            {/* ADD ROW FORM */}
                            <View style={styles.builderCard}>
                                <Text style={styles.label}>Add Activity Block</Text>
                                <View style={{flexDirection:'row', gap: 10, marginBottom: 10}}>
                                    <TextInput 
                                        style={[styles.input, {flex:1}]} 
                                        placeholder="Start (08:00 AM)" 
                                        value={tempTimelineRow.startTime}
                                        onChangeText={t => setTempTimelineRow({...tempTimelineRow, startTime: t})}
                                    />
                                    <TextInput 
                                        style={[styles.input, {flex:1}]} 
                                        placeholder="End (09:00 AM)" 
                                        value={tempTimelineRow.endTime}
                                        onChangeText={t => setTempTimelineRow({...tempTimelineRow, endTime: t})}
                                    />
                                </View>
                                
                                <Text style={styles.label}>Select Activity</Text>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={tempTimelineRow.selectedActivityIndex}
                                        onValueChange={(itemValue) => setTempTimelineRow({...tempTimelineRow, selectedActivityIndex: itemValue})}
                                    >
                                        <Picker.Item label="Select Stop or Accommodation..." value="" />
                                        
                                        <Picker.Item label="--- YOUR UPLOADED STOPS ---" value="" enabled={false} />
                                        {placeNames.map((name, idx) => (
                                            <Picker.Item key={`stop-${idx}`} label={`📍 ${name || `Stop ${idx+1}`}`} value={`stop|${idx}`} />
                                        ))}

                                        <Picker.Item label="--- ACCOMMODATIONS ---" value="" enabled={false} />
                                        {accommodations.map((accom, idx) => (
                                            <Picker.Item key={`accom-${idx}`} label={`🏨 ${accom.title}`} value={`accom|${idx}`} />
                                        ))}
                                    </Picker>
                                </View>

                                <TouchableOpacity style={styles.addTimeBtn} onPress={addToTimeline}>
                                    <Text style={{color:'#fff', fontWeight:'700'}}>+ Add to Schedule</Text>
                                </TouchableOpacity>
                            </View>

                            {/* TIMELINE PREVIEW */}
                            <Text style={[styles.sectionTitle, {marginTop: 20}]}>SCHEDULE PREVIEW</Text>
                            {timeline.length === 0 ? (
                                <Text style={{textAlign:'center', color:'#999', marginVertical: 20}}>No activities added yet.</Text>
                            ) : (
                                timeline.map((row, index) => (
                                    <View key={index} style={styles.timelineRow}>
                                        <View style={styles.timeCol}>
                                            <Text style={styles.timeText}>{row.startTime}</Text>
                                            <View style={styles.verticalLine} />
                                            <Text style={styles.timeText}>{row.endTime}</Text>
                                        </View>
                                        <View style={styles.activityCard}>
                                            <Text style={styles.activityTitle}>
                                                {row.type === 'stop' ? '📍' : '🏨'} {row.activityName}
                                            </Text>
                                            <Text style={styles.activityType}>
                                                {row.type === 'stop' ? 'Sightseeing Stop' : 'Accommodation/Rest'}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => removeTimelineRow(index)} style={{padding:5}}>
                                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}

                            {/* FINAL SUBMIT */}
                            <TouchableOpacity 
                                style={[styles.submitButton, {marginTop: 40, marginBottom: 50}]} 
                                onPress={handleFinalSubmit}
                                disabled={isLoading}
                            >
                                <LinearGradient colors={['#00c853', '#009624']} style={styles.gradientButton}>
                                    {isLoading ? <ActivityIndicator color="#fff"/> : <Text style={styles.submitText}>PUBLISH FULL TOUR</Text>}
                                </LinearGradient>
                            </TouchableOpacity>

                        </ScrollView>
                    </SafeAreaView>
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
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 20, fontWeight: '800' },
    
    section: { backgroundColor: '#fff', marginHorizontal: 15, marginVertical: 8, borderRadius: 12, padding: 15, elevation: 2 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 5, letterSpacing: 0.5 },
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
    submitButton: { marginHorizontal: 15, marginTop: 10, borderRadius: 12, overflow: 'hidden', elevation: 5 },
    gradientButton: { padding: 16, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    // Modals
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
    modalItemText: { fontSize: 16, color: '#333' },
    modalItemSub: { fontSize: 12, color: '#888', marginTop: 2 },
    modalClose: { marginTop: 15, alignItems: 'center', padding: 10 },

    // Builder Styles
    builderHeader: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
    builderTitle: { fontSize: 18, fontWeight: '800' },
    builderCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10 },
    pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15 },
    addTimeBtn: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
    
    timelineRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 8, marginTop: 10 },
    timeCol: { alignItems: 'center', width: 70 },
    timeText: { fontSize: 10, fontWeight: '600' },
    verticalLine: { height: 15, width: 1, backgroundColor: '#ccc', marginVertical: 2 },
    activityCard: { flex: 1, marginLeft: 10, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: '#007AFF' },
    activityTitle: { fontWeight: '700', fontSize: 14 },
    activityType: { fontSize: 10, color: '#666' }
});