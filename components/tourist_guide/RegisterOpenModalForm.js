import React, { useState } from "react";
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView, Image, StyleSheet, } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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

    const [images, setImages] = useState({
        birthCertificate: null,
        tourGuideCert: null,
        validId: null,
    });

    const pickImage = async (field) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
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

    const handleSubmit = () => {
        if (onSubmit) {
            onSubmit();
        }
    };

    return (
        <Modal visible={isModalOpen} animationType="slide">
            <ScrollView contentContainerStyle={styles.container}>
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

                {[
                    { label: "Tour Guide Certificate", key: "tourGuideCert" },
                    { label: "Proof of Recidency", key: "proofOfRecidency" },
                    { label: "Valid ID", key: "validId" },
                    { label: "NBI Clearance", key: "nbiClearance" },
                ].map(({ label, key }) => (
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

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <LinearGradient
                        colors={["#00B2FF", "#006AFF"]}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.submitText}>Submit</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setIsOpenModal(false)}
                    style={{ marginTop: 20 }}
                >
                    <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
            </ScrollView>
        </Modal>
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
