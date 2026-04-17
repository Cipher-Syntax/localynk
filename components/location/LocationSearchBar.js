import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Keyboard, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';

const CITY_SCOPE = 'Zamboanga City';

export default function LocationSearchBar({ value, onSelectLocation, placeholder = "Search for a location..." }) {
    const [searchQuery, setSearchQuery] = useState(value || '');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (value !== undefined && value !== searchQuery && !showDropdown) {
            setSearchQuery(value);
        }
    }, [value]);

    useEffect(() => {
        if (!showDropdown) return;
        const query = searchQuery.trim();
        if (query.length < 2) {
            setResults([]);
            return;
        }

        let active = true;
        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await api.get('/api/locations/search/', {
                    params: { q: query, limit: 6 },
                });
                if (active) {
                    // Extract data whether it's a direct array OR a Django DRF paginated object
                    const responseData = response.data;
                    const extractedItems = Array.isArray(responseData) 
                        ? responseData 
                        : (responseData?.results || responseData?.data || []);
                        
                    setResults(extractedItems);
                }
            } catch (error) {
                if (active) setResults([]);
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
                    }}
                    onFocus={() => setShowDropdown(true)}
                />
                {isSearching && <ActivityIndicator size="small" color="#0072FF" style={{ marginRight: 10 }} />}
            </View>

            {showDropdown && results.length > 0 && (
                <View style={styles.dropdown}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled={true}
                        style={{ maxHeight: 220 }}
                    >
                        {results.map((item, index) => (
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
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { position: 'relative', zIndex: 9999, elevation: 9999, marginBottom: 10 },
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