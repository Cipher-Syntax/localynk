import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    Image, 
    StyleSheet, 
    Animated, 
    TouchableOpacity, 
    Easing,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';

// Import images
import DiscoverPlace1 from '../../assets/localynk_images/discover1.png';
import DiscoverPlace2 from '../../assets/localynk_images/discover2.png';
import DiscoverPlace3 from '../../assets/localynk_images/discover3.png';
import DiscoverPlace4 from '../../assets/localynk_images/discover4.png';

// Create Animated Touchable component
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const DiscoverWhatYouWant = ({ isPublic = false }) => {
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    const [isActive, setIsActive] = useState(2);

    // Animation values
    const bounceValue = useRef(new Animated.Value(0)).current;

    const items = [
        { id: 1, image: DiscoverPlace1, name: 'BEACHES', touristGuide: "Juan", subtitle: "Sun-Kissed Shores" },
        { id: 2, image: DiscoverPlace2, name: 'MOUNTAINS', touristGuide: "Dela Cruz", subtitle: "Peak Adventures" },
        { id: 3, image: DiscoverPlace3, name: 'RIVERS', touristGuide: "John", subtitle: "Flowing Waters" },
        { id: 4, image: DiscoverPlace4, name: 'ISLANDS', touristGuide: "Doe", subtitle: "Tropical Escapes" },
    ];

    // Initialize flex values
    const flexAnimations = useRef(
        items.map(item => new Animated.Value(item.id === 2 ? 4 : 1))
    ).current;

    // Handle Flex Expansion Animation
    useEffect(() => {
        const animations = items.map((item, index) => {
            return Animated.timing(flexAnimations[index], {
                toValue: item.id === isActive ? 4 : 1,
                duration: 500,
                easing: Easing.out(Easing.cubic), // Slightly smoother easing
                useNativeDriver: false,
            });
        });
        Animated.parallel(animations).start();
    }, [isActive]);

    // Handle Arrow Bounce Animation
    useEffect(() => {
        const startBounce = () => {
            bounceValue.setValue(0);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounceValue, {
                        toValue: -8, // Slightly subtler bounce
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
                params: { category: item.touristGuide },
            });
        }
    };

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

            <View style={styles.discoverRow}>
                {items.map((item, index) => (
                    <AnimatedTouchable
                        key={item.id}
                        activeOpacity={1} 
                        onPress={() => setIsActive(item.id)}
                        style={[styles.discoverItem, { flex: flexAnimations[index] }]}
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
    discoverRow: {
        flexDirection: 'row',
        width: '100%',
        height: 450,
        backgroundColor: '#000'
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
    }
});