import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles/StopDetailsModal.styles';

const imageKeys = ['image', 'photo', 'stop_image', 'activityImage', 'activity_image', 'thumbnail', 'media_url'];

const parseTimeline = (timelineInput) => {
    if (!timelineInput) return [];

    let parsed = timelineInput;
    if (typeof timelineInput === 'string') {
        try {
            parsed = JSON.parse(timelineInput);
        } catch {
            return [];
        }
    }

    return Array.isArray(parsed) ? parsed : [];
};

const normalizeKey = (value) => String(value || '').trim().toLowerCase();

const getEntityImage = (entity) => {
    if (!entity || typeof entity !== 'object') return null;
    for (const key of imageKeys) {
        const value = entity[key];
        if (value) return value;
    }
    return null;
};

const StopDetailsModal = ({
    visible,
    onClose,
    timeline,
    title = 'Itinerary Schedule',
    emptyText = 'No itinerary stops available.',
    stopCatalog = [],
    accommodationCatalog = [],
    getImageUrl,
}) => {
    const timelineItems = useMemo(() => parseTimeline(timeline), [timeline]);

    const lookup = useMemo(() => {
        const stopById = new Map();
        const stopByName = new Map();
        const accommodationById = new Map();
        const accommodationByName = new Map();

        if (Array.isArray(stopCatalog)) {
            stopCatalog.forEach((stop) => {
                const stopId = Number(stop?.id);
                if (Number.isFinite(stopId) && stopId > 0) {
                    stopById.set(stopId, stop);
                }

                const stopName = normalizeKey(stop?.name || stop?.title || stop?.location || stop?.activityName);
                if (stopName) {
                    stopByName.set(stopName, stop);
                }
            });
        }

        if (Array.isArray(accommodationCatalog)) {
            accommodationCatalog.forEach((accommodation) => {
                const accommodationId = Number(accommodation?.id);
                if (Number.isFinite(accommodationId) && accommodationId > 0) {
                    accommodationById.set(accommodationId, accommodation);
                }

                const accommodationName = normalizeKey(
                    accommodation?.title || accommodation?.name || accommodation?.activityName || accommodation?.location
                );
                if (accommodationName) {
                    accommodationByName.set(accommodationName, accommodation);
                }
            });
        }

        return {
            stopById,
            stopByName,
            accommodationById,
            accommodationByName,
        };
    }, [stopCatalog, accommodationCatalog]);

    const groupedTimeline = useMemo(() => {
        return timelineItems.reduce((acc, item) => {
            const day = Number.parseInt(item?.day, 10) || 1;
            if (!acc[day]) acc[day] = [];
            acc[day].push(item);
            return acc;
        }, {});
    }, [timelineItems]);

    const toImageUri = (candidate) => {
        if (!candidate) return null;
        const raw = String(candidate).trim();
        if (!raw) return null;

        if (typeof getImageUrl === 'function') {
            const resolved = getImageUrl(raw);
            return resolved || raw;
        }

        return raw;
    };

    const resolveStopImage = (stop, index) => {
        const explicitImage = imageKeys.map((key) => stop?.[key]).find(Boolean);
        if (explicitImage) return toImageUri(explicitImage);

        const refId = Number.parseInt(stop?.refId, 10);
        const normalizedType = normalizeKey(stop?.type);
        if (Number.isFinite(refId) && refId > 0) {
            if (normalizedType === 'accom') {
                const accommodation = lookup.accommodationById.get(refId);
                return toImageUri(getEntityImage(accommodation));
            }

            const directStop = lookup.stopById.get(refId);
            if (directStop) return toImageUri(getEntityImage(directStop));

            const directAccommodation = lookup.accommodationById.get(refId);
            if (directAccommodation) return toImageUri(getEntityImage(directAccommodation));
        }

        const stopName = normalizeKey(
            stop?.activityName || stop?.name || stop?.title || stop?.location || stop?.activity
        );

        if (stopName) {
            if (lookup.stopByName.has(stopName)) {
                return toImageUri(getEntityImage(lookup.stopByName.get(stopName)));
            }
            if (lookup.accommodationByName.has(stopName)) {
                return toImageUri(getEntityImage(lookup.accommodationByName.get(stopName)));
            }
        }

        if (normalizedType === 'accom' && accommodationCatalog.length === 1) {
            return toImageUri(getEntityImage(accommodationCatalog[0]));
        }

        if (Array.isArray(stopCatalog) && stopCatalog[index]) {
            return toImageUri(getEntityImage(stopCatalog[index]));
        }

        return null;
    };

    const hasTimeline = Object.keys(groupedTimeline).length > 0;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{title}</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={20} color="#0F172A" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        {!hasTimeline && (
                            <View style={styles.emptyBox}>
                                <Ionicons name="images-outline" size={26} color="#94A3B8" />
                                <Text style={styles.emptyText}>{emptyText}</Text>
                            </View>
                        )}

                        {Object.keys(groupedTimeline)
                            .sort((a, b) => Number(a) - Number(b))
                            .map((dayKey) => (
                                <View key={`itinerary-day-${dayKey}`} style={styles.dayBlock}>
                                    <Text style={styles.dayTitle}>Day {dayKey}</Text>

                                    {groupedTimeline[dayKey].map((stop, index) => {
                                        const imageUri = resolveStopImage(stop, index);
                                        const stopType = normalizeKey(stop?.type) === 'accom' ? 'Accommodation' : 'Stop / Activity';

                                        return (
                                            <View key={`itinerary-day-${dayKey}-stop-${index}`} style={styles.stopCard}>
                                                {imageUri ? (
                                                    <Image source={{ uri: imageUri }} style={styles.stopImage} contentFit="cover" />
                                                ) : (
                                                    <View style={styles.stopImageFallback}>
                                                        <Ionicons name="image-outline" size={24} color="#94A3B8" />
                                                    </View>
                                                )}

                                                <View style={styles.stopBody}>
                                                    <Text style={styles.stopName}>
                                                        {stop?.activityName || stop?.name || stop?.title || 'Activity Stop'}
                                                    </Text>

                                                    {!!stop?.startTime && (
                                                        <Text style={styles.stopMeta}>
                                                            {stop.startTime}
                                                            {!!stop?.endTime ? ` - ${stop.endTime}` : ''}
                                                        </Text>
                                                    )}

                                                    <Text style={styles.stopMeta}>{stopType}</Text>

                                                    {!!stop?.description && (
                                                        <Text style={styles.stopDescription}>{stop.description}</Text>
                                                    )}
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default StopDetailsModal;
