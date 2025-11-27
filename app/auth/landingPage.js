import React from 'react';
import { View, ImageBackground, Text, StyleSheet, TouchableOpacity, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useRouter } from 'expo-router';

const LandingPage = () => {
    const router = useRouter();
    
    const handleTravelNow = () => {
        router.push('/public');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ImageBackground
                source={require("../../assets/localynk_images/landingPage.png")}
                style={styles.background}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
                    style={styles.overlay}
                />

                <SafeAreaView style={styles.safeArea}>
                    
                    <View style={styles.logoContainer}>
                        <Image 
                            source={require("../../assets/localynk_images/logo.png")} 
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <MaskedView
                                maskElement={
                                    <Text style={styles.title}>DISCOVER WITH LOCALS</Text>
                                }
                            >
                                <LinearGradient
                                    colors={['#FFFFFF', '#00C6FF']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ width: 400, height: 45 }} 
                                />
                            </MaskedView>
                        </View>
                        <Text style={styles.subtitle}>Your gateway to authentic journeys</Text>
                    </View>

                    <View style={styles.buttonWrapper}>
                        <TouchableOpacity 
                            style={styles.buttonTouchable} 
                            onPress={handleTravelNow}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#00C6FF', '#0072FF']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>TRAVEL NOW!</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                </SafeAreaView>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    background: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'center', 
        alignItems: 'center',     
        width: '100%',
        paddingHorizontal: 20
    },
    logoContainer: {
        marginBottom: 30,
        shadowColor: "#FFFFFF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 5,
    },
    logo: {
        width: 300, 
        height: 300, 
    },

    textContainer: {
        alignItems: 'center',
        marginBottom: 20, 
    },
    title: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 2,
        textAlign: 'center',
        lineHeight: 40,
    },
    subtitle: {
        color: '#E0E0E0',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 5,
        opacity: 0.9,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },

    // BUTTON STYLES
    buttonWrapper: {
        marginTop: 30, 
        width: '100%',
        maxWidth: 300,
    },
    buttonTouchable: {
        width: '100%',
    },
    buttonGradient: {
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00C6FF', 
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
});

export default LandingPage;