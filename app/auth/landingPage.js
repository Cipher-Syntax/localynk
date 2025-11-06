import React from 'react';
import { View, ImageBackground, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useRouter } from 'expo-router';

const LandingPage = () => {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ImageBackground
                source={require("../../assets/localynk_images/landingPage.png")}
                style={styles.background}
                resizeMode="cover"
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
                    style={styles.overlay}
                />

                <SafeAreaView style={styles.safeArea}>
                    
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
                                style={{ width: 400, height: 50 }}
                                />
                            </MaskedView>
                        </View>
                        <Text style={styles.subtitle}>Your gateway to authentic journeys</Text>
                    </View>

                    <View style={styles.buttonWrapper}>
                        <TouchableOpacity style={styles.buttonTouchable} onPress={() => router.push({pathname: "auth/login"})}>
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
        position: 'relative',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: 1.5,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        letterSpacing: 3
    },
    subtitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '400',
        textAlign: 'center',
        marginTop: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    buttonWrapper: {
        position: 'absolute',
        bottom: 80,
        width: '85%',
    },
    buttonTouchable: {
        width: '100%',
    },
    buttonGradient: {
        paddingVertical: 15,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
});

export default LandingPage;