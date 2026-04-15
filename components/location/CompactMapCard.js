import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, UIManager } from 'react-native';
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

const toNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export default function CompactMapCard({
    latitude,
    longitude,
    title = 'Pinned Location',
    subtitle = '',
}) {
    const lat = toNumber(latitude);
    const lng = toNumber(longitude);

    const coordinates = useMemo(() => {
        if (lat == null || lng == null) return null;
        return {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        };
    }, [lat, lng]);

    const mapAvailable = useMemo(() => {
        if (Platform.OS === 'web') return false;
        if (!MapView || !Marker) return false;

        const getViewManagerConfig = UIManager?.getViewManagerConfig;
        if (typeof getViewManagerConfig !== 'function') return true;

        return Boolean(getViewManagerConfig('AIRMap') || getViewManagerConfig('AIRGoogleMap'));
    }, []);

    if (!coordinates) return null;

    const openExternalMap = async () => {
        const label = encodeURIComponent(title || 'Pinned Location');
        const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}&query_place_id=${label}`;
        try {
            await Linking.openURL(url);
        } catch (_error) {
            // Silent fallback in UI-only helper
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
                <MapView
                    style={styles.map}
                    initialRegion={coordinates}
                    region={coordinates}
                    scrollEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                    zoomEnabled={false}
                    toolbarEnabled={false}
                    pointerEvents="none"
                >
                    <Marker coordinate={coordinates} />
                </MapView>
            ) : (
                <View style={styles.mapUnavailable}>
                    <Ionicons name="warning-outline" size={16} color="#92400E" />
                    <Text style={styles.mapUnavailableText}>Map preview unavailable in this build.</Text>
                </View>
            )}

            <TouchableOpacity style={styles.openButton} onPress={openExternalMap}>
                <Ionicons name="navigate" size={15} color="#1D4ED8" />
                <Text style={styles.openButtonText}>Open in Maps</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    title: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E3A8A',
    },
    subtitle: {
        fontSize: 11,
        color: '#334155',
        marginTop: 1,
    },
    map: {
        width: '100%',
        height: 130,
        borderRadius: 10,
        overflow: 'hidden',
    },
    mapUnavailable: {
        width: '100%',
        height: 130,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FCD34D',
        backgroundColor: '#FFFBEB',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    mapUnavailableText: {
        fontSize: 11,
        color: '#92400E',
        fontWeight: '600',
    },
    openButton: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
    openButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1D4ED8',
    },
});
