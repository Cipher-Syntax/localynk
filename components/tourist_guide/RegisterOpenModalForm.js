import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView, Image, StyleSheet, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import ApplicationConfirmationModal from "./ApplicationConfirmationModal"; 
import api from '../../api/api'; 
import { useAuth } from "../../context/AuthContext"; // ⭐ Import useAuth

const RegisterModalForm = ({ isModalOpen, setIsOpenModal, onSubmit }) => {
    // ⭐ Get the current authenticated user data
    const { user } = useAuth();

    // Utility function to safely get user data, defaulting to empty string for display
    const getInitialValue = (key) => user?.[key] || "";
    
    // ⭐ INITIALIZE STATE WITH AUTH USER DATA
    const [form, setForm] = useState({
        // General Profile Details (from AbstractUser and custom User model)
        firstName: getInitialValue("first_name"),
        lastName: getInitialValue("last_name"),
        email: getInitialValue("email"),
        phone: getInitialValue("phone_number"),
        location: getInitialValue("location"), // Mapped to 'address' input for simplicity
        bio: getInitialValue("bio"),

        // Other fields not directly mapped to User model but included in form
        middleInitial: "", // Assume this is not stored on User model but collected here
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
        // Updated validation to use 'location' field name from state
        const requiredFields = ['firstName', 'lastName', 'location', 'email', 'phone']; 
        const requiredImages = ['tour_guide_certificate', 'proof_of_residency', 'valid_id', 'nbi_clearance'];
        
        const isFormValid = requiredFields.every(field => form[field] && form[field].trim() !== '');
        const areImagesAttached = requiredImages.every(field => images[field] !== null);

        if (!isFormValid || !areImagesAttached) {
            Alert.alert("Missing Information", "Please fill in all personal details and upload all four required documents.");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            
            // ⭐ Map Form State to Django User Model Fields (for partial profile update during application)
            formData.append('first_name', form.firstName);
            formData.append('last_name', form.lastName);
            // formData.append('middle_initial', form.middleInitial); // Not in Django User model, omitting.
            formData.append('location', form.location); // Mapped from address/location input
            formData.append('email', form.email);
            formData.append('phone_number', form.phone);
            formData.append('bio', form.bio);
            if (form.landline) {
                formData.append('landline', form.landline);
            }
            
            // Append documents (crucial step for Django GuideApplication model)
            Object.keys(images).forEach(key => {
                if (images[key]) {
                    const uri = images[key];
                    const filename = uri.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image/jpeg`; // Default to jpeg if type unknown

                    formData.append(key, { uri, name: filename, type });
                }
            });

            // --- API CALL ---
            // This single endpoint must handle:
            // 1. PATCH/PUT user profile data (first_name, last_name, phone_number, location, bio).
            // 2. Creating the GuideApplication instance with documents linked to the current user.
            await api.post('api/guide-application/submit/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Optional: Call refreshUser() from AuthContext here to update user role/status locally
            // refreshUser(); // Assuming you'd need to manually trigger a refresh

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
                        <Text style={styles.header}>APPLY AS LOCAL GUIDE</Text>
                        <Text style={styles.subHeader}>Personal Details (Editable)</Text>

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

                        <Text style={styles.label}>Location (Address for Residency Proof):</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Address (City, Province, or detailed address)"
                            value={form.location}
                            onChangeText={(v) => handleInputChange("location", v)}
                        />
                        
                        {/* Bio Field (Optional, from Django User model) */}
                        <Text style={styles.label}>Bio/Description (Optional):</Text>
                        <TextInput
                            style={[styles.input, styles.bioInput]}
                            placeholder="Tell us a little about yourself (e.g., expertise, experience, why you want to guide)"
                            value={form.bio}
                            onChangeText={(v) => handleInputChange("bio", v)}
                            multiline
                            numberOfLines={4}
                        />

                        <Text style={styles.label}>Contact Information:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            keyboardType="email-address"
                            value={form.email}
                            onChangeText={(v) => handleInputChange("email", v)}
                            // Note: Email changes might require re-verification based on Django settings
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
                        
                        <Text style={[styles.subHeader, { marginTop: 20 }]}>Required Documents (Guide Application)</Text>

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
        paddingBottom: 40,
        backgroundColor: "#fff",
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#0A2342",
        textAlign: "center",
        marginBottom: 5,
    },
    subHeader: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#007AFF",
        marginTop: 15,
        marginBottom: 5,
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
    bioInput: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: 10,
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
        backgroundColor: 'white',
        borderRadius: 12,
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