import React, { useState, useEffect, useRef } from 'react';
import { 
    ScrollView, StatusBar, View, Text, Image, StyleSheet, TextInput, 
    TouchableOpacity, Alert, ActivityIndicator, Modal, FlatList, Platform, Dimensions 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker'; 
import api from '../../api/api';

const { width } = Dimensions.get('window');

const AddTour = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollViewRef = useRef(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // --- Data Sources ---
    const [destinations, setDestinations] = useState([]);
    const [accommodations, setAccommodations] = useState([]); 
    const [isFetchingData, setIsFetchingData] = useState(true);
    
    // --- Selection States ---
    const [selectedDest, setSelectedDest] = useState(null); 
    const [destModalVisible, setDestModalVisible] = useState(false);

    // --- Tour Data State ---
    const [featuredPlaces, setFeaturedPlaces] = useState([null]); // Image URIs
    const [placeNames, setPlaceNames] = useState(['']); // Text Names

    // --- Timeline State ---
    const [timeline, setTimeline] = useState([]); 
    const [tempTimelineRow, setTempTimelineRow] = useState({
        startTime: '',
        endTime: '',
        selectedActivityIndex: '',
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

    // --- Initial Fetch ---
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [destRes, accomRes] = await Promise.all([
                api.get('/api/destinations/'),
                api.get('/api/accommodations/list/')
            ]);
            setDestinations(destRes.data);
            setAccommodations(accomRes.data);
        } catch (error) {
            console.error("Failed to fetch data", error);
            Alert.alert("Connection Error", "Could not load data.");
        } finally {
            setIsFetchingData(false);
        }
    };

    // --- Logic Helpers ---
    const pickImage = async (index) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert('Permission required');
        
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

    const addToTimeline = () => {
        const { startTime, endTime, selectedActivityIndex } = tempTimelineRow;
        if (!startTime || !endTime || !selectedActivityIndex) {
            Alert.alert("Incomplete", "Please fill Start Time, End Time, and Activity.");
            return;
        }

        const [type, index] = selectedActivityIndex.split('|');
        let activityName = '';
        let activityId = null;

        if (type === 'stop') {
            activityName = placeNames[parseInt(index)] || `Stop ${parseInt(index) + 1}`;
        } else if (type === 'accom') {
            const accom = accommodations[parseInt(index)];
            activityName = accom.title;
            activityId = accom.id;
        }

        const newRow = { startTime, endTime, activityName, type, refId: activityId };
        setTimeline([...timeline, newRow]);
        setTempTimelineRow({ ...tempTimelineRow, selectedActivityIndex: '' }); 
    };

    const removeTimelineRow = (index) => {
        const newTimeline = [...timeline];
        newTimeline.splice(index, 1);
        setTimeline(newTimeline);
    };

    // --- Navigation Logic ---
    const validateStep = (step) => {
        if (step === 1) {
            if (!selectedDest || !formData.name || !formData.description) {
                Alert.alert("Missing Info", "Please select a destination and fill in tour details.");
                return false;
            }
        }
        if (step === 3) {
            if (!formData.pricePerDay || timeline.length === 0) {
                Alert.alert("Missing Info", "Please set a price and add at least one schedule item.");
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => prev - 1);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    // --- Final Submit ---
    const handleFinalSubmit = async () => {
        if (!validateStep(3)) return;
        setIsLoading(true);

        try {
            const data = new FormData();
            data.append('destination_id', selectedDest.id);
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('duration', formData.duration);
            data.append('max_group_size', formData.maxGroupSize);
            data.append('what_to_bring', formData.whatToBring);
            data.append('price_per_day', formData.pricePerDay);
            data.append('solo_price', formData.soloPricePerDay);
            data.append('additional_fee_per_head', formData.additionalPerHeadPerDay || 0);
            data.append('itinerary_timeline', JSON.stringify(timeline));

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

            const response = await api.post('/api/create/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.status === 201) {
                Alert.alert("Success", "Tour Created Successfully!", [{ text: "OK", onPress: () => router.back() }]);
            }
        } catch (error) {
            console.error("Submit Error:", error);
            Alert.alert("Error", "Failed to create tour.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Steps ---
    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            <View style={styles.progressInner}>
                {[1, 2, 3].map((step, index) => (
                    <React.Fragment key={step}>
                        <View style={[styles.stepDot, currentStep >= step && styles.stepDotActive]}>
                            <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>{step}</Text>
                        </View>
                        {index < 2 && <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>The Essentials</Text>
            <Text style={styles.stepSubtitle}>Where are you taking them?</Text>

            {/* Destination Selector */}
            <Text style={styles.label}>Destination</Text>
            <TouchableOpacity style={styles.dropdownSelector} onPress={() => setDestModalVisible(true)}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                    <Ionicons name="location" size={20} color="#0072FF" />
                    <Text style={selectedDest ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                        {selectedDest ? selectedDest.name : (isFetchingData ? "Loading..." : "Select Destination")}
                    </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            <Text style={styles.label}>Tour Name</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g., Grand Island Hopping"
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Describe the experience in detail..."
                multiline
                value={formData.description}
                onChangeText={(t) => setFormData({ ...formData, description: t })}
            />

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.label}>Duration</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 8 Hours"
                        value={formData.duration}
                        onChangeText={(t) => setFormData({ ...formData, duration: t })}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Max Pax</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 10"
                        keyboardType="numeric"
                        value={formData.maxGroupSize}
                        onChangeText={(t) => setFormData({ ...formData, maxGroupSize: t })}
                    />
                </View>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Stops & Requirements</Text>
            <Text style={styles.stepSubtitle}>Upload photos of the stops.</Text>

            <Text style={styles.label}>Tour Stops</Text>
            <View style={styles.gridContainer}>
                {featuredPlaces.map((uri, index) => (
                    <View key={index} style={styles.gridItemCard}>
                        <TouchableOpacity style={styles.imageUploadSmall} onPress={() => pickImage(index)}>
                            {uri ? (
                                <Image source={{ uri: uri }} style={styles.uploadedImage} />
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Ionicons name="camera" size={24} color="#ccc" />
                                    <Text style={{ fontSize: 10, color: '#999' }}>Upload</Text>
                                </View>
                            )}
                            <TouchableOpacity style={styles.removeIcon} onPress={() => removePlace(index)}>
                                <Ionicons name="close" size={12} color="#fff" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.cardInput}
                            placeholder={`Stop ${index + 1} Name`}
                            value={placeNames[index]}
                            onChangeText={(t) => handlePlaceNameChange(t, index)}
                        />
                    </View>
                ))}
                
                {/* Add New Stop Button */}
                <TouchableOpacity style={styles.addStopButton} onPress={addPlace}>
                    <Ionicons name="add-circle" size={30} color="#0072FF" />
                    <Text style={styles.addStopText}>Add Another Stop</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.label, {marginTop: 20}]}>What to Bring</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. Sunblock, Extra Clothes, Water"
                value={formData.whatToBring}
                onChangeText={(t) => setFormData({ ...formData, whatToBring: t })}
            />
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Pricing & Schedule</Text>
            <Text style={styles.stepSubtitle}>Finalize the itinerary.</Text>

            {/* Pricing Section */}
            <View style={styles.pricingCard}>
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.labelSmall}>Group Price</Text>
                        <View style={styles.priceInputRow}>
                            <Text style={styles.currency}>₱</Text>
                            <TextInput
                                style={styles.priceInput}
                                placeholder="0"
                                keyboardType="numeric"
                                value={formData.pricePerDay}
                                onChangeText={(t) => setFormData({ ...formData, pricePerDay: t })}
                            />
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.labelSmall}>Solo Price</Text>
                        <View style={styles.priceInputRow}>
                            <Text style={styles.currency}>₱</Text>
                            <TextInput
                                style={styles.priceInput}
                                placeholder="0"
                                keyboardType="numeric"
                                value={formData.soloPricePerDay}
                                onChangeText={(t) => setFormData({ ...formData, soloPricePerDay: t })}
                            />
                        </View>
                    </View>
                </View>
            </View>

            {/* Timeline Builder */}
            <Text style={[styles.label, { marginTop: 25 }]}>Itinerary Builder</Text>
            <View style={styles.builderContainer}>
                
                {/* Inputs Row */}
                <View style={styles.row}>
                    <TextInput 
                        style={[styles.inputSmall, {flex: 1, marginRight: 5}]} 
                        placeholder="Start (8:00 AM)" 
                        value={tempTimelineRow.startTime}
                        onChangeText={t => setTempTimelineRow({...tempTimelineRow, startTime: t})}
                    />
                    <TextInput 
                        style={[styles.inputSmall, {flex: 1, marginLeft: 5}]} 
                        placeholder="End (9:00 AM)" 
                        value={tempTimelineRow.endTime}
                        onChangeText={t => setTempTimelineRow({...tempTimelineRow, endTime: t})}
                    />
                </View>

                {/* Activity Picker */}
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={tempTimelineRow.selectedActivityIndex}
                        onValueChange={(itemValue) => setTempTimelineRow({...tempTimelineRow, selectedActivityIndex: itemValue})}
                        style={{ height: 50, width: '100%' }} // Fix for Android width
                    >
                        <Picker.Item label="Select Activity..." value="" color="#999" />
                        <Picker.Item label="--- YOUR STOPS ---" value="" enabled={false} />
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
                    <Text style={styles.addTimeBtnText}>+ Add to Schedule</Text>
                </TouchableOpacity>

                {/* Timeline Visualization */}
                <View style={styles.timelineList}>
                    {timeline.length === 0 ? (
                        <Text style={styles.emptyTimelineText}>No activities added yet.</Text>
                    ) : (
                        timeline.map((row, index) => (
                            <View key={index} style={styles.timelineItem}>
                                <View style={styles.timelineLeft}>
                                    <Text style={styles.timeText}>{row.startTime}</Text>
                                    <View style={styles.dotLine} />
                                    <Text style={styles.timeText}>{row.endTime}</Text>
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={styles.activityName}>{row.type === 'stop' ? '📍' : '🏨'} {row.activityName}</Text>
                                    <TouchableOpacity onPress={() => removeTimelineRow(index)}>
                                        <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitleText}>Create Tour</Text>
                    <View style={{ width: 24 }} />
                </View>

                {renderProgressBar()}

                <ScrollView 
                    ref={scrollViewRef}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                >
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                </ScrollView>

                {/* Footer Navigation */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                    {currentStep > 1 && (
                        <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                            <Text style={styles.secondaryButtonText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                        style={[styles.primaryButton, currentStep === 1 && { flex: 1 }]} 
                        onPress={currentStep === 3 ? handleFinalSubmit : nextStep}
                        disabled={isLoading}
                    >
                        <LinearGradient
                            colors={['#0072FF', '#00C6FF']}
                            style={styles.gradientBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    {currentStep === 3 ? 'Publish Tour' : 'Next Step'}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>

            {/* Destination Modal */}
            <Modal visible={destModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
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
                                    <Ionicons name="location-outline" size={20} color="#333" style={{marginRight: 10}}/>
                                    <View>
                                        <Text style={styles.modalItemText}>{item.name}</Text>
                                        <Text style={styles.modalItemSub}>{item.location}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.modalClose} onPress={() => setDestModalVisible(false)}>
                            <Text style={styles.modalCloseText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default AddTour;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    
    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
    },
    headerTitleText: { fontSize: 18, fontWeight: '700', color: '#1F2937' },

    // Progress Bar
    progressContainer: { backgroundColor: '#fff', paddingVertical: 20, marginBottom: 10 },
    progressInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
    stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', zIndex: 2 },
    stepDotActive: { backgroundColor: '#0072FF', borderColor: '#0072FF', elevation: 4, shadowColor: '#0072FF', shadowOpacity: 0.3 },
    stepNumber: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    stepNumberActive: { color: '#fff' },
    stepLine: { width: 60, height: 3, backgroundColor: '#E5E7EB', marginHorizontal: 4, borderRadius: 2 },
    stepLineActive: { backgroundColor: '#0072FF' },

    // Step Layouts
    stepContainer: { padding: 20 },
    stepTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 5 },
    stepSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 25 },
    row: { flexDirection: 'row', alignItems: 'center' },
    
    // Inputs & Labels
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 15 },
    labelSmall: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 5 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: '#1F2937' },
    inputSmall: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, fontSize: 14 },
    
    dropdownSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 15 },
    dropdownTextPlaceholder: { color: '#9CA3AF', fontSize: 15 },
    dropdownTextSelected: { color: '#1F2937', fontSize: 15, fontWeight: '600' },

    // Step 2: Stops Grid
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridItemCard: { width: (width - 50) / 2, backgroundColor: '#fff', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    imageUploadSmall: { height: 100, backgroundColor: '#F3F4F6', borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 8 },
    uploadedImage: { width: '100%', height: '100%' },
    removeIcon: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 10 },
    cardInput: { fontSize: 12, textAlign: 'center', padding: 4, backgroundColor: '#F9FAFB', borderRadius: 4 },
    addStopButton: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, marginTop: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#0072FF', borderRadius: 12, backgroundColor: '#EFF6FF' },
    addStopText: { color: '#0072FF', fontWeight: '600', marginLeft: 8 },

    // Step 3: Pricing & Builder
    pricingCard: { backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    priceInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8, paddingHorizontal: 10 },
    currency: { fontSize: 16, fontWeight: '700', color: '#9CA3AF', marginRight: 5 },
    priceInput: { flex: 1, paddingVertical: 10, fontSize: 16, fontWeight: '600', color: '#1F2937' },
    
    builderContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 5 },
    pickerWrapper: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginVertical: 10, overflow: 'hidden' },
    addTimeBtn: { backgroundColor: '#0072FF', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
    addTimeBtnText: { color: '#fff', fontWeight: '700' },
    
    timelineList: { marginTop: 5 },
    emptyTimelineText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, fontStyle: 'italic' },
    timelineItem: { flexDirection: 'row', marginBottom: 12 },
    timelineLeft: { width: 60, alignItems: 'center', marginRight: 10 },
    timeText: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
    dotLine: { width: 1, flex: 1, backgroundColor: '#D1D5DB', marginVertical: 2 },
    timelineContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 8 },
    activityName: { fontSize: 13, fontWeight: '600', color: '#1F2937' },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6', padding: 20, flexDirection: 'row', gap: 15, elevation: 10 },
    secondaryButton: { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, height: 50 },
    secondaryButtonText: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
    primaryButton: { flex: 1, height: 50, borderRadius: 12, overflow: 'hidden' },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15, textAlign: 'center' },
    modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalItemText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
    modalItemSub: { fontSize: 12, color: '#6B7280' },
    modalClose: { marginTop: 15, alignItems: 'center', padding: 10 },
    modalCloseText: { color: '#FF3B30', fontSize: 16, fontWeight: '600' }
});