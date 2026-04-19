import React, { useEffect, useRef } from 'react';
import {
    View,
    ImageBackground,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const LandingPage = () => {
    const router = useRouter();

    // Animation values
    const logoAnim = useRef(new Animated.Value(0)).current;
    const textAnim = useRef(new Animated.Value(0)).current;
    const buttonAnim = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(logoAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(textAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(buttonAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleTravelNow = () => {
        router.push('/public');
    };

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../../assets/localynk_images/landingPage.jpg')}
                style={styles.background}
                resizeMode="cover"
                blurRadius={6}
            >
                <LinearGradient
                    colors={[
                        'rgba(0,10,30,0.55)',
                        'rgba(0,20,50,0.35)',
                        'rgba(0,10,30,0.15)',
                        'rgba(0,30,70,0.60)',
                        'rgba(0,10,30,0.90)',
                    ]}
                    locations={[0, 0.2, 0.5, 0.75, 1]}
                    style={styles.overlay}
                />

                <SafeAreaView style={styles.safeArea}>

                    <Animated.View
                        style={[
                            styles.logoContainer,
                            {
                                opacity: logoAnim,
                                transform: [{ scale: logoScale }],
                            },
                        ]}
                    >
                        <View style={styles.logoGlow} />
                        <Image
                            source={require('../../assets/localynk_images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.textContainer,
                            {
                                opacity: textAnim,
                                transform: [
                                    {
                                        translateY: textAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [20, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.titleWrapper}>
                            <MaskedView
                                maskElement={
                                    <Text style={styles.title}>DISCOVER WITH LOCALS</Text>
                                }
                            >
                                <LinearGradient
                                    colors={['#FFFFFF', '#7EDDFF', '#00C6FF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.titleGradientBox}
                                />
                            </MaskedView>
                        </View>

                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <View style={styles.dividerDot} />
                            <View style={styles.dividerLine} />
                        </View>

                        <Text style={styles.subtitle}>
                            Your gateway to authentic journeys
                        </Text>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.buttonWrapper,
                            {
                                opacity: buttonAnim,
                                transform: [
                                    {
                                        translateY: buttonAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [30, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.buttonTouchable}
                            onPress={handleTravelNow}
                            activeOpacity={0.82}
                        >
                            <LinearGradient
                                colors={['#00C6FF', '#0072FF']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>✦  TRAVEL NOW  ✦</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={styles.legalText}>
                            Connect · Explore · Experience
                        </Text>
                    </Animated.View>

                </SafeAreaView>
            </ImageBackground>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000A1E',
    },

    // ── BACKGROUND ──
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },

    // ── LAYOUT ──
    safeArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },

    // ── LOGO ──
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    logoGlow: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(0, 198, 255, 0.18)',
        shadowColor: '#00C6FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 40,
        elevation: 20,
    },
    logo: {
        width: 220,
        height: 260,
    },

    // ── TEXT ──
    textContainer: {
        alignItems: 'center',
        marginBottom: 36,
        paddingHorizontal: 10,
    },
    titleWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: 3,
        textAlign: 'center',
        lineHeight: 38,
    },
    titleGradientBox: {
        width: width - 56,
        height: 42,
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        width: 160,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(0,198,255,0.45)',
    },
    dividerDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#00C6FF',
        marginHorizontal: 8,
    },

    subtitle: {
        color: '#C8EEFF',
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 0.8,
        opacity: 0.92,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },

    // ── BUTTON ──
    buttonWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    buttonTouchable: {
        width: '80%',
        maxWidth: 280,
    },
    buttonGradient: {
        paddingVertical: 17,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00C6FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 2,
    },
    legalText: {
        marginTop: 14,
        color: 'rgba(200,238,255,0.5)',
        fontSize: 11,
        letterSpacing: 2.5,
        textAlign: 'center',
        fontWeight: '600',
    },
});

export default LandingPage;