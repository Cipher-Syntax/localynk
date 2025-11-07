import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

const About = () => {
    return (
        <View style={styles.container}>
            <View style={styles.contentRow}>

                <View style={styles.logoContainer}>
                    <Image source={require("../../assets/localynk_images/logo.png")} />
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <MaskedView
                            maskElement={
                                <Text style={styles.logoText}>LOCALYNK</Text>
                            }
                        >
                            <LinearGradient
                            colors={['#00C6FF', '#0072FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ width: 300, height: 50 }}
                            />
                        </MaskedView>
                    </View>

                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.description}>
                        LocalLynk is a travel platform that connects explorers with friendly local guides, making every journey more authentic and personal. It bridges travelers to hidden gems, cultural experiences, and real stories that only locals can share. Whether you crave beaches, mountains, city life, or quiet provinces, LocalLynk helps you discover destinations beyond the usual — turning every trip into a meaningful adventure.
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'start',
        gap: 20,
        justifyContent: "center"
    },
    logoContainer: {
        width: 230,
        height: 300,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        flexShrink: 0,
    },
    logoText: {
        fontSize: 28,
        fontWeight: 900,
        // color: '#fff',
        letterSpacing: 4,
        textAlign: "center"
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    description: {
        fontSize: 14,
        lineHeight: 22,
        color: '#333',
        textAlign: 'justify',
        fontFamily: 'System',
    },
});

export default About;