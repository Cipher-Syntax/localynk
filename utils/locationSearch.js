import api from '../api/api';
import * as Location from 'expo-location';

const CITY_SCOPE = 'Zamboanga City';
const COUNTRY_SCOPE = 'Philippines';
const ZDS_BOUNDS = {
    west: 121.7,
    south: 6.75,
    east: 122.35,
    north: 7.35,
};

const toFiniteNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const isInCoordinateRange = (latitude, longitude) => {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

const isWithinZdsBounds = (latitude, longitude) => {
    return (
        latitude >= ZDS_BOUNDS.south
        && latitude <= ZDS_BOUNDS.north
        && longitude >= ZDS_BOUNDS.west
        && longitude <= ZDS_BOUNDS.east
    );
};

const buildScopedQueries = (query) => {
    const trimmed = String(query || '').trim();
    if (!trimmed) return [];

    const lower = trimmed.toLowerCase();
    const cityLower = CITY_SCOPE.toLowerCase();
    const countryLower = COUNTRY_SCOPE.toLowerCase();

    const candidates = [trimmed];

    if (!lower.includes(cityLower)) {
        candidates.push(`${trimmed}, ${CITY_SCOPE}`);
    }

    if (!lower.includes(countryLower)) {
        candidates.push(`${trimmed}, ${CITY_SCOPE}, ${COUNTRY_SCOPE}`);
    }

    return Array.from(new Set(candidates));
};

const extractCoordinates = (locationResult) => {
    const latitude = toFiniteNumber(locationResult?.latitude);
    const longitude = toFiniteNumber(locationResult?.longitude);

    if (latitude == null || longitude == null) return null;
    if (!isInCoordinateRange(latitude, longitude)) return null;

    return {
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
    };
};

const geocodeWithDeviceProvider = async (query) => {
    const scopedQueries = buildScopedQueries(query);
    if (scopedQueries.length === 0) return null;

    for (const candidate of scopedQueries) {
        try {
            const results = await Location.geocodeAsync(candidate);
            if (!Array.isArray(results) || results.length === 0) continue;

            const withBoundsPriority = [...results].sort((a, b) => {
                const aInBounds = isWithinZdsBounds(a.latitude, a.longitude);
                const bInBounds = isWithinZdsBounds(b.latitude, b.longitude);
                if (aInBounds === bInBounds) return 0;
                return aInBounds ? -1 : 1;
            });

            const firstValid = withBoundsPriority
                .map(extractCoordinates)
                .find(Boolean);

            if (!firstValid) continue;

            return {
                ...firstValid,
                label: candidate,
            };
        } catch {
            // Try the next candidate query.
        }
    }

    return null;
};

const geocodeWithNominatim = async (query) => {
    const scopedQueries = buildScopedQueries(query);
    if (scopedQueries.length === 0) return null;

    for (const candidate of scopedQueries) {
        try {
            const params = new URLSearchParams({
                q: candidate,
                format: 'jsonv2',
                limit: '5',
                countrycodes: 'ph',
                addressdetails: '1',
            });

            const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Accept-Language': 'en',
                    'User-Agent': 'localynk-mobile/1.0',
                },
            });

            if (!response.ok) continue;

            const payload = await response.json();
            const results = Array.isArray(payload) ? payload : [];
            if (results.length === 0) continue;

            const withBoundsPriority = [...results].sort((a, b) => {
                const aLat = toFiniteNumber(a?.lat);
                const aLng = toFiniteNumber(a?.lon);
                const bLat = toFiniteNumber(b?.lat);
                const bLng = toFiniteNumber(b?.lon);

                const aInBounds = aLat != null && aLng != null && isWithinZdsBounds(aLat, aLng);
                const bInBounds = bLat != null && bLng != null && isWithinZdsBounds(bLat, bLng);

                if (aInBounds === bInBounds) return 0;
                return aInBounds ? -1 : 1;
            });

            for (const item of withBoundsPriority) {
                const latitude = toFiniteNumber(item?.lat);
                const longitude = toFiniteNumber(item?.lon);

                if (latitude == null || longitude == null) continue;
                if (!isInCoordinateRange(latitude, longitude)) continue;

                return {
                    latitude: Number(latitude.toFixed(6)),
                    longitude: Number(longitude.toFixed(6)),
                    label: String(item?.display_name || candidate),
                };
            }
        } catch {
            // Try the next candidate query.
        }
    }

    return null;
};

const parseCoordinatesFromText = (locationText) => {
    const query = String(locationText || '').trim();
    if (!query) return null;

    const match = query.match(/(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)/);
    if (!match) return null;

    const latitude = toFiniteNumber(match[1]);
    const longitude = toFiniteNumber(match[2]);
    if (latitude == null || longitude == null) return null;
    if (!isInCoordinateRange(latitude, longitude)) return null;

    return {
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        label: query,
    };
};

export const findCoordinatesForLocation = async (locationText, { limit = 1 } = {}) => {
    const query = String(locationText || '').trim();
    if (query.length < 2) return null;

    const parsedCoordinates = parseCoordinatesFromText(query);
    if (parsedCoordinates) return parsedCoordinates;

    try {
        const response = await api.get('api/locations/search/', {
            params: {
                q: query,
                limit,
            },
            skipAuth: true,
        });

        const results = Array.isArray(response.data) ? response.data : [];
        const firstValid = results.find((item) => {
            const latitude = toFiniteNumber(item?.latitude);
            const longitude = toFiniteNumber(item?.longitude);
            return latitude != null && longitude != null;
        });

        if (!firstValid) {
            const fromDevice = await geocodeWithDeviceProvider(query);
            if (fromDevice) return fromDevice;

            return await geocodeWithNominatim(query);
        }

        return {
            latitude: Number(toFiniteNumber(firstValid.latitude).toFixed(6)),
            longitude: Number(toFiniteNumber(firstValid.longitude).toFixed(6)),
            label: String(firstValid.label || firstValid.name || query),
        };
    } catch {
        const fromDevice = await geocodeWithDeviceProvider(query);
        if (fromDevice) return fromDevice;

        return await geocodeWithNominatim(query);
    }
};