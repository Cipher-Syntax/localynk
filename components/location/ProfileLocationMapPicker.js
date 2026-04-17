import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from './NativeMap'; // Safe Web Map Loading

const CITY_SCOPE = 'Zamboanga City';
const DEFAULT_REGION = { latitude: 6.93, longitude: 122.08, latitudeDelta: 0.08, longitudeDelta: 0.08 };
const toNumber = (value) => { const parsed = Number.parseFloat(value); return Number.isFinite(parsed) ? parsed : null; };
const isInCoordinateRange = (lat, lng) => lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
const isUnsetCoordinatePair = (lat, lng) => Math.abs(lat) < 0.000001 && Math.abs(lng) < 0.000001;

export default function ProfileLocationMapPicker({
    latitude, longitude, onChangeCoordinates, title = 'Pin Your Location on Map', subtitle
}) {
    const mapRef = useRef(null);

    const mapAvailable = useMemo(() => {
        if (Platform.OS === 'web') return false;
        const getViewManagerConfig = UIManager?.getViewManagerConfig;
        if (typeof getViewManagerConfig !== 'function') return true;
        return Boolean(getViewManagerConfig('AIRMap') || getViewManagerConfig('AIRGoogleMap'));
    }, []);

    const marker = useMemo(() => {
        const lat = toNumber(latitude);
        const lng = toNumber(longitude);
        if (lat == null || lng == null || !isInCoordinateRange(lat, lng) || isUnsetCoordinatePair(lat, lng)) return null;
        return { latitude: lat, longitude: lng };
    }, [latitude, longitude]);

    const initialRegion = useMemo(() => {
        if (!marker) return DEFAULT_REGION;
        return { latitude: marker.latitude, longitude: marker.longitude, latitudeDelta: 0.025, longitudeDelta: 0.025 };
    }, [marker]);

    useEffect(() => {
        if (!marker || !mapRef.current) return;
        mapRef.current.animateToRegion({
            latitude: marker.latitude,
            longitude: marker.longitude,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
        }, 420);
    }, [marker]);

    const updateCoordinates = (coordinate) => {
        if (!coordinate) return;
        const nextLat = toNumber(coordinate.latitude);
        const nextLng = toNumber(coordinate.longitude);
        if (nextLat == null || nextLng == null) return;
        onChangeCoordinates?.({ latitude: Number(nextLat.toFixed(6)), longitude: Number(nextLng.toFixed(6)) });
    };

    return (
        <View style={styles.wrapper}>
            <View style={styles.headerRow}>
                <Ionicons name="map-outline" size={16} color="#1D4ED8" />
                <Text style={styles.title}>{title}</Text>
            </View>

            <Text style={styles.subtitle}>
                {subtitle || `Drag or tap map to set your exact spot in ${CITY_SCOPE}.`}
            </Text>

            <View style={styles.mapContainer}>
                {mapAvailable ? (
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={initialRegion}
                        mapType="standard"
                        onPress={(event) => updateCoordinates(event.nativeEvent.coordinate)}
                        zoomEnabled
                        scrollEnabled
                        rotateEnabled={false}
                        pitchEnabled={false}
                    >
                        {marker && (
                            <Marker
                                coordinate={marker}
                                draggable
                                onDragEnd={(event) => updateCoordinates(event.nativeEvent.coordinate)}
                            />
                        )}
                    </MapView>
                ) : (
                    <View style={styles.mapUnavailable}>
                        <Ionicons name="warning-outline" size={18} color="#92400E" />
                        <Text style={styles.mapUnavailableTitle}>Map is unavailable in this build.</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { marginTop: 2, marginBottom: 10, borderWidth: 1, borderColor: '#DBEAFE', borderRadius: 12, backgroundColor: '#EFF6FF', padding: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { fontSize: 13, fontWeight: '700', color: '#1E3A8A' },
    subtitle: { marginTop: 4, fontSize: 12, color: '#334155', marginBottom: 8 },
    mapContainer: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#BFDBFE' },
    map: { width: '100%', height: 190 },
    mapUnavailable: { minHeight: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFBEB' },
    mapUnavailableTitle: { fontSize: 12, fontWeight: '700', color: '#78350F' },
});