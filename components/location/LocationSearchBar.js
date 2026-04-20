import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Keyboard, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

const CITY_SCOPE = 'Zamboanga City';

const toNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizeResults = (responseData) => {
    const rawItems = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.results)
            ? responseData.results
            : Array.isArray(responseData?.data)
                ? responseData.data
                : Array.isArray(responseData?.items)
                    ? responseData.items
                    : Array.isArray(responseData?.suggestions)
                        ? responseData.suggestions
                        : Array.isArray(responseData?.features)
                            ? responseData.features
                            : [];

    return rawItems
        .map((item, index) => {
            if (!item || typeof item !== 'object') return null;

            const centerLongitude = Array.isArray(item.center) ? toNumber(item.center[0]) : null;
            const centerLatitude = Array.isArray(item.center) ? toNumber(item.center[1]) : null;
            const latitude = toNumber(item.latitude) ?? centerLatitude;
            const longitude = toNumber(item.longitude) ?? centerLongitude;

            const label = String(item.label || item.place_name || item.name || item.text || '').trim();
            if (!label) return null;

            return {
                id: item.id ?? `${label}-${index}`,
                label,
                name: String(item.name || item.text || label).trim(),
                municipality: String(item.municipality || item.city || item.town || CITY_SCOPE),
                latitude,
                longitude,
                is_existing: Boolean(item.is_existing),
                existing_name: item.existing_name,
            };
        })
        .filter(Boolean);
};

export default function LocationSearchBar({ value, onSelectLocation, onChangeText, onBlur, placeholder = "Search for a location..." }) {
    const [searchQuery, setSearchQuery] = useState(value || '');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchError, setSearchError] = useState('');

    useEffect(() => {
        if (value === undefined || showDropdown) return;

        setSearchQuery((previous) => {
            if (value === previous) return previous;
            return value;
        });
    }, [value, showDropdown]);

    useEffect(() => {
        if (!showDropdown) return;
        const query = searchQuery.trim();
        if (query.length < 2) {
            setResults([]);
            setSearchError('');
            return;
        }

        let active = true;
        const timer = setTimeout(async () => {
            setIsSearching(true);
            setSearchError('');
            try {
                const response = await api.get('/api/locations/search/', {
                    params: { q: query, limit: 6 },
                    skipAuth: true,
                });
                if (active) {
                    setResults(normalizeResults(response.data));
                }
            } catch (_error) {
                if (active) {
                    setResults([]);
                    setSearchError('Could not load matching places right now.');
                }
            } finally {
                if (active) setIsSearching(false);
            }
        }, 400);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [searchQuery, showDropdown]);

    const handleSelect = (item) => {
        Keyboard.dismiss();
        setShowDropdown(false);
        const locationName = item.label || item.name;
        setSearchQuery(locationName);
        
        if (onSelectLocation) {
            onSelectLocation({
                address: locationName,
                latitude: item.latitude != null ? Number(item.latitude) : null,
                longitude: item.longitude != null ? Number(item.longitude) : null,
            });
        }
    };

    const useTypedLocation = () => {
        const typedLocation = String(searchQuery || '').trim();
        if (!typedLocation) return;

        Keyboard.dismiss();
        setShowDropdown(false);

        onSelectLocation?.({
            address: typedLocation,
            latitude: null,
            longitude: null,
        });
    };

    const trimmedQuery = String(searchQuery || '').trim();
    const hasSearchText = trimmedQuery.length >= 2;
    const shouldShowSearchingRow = showDropdown && hasSearchText && isSearching;
    const shouldShowNoResultAction = showDropdown && hasSearchText && !isSearching && !searchError && results.length === 0;
    const shouldShowErrorAction = showDropdown && hasSearchText && !isSearching && Boolean(searchError) && results.length === 0;
    const shouldShowDropdown = showDropdown && hasSearchText && (results.length > 0 || shouldShowSearchingRow || shouldShowNoResultAction || shouldShowErrorAction);

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <Ionicons name="search" size={20} color="#6B7280" style={styles.icon} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={(text) => {
                        setSearchQuery(text);
                        setShowDropdown(true);
                        onChangeText?.(text);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={(event) => {
                        const text = event?.nativeEvent?.text ?? searchQuery;
                        onBlur?.(text);
                        setTimeout(() => setShowDropdown(false), 120);
                    }}
                />
                {isSearching && <ActivityIndicator size="small" color="#0072FF" style={{ marginRight: 10 }} />}
            </View>

            {shouldShowDropdown && (
                <View style={styles.dropdown}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                        style={{ maxHeight: 220 }}
                    >
                        {shouldShowSearchingRow ? (
                            <View style={styles.resultItem}>
                                <Text style={styles.resultName}>Searching matching places...</Text>
                                <Text style={styles.resultSub}>Please wait</Text>
                            </View>
                        ) : results.length > 0 ? (
                            results.map((item, index) => (
                                <TouchableOpacity 
                                    key={item.id ? String(item.id) : String(index)} 
                                    style={styles.resultItem} 
                                    onPress={() => handleSelect(item)}
                                >
                                    {item.is_existing && (
                                        <View style={styles.existingBadge}>
                                            <Ionicons name="pin" size={12} color="#0891B2" />
                                            <Text style={styles.existingText}>Existing: {item.existing_name}</Text>
                                        </View>
                                    )}
                                    <Text style={styles.resultName}>{item.label || item.name}</Text>
                                    <Text style={styles.resultSub}>{item.municipality || CITY_SCOPE}</Text>
                                </TouchableOpacity>
                            ))
                        ) : shouldShowErrorAction ? (
                            <>
                                <View style={styles.resultItem}>
                                    <Text style={styles.resultName}>Suggestions unavailable</Text>
                                    <Text style={styles.resultSub}>{searchError}</Text>
                                </View>
                                <TouchableOpacity style={styles.resultItem} onPress={useTypedLocation}>
                                    <Text style={styles.resultName}>Use typed location</Text>
                                    <Text style={styles.resultSub}>{trimmedQuery}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <TouchableOpacity style={styles.resultItem} onPress={useTypedLocation}>
                                <Text style={styles.resultName}>Use typed location</Text>
                                <Text style={styles.resultSub}>{trimmedQuery}</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { position: 'relative', zIndex: 9999, elevation: 9999, marginBottom: 10, overflow: 'visible' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12 },
    icon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1F2937' },
    dropdown: { position: 'absolute', top: 55, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, elevation: 10, zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
    resultItem: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    existingBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 },
    existingText: { fontSize: 11, fontWeight: '700', color: '#0891B2', letterSpacing: 0.5 },
    resultName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
    resultSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});