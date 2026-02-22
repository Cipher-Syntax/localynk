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

// Calculate precise widths to keep the exact 4-item view proportion for the slider.
// The active item takes up 4/7 of the screen, and inactive items take 1/7 each.
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTIVE_WIDTH = SCREEN_WIDTH * (4 / 7);
const INACTIVE_WIDTH = SCREEN_WIDTH * (1 / 7);

const DiscoverWhatYouWant = ({ isPublic = false }) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    
    const [items, setItems] = useState([]);
    const [isActive, setIsActive] = useState(null);
    const [loading, setLoading] = useState(true);

    const bounceValue = useRef(new Animated.Value(0)).current;
    
    // We use a ref object to hold dynamically generated Animated Values for the width of each category item
    const widthAnimations = useRef({});

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/api/categories/');
                const fetchedCategories = response.data; // e.g. ['Cultural', 'Historical', 'Adventure', ...]

                // Fallback images to cycle through
                const localImages = [DiscoverPlace1, DiscoverPlace2, DiscoverPlace3, DiscoverPlace4];

                const dynamicItems = fetchedCategories.map((cat, index) => ({
                    id: index + 1,
                    originalName: cat, // Need this to pass into the API params later
                    name: cat.toUpperCase(),
                    image: localImages[index % localImages.length],
                }));

                // Initialize the width animation value for each dynamic item
                dynamicItems.forEach((item, index) => {
                    // Make the first item expanded by default
                    const isFirst = index === 0;
                    widthAnimations.current[item.id] = new Animated.Value(isFirst ? ACTIVE_WIDTH : INACTIVE_WIDTH);
                });

                setItems(dynamicItems);
                if (dynamicItems.length > 0) {
                    setIsActive(dynamicItems[0].id);
                }
            } catch (error) {
                console.error("Error fetching categories for Discover section:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Animate widths when the active item changes
    useEffect(() => {
        if (!isActive || items.length === 0) return;

        const animations = items.map((item) => {
            return Animated.timing(widthAnimations.current[item.id], {
                toValue: item.id === isActive ? ACTIVE_WIDTH : INACTIVE_WIDTH,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false, // width animation doesn't support native driver
            });
        });
        
        Animated.parallel(animations).start();
    }, [isActive, items]);

    // Bounce animation for the circular arrow button
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
    }, [isActive]);

    const handleDiscoverPress = (item) => {
        if (isPublic && !isAuthenticated) {
            router.push('/auth/login');
        } else {
            router.push({
                pathname: "/(protected)/guideSelection",
                params: { category: item.originalName }, // Use the exact name from the backend for filtering
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

    if (items.length === 0) return null; // Don't show the section if no categories exist

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
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContainer}
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
        backgroundColor: '#000'
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
        width: 450, // wide enough to accommodate rotated text
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
    }
});