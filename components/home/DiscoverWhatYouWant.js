import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated, TouchableOpacity, Easing, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

import DiscoverPlace1 from '../../assets/localynk_images/discover1.png';
import DiscoverPlace2 from '../../assets/localynk_images/discover2.png';
import DiscoverPlace3 from '../../assets/localynk_images/discover3.png';
import DiscoverPlace4 from '../../assets/localynk_images/discover4.png';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTIVE_WIDTH = SCREEN_WIDTH * (4 / 7);
const INACTIVE_WIDTH = SCREEN_WIDTH * (1 / 7);
const LOCAL_IMAGES = [DiscoverPlace1, DiscoverPlace2, DiscoverPlace3, DiscoverPlace4];

const extractCategoriesFromDestinations = (destinations = []) => {
    const categories = [];
    const seen = new Set();

    destinations.forEach((destination) => {
        const category = String(destination?.category || '').trim();
        if (!category) return;

        const key = category.toLowerCase();
        if (seen.has(key)) return;

        seen.add(key);
        categories.push(category);
    });

    return categories;
};

const buildDiscoverItems = (categories = []) => (
    categories
        .filter((category) => typeof category === 'string' && category.trim().length > 0)
        .map((category, index) => ({
            id: index + 1,
            originalName: category,
            name: category.toUpperCase(),
            image: LOCAL_IMAGES[index % LOCAL_IMAGES.length],
        }))
);

const DiscoverWhatYouWant = ({ isPublic = false }) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    
    const [items, setItems] = useState([]);
    const [isActive, setIsActive] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRightScrollHint, setShowRightScrollHint] = useState(false);

    const bounceValue = useRef(new Animated.Value(0)).current;
    const rightHintPulse = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef(null);
    const scrollLayoutWidthRef = useRef(0);
    const scrollContentWidthRef = useRef(0);
    const scrollOffsetXRef = useRef(0);
    
    const widthAnimations = useRef({});

    useEffect(() => {
        const fetchCategories = async () => {
            const applyItems = (nextItems) => {
                widthAnimations.current = {};

                nextItems.forEach((item, index) => {
                    const isFirst = index === 0;
                    widthAnimations.current[item.id] = new Animated.Value(isFirst ? ACTIVE_WIDTH : INACTIVE_WIDTH);
                });

                setItems(nextItems);
                setIsActive(nextItems.length > 0 ? nextItems[0].id : null);
            };

            const requestConfig = isPublic && !isAuthenticated ? { skipAuth: true } : undefined;
            let categories = [];

            try {
                const response = await api.get('/api/categories/', requestConfig);
                categories = Array.isArray(response?.data) ? response.data : [];
            } catch (_error) {
                categories = [];
            }

            if (categories.length === 0) {
                try {
                    const response = await api.get('/api/destinations/', requestConfig);
                    const destinations = Array.isArray(response?.data)
                        ? response.data
                        : (Array.isArray(response?.data?.results) ? response.data.results : []);
                    categories = extractCategoriesFromDestinations(destinations);
                } catch (_destinationsError) {
                    categories = [];
                }
            }

            const dynamicItems = buildDiscoverItems(categories);
            applyItems(dynamicItems);
            setLoading(false);
        };

        fetchCategories();
    }, [isAuthenticated, isPublic]);

    useEffect(() => {
        if (!isActive || items.length === 0) return;

        const animations = items.map((item) => {
            return Animated.timing(widthAnimations.current[item.id], {
                toValue: item.id === isActive ? ACTIVE_WIDTH : INACTIVE_WIDTH,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false, 
            });
        });
        
        Animated.parallel(animations).start();
    }, [isActive, items]);

    useEffect(() => {
        const startBounce = () => {
            bounceValue.setValue(0);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounceValue, {
                        toValue: -8, 
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(bounceValue, {
                        toValue: 0,
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        if (isActive) {
            startBounce();
        }
    }, [isActive, bounceValue]);

    useEffect(() => {
        let pulseAnimation;

        if (showRightScrollHint) {
            rightHintPulse.setValue(0);
            pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(rightHintPulse, {
                        toValue: 1,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(rightHintPulse, {
                        toValue: 0,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseAnimation.start();
        }

        return () => {
            if (pulseAnimation) {
                pulseAnimation.stop();
            }
        };
    }, [showRightScrollHint, rightHintPulse]);

    const updateScrollHint = (offsetX = 0) => {
        const layoutWidth = scrollLayoutWidthRef.current;
        const contentWidth = scrollContentWidthRef.current;

        if (!layoutWidth || !contentWidth) {
            setShowRightScrollHint(false);
            return;
        }

        const hasOverflow = contentWidth > layoutWidth + 8;
        const canScrollRight = offsetX < (contentWidth - layoutWidth - 8);
        setShowRightScrollHint(hasOverflow && canScrollRight);
    };

    const handleRightHintPress = () => {
        const layoutWidth = scrollLayoutWidthRef.current || SCREEN_WIDTH;
        const contentWidth = scrollContentWidthRef.current || 0;
        const currentOffset = scrollOffsetXRef.current || 0;

        if (!scrollViewRef.current || !contentWidth) return;

        const maxOffset = Math.max(contentWidth - layoutWidth, 0);
        const nextOffset = Math.min(currentOffset + layoutWidth, maxOffset);

        scrollViewRef.current.scrollTo({ x: nextOffset, animated: true });
        updateScrollHint(nextOffset);
    };

    const rightHintAnimatedStyle = {
        transform: [
            {
                translateX: rightHintPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 4],
                }),
            },
            {
                scale: rightHintPulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                }),
            },
        ],
    };

    // UPDATED: Now directs to explore page with the selected category filter
    const handleDiscoverPress = (item) => {
        if (isPublic && !isAuthenticated) {
            router.push('/auth/login');
        } else {
            router.push({
                pathname: "/(protected)/explore",
                params: { 
                    tab: 'places', // Automatically switch to places tab
                    category: item.originalName 
                }, 
            });
        }
    };

    if (loading) {
        return (
            <View style={[styles.discoverSection, { justifyContent: 'center', alignItems: 'center', height: 400 }]}>
                <ActivityIndicator size="large" color="#00C6FF" />
            </View>
        );
    }

    if (items.length === 0) return null; 

    return (
        <View style={styles.discoverSection}>
            <View style={styles.bannerContainer}>
                <Image
                    source={require('../../assets/localynk_images/travel.webp')}
                    style={styles.bannerImage}
                />
                <LinearGradient 
                    colors={['transparent', 'rgba(0,0,0,0.7)']} 
                    style={StyleSheet.absoluteFill} 
                />
                <View style={styles.bannerTextContainer}>
                    <Text style={styles.discoverTitle}>Discover What You Want</Text>
                    <View style={styles.titleUnderline} />
                </View>
            </View>

            <View style={styles.discoverRowWrapper}>
                <ScrollView 
                    ref={scrollViewRef}
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContainer}
                    onLayout={(event) => {
                        scrollLayoutWidthRef.current = event.nativeEvent.layout.width;
                        updateScrollHint(scrollOffsetXRef.current);
                    }}
                    onContentSizeChange={(contentWidth) => {
                        scrollContentWidthRef.current = contentWidth;
                        updateScrollHint(scrollOffsetXRef.current);
                    }}
                    onScroll={(event) => {
                        const offsetX = event.nativeEvent.contentOffset.x;
                        scrollOffsetXRef.current = offsetX;
                        updateScrollHint(offsetX);
                    }}
                    scrollEventThrottle={16}
                >
                    {items.map((item) => (
                        <AnimatedTouchable
                            key={item.id}
                            activeOpacity={1} 
                            onPress={() => setIsActive(item.id)}
                            style={[styles.discoverItem, { width: widthAnimations.current[item.id] }]}
                        >
                            <Image
                                source={item.image}
                                style={styles.discoverImage}
                            />
                            
                            <Animated.View style={[
                                StyleSheet.absoluteFill, 
                                { backgroundColor: 'black', opacity: isActive === item.id ? 0 : 0.3 }
                            ]} />

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
                                    <LinearGradient 
                                        colors={['rgba(0,0,0,0.6)', 'transparent']}
                                        style={styles.titleGradientOverlay}
                                    >
                                        <Text style={styles.activeSubtitle}>EXPLORE THE</Text>
                                        <Text style={styles.activeTitle}>{item.name}</Text>
                                    </LinearGradient>

                                    <TouchableOpacity
                                        onPress={() => handleDiscoverPress(item)}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient 
                                            colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
                                            style={styles.descriptionGradientOverlay}
                                        >
                                            <Text style={styles.discoverSubtext}>
                                                Find breathtaking views & hidden gems in our{' '}
                                                <Text style={styles.AccentText}>{item.name.toLowerCase()}</Text> collection.
                                            </Text>
                                            
                                            <Animated.View style={{ transform: [{ translateY: bounceValue }], marginTop: 12 }}>
                                                <View style={styles.iconCircle}>
                                                    <Ionicons name='arrow-forward' color="#fff" size={20} />
                                                </View>
                                            </Animated.View>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </AnimatedTouchable>
                    ))}
                </ScrollView>

                {showRightScrollHint && (
                    <TouchableOpacity activeOpacity={0.9} style={styles.scrollHintOverlay} onPress={handleRightHintPress}>
                        <LinearGradient
                            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
                            style={styles.scrollHintGradient}
                        />
                        <Animated.View style={[styles.scrollHintIconWrap, rightHintAnimatedStyle]}>
                            <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
                        </Animated.View>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default DiscoverWhatYouWant;

const styles = StyleSheet.create({
    discoverSection: {
        marginTop: 0,
    },
    bannerContainer: {
        width: "100%", 
        height: 220,
        marginTop: 0, 
        marginBottom: 30,
        position: 'relative',
        justifyContent: 'flex-end'
    },
    bannerImage: {
        width: "100%", 
        height: "100%", 
        objectFit: "cover",
        position: 'absolute'
    },
    bannerTextContainer: {
        padding: 20,
        alignItems: 'center',
    },
    discoverTitle: {
        textAlign: 'center',
        fontSize: 24,
        textTransform: 'uppercase',
        letterSpacing: 2,
        fontWeight: '800',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 5,
    },
    titleUnderline: {
        width: 60,
        height: 3,
        backgroundColor: '#00C6FF',
        marginTop: 8,
        borderRadius: 2
    },
    discoverRowWrapper: {
        width: '100%',
        height: 450,
        backgroundColor: '#000',
        position: 'relative',
    },
    scrollContainer: {
        flexDirection: 'row',
        height: '100%',
    },
    discoverItem: {
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
        borderRightWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.2)', 
    },
    discoverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        position: 'absolute',
    },
    rotatedTextContainer: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    inactiveDiscoverText: {
        fontSize: 18,
        fontWeight: "800",
        color: 'rgba(255,255,255,0.85)',
        transform: [{ rotate: '-90deg' }],
        letterSpacing: 6,
        width: 450, 
        textAlign: "center",
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    activeItemContainer: {
        position: 'absolute',
        top: 0, bottom: 0, left: 0, right: 0,
        justifyContent: 'space-between',
        zIndex: 10,
    },
    titleGradientOverlay: {
        paddingTop: 40,
        paddingHorizontal: 20,
        paddingBottom: 30,
        justifyContent: 'flex-start',
    },
    activeSubtitle: {
        color: '#00C6FF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    activeTitle: {
        fontSize: 34,
        fontWeight: '900',
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    descriptionGradientOverlay: {
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 25,
        alignItems: "center",
        justifyContent: "center"
    },
    discoverSubtext: {
        textAlign: 'center',
        fontSize: 15,
        color: '#e0e0e0',
        fontWeight: '500',
        lineHeight: 22,
    },
    AccentText: {
        color: '#00C6FF',
        fontWeight: '700',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 198, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#00C6FF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    scrollHintOverlay: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollHintGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    scrollHintIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(0, 198, 255, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#00C6FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
});