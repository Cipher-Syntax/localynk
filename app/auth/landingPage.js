import { Image } from 'expo-image';
import React, { useEffect, useRef } from 'react';
import { View, ImageBackground, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useRouter } from 'expo-router';
import { styles } from './styles/landingPage.styles';

const LandingPage = () => {
    const router = useRouter();

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
    }, [logoAnim, logoScale, textAnim, buttonAnim]);

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
                            contentFit="contain"
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

export default LandingPage;