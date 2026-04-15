import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

let MapView = null;
let Marker = null;

try {
    const mapsModule = require('react-native-maps');
    MapView = mapsModule.default;
    Marker = mapsModule.Marker;
} catch {
    MapView = null;
    Marker = null;
}

const CITY_SCOPE = 'Zamboanga City';
const DEFAULT_REGION = {
    latitude: 6.93,
    longitude: 122.08,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
};

const toNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const formatCoordinate = (value) => Number(value).toFixed(6);

export default function ProfileLocationMapPicker({
    latitude,
    longitude,
    onChangeCoordinates,
    title = 'Pin Your Location on Map',
    subtitle,
}) {
    const mapRef = useRef(null);

    const mapAvailable = useMemo(() => {
        if (Platform.OS === 'web') return false;
        if (!MapView || !Marker) return false;

        const getViewManagerConfig = UIManager?.getViewManagerConfig;
        if (typeof getViewManagerConfig !== 'function') return true;

        return Boolean(getViewManagerConfig('AIRMap') || getViewManagerConfig('AIRGoogleMap'));
    }, []);

    const marker = useMemo(() => {
        const lat = toNumber(latitude);
        const lng = toNumber(longitude);

        if (lat == null || lng == null) return null;

        return {
            latitude: lat,
            longitude: lng,
        };
    }, [latitude, longitude]);

    const initialRegion = useMemo(() => {
        if (!marker) return DEFAULT_REGION;

        return {
            latitude: marker.latitude,
            longitude: marker.longitude,
            latitudeDelta: 0.025,
            longitudeDelta: 0.025,
        };
    }, [marker]);

    useEffect(() => {
        if (!marker || !mapRef.current) return;

        mapRef.current.animateToRegion(
            {
                latitude: marker.latitude,
                longitude: marker.longitude,
                latitudeDelta: 0.025,
                longitudeDelta: 0.025,
            },
            420,
        );
    }, [marker?.latitude, marker?.longitude]);

    const updateCoordinates = (coordinate) => {
        if (!coordinate) return;

        const nextLat = toNumber(coordinate.latitude);
        const nextLng = toNumber(coordinate.longitude);

        if (nextLat == null || nextLng == null) return;

        onChangeCoordinates?.({
            latitude: Number(nextLat.toFixed(6)),
            longitude: Number(nextLng.toFixed(6)),
        });
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
                        <Text style={styles.mapUnavailableText}>
                            Use a development build or rebuild the app after installing react-native-maps.
                        </Text>
                    </View>
                )}
            </View>

            <Text style={styles.caption}>
                {!mapAvailable
                    ? 'Map pinning is unavailable in this app build.'
                    : marker
                        ? `Pinned at ${formatCoordinate(marker.latitude)}, ${formatCoordinate(marker.longitude)}`
                        : 'Tap anywhere on the map to place a marker.'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginTop: 2,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        padding: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E3A8A',
    },
    subtitle: {
        marginTop: 4,
        fontSize: 12,
        color: '#334155',
    },
    mapContainer: {
        marginTop: 8,
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    map: {
        width: '100%',
        height: 190,
    },
    mapUnavailable: {
        minHeight: 150,
        paddingHorizontal: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFBEB',
    },
    mapUnavailableTitle: {
        marginTop: 6,
        fontSize: 12,
        fontWeight: '700',
        color: '#78350F',
        textAlign: 'center',
    },
    mapUnavailableText: {
        marginTop: 4,
        fontSize: 11,
        color: '#92400E',
        textAlign: 'center',
    },
    caption: {
        marginTop: 8,
        fontSize: 11,
        color: '#334155',
        fontWeight: '600',
    },
});
