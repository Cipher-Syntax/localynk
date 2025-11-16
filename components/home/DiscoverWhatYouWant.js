import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated, TouchableOpacity, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Import images
import DiscoverPlace1 from '../../assets/localynk_images/discover1.png';
import DiscoverPlace2 from '../../assets/localynk_images/discover2.png';
import DiscoverPlace3 from '../../assets/localynk_images/discover3.png';
import DiscoverPlace4 from '../../assets/localynk_images/discover4.png';

// Create Animated Touchable component
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const DiscoverWhatYouWant = () => {
    const router = useRouter();
    const [isActive, setIsActive] = useState(2);

    const bounceValue = useRef(new Animated.Value(0)).current;

    const items = [
        { id: 1, image: DiscoverPlace1, name: 'BEACHES', touristGuide: "Juan" },
        { id: 2, image: DiscoverPlace2, name: 'MOUNTAINS', touristGuide: "Dela Cruz" },
        { id: 3, image: DiscoverPlace3, name: 'RIVERS', touristGuide: "John" },
        { id: 4, image: DiscoverPlace4, name: 'BEACHES', touristGuide: "Doe" },
    ];

    // Flex animations
    const flexAnimations = useRef(
        items.map(item => new Animated.Value(item.id === isActive ? 4 : 1))
    ).current;

    useEffect(() => {
        const animations = items.map((item, index) => {
            return Animated.timing(flexAnimations[index], {
                toValue: item.id === isActive ? 4 : 1,
                duration: 500,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: false,
            });
        });
        Animated.parallel(animations).start();
    }, [isActive, flexAnimations]);

    const startBounce = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceValue, {
                    toValue: -10,
                    duration: 400,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceValue, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    useEffect(() => {
        startBounce();
    }, [isActive]);

    return (
        <View style={styles.discoverSection}>
            <View style={{ width: "100%", height: 250, marginTop: 20, marginBottom: 50 }}>
                <Image
                    source={require('../../assets/localynk_images/travel.webp')}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            </View>
            <Text style={styles.discoverTitle}>Discover What You Want</Text>
            <View style={styles.discoverRow}>
                {items.map((item, index) => (
                    <AnimatedTouchable
                        key={item.id}
                        activeOpacity={0.9}
                        onPress={() => setIsActive(item.id)}
                        style={[styles.discoverItem, { flex: flexAnimations[index] }]}
                    >
                        <Image
                            source={item.image}
                            style={[styles.discoverImage, { opacity: isActive === item.id ? 1 : 0.8 }]}
                        />

                        {isActive !== item.id && (
                            <View style={styles.rotatedTextContainer}>
                                <Text
                                    style={styles.inactiveDiscoverText}
                                    numberOfLines={1}
                                >
                                    {item.name}
                                </Text>
                            </View>
                        )}

                        {isActive === item.id && (
                            <View style={styles.activeItemContainer}>
                                <View style={styles.titleOverlay}>
                                    <Text style={styles.activeTitle}>{item.name}</Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() =>
                                        router.push({
                                            pathname: "/(protected)/attractionDetails",
                                            params: { category: item.touristGuide },
                                        })
                                    }
                                    style={styles.descriptionOverlay}
                                >
                                    <Text style={styles.discoverSubtext}>
                                        Discover more breathtaking{'\n'}{item.name.toLowerCase()} spots
                                    </Text>
                                    <Animated.View style={{ transform: [{ translateY: bounceValue }], marginTop: 10 }}>
                                        <Ionicons name='arrow-down-outline' color="#00C6FF" size={25} />
                                    </Animated.View>
                                </TouchableOpacity>
                            </View>
                        )}
                    </AnimatedTouchable>
                ))}
            </View>
        </View>
    );
};

export default DiscoverWhatYouWant;

const styles = StyleSheet.create({
    discoverSection: {
        marginTop: 20,
    },
    discoverTitle: {
        textAlign: 'center',
        fontSize: 18,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
        marginBottom: 10,
    },
    discoverRow: {
        flexDirection: 'row',
        width: '100%',
        height: 400,
        overflow: 'hidden',
    },
    discoverItem: {
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
    },
    discoverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    rotatedTextContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    inactiveDiscoverText: {
        fontSize: 22,
        fontWeight: "900",
        color: '#ffffff',
        transform: [{ rotate: '-90deg' }],
        letterSpacing: 25,
        width: 400,
        textAlign: "center",
    },
    activeItemContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'space-between',
        zIndex: 10,
    },
    titleOverlay: {
        paddingTop: 20,
        paddingHorizontal: 15,
        justifyContent: 'flex-start',
    },
    activeTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff',
        textAlign: 'center',
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    descriptionOverlay: {
        paddingBottom: 40,
        paddingHorizontal: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingVertical: 15,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },
    discoverSubtext: {
        textAlign: 'center',
        fontSize: 14,
        color: '#00C6FF',
        fontWeight: '500',
        lineHeight: 20,
    },
});
