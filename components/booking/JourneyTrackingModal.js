import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

const buildDraftMap = (items) => {
    const next = {};
    (Array.isArray(items) ? items : []).forEach((item) => {
        next[item.id] = {
            guide_remarks: item.guide_remarks || '',
            tourist_remarks: item.tourist_remarks || '',
        };
    });
    return next;
};

const formatCheckpointTime = (isoLikeValue) => {
    if (!isoLikeValue) return 'Not yet checked';
    const parsed = new Date(isoLikeValue);
    if (Number.isNaN(parsed.getTime())) return 'Checked';
    return parsed.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

const JourneyTrackingModal = ({
    visible,
    bookingId,
    canEditChecklist,
    canEditGuideRemarks,
    canEditTouristRemarks,
    onClose,
    onJourneyUpdated,
}) => {
    const [checkpoints, setCheckpoints] = useState([]);
    const [draftById, setDraftById] = useState({});
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [savingById, setSavingById] = useState({});

    const loadJourney = useCallback(async () => {
        if (!bookingId) return;
        setLoading(true);
        setErrorMessage('');

        try {
            const response = await api.get(`/api/bookings/${bookingId}/journey/`);
            const rows = Array.isArray(response?.data) ? response.data : [];
            setCheckpoints(rows);
            setDraftById(buildDraftMap(rows));
        } catch (error) {
            console.error('Failed to load booking journey checkpoints:', error);
            setErrorMessage('Unable to load journey tracking right now. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    useEffect(() => {
        if (!visible) return;
        loadJourney();
    }, [visible, loadJourney]);

    const groupedByDay = useMemo(() => {
        return checkpoints.reduce((acc, item) => {
            const dayKey = Number.parseInt(item?.day_number, 10) || 1;
            if (!acc[dayKey]) acc[dayKey] = [];
            acc[dayKey].push(item);
            return acc;
        }, {});
    }, [checkpoints]);

    const setSaving = useCallback((checkpointId, isSaving) => {
        setSavingById((previous) => ({
            ...previous,
            [checkpointId]: isSaving,
        }));
    }, []);

    const patchCheckpoint = useCallback(async (checkpointId, payload, optimisticPatch = null) => {
        if (!bookingId) return false;

        const previousItem = checkpoints.find((item) => item.id === checkpointId);
        if (!previousItem) return false;

        setSaving(checkpointId, true);
        setErrorMessage('');

        if (optimisticPatch) {
            setCheckpoints((previous) => previous.map((item) => (
                item.id === checkpointId ? { ...item, ...optimisticPatch } : item
            )));
        }

        try {
            const response = await api.patch(`/api/bookings/${bookingId}/journey/${checkpointId}/`, payload);
            const nextItem = response?.data;
            if (nextItem && typeof nextItem === 'object') {
                setCheckpoints((previous) => previous.map((item) => (
                    item.id === checkpointId ? { ...item, ...nextItem } : item
                )));
                setDraftById((previous) => ({
                    ...previous,
                    [checkpointId]: {
                        guide_remarks: nextItem.guide_remarks || '',
                        tourist_remarks: nextItem.tourist_remarks || '',
                    },
                }));
            }

            if (typeof onJourneyUpdated === 'function') {
                onJourneyUpdated();
            }
            return true;
        } catch (error) {
            console.error('Failed to update journey checkpoint:', error);
            setErrorMessage('Failed to save checkpoint changes. Please retry.');
            setCheckpoints((previous) => previous.map((item) => (
                item.id === checkpointId ? previousItem : item
            )));
            return false;
        } finally {
            setSaving(checkpointId, false);
        }
    }, [bookingId, checkpoints, onJourneyUpdated, setSaving]);

    const handleToggleChecked = useCallback(async (checkpoint) => {
        if (!canEditChecklist || !checkpoint) return;
        const nextChecked = !Boolean(checkpoint.is_checked);
        await patchCheckpoint(
            checkpoint.id,
            { is_checked: nextChecked },
            { is_checked: nextChecked }
        );
    }, [canEditChecklist, patchCheckpoint]);

    const setDraftField = useCallback((checkpointId, field, value) => {
        setDraftById((previous) => ({
            ...previous,
            [checkpointId]: {
                ...(previous[checkpointId] || {}),
                [field]: value,
            },
        }));
    }, []);

    const renderRemarkEditor = (checkpoint, fieldName, label, canEdit) => {
        const isSaving = Boolean(savingById[checkpoint.id]);
        const valueFromDraft = draftById?.[checkpoint.id]?.[fieldName];
        const currentValue = valueFromDraft !== undefined ? valueFromDraft : (checkpoint?.[fieldName] || '');
        const originalValue = checkpoint?.[fieldName] || '';
        const hasChanged = currentValue !== originalValue;

        if (!canEdit && !originalValue) {
            return null;
        }

        return (
            <View style={styles.remarksBlock}>
                <Text style={styles.remarksLabel}>{label}</Text>
                <TextInput
                    multiline
                    numberOfLines={3}
                    style={[styles.remarksInput, !canEdit && styles.remarksInputReadOnly]}
                    editable={canEdit && !isSaving}
                    value={currentValue}
                    onChangeText={(text) => setDraftField(checkpoint.id, fieldName, text)}
                    placeholder={canEdit ? 'Write a remark for this stop' : 'No remark yet'}
                    placeholderTextColor="#94A3B8"
                    textAlignVertical="top"
                />
                {canEdit && (
                    <TouchableOpacity
                        disabled={!hasChanged || isSaving}
                        onPress={() => patchCheckpoint(checkpoint.id, { [fieldName]: currentValue })}
                        style={[
                            styles.saveRemarkButton,
                            (!hasChanged || isSaving) && styles.saveRemarkButtonDisabled,
                        ]}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.saveRemarkButtonText}>Save Remark</Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>Track Journey</Text>
                            <Text style={styles.headerSubtitle}>Checklist and remarks per itinerary stop</Text>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={20} color="#0F172A" />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator size="large" color="#1D4ED8" />
                            <Text style={styles.loadingText}>Loading journey checkpoints...</Text>
                        </View>
                    ) : (
                        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                            {!!errorMessage && (
                                <View style={styles.errorCard}>
                                    <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
                                    <Text style={styles.errorText}>{errorMessage}</Text>
                                </View>
                            )}

                            {checkpoints.length === 0 ? (
                                <View style={styles.emptyBox}>
                                    <Ionicons name="map-outline" size={28} color="#94A3B8" />
                                    <Text style={styles.emptyText}>No itinerary stops are available for this booking.</Text>
                                </View>
                            ) : (
                                Object.keys(groupedByDay)
                                    .sort((a, b) => Number(a) - Number(b))
                                    .map((dayKey) => (
                                        <View key={`journey-day-${dayKey}`} style={styles.dayBlock}>
                                            <Text style={styles.dayTitle}>Day {dayKey}</Text>

                                            {groupedByDay[dayKey].map((checkpoint) => {
                                                const isSaving = Boolean(savingById[checkpoint.id]);
                                                return (
                                                    <View key={`checkpoint-${checkpoint.id}`} style={styles.stopCard}>
                                                        <View style={styles.stopHeaderRow}>
                                                            <TouchableOpacity
                                                                style={styles.checkboxTapArea}
                                                                disabled={!canEditChecklist || isSaving}
                                                                onPress={() => handleToggleChecked(checkpoint)}
                                                            >
                                                                <Ionicons
                                                                    name={checkpoint.is_checked ? 'checkbox' : 'square-outline'}
                                                                    size={24}
                                                                    color={checkpoint.is_checked ? '#16A34A' : '#64748B'}
                                                                />
                                                            </TouchableOpacity>

                                                            <View style={{ flex: 1 }}>
                                                                <Text style={styles.stopName}>{checkpoint.stop_name || 'Activity Stop'}</Text>
                                                                <Text style={styles.stopMeta}>
                                                                    {checkpoint.start_time
                                                                        ? `${checkpoint.start_time}${checkpoint.end_time ? ` - ${checkpoint.end_time}` : ''}`
                                                                        : 'No time specified'}
                                                                </Text>
                                                                {!!checkpoint.stop_type && (
                                                                    <Text style={styles.stopMeta}>{String(checkpoint.stop_type)}</Text>
                                                                )}
                                                            </View>

                                                            {isSaving && <ActivityIndicator size="small" color="#1D4ED8" />}
                                                        </View>

                                                        <Text style={styles.checkStatusText}>
                                                            {checkpoint.is_checked
                                                                ? `Checked: ${formatCheckpointTime(checkpoint.checked_at)}`
                                                                : 'Not yet checked'}
                                                        </Text>

                                                        {renderRemarkEditor(
                                                            checkpoint,
                                                            'guide_remarks',
                                                            'Guide / Agency Remark',
                                                            canEditGuideRemarks
                                                        )}

                                                        {renderRemarkEditor(
                                                            checkpoint,
                                                            'tourist_remarks',
                                                            'Tourist Remark',
                                                            canEditTouristRemarks
                                                        )}
                                                    </View>
                                                );
                                            })}
                                        </View>
                                    ))
                            )}

                            <View style={{ height: 20 }} />
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
    },
    sheet: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        minHeight: '52%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
    },
    headerSubtitle: {
        marginTop: 2,
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E2E8F0',
    },
    loadingWrap: {
        flex: 1,
        minHeight: 220,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    loadingText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '600',
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
    },
    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: '#FCA5A5',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginBottom: 10,
    },
    errorText: {
        flex: 1,
        fontSize: 12,
        color: '#7F1D1D',
        fontWeight: '600',
    },
    emptyBox: {
        marginTop: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        paddingVertical: 28,
        paddingHorizontal: 16,
    },
    emptyText: {
        marginTop: 8,
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        textAlign: 'center',
    },
    dayBlock: {
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DDE5F0',
        backgroundColor: '#FFFFFF',
        padding: 12,
    },
    dayTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1D4ED8',
        marginBottom: 10,
    },
    stopCard: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        padding: 10,
        marginBottom: 10,
    },
    stopHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    checkboxTapArea: {
        marginTop: 1,
        paddingRight: 2,
    },
    stopName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },
    stopMeta: {
        marginTop: 2,
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
    },
    checkStatusText: {
        marginTop: 6,
        marginBottom: 8,
        fontSize: 12,
        fontWeight: '700',
        color: '#334155',
    },
    remarksBlock: {
        marginTop: 2,
        marginBottom: 8,
    },
    remarksLabel: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '700',
        marginBottom: 6,
    },
    remarksInput: {
        minHeight: 70,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 13,
        color: '#0F172A',
        fontWeight: '500',
    },
    remarksInputReadOnly: {
        backgroundColor: '#F1F5F9',
        color: '#475569',
    },
    saveRemarkButton: {
        alignSelf: 'flex-start',
        marginTop: 8,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: '#1D4ED8',
    },
    saveRemarkButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    saveRemarkButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
});

export default JourneyTrackingModal;
