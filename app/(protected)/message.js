import { View, Text, ActivityIndicator, ScrollView, StyleSheet, StatusBar, Image, TouchableOpacity, TextInput } from "react-native";
import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function Message() {
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setMessages([
                { id: 1, sender: "You", text: "Good Morning Sir!", timestamp: "10:30 AM", isSent: true },
                { id: 3, sender: "Francis", text: "Good Morning sir, how may I help you? ", timestamp: "10:40 AM", isSent: false },
                { id: 3, sender: "You", text: "Is your accommodation good for a family of 5? ", timestamp: "10:40 AM", isSent: true },
                { id: 4, sender: "Francis", text: "yes sir my place can accommodate up to 7 people", timestamp: "10:40 AM", isSent: false },
            ]);
            setLoading(false);
        }, 1500);
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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
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

            <ScrollView
                style={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
            >
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
                                message.isSent
                                    ? styles.sentBubble
                                    : styles.receivedBubble,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.messageText,
                                    message.isSent
                                        ? styles.sentText
                                        : styles.receivedText,
                                ]}
                            >
                                {message.text}
                            </Text>
                        </View>
                        <Text style={styles.timestamp}>{message.timestamp}</Text>
                    </View>
                ))}
            </ScrollView>

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
        </View>
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
        backgroundColor: "#f5f5f5",
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
        backgroundColor: "#fff",
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
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#00051A",
        paddingVertical: 10,
        paddingHorizontal: 10,
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
