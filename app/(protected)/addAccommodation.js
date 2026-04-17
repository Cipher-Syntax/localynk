import React, { useState, useRef } from 'react';
import {ScrollView,View,Text,Image,StyleSheet,TextInput,TouchableOpacity,ActivityIndicator,Platform,Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../api/api';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import ProfileLocationMapPicker from '../../components/location/ProfileLocationMapPicker';
import LocationSearchBar from '../../components/location/LocationSearchBar';

const { width } = Dimensions.get('window');

const normalizeTransportCapacities = (rawValue) => {
    const source = Array.isArray(rawValue)
        ? rawValue
        : typeof rawValue === 'string'
            ? rawValue.split(',')
            : [];

    const normalized = [];
    const seen = new Set();

    source.forEach((value) => {
        const parsed = parseInt(String(value || '').trim(), 10);
        if (!Number.isFinite(parsed) || parsed <= 0 || seen.has(parsed)) {
            return;
        }
        seen.add(parsed);
        normalized.push(parsed);
    });

    return normalized;
};

const normalizeTransportOptions = (rawValue) => {
    const source = Array.isArray(rawValue) ? rawValue : [];
    const normalized = [];

    source.forEach((item) => {
        const vehicleType = String(item?.vehicle_type || '').trim();
        const capacities = normalizeTransportCapacities(item?.transport_capacities || []);
        if (!vehicleType || capacities.length === 0) {
            return;
        }

        normalized.push({
            vehicle_type: vehicleType,
            transport_capacities: capacities,
        });
    });

    return normalized;
};

const AddAccommodation = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const scrollViewRef = useRef(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const initialFormState = {
        name: '',
        type: 'Room',
        description: '',
        address: '',
        latitude: null,
        longitude: null,
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
        transportOptions: [],
        draftVehicleType: '',
        draftTransportCapacities: [],
        draftTransportCapacityInput: '',
    };

    const [formData, setFormData] = useState(initialFormState);
    const [images, setImages] = useState({
        accommodation: null,
        room: null,
        transport: null
    });

    const accommodationTypes = ['Room', 'Hostel', 'Hotel', 'Apartment'];
    const roomTypes = ['Single', 'Double', 'Suite', 'Family'];
    const vehicleTypeOptions = ['Van', 'Car', 'Boat', 'Tricycle', 'Motorcycle', 'Bus', 'SUV'];

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

    const pickImage = async (type) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Permission required: Need access to your photos.', 'error');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setImages(prev => ({ ...prev, [type]: result.assets[0].uri }));
        }
    };

    const toggleOffering = (key) => {
        setFormData(prev => ({
            ...prev,
            offerings: { ...prev.offerings, [key]: !prev.offerings[key] }
        }));
    };

    const addTransportCapacity = () => {
        const nextCapacities = normalizeTransportCapacities([
            ...(formData.draftTransportCapacities || []),
            formData.draftTransportCapacityInput,
        ]);

        if (nextCapacities.length === (formData.draftTransportCapacities || []).length) {
            showToast('Enter a valid transport capacity before adding.', 'error');
            return;
        }

        setFormData((prev) => ({
            ...prev,
            draftTransportCapacities: nextCapacities,
            draftTransportCapacityInput: '',
        }));
    };

    const removeTransportCapacity = (capacityToRemove) => {
        setFormData((prev) => ({
            ...prev,
            draftTransportCapacities: (prev.draftTransportCapacities || []).filter((capacity) => capacity !== capacityToRemove),
        }));
    };

    const addTransportOption = () => {
        const vehicleType = String(formData.draftVehicleType || '').trim();
        const capacities = normalizeTransportCapacities(formData.draftTransportCapacities || []);

        if (!vehicleType) {
            showToast('Select or type a vehicle type before adding transportation.', 'error');
            return;
        }

        if (capacities.length === 0) {
            showToast('Add at least one capacity for this vehicle.', 'error');
            return;
        }

        setFormData((prev) => ({
            ...prev,
            transportOptions: normalizeTransportOptions([
                ...(prev.transportOptions || []),
                { vehicle_type: vehicleType, transport_capacities: capacities },
            ]),
            draftVehicleType: '',
            draftTransportCapacities: [],
            draftTransportCapacityInput: '',
        }));
    };

    const removeTransportOption = (indexToRemove) => {
        setFormData((prev) => ({
            ...prev,
            transportOptions: (prev.transportOptions || []).filter((_, index) => index !== indexToRemove),
        }));
    };

    const validateStep = (step) => {
        if (step === 1) {
            if (!formData.name || !formData.address || !formData.pricePerNight) {
                showToast("Please fill in Name, Address, and Price.", "error");
                return false;
            }
        }

        if (step === 3 && formData.transportation) {
            const finalTransportOptions = normalizeTransportOptions(formData.transportOptions || []);

            if (finalTransportOptions.length === 0) {
                showToast('Please add at least one transportation entry.', 'error');
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

    const handleSubmit = async () => {
        if (!validateStep(3)) return;
        setLoading(true);
        try {
            const data = new FormData();
            
            data.append('title', formData.name);
            data.append('description', formData.description);
            data.append('location', formData.address);

            if (formData.latitude !== null && formData.latitude !== undefined && String(formData.latitude).trim() !== '') {
                data.append('latitude', String(formData.latitude));
            }

            if (formData.longitude !== null && formData.longitude !== undefined && String(formData.longitude).trim() !== '') {
                data.append('longitude', String(formData.longitude));
            }

            data.append('price', formData.pricePerNight);
            data.append('accommodation_type', formData.type);
            data.append('room_type', formData.roomType);
            data.append('amenities', JSON.stringify(formData.offerings));
            data.append('offer_transportation', formData.transportation ? "true" : "false");
            
            if (formData.transportation) {
                const finalTransportOptions = normalizeTransportOptions(formData.transportOptions || []);
                const firstTransport = finalTransportOptions[0] || null;

                data.append('transport_options', JSON.stringify(finalTransportOptions));
                data.append('vehicle_type', firstTransport?.vehicle_type || '');
                data.append('transport_capacities', JSON.stringify(firstTransport?.transport_capacities || []));
                data.append('transport_capacity', firstTransport?.transport_capacities?.[0] || 0);
            }

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

            appendImage(images.accommodation, 'photo');
            appendImage(images.room, 'room_image');
            if (formData.transportation) appendImage(images.transport, 'transport_image');

            await api.post('/api/accommodations/', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            showToast("Accommodation listed! Moving to final step...", "success");
            setTimeout(() => {
                router.back();
            }, 1500);
            
        } 
        catch (error) {
            console.error("Submit Error:", error);
            showToast("Failed to upload listing. Please try again.", "error");
        } 
        finally {
            setLoading(false);
        }
    };

    const renderProgressBar = () => (
        <View style={styles.progressContainer}>
            <View style={styles.progressInner}>
                {[1, 2, 3].map((step, index) => (
                    <React.Fragment key={step}>
                        <View style={[styles.stepDot, currentStep >= step && styles.stepDotActive]}>
                            <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>
                                {step}
                            </Text>
                        </View>

                        {index < 2 && (
                            <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />
                        )}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>The Basics</Text>
            <Text style={styles.stepSubtitle}>Let&apos;s start with the essential details.</Text>

            <Text style={styles.label}>Listing Title</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g., Sunset Beach Villa"
                placeholderTextColor="#9CA3AF"
                value={formData.name}
                onChangeText={t => setFormData({ ...formData, name: t })}
            />

            <Text style={styles.label}>Where is it located?</Text>
            
            {/* 1. STANDALONE SEARCH BAR (Highest z-index so it drops over everything) */}
            <View style={{ zIndex: 9999, elevation: 9999, position: 'relative' }}>
                <LocationSearchBar 
                    value={formData.address}
                    onSelectLocation={(loc) => {
                        setFormData(prev => ({ 
                            ...prev, 
                            address: loc.address, 
                            latitude: loc.latitude, 
                            longitude: loc.longitude 
                        }));
                    }}
                />
            </View>

            {/* 2. STANDALONE MAP (Standard flow with positive margin to avoid overlap) */}
            <View style={{ marginTop: 15 }}>
                <ProfileLocationMapPicker
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onChangeCoordinates={(coords) => {
                        setFormData(prev => ({ 
                            ...prev, 
                            latitude: coords.latitude, 
                            longitude: coords.longitude 
                        }));
                    }}
                />
            </View>

            <Text style={styles.label}>Property Type</Text>
            <View style={styles.pillContainer}>
                {accommodationTypes.map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.pill, formData.type === type && styles.pillActive]}
                        onPress={() => setFormData({ ...formData, type })}
                    >
                        <Text style={[styles.pillText, formData.type === type && styles.pillTextActive]}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Price per Night (₱)</Text>
            <View style={styles.inputIconRow}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#666', marginRight: 5 }}>₱</Text>
                <TextInput
                    style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1F2937' }}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={formData.pricePerNight}
                    onChangeText={t => setFormData({ ...formData, pricePerNight: t })}
                />
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Tell tourists what makes your place special..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={formData.description}
                onChangeText={t => setFormData({ ...formData, description: t })}
            />
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Room & Amenities</Text>
            <Text style={styles.stepSubtitle}>What does the space look like?</Text>

            <Text style={styles.label}>Room Arrangement</Text>
            <View style={styles.pillContainer}>
                {roomTypes.map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.pill, formData.roomType === type && styles.pillActive]}
                        onPress={() => setFormData({ ...formData, roomType: type })}
                    >
                        <Text style={[styles.pillText, formData.roomType === type && styles.pillTextActive]}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Amenities</Text>
            <View style={styles.gridContainer}>
                {Object.keys(formData.offerings).map(key => {
                    const icons = {
                        wifi: 'wifi', breakfast: 'restaurant', ac: 'snow', parking: 'car', pool: 'water'
                    };
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[styles.gridItem, formData.offerings[key] && styles.gridItemActive]}
                            onPress={() => toggleOffering(key)}
                        >
                            <Ionicons 
                                name={icons[key]} 
                                size={24} 
                                color={formData.offerings[key] ? '#fff' : '#666'} 
                            />
                            <Text style={[styles.gridText, formData.offerings[key] && styles.gridTextActive]}>
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={[styles.label, { marginTop: 25 }]}>Room Photo (Optional)</Text>
            <TouchableOpacity style={styles.imageUploadLarge} onPress={() => pickImage('room')}>
                {images.room ? (
                    <Image source={{ uri: images.room }} style={styles.uploadedImage} />
                ) : (
                    <View style={styles.uploadPlaceholder}>
                        <Ionicons name="bed-outline" size={40} color="#0072FF" />
                        <Text style={styles.uploadText}>Upload Interior Photo</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Media & Logistics</Text>
            <Text style={styles.stepSubtitle}>Final touches to make it stand out.</Text>

            <Text style={styles.label}>Cover Photo (Required)</Text>
            <TouchableOpacity style={styles.imageUploadLarge} onPress={() => pickImage('accommodation')}>
                {images.accommodation ? (
                    <Image source={{ uri: images.accommodation }} style={styles.uploadedImage} />
                ) : (
                    <View style={styles.uploadPlaceholder}>
                        <Ionicons name="image-outline" size={40} color="#0072FF" />
                        <Text style={styles.uploadText}>Upload Main Listing Photo</Text>
                    </View>
                )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.switchRow}>
                <View>
                    <Text style={styles.switchTitle}>Offer Transportation?</Text>
                    <Text style={styles.switchSub}>Do you pick up guests?</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.toggle, formData.transportation && styles.toggleActive]}
                    onPress={() => setFormData((prev) => {
                        const nextState = !prev.transportation;
                        if (!nextState) {
                            return {
                                ...prev,
                                transportation: false,
                                transportOptions: [],
                                draftVehicleType: '',
                                draftTransportCapacities: [],
                                draftTransportCapacityInput: '',
                            };
                        }

                        return {
                            ...prev,
                            transportation: true,
                        };
                    })}
                >
                    <View style={[styles.toggleCircle, formData.transportation && styles.toggleCircleActive]} />
                </TouchableOpacity>
            </View>

            {formData.transportation && (
                <View style={styles.transportContainer}>
                    <Text style={styles.label}>Vehicle Selection</Text>
                    <View style={styles.pillContainer}>
                        {vehicleTypeOptions.map((vehicleType) => (
                            <TouchableOpacity
                                key={vehicleType}
                                style={[styles.pill, formData.draftVehicleType === vehicleType && styles.pillActive]}
                                onPress={() => setFormData((prev) => ({ ...prev, draftVehicleType: vehicleType }))}
                            >
                                <Text style={[styles.pillText, formData.draftVehicleType === vehicleType && styles.pillTextActive]}>{vehicleType}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Vehicle Type (Editable)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Van, Boat, Tricycle"
                        placeholderTextColor="#9CA3AF"
                        value={formData.draftVehicleType}
                        onChangeText={t => setFormData({ ...formData, draftVehicleType: t })}
                    />

                    <Text style={styles.label}>Transport Capacities (Pax)</Text>
                    <View style={styles.capacityInputRow}>
                        <TextInput
                            style={[styles.input, styles.capacityInput]}
                            placeholder="e.g. 4"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={formData.draftTransportCapacityInput}
                            onChangeText={t => setFormData({ ...formData, draftTransportCapacityInput: t })}
                        />
                        <TouchableOpacity style={styles.addCapacityButton} onPress={addTransportCapacity}>
                            <Text style={styles.addCapacityButtonText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.capacityChipsContainer}>
                        {(formData.draftTransportCapacities || []).map((capacity) => (
                            <View key={`capacity-${capacity}`} style={styles.capacityChip}>
                                <Text style={styles.capacityChipText}>{capacity} pax</Text>
                                <TouchableOpacity onPress={() => removeTransportCapacity(capacity)}>
                                    <Ionicons name="close" size={14} color="#1F2937" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <View style={{flexDirection: 'row', gap: 15}}>
                        <View style={{flex: 1}}>
                            <Text style={styles.label}>Vehicle Photo</Text>
                            <TouchableOpacity style={styles.imageUploadSmall} onPress={() => pickImage('transport')}>
                                {images.transport ? (
                                    <Image source={{ uri: images.transport }} style={styles.uploadedImage} />
                                ) : (
                                    <Ionicons name="camera" size={24} color="#ccc" />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.addTransportOptionButton} onPress={addTransportOption}>
                        <Text style={styles.addTransportOptionButtonText}>Add Transportation</Text>
                    </TouchableOpacity>

                    <View style={styles.transportOptionsList}>
                        {(formData.transportOptions || []).map((option, index) => (
                            <View key={`transport-option-${index}`} style={styles.transportOptionCard}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.transportOptionTitle}>{option.vehicle_type}</Text>
                                    <Text style={styles.transportOptionSubtitle}>Capacities: {option.transport_capacities.join(', ')} pax</Text>
                                </View>
                                <TouchableOpacity onPress={() => removeTransportOption(index)}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <ScreenSafeArea style={{ flex: 1 }} edges={['bottom', 'top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitleText}>List Accommodation</Text>
                    <View style={{ width: 24 }} />
                </View>

                {renderProgressBar()}

                <ScrollView 
                    ref={scrollViewRef}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled" 
                >
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                </ScrollView>

                <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                    {currentStep > 1 && (
                        <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                            <Text style={styles.secondaryButtonText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                        style={[styles.primaryButton, currentStep === 1 && { flex: 1 }]} 
                        onPress={currentStep === 3 ? handleSubmit : nextStep}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#0072FF', '#00C6FF']}
                            style={styles.gradientBtn}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.primaryButtonText}>
                                    {currentStep === 3 ? 'Submit Listing' : 'Next Step'}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {toast.visible && (
                    <View style={[
                        styles.toastContainer, 
                        toast.type === 'error' ? styles.toastError : styles.toastSuccess
                    ]}>
                        <Ionicons 
                            name={toast.type === 'error' ? "alert-circle" : "checkmark-circle"} 
                            size={24} color="#fff" 
                        />
                        <Text style={styles.toastText}>{toast.message}</Text>
                    </View>
                )}

            </ScreenSafeArea>
        </View>
    );
};

export default AddAccommodation;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    headerTitleText: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    progressContainer: { backgroundColor: '#fff', paddingVertical: 20, marginBottom: 10 },
    progressInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '90%', margin: "auto" },
    stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', zIndex: 2 },
    stepDotActive: { backgroundColor: '#0072FF', borderColor: '#0072FF', elevation: 4, shadowColor: '#0072FF', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
    stepNumber: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    stepNumberActive: { color: '#fff' },
    stepLine: { width: 60, height: 3, backgroundColor: '#E5E7EB', marginHorizontal: 4, borderRadius: 2 },
    stepLineActive: { backgroundColor: '#0072FF' },
    stepContainer: { padding: 20 },
    stepTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 5 },
    stepSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 25 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: '#1F2937' },
    inputIconRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12 },
    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
    pillActive: { backgroundColor: '#EFF6FF', borderColor: '#0072FF' },
    pillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    pillTextActive: { color: '#0072FF' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: (width - 64) / 3, aspectRatio: 1, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', gap: 8 },
    gridItemActive: { backgroundColor: '#0072FF', borderColor: '#0072FF' },
    gridText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    gridTextActive: { color: '#fff' },
    imageUploadLarge: { height: 180, backgroundColor: '#EFF6FF', borderRadius: 16, borderWidth: 2, borderColor: '#DBEAFE', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    imageUploadSmall: { height: 50, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    uploadPlaceholder: { alignItems: 'center', gap: 10 },
    uploadText: { fontSize: 14, color: '#0072FF', fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 25 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    switchTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
    switchSub: { fontSize: 13, color: '#6B7280' },
    toggle: { width: 50, height: 28, backgroundColor: '#E5E7EB', borderRadius: 14, padding: 2, justifyContent: 'center' },
    toggleActive: { backgroundColor: '#0072FF' },
    toggleCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    toggleCircleActive: { alignSelf: 'flex-end' },
    transportContainer: { backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    capacityInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    capacityInput: { flex: 1 },
    addCapacityButton: { backgroundColor: '#0072FF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
    addCapacityButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    capacityChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 6 },
    capacityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DBEAFE', borderColor: '#93C5FD', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    capacityChipText: { color: '#1E3A8A', fontSize: 12, fontWeight: '600' },
    addTransportOptionButton: { backgroundColor: '#0F766E', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
    addTransportOptionButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    transportOptionsList: { marginTop: 12, gap: 8 },
    transportOptionCard: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
    transportOptionTitle: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
    transportOptionSubtitle: { color: '#475569', fontSize: 12, marginTop: 2 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6', padding: 20, flexDirection: 'row', gap: 15, elevation: 10 },
    secondaryButton: { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, height: 50 },
    secondaryButtonText: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
    primaryButton: { flex: 1, height: 50, borderRadius: 12, overflow: 'hidden' },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    toastContainer: { position: 'absolute', bottom: 80, left: 20, right: 20, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10, zIndex: 1000 },
    toastSuccess: { backgroundColor: '#00c853' },
    toastError: { backgroundColor: '#ff5252' },
    toastText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 12 },
});