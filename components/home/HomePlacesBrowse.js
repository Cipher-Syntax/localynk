import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

import FallbackImage from '../../assets/localynk_images/discover1.png';

const { width } = Dimensions.get('window');
const GAP = 10;
const PADDING = 15;

const LARGE_HEIGHT = 220; 
const SMALL_HEIGHT = (LARGE_HEIGHT - GAP) / 2;

const PlaceCard = ({ item, style, onPress }) => {
    const imageSource = item.image || item.first_image || item.thumbnail
        ? { uri: item.image || item.first_image || item.thumbnail }
        : FallbackImage;

    return (
        <TouchableOpacity
            style={[styles.placeCard, style]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <Image source={imageSource} style={styles.placeImage} resizeMode="cover" />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            />
            <View style={styles.infoOverlay}>
                <Text style={styles.placeName} numberOfLines={1}>
                    {item.name}
                </Text>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={10} color="#fff" />
                    <Text style={styles.placeLocation} numberOfLines={1}>
                        {item.location || 'Zamboanga City'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const HomePlacesBrowse = ({ isPublic = false, data = [] }) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const destinations = data.slice(0, 12);

    const handlePlacePress = (item) => {
        if (isPublic && !isAuthenticated) {
            router.push('/auth/login');
        } else {
            router.push({
                pathname: '/(protected)/placesDetails',
                params: {
                    id: item.id.toString(),
                    image: item.image || item.first_image || '',
                },
            });
        }
    };

    const handleViewAll = () => {
        if (isPublic && !isAuthenticated) {
            router.push('/auth/login');
        } else {
            router.push({
                pathname: '/(protected)/explore',
                params: { tab: 'places' },
            });
        }
    };

    const chunkData = (data, size) => {
        const chunks = [];
        for (let i = 0; i < data.length; i += size) {
            chunks.push(data.slice(i, i + size));
        }
        return chunks;
    };

    const renderBentoRow = ({ item: chunk, index }) => {
        if (!chunk || chunk.length === 0) return null;
        const isBigLeft = index % 2 === 0;

        if (chunk.length === 3) {
            return (
                <View style={styles.rowContainer}>
                    {isBigLeft ? (
                        <>
                            <PlaceCard
                                item={chunk[0]}
                                style={{ width: '65%', height: LARGE_HEIGHT }}
                                onPress={() => handlePlacePress(chunk[0])}
                            />
                            <View style={styles.columnContainer}>
                                <PlaceCard
                                    item={chunk[1]}
                                    style={{ width: '100%', height: SMALL_HEIGHT }}
                                    onPress={() => handlePlacePress(chunk[1])}
                                />
                                <PlaceCard
                                    item={chunk[2]}
                                    style={{ width: '100%', height: SMALL_HEIGHT }}
                                    onPress={() => handlePlacePress(chunk[2])}
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            <View style={styles.columnContainer}>
                                <PlaceCard
                                    item={chunk[0]}
                                    style={{ width: '100%', height: SMALL_HEIGHT }}
                                    onPress={() => handlePlacePress(chunk[0])}
                                />
                                <PlaceCard
                                    item={chunk[1]}
                                    style={{ width: '100%', height: SMALL_HEIGHT }}
                                    onPress={() => handlePlacePress(chunk[1])}
                                />
                            </View>
                            <PlaceCard
                                item={chunk[2]}
                                style={{ width: '65%', height: LARGE_HEIGHT }}
                                onPress={() => handlePlacePress(chunk[2])}
                            />
                        </>
                    )}
                </View>
            );
        }

        if (chunk.length === 2) {
            return (
                <View style={styles.rowContainer}>
                    <PlaceCard
                        item={chunk[0]}
                        style={{ width: '48.5%', height: LARGE_HEIGHT }}
                        onPress={() => handlePlacePress(chunk[0])}
                    />
                    <PlaceCard
                        item={chunk[1]}
                        style={{ width: '48.5%', height: LARGE_HEIGHT }}
                        onPress={() => handlePlacePress(chunk[1])}
                    />
                </View>
            );
        }

        if (chunk.length === 1) {
            return (
                <View style={styles.rowContainer}>
                    <PlaceCard
                        item={chunk[0]}
                        style={{ width: '100%', height: LARGE_HEIGHT * 0.8 }}
                        onPress={() => handlePlacePress(chunk[0])}
                    />
                </View>
            );
        }
        return null;
    };

    if (!destinations || destinations.length === 0) {
        return null;
    }

    const dataChunks = chunkData(destinations, 3);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.title}>Discover Places</Text>
                    <Text style={styles.subtitle}>Curated spots in Zamboanga</Text>
                </View>
                <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={handleViewAll}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={styles.viewAllText}>View All</Text>
                    <Ionicons name="arrow-forward" size={14} color="#0072FF" />
                </TouchableOpacity>
            </View>

            <FlatList
                key="bento-grid"
                data={dataChunks}
                renderItem={renderBentoRow}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

export default HomePlacesBrowse;

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: PADDING,
        marginBottom: 16,
    },
    headerLeft: {
        flex: 1,
        marginRight: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F8FF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#0072FF',
        marginRight: 4,
    },
    listContent: {
        paddingHorizontal: PADDING,
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: GAP,
        width: '100%',
    },
    columnContainer: {
        width: '32%',
        justifyContent: 'space-between',
        height: LARGE_HEIGHT,
    },
    placeCard: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        position: 'relative',
    },
    placeImage: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%',
        zIndex: 1,
    },
    infoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        zIndex: 2,
    },
    placeName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    placeLocation: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        marginLeft: 4,
        flex: 1,
        fontWeight: '500',
    },
});