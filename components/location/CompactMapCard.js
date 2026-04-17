import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, Linking, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { findCoordinatesForLocation } from '../../utils/locationSearch';

// Import our new isolated map module
import MapView, { Marker } from './NativeMap';

const toNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const DEFAULT_REGION = {
    latitude: 6.93,
    longitude: 122.08,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
};

export default function CompactMapCard({
    latitude,
    longitude,
    title = 'Pinned Location',
    subtitle = '',
    locationText = '',
}) {
    const lat = toNumber(latitude);
    const lng = toNumber(longitude);

    const explicitCoordinates = useMemo(() => {
        if (lat == null || lng == null) return null;
        return { latitude: lat, longitude: lng };
    }, [lat, lng]);

    const [resolvedCoordinates, setResolvedCoordinates] = useState(null);
    const [isResolving, setIsResolving] = useState(false);

    const searchQuery = useMemo(() => {
        return String(locationText || subtitle || '').trim();
    }, [locationText, subtitle]);

    useEffect(() => {
        let isCancelled = false;

        if (explicitCoordinates) {
            setResolvedCoordinates(null);
            setIsResolving(false);
            return () => { isCancelled = true; };
        }

        if (searchQuery.length < 2) {
            setResolvedCoordinates(null);
            setIsResolving(false);
            return () => { isCancelled = true; };
        }

        setIsResolving(true);

        (async () => {
            const resolved = await findCoordinatesForLocation(searchQuery, { limit: 1 });
            if (isCancelled) return;

            if (resolved) {
                setResolvedCoordinates({
                    latitude: Number(resolved.latitude),
                    longitude: Number(resolved.longitude),
                });
            } else {
                setResolvedCoordinates(null);
            }

            setIsResolving(false);
        })();

        return () => { isCancelled = true; };
    }, [explicitCoordinates, searchQuery]);

    const markerCoordinates = explicitCoordinates || resolvedCoordinates;

    const mapRegion = useMemo(() => {
        if (!markerCoordinates) return DEFAULT_REGION;
        return {
            latitude: markerCoordinates.latitude,
            longitude: markerCoordinates.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        };
    }, [markerCoordinates]);

    const mapAvailable = useMemo(() => {
        if (Platform.OS === 'web') return false;

        const getViewManagerConfig = UIManager?.getViewManagerConfig;
        if (typeof getViewManagerConfig !== 'function') return true;

        return Boolean(getViewManagerConfig('AIRMap') || getViewManagerConfig('AIRGoogleMap'));
    }, []);

    const openExternalMap = async () => {
        const query = markerCoordinates
            ? `${markerCoordinates.latitude},${markerCoordinates.longitude}`
            : searchQuery;

        if (!query) return;

        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
        try {
            await Linking.openURL(url);
        } catch (_error) {
            // Silent fallback
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.headerRow}>
                <Ionicons name="map" size={16} color="#1D4ED8" />
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{title}</Text>
                    {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
            </View>

            {mapAvailable ? (
                <View>
                    <MapView
                        style={styles.map}
                        initialRegion={mapRegion}
                        region={mapRegion}
                        scrollEnabled={false}
                        rotateEnabled={false}
                        pitchEnabled={false}
                        zoomEnabled={false}
                        toolbarEnabled={false}
                        pointerEvents="none"
                    >
                        {markerCoordinates && <Marker coordinate={markerCoordinates} />}
                    </MapView>

                    {isResolving && (
                        <View style={styles.resolvingOverlay}>
                            <ActivityIndicator size="small" color="#1D4ED8" />
                            <Text style={styles.resolvingText}>Resolving location...</Text>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.mapUnavailable}>
                    <Ionicons name="warning-outline" size={16} color="#92400E" />
                    <Text style={styles.mapUnavailableText}>Map preview unavailable in this build.</Text>
                </View>
            )}

            {markerCoordinates ? (
                <Text style={styles.coordinatesText}>
                    {`Pinned at ${markerCoordinates.latitude.toFixed(6)}, ${markerCoordinates.longitude.toFixed(6)}`}
                </Text>
            ) : (
                <Text style={styles.coordinatesHint}>Pin is not available yet for this location.</Text>
            )}

            <TouchableOpacity style={styles.openButton} onPress={openExternalMap}>
                <Ionicons name="navigate" size={15} color="#1D4ED8" />
                <Text style={styles.openButtonText}>{markerCoordinates ? 'Open in Maps' : 'Search in Maps'}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { marginTop: 10, borderWidth: 1, borderColor: '#DBEAFE', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    title: { fontSize: 12, fontWeight: '700', color: '#1E3A8A' },
    subtitle: { fontSize: 11, color: '#334155', marginTop: 1 },
    map: { width: '100%', height: 130, borderRadius: 10, overflow: 'hidden' },
    resolvingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center', gap: 6 },
    resolvingText: { fontSize: 11, color: '#1E3A8A', fontWeight: '700' },
    mapUnavailable: { width: '100%', height: 130, borderRadius: 10, borderWidth: 1, borderColor: '#FCD34D', backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', gap: 4 },
    mapUnavailableText: { fontSize: 11, color: '#92400E', fontWeight: '600' },
    coordinatesText: { marginTop: 8, fontSize: 11, color: '#334155', fontWeight: '700' },
    coordinatesHint: { marginTop: 8, fontSize: 11, color: '#64748B', fontWeight: '600' },
    openButton: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
    openButtonText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
});