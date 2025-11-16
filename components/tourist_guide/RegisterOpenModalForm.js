import React, { useState } from "react";
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView, Image, StyleSheet, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import ApplicationConfirmationModal from "./ApplicationConfirmationModal"; 
import api from '../../api/api'; 

const RegisterModalForm = ({ isModalOpen, setIsOpenModal, onSubmit }) => {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        middleInitial: "",
        address: "",
        email: "",
        phone: "",
        landline: "",
    });

    // Keys MUST match the fields in your GuideApplication model in Django backend
    const [images, setImages] = useState({
        tour_guide_certificate: null, 
        proof_of_residency: null, 
        valid_id: null,
        nbi_clearance: null, 
    });

    const [isLoading, setIsLoading] = useState(false); 
    const [showConfirm, setShowConfirm] = useState(false); 

    const pickImage = async (field) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission required', 'We need access to your photos to upload documents.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImages({ ...images, [field]: result.assets[0].uri });
        }
    };

    const handleInputChange = (field, value) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = async () => {
        const requiredFields = ['firstName', 'lastName', 'address', 'email', 'phone'];
        const requiredImages = ['tour_guide_certificate', 'proof_of_residency', 'valid_id', 'nbi_clearance'];
        
        const isFormValid = requiredFields.every(field => form[field].trim() !== '');
        const areImagesAttached = requiredImages.every(field => images[field] !== null);

        if (!isFormValid || !areImagesAttached) {
            Alert.alert("Missing Information", "Please fill in all personal details and upload all four required documents.");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            
            // Append personal data (assuming your backend endpoint handles partial user profile updates)
            formData.append('first_name', form.firstName);
            formData.append('last_name', form.lastName);
            formData.append('middle_initial', form.middleInitial);
            formData.append('address', form.address);
            formData.append('email', form.email);
            formData.append('phone_number', form.phone);
            if (form.landline) {
                formData.append('landline', form.landline);
            }

            // Append documents (crucial step for Django FileField upload)
            Object.keys(images).forEach(key => {
                if (images[key]) {
                    const uri = images[key];
                    const filename = uri.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image/jpeg`; // Default to jpeg if type unknown

                    formData.append(key, { uri, name: filename, type });
                }
            });

            // --- API CALL TO NEW BACKEND ENDPOINT ---
            // Note: This endpoint should handle creating/updating the User profile 
            // and saving the GuideApplication model with documents.
            // We use 'system_management' URL prefix as defined in the backend section.
            await api.post('api/guide-application/submit/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setIsLoading(false);
            setIsOpenModal(false); 
            setShowConfirm(true); 

        } catch (error) {
            console.error('Application submission error:', error.response?.data || error.message);
            setIsLoading(false);
            Alert.alert(
                "Submission Failed", 
                "An error occurred while submitting your application. Please try again. Ensure you are logged in and all documents are valid images."
            );
        }
    };

    const uploadFields = [
        { label: "Tour Guide Certificate", key: "tour_guide_certificate" },
        { label: "Proof of Residency", key: "proof_of_residency" },
        { label: "Valid ID", key: "valid_id" },
        { label: "NBI Clearance", key: "nbi_clearance" },
    ];
    
    return (
        <>
            <Modal visible={isModalOpen} animationType="slide">
                <ScrollView contentContainerStyle={styles.container}>
                    <SafeAreaView>
                        <Text style={styles.header}>REGISTER HERE!</Text>

                        {/* Name Fields */}
                        <Text style={styles.label}>Name:</Text>
                        <View style={styles.row}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="First Name"
                                value={form.firstName}
                                onChangeText={(v) => handleInputChange("firstName", v)}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1, marginLeft: 5 }]}
                                placeholder="Last Name"
                                value={form.lastName}
                                onChangeText={(v) => handleInputChange("lastName", v)}
                            />
                            <TextInput
                                style={[styles.input, { width: 40, marginLeft: 5 }]}
                                placeholder="M.I."
                                value={form.middleInitial}
                                onChangeText={(v) => handleInputChange("middleInitial", v)}
                            />
                        </View>

                        <Text style={styles.label}>Address:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Address"
                            value={form.address}
                            onChangeText={(v) => handleInputChange("address", v)}
                        />

                        <Text style={styles.label}>Contact Information:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            keyboardType="email-address"
                            value={form.email}
                            onChangeText={(v) => handleInputChange("email", v)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            keyboardType="phone-pad"
                            value={form.phone}
                            onChangeText={(v) => handleInputChange("phone", v)}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Landline (optional)"
                            keyboardType="phone-pad"
                            value={form.landline}
                            onChangeText={(v) => handleInputChange("landline", v)}
                        />

                        {/* Document Uploads */}
                        {uploadFields.map(({ label, key }) => (
                            <View key={key} style={styles.uploadContainer}>
                                <Text style={styles.label}>{label}:</Text>
                                <TouchableOpacity
                                    style={styles.imageUpload}
                                    onPress={() => pickImage(key)}
                                >
                                    {images[key] ? (
                                        <Image source={{ uri: images[key] }} style={styles.image} />
                                    ) : (
                                        <Ionicons name="image-outline" size={60} color="#aaa" />
                                    )}
                                    <Ionicons
                                        name="add-circle"
                                        size={24}
                                        color="#007AFF"
                                        style={styles.addIcon}
                                    />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity 
                            style={styles.submitButton} 
                            onPress={handleSubmit} 
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={["#00B2FF", "#006AFF"]}
                                style={styles.gradientButton}
                            >
                                {isLoading ? ( 
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitText}>Submit Application</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsOpenModal(false)}
                            style={{ marginTop: 20 }}
                        >
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                </ScrollView>
            </Modal>
            
            {/* NEW CONFIRMATION MODAL */}
            <ApplicationConfirmationModal 
                isModalOpen={showConfirm} 
                setIsModalOpen={setShowConfirm} 
            />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#fff",
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#0A2342",
        textAlign: "center",
        marginBottom: 20,
    },
    label: {
        fontWeight: "600",
        marginTop: 10,
        marginBottom: 5,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 6,
        padding: 8,
        fontSize: 14,
        marginBottom: 8,
    },
    uploadContainer: {
        marginTop: 10,
    },
    imageUpload: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        height: 120,
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: 8,
    },
    addIcon: {
        position: "absolute",
        bottom: 8,
        right: 8,
    },
    submitButton: {
        marginTop: 20,
        alignSelf: "center",
        width: "100%",
    },
    gradientButton: {
        borderRadius: 10,
        paddingVertical: 10,
        height: 40, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "600",
    },
    closeText: {
        textAlign: "center",
        color: "#006AFF",
    },
});

export default RegisterModalForm;