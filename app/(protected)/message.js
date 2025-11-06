import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    StatusBar,
    Image,
    TouchableOpacity,
    TextInput,
    Modal,
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Message() {
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setMessages([
                { id: 1, sender: "You", text: "Hi! Good morning!", timestamp: "10:20 AM", isSent: true },
                { id: 2, sender: "Francis", text: "Good morning! How can I assist you today?", timestamp: "10:25 AM", isSent: false },
                { id: 3, sender: "You", text: "Do you provide tours for families?", timestamp: "10:27 AM", isSent: true },
                { id: 4, sender: "Francis", text: "Yes! My packages are family-friendly and customizable.", timestamp: "10:30 AM", isSent: false },
            ]);
            setLoading(false);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    const handleSendMessage = () => {
        if (inputText.trim() === "") return;
        const newMessage = {
            id: messages.length + 1,
            sender: "You",
            text: inputText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isSent: true,
        };
        setMessages([...messages, newMessage]);
        setInputText("");
    };

    const handleReportConfirm = () => {
        const reason = selectedReason === "Other" ? customReason : selectedReason;
        if (!reason.trim()) {
            Alert.alert("⚠️ Incomplete", "Please select or enter a reason for reporting.");
            return;
        }
        setModalVisible(false);
        setTimeout(() => {
            Alert.alert("✅ Report Sent", "Your report has been successfully submitted.");
        }, 300);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.header}>
                <Image
                    source={require("../../assets/localynk_images/header.png")}
                    style={styles.headerImage}
                />
                <LinearGradient
                    colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.2)", "transparent"]}
                    style={styles.overlay}
                />
                <Text style={styles.headerTitle}>Message</Text>
            </View>

            <View style={styles.guideInfo}>
                <Text style={styles.guideName}>FRANCIS MIRAVILLA</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Ionicons name="flag-outline" size={22} color="#000" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
                {messages.map((message) => (
                    <View
                        key={message.id}
                        style={[
                            styles.messageBox,
                            message.isSent ? styles.sentMessage : styles.receivedMessage,
                        ]}
                    >
                        {!message.isSent && (
                            <Text style={styles.senderName}>{message.sender}</Text>
                        )}
                        <View
                            style={[
                                styles.messageBubble,
                                message.isSent ? styles.sentBubble : styles.receivedBubble,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.messageText,
                                    message.isSent ? styles.sentText : styles.receivedText,
                                ]}
                            >
                                {message.text}
                            </Text>
                        </View>
                        <Text style={styles.timestamp}>{message.timestamp}</Text>
                    </View>
                ))}
            </ScrollView>

            <Modal
                visible={isModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>REPORT THIS TOURIST?</Text>

                        <Text style={styles.reasonLabel}>Select Reason</Text>
                        {["Rude Behavior", "Inappropriate Message", "Spam", "Other"].map((reason) => (
                            <TouchableOpacity
                                key={reason}
                                style={[
                                    styles.reasonOption,
                                    selectedReason === reason && styles.selectedReason,
                                ]}
                                onPress={() => setSelectedReason(reason)}
                            >
                                <Text
                                    style={[
                                        styles.reasonText,
                                        selectedReason === reason && styles.selectedReasonText,
                                    ]}
                                >
                                    {reason}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {selectedReason === "Other" && (
                            <TextInput
                                style={styles.reasonInput}
                                placeholder="Enter your reason..."
                                placeholderTextColor="#777"
                                value={customReason}
                                onChangeText={setCustomReason}
                                multiline
                            />
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.yesButton]}
                                onPress={handleReportConfirm}
                            >
                                <Text style={styles.buttonText}>Submit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.noButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="camera-outline" size={22} color="#555" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="image-outline" size={22} color="#555" />
                </TouchableOpacity>
                <View style={styles.textInputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Aa"
                        placeholderTextColor="#777"
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                </View>
                <TouchableOpacity style={styles.iconButton}>
                    <Ionicons name="happy-outline" size={22} color="#555" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.iconButton, styles.sendButton]}
                    onPress={handleSendMessage}
                >
                    <Ionicons name="send-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
    },
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    header: {
        position: "relative",
        height: 120,
        justifyContent: "center",
    },
    headerImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTitle: {
        position: "absolute",
        bottom: 15,
        left: 20,
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 1,
    },
    guideInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderColor: "#ddd",
    },
    guideName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#00051A",
    },
    messagesContainer: {
        flex: 1,
        padding: 15,
    },
    messageBox: {
        marginBottom: 25,
    },
    sentMessage: {
        alignItems: "flex-end",
    },
    receivedMessage: {
        alignItems: "flex-start",
    },
    senderName: {
        fontSize: 12,
        fontWeight: "600",
        color: "#555",
        marginBottom: 4,
        marginLeft: 10,
    },
    messageBubble: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        maxWidth: "75%",
    },
    sentBubble: {
        backgroundColor: "#00051A",
    },
    receivedBubble: {
        backgroundColor: "#E9EEF3",
    },
    messageText: {
        fontSize: 15,
    },
    sentText: {
        color: "#fff",
    },
    receivedText: {
        color: "#000",
    },
    timestamp: {
        fontSize: 11,
        color: "#999",
        marginTop: 4,
        marginHorizontal: 10,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalContainer: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#00051A",
        textAlign: "center",
        marginBottom: 15,
    },
    reasonLabel: {
        fontWeight: "600",
        color: "#000",
        marginBottom: 8,
    },
    reasonOption: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginBottom: 8,
    },
    selectedReason: {
        borderColor: "#00051A",
        backgroundColor: "#E9EEF3",
    },
    reasonText: {
        color: "#333",
        fontSize: 14,
    },
    selectedReasonText: {
        color: "#00051A",
        fontWeight: "700",
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        height: 80,
        textAlignVertical: "top",
        marginBottom: 10,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 10,
    },
    modalButton: {
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 25,
        marginHorizontal: 10,
    },
    yesButton: {
        backgroundColor: "#00051A",
    },
    noButton: {
        backgroundColor: "#555",
    },
    buttonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#00051A",
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginBottom: 40,
    },
    iconButton: {
        paddingHorizontal: 6,
    },
    textInputWrapper: {
        flex: 1,
        marginHorizontal: 8,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: "#fff",
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: "#007AFF",
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
    },
});
