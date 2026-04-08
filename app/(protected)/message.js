import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, Keyboard } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../api/api';
import { useAuth } from "../../context/AuthContext";
import Toast from '../../components/Toast';

export default function Message() {
    const isIOS = Platform.OS === 'ios';
    const isAndroid = Platform.OS === 'android';
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);
    const [isModalVisible, setModalVisible] = useState(false);
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
    const { user } = useAuth();
    const scrollViewRef = useRef();
    const router = useRouter();

    const { partnerId, partnerName, partnerImage } = useLocalSearchParams();
    const normalizedPartnerId = useMemo(() => {
        const parsed = Number(partnerId);
        return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : null;
    }, [partnerId]);

    const normalizeDisplayName = (rawValue, fallback = 'User') => {
        const raw = String(rawValue || '').trim();
        if (!raw) return fallback;

        if (!raw.includes('@')) {
            return raw;
        }

        const local = raw.split('@', 1)[0].replace(/[._-]+/g, ' ').trim();
        if (!local) return fallback;

        return local
            .split(' ')
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
    };

    const displayPartnerName = useMemo(() => normalizeDisplayName(partnerName, 'Conversation'), [partnerName]);

    

    const getImageUrl = (imgPath) => {
        if (!imgPath) return null;
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000';
        return `${base}${imgPath}`;
    };

    // Move fetchMessages to component scope so it can be used elsewhere
    const fetchMessages = React.useCallback(async () => {
        if (!normalizedPartnerId) {
            setLoading(false);
            return;
        }
        try {
            const response = await api.get(`/api/conversations/${normalizedPartnerId}/messages/`);
            setMessages(response.data);
        } catch (error) {
            console.error('Failed to fetch messages:', error);

            const detail =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                error?.message ||
                'Failed to load conversation.';

            setToast({ visible: true, message: String(detail), type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [normalizedPartnerId]);

    useEffect(() => {
        fetchMessages();

        const interval = setInterval(() => {
            fetchMessages();
        }, 5000);

        return () => clearInterval(interval);
    }, [normalizedPartnerId, fetchMessages]);

    useEffect(() => {
        if (!isAndroid) {
            return undefined;
        }

        const onKeyboardDidShow = Keyboard.addListener('keyboardDidShow', (event) => {
            const nextHeight = event?.endCoordinates?.height ?? 0;
            setAndroidKeyboardHeight(nextHeight > 0 ? nextHeight : 0);
        });

        const onKeyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
            setAndroidKeyboardHeight(0);
        });

        return () => {
            onKeyboardDidShow.remove();
            onKeyboardDidHide.remove();
        };
    }, [isAndroid]);

    const handleSendMessage = async () => {
        if (inputText.trim() === "" || !normalizedPartnerId) return;

        if (Number(normalizedPartnerId) === Number(user?.id)) {
            setToast({ visible: true, message: "You cannot message the same account you're logged into.", type: 'error' });
            return;
        }
        
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phoneRegex = /(\+?\d[- .]*){10,11}/g;

        let processedText = inputText.replace(emailRegex, '[REDACTED]').replace(phoneRegex, '[REDACTED]');

        if (processedText !== inputText) {
            setToast({ visible: true, message: "Contact info is not allowed. Message redacted.", type: 'error' });
        }

        const optimisticMessage = {
            id: `temp-${Date.now()}`,
            content: processedText,
            sender: user.id,
            receiver: normalizedPartnerId,
            timestamp: new Date().toISOString(),
            local_status: 'sending',
        };

        setMessages(prevMessages => [...prevMessages, optimisticMessage]);
        setInputText("");

        try {
            await api.post(`/api/conversations/${normalizedPartnerId}/messages/`, {
                content: optimisticMessage.content,
            });
            fetchMessages();
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prevMessages => prevMessages.map((m) => (
                m.id === optimisticMessage.id
                    ? { ...m, local_status: 'failed' }
                    : m
            )));

            const detail =
                error?.response?.data?.detail ||
                error?.response?.data?.receiver?.[0] ||
                error?.response?.data?.content?.[0] ||
                error?.message ||
                "Failed to send message.";

            setToast({ visible: true, message: String(detail), type: 'error' });
        }
    };

    const retryFailedMessage = async (tempMessage) => {
        if (!normalizedPartnerId) return;

        setMessages((prev) => prev.map((m) => (
            m.id === tempMessage.id ? { ...m, local_status: 'sending' } : m
        )));

        try {
            await api.post(`/api/conversations/${normalizedPartnerId}/messages/`, {
                content: tempMessage.content,
            });
            setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
            fetchMessages();
        } catch (_error) {
            setMessages((prev) => prev.map((m) => (
                m.id === tempMessage.id ? { ...m, local_status: 'failed' } : m
            )));
            setToast({ visible: true, message: 'Retry failed. Please try again.', type: 'error' });
        }
    };

    const handleReportConfirm = async () => {
        const reason = selectedReason === "Other" ? customReason : selectedReason;
        if (!reason.trim()) {
            setToast({ visible: true, message: "Please select or enter a reason.", type: 'error' });
            return;
        }

        try {
            await api.post('/api/submit/', {
                reported_user: normalizedPartnerId,
                reason: reason,
            });
            setModalVisible(false);
            setTimeout(() => {
                setToast({ visible: true, message: "Report successfully submitted.", type: 'success' });
            }, 300);
        } catch (error) {
            console.error('Failed to submit report:', error);
            setToast({ visible: true, message: "Failed to submit report. Try again.", type: 'error' });
        }
    };

    if (!normalizedPartnerId) {
        return (
            <SafeAreaView style={styles.container} edges={['bottom']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Message</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text>No conversation selected.</Text>
                    <TouchableOpacity onPress={() => router.replace('/(protected)/conversations')}>
                        <Text style={{color: 'blue', marginTop: 10}}>Go to conversations</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['bottom']}>
                <View style={{ height: 120, backgroundColor: '#E0E6ED', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
                     <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E0E6ED', marginRight: 10 }} />
                     <View style={{ width: 120, height: 16, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                </View>
                <View style={{ flex: 1, padding: 15 }}>
                     <View style={{ alignSelf: 'flex-start', width: '60%', height: 50, backgroundColor: '#E0E6ED', borderRadius: 16, marginBottom: 25 }} />
                     <View style={{ alignSelf: 'flex-end', width: '50%', height: 40, backgroundColor: '#E0E6ED', borderRadius: 16, marginBottom: 25 }} />
                     <View style={{ alignSelf: 'flex-start', width: '70%', height: 60, backgroundColor: '#E0E6ED', borderRadius: 16, marginBottom: 25 }} />
                </View>
                <View style={{ height: 60, backgroundColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 }}>
                     <View style={{ flex: 1, height: 40, backgroundColor: '#fff', borderRadius: 20 }} />
                     <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0E6ED', marginLeft: 10 }} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
            {isIOS ? (
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior="padding"
                    keyboardVerticalOffset={8}
                >
                    <View style={{ flex: 1 }}>
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
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                {partnerImage ? (
                                    <Image 
                                        source={{ uri: getImageUrl(partnerImage) }} 
                                        style={styles.headerAvatar}
                                    />
                                ) : (
                                    <View style={styles.headerAvatarPlaceholder}>
                                        <Ionicons name="person-circle" size={32} color="#94A3B8" />
                                    </View>
                                )}
                                <Text style={styles.guideName}>{displayPartnerName}</Text>
                            </View>

                            {Number(user?.id) !== Number(normalizedPartnerId) && (
                                <TouchableOpacity onPress={() => setModalVisible(true)}>
                                    <Ionicons name="flag-outline" size={22} color="#000" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView 
                            style={styles.messagesContainer} 
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                            onScrollBeginDrag={Keyboard.dismiss}
                            ref={scrollViewRef}
                            onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
                        >
                            {messages.length === 0 && (
                                <View style={styles.emptyThreadContainer}>
                                    <Text style={styles.emptyThreadTitle}>No messages yet</Text>
                                    <Text style={styles.emptyThreadText}>Send a message to start this conversation.</Text>
                                </View>
                            )}

                            {messages.map((message) => {
                                const isSent = Number(message.sender) === Number(user?.id);
                                const localStatus = message.local_status;
                                const serverRead = Boolean(message.is_read);
                                const statusLabel = localStatus === 'failed'
                                    ? 'Failed to send'
                                    : localStatus === 'sending'
                                        ? 'Sending...'
                                        : serverRead
                                            ? 'Read'
                                            : 'Delivered';

                                return (
                                    <View
                                        key={message.id}
                                        style={[
                                            styles.messageBox,
                                            isSent ? styles.sentMessage : styles.receivedMessage,
                                        ]}
                                    >
                                        {!isSent && (
                                            <Text style={styles.senderName}>{normalizeDisplayName(message.sender_display_name || partnerName)}</Text>
                                        )}
                                        <View
                                            style={[
                                                styles.messageBubble,
                                                isSent ? styles.sentBubble : styles.receivedBubble,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.messageText,
                                                    isSent ? styles.sentText : styles.receivedText,
                                                ]}
                                            >
                                                {message.content}
                                            </Text>
                                        </View>
                                        <Text style={styles.timestamp}>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                                        {isSent && (
                                            <View style={styles.statusRow}>
                                                <Text style={[styles.statusText, localStatus === 'failed' && styles.statusFailed]}>{statusLabel}</Text>
                                                {localStatus === 'failed' && (
                                                    <TouchableOpacity style={styles.retryBtn} onPress={() => retryFailedMessage(message)}>
                                                        <Text style={styles.retryBtnText}>Retry</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <Modal
                            visible={isModalVisible}
                            transparent
                            animationType="slide"
                            onRequestClose={() => setModalVisible(false)}
                        >
                            <View style={styles.modalOverlay}>
                                <View style={styles.modalContainer}>
                                    <Text style={styles.modalTitle}>REPORT THIS USER?</Text>

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

                                    <SafeAreaView edges={['bottom']} style={styles.modalButtons}>
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
                                    </SafeAreaView>
                                </View>
                            </View>
                        </Modal>

                        <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
                            <View style={styles.inputContainer}>
                                <View style={styles.textInputWrapper}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Aa"
                                        placeholderTextColor="#777"
                                        value={inputText}
                                        onChangeText={setInputText}
                                        multiline
                                        blurOnSubmit={false}
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[styles.iconButton, styles.sendButton]}
                                    onPress={handleSendMessage}
                                >
                                    <Ionicons name="send" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </SafeAreaView>
                    </View>
                </KeyboardAvoidingView>
            ) : (
                <View style={{ flex: 1 }}>
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
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        {partnerImage ? (
                            <Image 
                                source={{ uri: getImageUrl(partnerImage) }} 
                                style={styles.headerAvatar}
                            />
                        ) : (
                            <View style={styles.headerAvatarPlaceholder}>
                                <Ionicons name="person-circle" size={32} color="#94A3B8" />
                            </View>
                        )}
                        <Text style={styles.guideName}>{displayPartnerName}</Text>
                    </View>

                    {Number(user?.id) !== Number(normalizedPartnerId) && (
                        <TouchableOpacity onPress={() => setModalVisible(true)}>
                            <Ionicons name="flag-outline" size={22} color="#000" />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView 
                    style={styles.messagesContainer} 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    onScrollBeginDrag={Keyboard.dismiss}
                    ref={scrollViewRef}
                    onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
                >
                    {messages.length === 0 && (
                        <View style={styles.emptyThreadContainer}>
                            <Text style={styles.emptyThreadTitle}>No messages yet</Text>
                            <Text style={styles.emptyThreadText}>Send a message to start this conversation.</Text>
                        </View>
                    )}

                    {messages.map((message) => {
                        const isSent = Number(message.sender) === Number(user?.id);
                        const localStatus = message.local_status;
                        const serverRead = Boolean(message.is_read);
                        const statusLabel = localStatus === 'failed'
                            ? 'Failed to send'
                            : localStatus === 'sending'
                                ? 'Sending...'
                                : serverRead
                                    ? 'Read'
                                    : 'Delivered';

                        return (
                            <View
                                key={message.id}
                                style={[
                                    styles.messageBox,
                                    isSent ? styles.sentMessage : styles.receivedMessage,
                                ]}
                            >
                                {!isSent && (
                                    <Text style={styles.senderName}>{normalizeDisplayName(message.sender_display_name || partnerName)}</Text>
                                )}
                                <View
                                    style={[
                                        styles.messageBubble,
                                        isSent ? styles.sentBubble : styles.receivedBubble,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.messageText,
                                            isSent ? styles.sentText : styles.receivedText,
                                        ]}
                                    >
                                        {message.content}
                                    </Text>
                                </View>
                                <Text style={styles.timestamp}>{new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                                {isSent && (
                                    <View style={styles.statusRow}>
                                        <Text style={[styles.statusText, localStatus === 'failed' && styles.statusFailed]}>{statusLabel}</Text>
                                        {localStatus === 'failed' && (
                                            <TouchableOpacity style={styles.retryBtn} onPress={() => retryFailedMessage(message)}>
                                                <Text style={styles.retryBtnText}>Retry</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>

                <Modal
                    visible={isModalVisible}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <Text style={styles.modalTitle}>REPORT THIS USER?</Text>

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

                            <SafeAreaView edges={['bottom']} style={styles.modalButtons}>
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
                            </SafeAreaView>
                        </View>
                    </View>
                </Modal>

                <SafeAreaView edges={['bottom']} style={[styles.inputSafeArea, androidKeyboardHeight > 0 ? { marginBottom: androidKeyboardHeight } : null]}>
                    <View style={styles.inputContainer}>
                        <View style={styles.textInputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Aa"
                                placeholderTextColor="#777"
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                blurOnSubmit={false}
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.iconButton, styles.sendButton]}
                            onPress={handleSendMessage}
                        >
                            <Ionicons name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
    container: { flex: 1, backgroundColor: "#fff" },
    header: { position: "relative", height: 120, justifyContent: "center" },
    headerImage: { width: "100%", height: "100%", resizeMode: "cover", borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: "absolute", bottom: 15, left: 20, color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 1 },
    guideInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderColor: "#ddd" },
    guideName: { fontSize: 14, fontWeight: "700", color: "#00051A" },
    headerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: '#eee' },
    headerAvatarPlaceholder: { width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: '#00A8FF', alignItems: 'center', justifyContent: 'center' },
    headerAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    messagesContainer: { flex: 1, padding: 15 },
    messageBox: { marginBottom: 25 },
    sentMessage: { alignItems: "flex-end" },
    receivedMessage: { alignItems: "flex-start" },
    senderName: { fontSize: 12, fontWeight: "600", color: "#555", marginBottom: 4, marginLeft: 10 },
    messageBubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, maxWidth: "75%" },
    sentBubble: { backgroundColor: "#00051A" },
    receivedBubble: { backgroundColor: "#E9EEF3" },
    messageText: { fontSize: 15 },
    sentText: { color: "#fff" },
    receivedText: { color: "#000" },
    timestamp: { fontSize: 11, color: "#999", marginTop: 4, marginHorizontal: 10 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginHorizontal: 10, gap: 8 },
    statusText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
    statusFailed: { color: '#DC2626' },
    retryBtn: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#FEE2E2', borderRadius: 999 },
    retryBtnText: { fontSize: 10, fontWeight: '700', color: '#B91C1C' },
    emptyThreadContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, paddingHorizontal: 20 },
    emptyThreadTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
    emptyThreadText: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
    modalContainer: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
    modalTitle: { fontSize: 16, fontWeight: "700", color: "#00051A", textAlign: "center", marginBottom: 15 },
    reasonLabel: { fontWeight: "600", color: "#000", marginBottom: 8 },
    reasonOption: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 8 },
    selectedReason: { borderColor: "#00051A", backgroundColor: "#E9EEF3" },
    reasonText: { color: "#333", fontSize: 14 },
    selectedReasonText: { color: "#00051A", fontWeight: "700" },
    reasonInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, height: 80, textAlignVertical: "top", marginBottom: 10 },
    modalButtons: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
    modalButton: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 25, marginHorizontal: 10 },
    yesButton: { backgroundColor: "#00051A" },
    noButton: { backgroundColor: "#555" },
    buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
    inputSafeArea: { backgroundColor: "#F0F0F0" },
    inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0F0F0", paddingVertical: 7, paddingHorizontal: 7 },
    iconButton: { paddingHorizontal: 6 },
    textInputWrapper: { flex: 1, marginHorizontal: 8, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
    input: { fontSize: 15, maxHeight: 100 },
    sendButton: { backgroundColor: "#007AFF", borderRadius: 20, width: 36, height: 36, justifyContent: "center", alignItems: "center" },
});
