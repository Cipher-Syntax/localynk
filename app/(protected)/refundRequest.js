import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Platform, StatusBar, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import api from '../../api/api';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import { styles } from './styles/refundRequest.styles';

const BLOCKING_STATUSES = ['requested', 'under_review', 'approved', 'completed'];
const REFUND_MIN_DAYS_BEFORE_CHECKIN_DEFAULT = 3;

const STATUS_COLORS = {
    requested: { bg: '#FEF3C7', text: '#92400E' },
    under_review: { bg: '#DBEAFE', text: '#1E40AF' },
    approved: { bg: '#DCFCE7', text: '#166534' },
    rejected: { bg: '#FEE2E2', text: '#991B1B' },
    completed: { bg: '#CCFBF1', text: '#0F766E' },
};

export default function RefundRequestScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const bookingId = params?.bookingId ? String(params.bookingId) : '';
    const bookingTitle = params?.bookingTitle ? String(params.bookingTitle) : 'Selected Booking';
    const parsedRefundId = Number(params?.refundId);
    const notificationRefundId = Number.isFinite(parsedRefundId) && parsedRefundId > 0
        ? Math.floor(parsedRefundId)
        : null;
    const downPayment = Number(params?.downPayment || 0);
    const checkInDate = params?.checkInDate ? String(params.checkInDate) : '';
    const parsedRefundMinDays = Number(params?.refundMinDays);
    const refundMinDays = Number.isFinite(parsedRefundMinDays) && parsedRefundMinDays >= 0
        ? Math.floor(parsedRefundMinDays)
        : REFUND_MIN_DAYS_BEFORE_CHECKIN_DEFAULT;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [history, setHistory] = useState([]);
    const [reason, setReason] = useState('');
    const [proofUri, setProofUri] = useState('');
    const [proofName, setProofName] = useState('');
    const [toast, setToast] = useState({ message: '', type: 'success' });

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: 'success' }), 2600);
    }, []);

    const loadRefundHistory = useCallback(async () => {
        if (!bookingId && !notificationRefundId) {
            setLoading(false);
            return;
        }

        try {
            let incoming = [];

            if (bookingId) {
                const response = await api.get('/api/payments/refunds/my/', {
                    params: { booking_id: bookingId },
                });
                incoming = Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.results)
                        ? response.data.results
                        : [];
            }

            if (notificationRefundId) {
                try {
                    const detailRes = await api.get(`/api/payments/refunds/${notificationRefundId}/`);
                    const detail = detailRes.data;
                    if (detail?.id) {
                        incoming = [detail, ...incoming.filter((item) => Number(item?.id) !== Number(detail.id))];
                    }
                } catch (detailError) {
                    console.error('Failed to load specific refund detail:', detailError);
                }
            }

            const sortedIncoming = [...incoming].sort(
                (a, b) => new Date(b?.request_date || 0).getTime() - new Date(a?.request_date || 0).getTime()
            );
            setHistory(sortedIncoming);
        } catch (error) {
            console.error('Failed to load refund requests:', error);
            showToast('Failed to load refund history.', 'error');
        } finally {
            setLoading(false);
        }
    }, [bookingId, notificationRefundId, showToast]);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            loadRefundHistory();
        }, [loadRefundHistory])
    );

    const latestRequest = history.length > 0 ? history[0] : null;
    const selectedRequest = useMemo(() => {
        if (!history.length) return null;
        if (notificationRefundId) {
            const match = history.find((item) => Number(item?.id) === Number(notificationRefundId));
            if (match) return match;
        }
        return history[0];
    }, [history, notificationRefundId]);

    const hasBlockingRequest = useMemo(() => {
        if (!latestRequest?.status) return false;
        return BLOCKING_STATUSES.includes(String(latestRequest.status).toLowerCase());
    }, [latestRequest]);

    const daysUntilCheckIn = useMemo(() => {
        if (!checkInDate) return null;
        const checkIn = new Date(checkInDate);
        if (Number.isNaN(checkIn.getTime())) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        checkIn.setHours(0, 0, 0, 0);
        return Math.round((checkIn - today) / (1000 * 60 * 60 * 24));
    }, [checkInDate]);

    const isRefundWindowClosed = useMemo(() => {
        if (daysUntilCheckIn === null) return false;
        return daysUntilCheckIn < refundMinDays;
    }, [daysUntilCheckIn, refundMinDays]);

    const isImageAttachment = useCallback((url) => {
        if (!url) return false;
        return /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(String(url));
    }, []);

    const openAttachment = useCallback(async (url) => {
        if (!url) return;
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error('Failed to open attachment URL:', error);
            showToast('Unable to open attachment.', 'error');
        }
    }, [showToast]);

    const pickProofImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
            showToast('Media library permission is required to upload proof.', 'error');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.9,
        });

        if (result.canceled) return;

        const selected = result.assets?.[0];
        if (!selected?.uri) return;

        const fallbackName = `refund-proof-${Date.now()}.jpg`;
        const fileName = selected.fileName || selected.uri.split('/').pop() || fallbackName;

        setProofUri(selected.uri);
        setProofName(fileName);
    };

    const submitRefundRequest = async () => {
        if (!bookingId) {
            showToast('Missing booking information.', 'error');
            return;
        }

        if (hasBlockingRequest) {
            showToast('A refund request is already in progress for this booking.', 'error');
            return;
        }

        if (isRefundWindowClosed) {
            showToast(`Refund requests must be made at least ${refundMinDays} days before check-in.`, 'error');
            return;
        }

        if (reason.trim().length < 10) {
            showToast('Please provide a clear reason (at least 10 characters).', 'error');
            return;
        }

        if (!proofUri) {
            showToast('Please upload proof before submitting.', 'error');
            return;
        }

        const uriParts = proofUri.split('.');
        const ext = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';

        const formData = new FormData();
        formData.append('booking_id', String(bookingId));
        formData.append('reason', reason.trim());
        formData.append('requested_amount', String(downPayment || 0));
        formData.append('proof_attachment', {
            uri: Platform.OS === 'ios' ? proofUri.replace('file://', '') : proofUri,
            name: proofName || `refund-proof-${Date.now()}.${ext}`,
            type: mime,
        });

        setSubmitting(true);
        try {
            await api.post('/api/payments/refunds/request/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            showToast('Refund request submitted successfully.', 'success');
            setReason('');
            setProofUri('');
            setProofName('');
            loadRefundHistory();
        } catch (error) {
            const detail = error?.response?.data;
            console.error('Refund request failed:', detail || error);
            showToast('Unable to submit refund request. Please review your details.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStatusChip = (status) => {
        const normalized = String(status || '').toLowerCase();
        const colors = STATUS_COLORS[normalized] || { bg: '#E2E8F0', text: '#334155' };
        return (
            <View style={[styles.statusChip, { backgroundColor: colors.bg }]}> 
                <Text style={[styles.statusChipText, { color: colors.text }]}>{normalized.replace('_', ' ')}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView edges={['top']} style={styles.loadingScreen}>
                <ActivityIndicator size="large" color="#0EA5E9" />
                <Text style={styles.loadingText}>Loading refund details...</Text>
            </SafeAreaView>
        );
    }

    return (
        <ScreenSafeArea edges={['top']} style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={20} color="#0F172A" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Request Downpayment Refund</Text>
                    <Text style={styles.headerSubtitle}>Booking #{bookingId || 'N/A'}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Booking</Text>
                    <Text style={styles.infoValue}>{bookingTitle}</Text>
                    <Text style={styles.infoLabel}>Downpayment Paid</Text>
                    <Text style={styles.infoValueAmount}>₱ {downPayment.toLocaleString()}</Text>
                </View>

                <View style={[styles.policyCard, isRefundWindowClosed && styles.policyCardWarning]}>
                    <View style={styles.policyHeaderRow}>
                        <Ionicons name="shield-checkmark-outline" size={16} color={isRefundWindowClosed ? '#B45309' : '#0F766E'} />
                        <Text style={[styles.policyTitle, isRefundWindowClosed && styles.policyTitleWarning]}>Refund Policy</Text>
                    </View>
                    <Text style={[styles.policyText, isRefundWindowClosed && styles.policyTextWarning]}>
                        Refund requests are accepted only when submitted at least {refundMinDays} day{refundMinDays === 1 ? '' : 's'} before check-in.
                    </Text>
                    {daysUntilCheckIn !== null && (
                        <Text style={[styles.policyMetaText, isRefundWindowClosed && styles.policyMetaTextWarning]}>
                            Days before check-in: {daysUntilCheckIn}
                        </Text>
                    )}
                </View>

                {selectedRequest && (
                    <View style={styles.latestCard}>
                        <View style={styles.latestTopRow}>
                            <Text style={styles.latestTitle}>Selected Request #{selectedRequest.id}</Text>
                            {renderStatusChip(selectedRequest.status)}
                        </View>
                        <Text style={styles.latestMeta}>Requested Amount: ₱ {Number(selectedRequest.requested_amount || 0).toLocaleString()}</Text>
                        {!!selectedRequest.approved_amount && (
                            <Text style={styles.latestMeta}>Approved Amount: ₱ {Number(selectedRequest.approved_amount || 0).toLocaleString()}</Text>
                        )}
                        <Text style={styles.latestMeta}>Reason: {selectedRequest.reason || 'N/A'}</Text>
                        <Text style={styles.latestMeta}>Request Date: {selectedRequest.request_date ? new Date(selectedRequest.request_date).toLocaleString() : 'N/A'}</Text>
                        <Text style={styles.latestNotes}>
                            Admin Notes: {selectedRequest.admin_notes ? selectedRequest.admin_notes : 'No admin notes yet.'}
                        </Text>

                        {!!selectedRequest.proof_attachment_url && (
                            <View style={styles.attachmentWrap}>
                                <Text style={styles.attachmentTitle}>Uploaded Proof</Text>
                                {isImageAttachment(selectedRequest.proof_attachment_url) ? (
                                    <Image
                                        source={{ uri: selectedRequest.proof_attachment_url }}
                                        style={styles.attachmentPreview}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <View style={styles.attachmentPlaceholder}>
                                        <Ionicons name="document-text-outline" size={18} color="#334155" />
                                        <Text style={styles.attachmentPlaceholderText}>Attachment file</Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.attachmentButton}
                                    onPress={() => openAttachment(selectedRequest.proof_attachment_url)}
                                >
                                    <Ionicons name="open-outline" size={14} color="#0F766E" style={{ marginRight: 6 }} />
                                    <Text style={styles.attachmentButtonText}>Open Attachment</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Refund Form</Text>
                    <Text style={styles.sectionHint}>
                        Provide a clear reason and proof attachment. Admin will review this request against refund policy.
                    </Text>

                    <Text style={styles.fieldLabel}>Reason for Refund</Text>
                    <TextInput
                        style={styles.reasonInput}
                        value={reason}
                        onChangeText={setReason}
                        multiline
                        numberOfLines={4}
                        placeholder="Explain why you are requesting a refund..."
                        placeholderTextColor="#94A3B8"
                        editable={!hasBlockingRequest && !submitting}
                    />

                    <Text style={styles.fieldLabel}>Proof Attachment (JPG/PNG)</Text>
                    <TouchableOpacity
                        style={[styles.uploadButton, (hasBlockingRequest || isRefundWindowClosed) && styles.disabledButton]}
                        onPress={pickProofImage}
                        disabled={hasBlockingRequest || isRefundWindowClosed || submitting}
                    >
                        <Ionicons name="cloud-upload-outline" size={16} color="#0F766E" style={{ marginRight: 6 }} />
                        <Text style={styles.uploadButtonText}>{proofUri ? 'Change Proof Image' : 'Upload Proof Image'}</Text>
                    </TouchableOpacity>

                    {!!proofUri && (
                        <View style={styles.proofPreviewWrap}>
                            <Image source={{ uri: proofUri }} style={styles.proofPreview} contentFit="cover" />
                            <Text style={styles.proofName} numberOfLines={1}>{proofName || 'Proof attachment selected'}</Text>
                        </View>
                    )}

                    {hasBlockingRequest && (
                        <View style={styles.warningBox}>
                            <Ionicons name="information-circle" size={16} color="#92400E" />
                            <Text style={styles.warningText}>
                                A refund request is already active for this booking. Wait for completion or final decision.
                            </Text>
                        </View>
                    )}

                    {isRefundWindowClosed && (
                        <View style={styles.warningBox}>
                            <Ionicons name="time-outline" size={16} color="#92400E" />
                            <Text style={styles.warningText}>
                                This booking is inside the cutoff window. Refund requests must be submitted at least {refundMinDays} days before check-in.
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={[styles.submitButton, (hasBlockingRequest || isRefundWindowClosed || submitting) && styles.disabledButton]}
                        onPress={submitRefundRequest}
                        disabled={hasBlockingRequest || isRefundWindowClosed || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.submitButtonText}>Submit Refund Request</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Refund History</Text>
                    {history.length === 0 ? (
                        <Text style={styles.emptyHistoryText}>No refund requests found for this booking.</Text>
                    ) : (
                        history.map((item) => (
                            <View key={item.id} style={styles.historyCard}>
                                <View style={styles.historyTopRow}>
                                    <Text style={styles.historyId}>Request #{item.id}</Text>
                                    {renderStatusChip(item.status)}
                                </View>
                                <Text style={styles.historyText}>Requested: ₱ {Number(item.requested_amount || 0).toLocaleString()}</Text>
                                {!!item.approved_amount && (
                                    <Text style={styles.historyText}>Approved: ₱ {Number(item.approved_amount || 0).toLocaleString()}</Text>
                                )}
                                <Text style={styles.historyText}>Reason: {item.reason}</Text>
                                <Text style={styles.historyNotes}>Admin Notes: {item.admin_notes ? item.admin_notes : 'No admin notes yet.'}</Text>

                                {!!item.proof_attachment_url && (
                                    <TouchableOpacity
                                        style={styles.historyAttachmentButton}
                                        onPress={() => openAttachment(item.proof_attachment_url)}
                                    >
                                        <Ionicons name="attach-outline" size={14} color="#0F766E" style={{ marginRight: 6 }} />
                                        <Text style={styles.historyAttachmentText}>Open uploaded proof</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {!!toast.message && (
                <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
                    <Ionicons
                        name={toast.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                        size={18}
                        color="#fff"
                    />
                    <Text style={styles.toastText}>{toast.message}</Text>
                </View>
            )}
        </ScreenSafeArea>
    );
}

