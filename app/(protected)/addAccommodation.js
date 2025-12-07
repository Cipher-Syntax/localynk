import React, { useState, useRef } from 'react';
import {ScrollView,StatusBar,View,Text,Image,StyleSheet,TextInput,TouchableOpacity,Alert,ActivityIndicator,Platform,Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '../../api/api';

const { width } = Dimensions.get('window');

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
    const [images, setImages] = useState({
        accommodation: null,
        room: null,
        transport: null
    });

    const accommodationTypes = ['Room', 'Hostel', 'Hotel', 'Apartment'];
    const roomTypes = ['Single', 'Double', 'Suite', 'Family'];

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

    const validateStep = (step) => {
        if (step === 1) {
            if (!formData.name || !formData.address || !formData.pricePerNight) {
                showToast("Please fill in Name, Address, and Price.", "error");
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
        setLoading(true);
        try {
            const data = new FormData();
            
            data.append('title', formData.name);
            data.append('description', formData.description);
            data.append('location', formData.address);
            data.append('price', formData.pricePerNight);
            data.append('accommodation_type', formData.type);
            data.append('room_type', formData.roomType);
            data.append('amenities', JSON.stringify(formData.offerings));
            data.append('offer_transportation', formData.transportation ? "true" : "false");
            
            if (formData.transportation) {
                data.append('vehicle_type', formData.vehicleType);
                data.append('transport_capacity', formData.capacity || 0);
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
                router.push('/(protected)/addTour');
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
            <Text style={styles.stepSubtitle}>Let's start with the essential details.</Text>

            <Text style={styles.label}>Listing Title</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g., Sunset Beach Villa"
                value={formData.name}
                onChangeText={t => setFormData({ ...formData, name: t })}
            />

            <Text style={styles.label}>Where is it located?</Text>
            <View style={styles.inputIconRow}>
                <Ionicons name="location-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                <TextInput
                    style={{ flex: 1 }}
                    placeholder="Address or Landmark"
                    value={formData.address}
                    onChangeText={t => setFormData({ ...formData, address: t })}
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
                    style={{ flex: 1, fontSize: 16, fontWeight: '600' }}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={formData.pricePerNight}
                    onChangeText={t => setFormData({ ...formData, pricePerNight: t })}
                />
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Tell tourists what makes your place special..."
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
                    onPress={() => setFormData({ ...formData, transportation: !formData.transportation })}
                >
                    <View style={[styles.toggleCircle, formData.transportation && styles.toggleCircleActive]} />
                </TouchableOpacity>
            </View>

            {formData.transportation && (
                <View style={styles.transportContainer}>
                    <Text style={styles.label}>Vehicle Type</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Van, Boat, Tricycle"
                        value={formData.vehicleType}
                        onChangeText={t => setFormData({ ...formData, vehicleType: t })}
                    />
                    
                    <View style={{flexDirection: 'row', gap: 15}}>
                        <View style={{flex: 1}}>
                            <Text style={styles.label}>Capacity</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Pax"
                                keyboardType="numeric"
                                value={formData.capacity}
                                onChangeText={t => setFormData({ ...formData, capacity: t })}
                            />
                        </View>
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
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                
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
                >
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                </ScrollView>

                {/* Footer Navigation - FIXED WITH INSETS */}
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

            </SafeAreaView>
        </View>
    );
};

export default AddAccommodation;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6'
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937'
    },
    progressContainer: {
        backgroundColor: '#fff',
        paddingVertical: 20,
        marginBottom: 10,
    },
    progressInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '90%',
        margin: "auto"
    },
    stepDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        zIndex: 2,
    },
    stepDotActive: {
        backgroundColor: '#0072FF',
        borderColor: '#0072FF',
        elevation: 4,
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    stepNumberActive: {
        color: '#fff',
    },
    stepLine: {
        width: 60,
        height: 3,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
        borderRadius: 2,
    },
    stepLineActive: {
        backgroundColor: '#0072FF',
    },
    stepLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: -2
    },
    stepLineActive: {
        backgroundColor: '#0072FF'
    },
    stepContainer: {
        padding: 20,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 5
    },
    stepSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 25
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 15
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937'
    },
    inputIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    pillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    pillActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#0072FF'
    },
    pillText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280'
    },
    pillTextActive: {
        color: '#0072FF'
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12
    },
    gridItem: {
        width: (width - 64) / 3,
        aspectRatio: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 8
    },
    gridItemActive: {
        backgroundColor: '#0072FF',
        borderColor: '#0072FF'
    },
    gridText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280'
    },
    gridTextActive: {
        color: '#fff'
    },
    imageUploadLarge: {
        height: 180,
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#DBEAFE',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    imageUploadSmall: {
        height: 50,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover'
    },
    uploadPlaceholder: {
        alignItems: 'center',
        gap: 10
    },
    uploadText: {
        fontSize: 14,
        color: '#0072FF',
        fontWeight: '600'
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 25
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    switchTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937'
    },
    switchSub: {
        fontSize: 13,
        color: '#6B7280'
    },
    toggle: {
        width: 50,
        height: 28,
        backgroundColor: '#E5E7EB',
        borderRadius: 14,
        padding: 2,
        justifyContent: 'center'
    },
    toggleActive: {
        backgroundColor: '#0072FF'
    },
    toggleCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    toggleCircleActive: {
        alignSelf: 'flex-end'
    },
    transportContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        padding: 20,
        flexDirection: 'row',
        gap: 15,
        elevation: 10,
    },
    secondaryButton: {
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        height: 50
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4B5563'
    },
    primaryButton: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        overflow: 'hidden'
    },
    gradientBtn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff'
    },
    toastContainer: { 
        position: 'absolute', 
        bottom: 80, 
        left: 20, 
        right: 20, 
        borderRadius: 12, 
        padding: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 8, 
        elevation: 10, 
        zIndex: 1000 
    },
    toastSuccess: { backgroundColor: '#00c853' },
    toastError: { backgroundColor: '#ff5252' },
    toastText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 12 },
});