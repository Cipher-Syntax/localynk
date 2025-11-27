import React, { useState, useRef } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    Modal, 
    TouchableOpacity, 
    ScrollView, 
    Image, 
    StyleSheet, 
    ActivityIndicator, 
    Alert,
    Dimensions,
    Platform 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import ApplicationConfirmationModal from "./ApplicationConfirmationModal"; 
import api from '../../api/api'; 
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get('window');

const RegisterModalForm = ({ isModalOpen, setIsOpenModal, onSubmit }) => {
    const { user } = useAuth();
    const scrollViewRef = useRef(null);

    const getInitialValue = (key) => user?.[key] || "";
    
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [form, setForm] = useState({
        firstName: getInitialValue("first_name"),
        lastName: getInitialValue("last_name"),
        middleInitial: user?.middle_name ? user.middle_name.charAt(0).toUpperCase() : "",
        email: getInitialValue("email"),
        phone: getInitialValue("phone_number"),
        location: getInitialValue("location"), 
        landline: "",
    });

    const [images, setImages] = useState({
        tour_guide_certificate: null, 
        proof_of_residency: null, 
        valid_id: null,
        nbi_clearance: null, 
    });

    const pickImage = async (field) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'We need access to your photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImages(prev => ({ ...prev, [field]: result.assets[0].uri }));
        }
    };

    const handleInputChange = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const handleMiddleInitialChange = (text) => {
        const initial = text.length > 0 ? text.charAt(0).toUpperCase() : "";
        setForm(prev => ({ ...prev, middleInitial: initial }));
    };

    const validateStep = (step) => {
        if (step === 1) {
            if (!form.firstName || !form.lastName || !form.location) {
                Alert.alert("Missing Info", "Please fill in your Name and Location.");
                return false;
            }
        }
        if (step === 2) {
            if (!form.email || !form.phone) {
                Alert.alert("Missing Info", "Email and Phone Number are required.");
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
        const requiredImages = ['tour_guide_certificate', 'proof_of_residency', 'valid_id', 'nbi_clearance'];
        const areImagesAttached = requiredImages.every(field => images[field] !== null);

        if (!areImagesAttached) {
            Alert.alert("Missing Documents", "Please upload all 4 required documents.");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            
            // Text Data
            formData.append('first_name', form.firstName);
            formData.append('last_name', form.lastName);
            formData.append('middle_name', form.middleInitial);
            formData.append('location', form.location);
            formData.append('email', form.email);
            formData.append('phone_number', form.phone);
            if (form.landline) formData.append('landline', form.landline);
            
            Object.keys(images).forEach(key => {
                if (images[key]) {
                    const uri = images[key];
                    const filename = uri.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image/jpeg`;
                    formData.append(key, { uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri, name: filename, type });
                }
            });

            await api.post('api/guide-application/submit/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setIsLoading(false);
            setIsOpenModal(false); 
            setShowConfirm(true);

        } catch (error) {
            console.error('Submission error:', error.response?.data || error.message);
            setIsLoading(false);
            Alert.alert("Submission Failed", "Please check your internet connection and try again.");
        }
    };

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
            <Text style={styles.stepTitle}>Personal Details</Text>
            <Text style={styles.stepSubtitle}>Let's get to know you.</Text>

            <Text style={styles.label}>Full Name</Text>
            <View style={styles.row}>
                <TextInput
                    style={[styles.input, { flex: 2, marginRight: 10 }]}
                    placeholder="First Name"
                    value={form.firstName}
                    onChangeText={(v) => handleInputChange("firstName", v)}
                />
                <TextInput
                    style={[styles.input, { width: 60, marginRight: 10, textAlign: 'center' }]}
                    placeholder="M.I."
                    value={form.middleInitial}
                    onChangeText={handleMiddleInitialChange}
                    maxLength={1}
                />
                <TextInput
                    style={[styles.input, { flex: 2 }]}
                    placeholder="Last Name"
                    value={form.lastName}
                    onChangeText={(v) => handleInputChange("lastName", v)}
                />
            </View>

            <Text style={styles.label}>Location / Address</Text>
            <TextInput
                style={styles.input}
                placeholder="City, Province or Full Address"
                value={form.location}
                onChangeText={(v) => handleInputChange("location", v)}
            />
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Contact Info</Text>
            <Text style={styles.stepSubtitle}>How can we reach you?</Text>

            <Text style={styles.label}>Email Address</Text>
            <TextInput
                style={styles.input}
                placeholder="name@example.com"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(v) => handleInputChange("email", v)}
            />

            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
                style={styles.input}
                placeholder="0912 345 6789"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(v) => handleInputChange("phone", v)}
            />

            <Text style={styles.label}>Landline (Optional)</Text>
            <TextInput
                style={styles.input}
                placeholder="(02) 1234 5678"
                keyboardType="phone-pad"
                value={form.landline}
                onChangeText={(v) => handleInputChange("landline", v)}
            />
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Documents</Text>
            <Text style={styles.stepSubtitle}>Upload clear photos of the following.</Text>

            <View style={styles.gridContainer}>
                {[
                    { label: "Guide Certificate", key: "tour_guide_certificate" },
                    { label: "Proof of Residency", key: "proof_of_residency" },
                    { label: "Valid ID", key: "valid_id" },
                    { label: "NBI Clearance", key: "nbi_clearance" },
                ].map((item, index) => (
                    <View key={index} style={styles.gridItem}>
                        <Text style={styles.gridLabel}>{item.label}</Text>
                        <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage(item.key)}>
                            {images[item.key] ? (
                                <Image source={{ uri: images[item.key] }} style={styles.uploadedImage} />
                            ) : (
                                <View style={{ alignItems: 'center' }}>
                                    <Ionicons name="cloud-upload-outline" size={28} color="#0072FF" />
                                    <Text style={styles.uploadText}>Upload</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        </View>
    );

    return (
        <>
            <Modal visible={isModalOpen} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.container}>
                    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                        
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => setIsOpenModal(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#1F2937" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitleText}>Guide Application</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        {renderProgressBar()}

                        <ScrollView 
                            ref={scrollViewRef}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {currentStep === 1 && renderStep1()}
                            {currentStep === 2 && renderStep2()}
                            {currentStep === 3 && renderStep3()}
                        </ScrollView>

                        {/* Footer Navigation */}
                        <View style={styles.footer}>
                            {currentStep > 1 && (
                                <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
                                    <Text style={styles.secondaryButtonText}>Back</Text>
                                </TouchableOpacity>
                            )}
                            
                            <TouchableOpacity 
                                style={[styles.primaryButton, currentStep === 1 && { flex: 1 }]} 
                                onPress={currentStep === 3 ? handleSubmit : nextStep}
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
                                            {currentStep === 3 ? 'Submit Application' : 'Next Step'}
                                        </Text>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                    </SafeAreaView>
                </View>
            </Modal>

            <ApplicationConfirmationModal 
                isModalOpen={showConfirm} 
                setIsModalOpen={setShowConfirm} 
            />
        </>
    );
};

export default RegisterModalForm;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
    },
    headerTitleText: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    closeButton: { padding: 5 },

    progressContainer: { backgroundColor: '#fff', paddingVertical: 20, marginBottom: 10 },
    progressInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
    stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', zIndex: 2 },
    stepDotActive: { backgroundColor: '#0072FF', borderColor: '#0072FF', elevation: 4, shadowColor: '#0072FF', shadowOpacity: 0.3 },
    stepNumber: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    stepNumberActive: { color: '#fff' },
    stepLine: { width: 60, height: 3, backgroundColor: '#E5E7EB', marginHorizontal: 4, borderRadius: 2 },
    stepLineActive: { backgroundColor: '#0072FF' },

    stepContainer: { padding: 20 },
    stepTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 5 },
    stepSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 25 },
    
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: '#1F2937' },
    row: { flexDirection: 'row', alignItems: 'center' },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
    gridItem: { width: '48%', marginBottom: 20 },
    gridLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    imagePicker: { 
        height: 120, backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1, 
        borderColor: '#BFDBFE', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' 
    },
    uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    uploadText: { fontSize: 12, color: '#0072FF', fontWeight: '600', marginTop: 5 },

    footer: { 
        position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', 
        borderTopWidth: 1, borderTopColor: '#F3F4F6', padding: 20, flexDirection: 'row', gap: 15, elevation: 10 
    },
    secondaryButton: { 
        paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', 
        backgroundColor: '#F3F4F6', borderRadius: 12, height: 50 
    },
    secondaryButtonText: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
    primaryButton: { flex: 1, height: 50, borderRadius: 12, overflow: 'hidden' },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' }
});