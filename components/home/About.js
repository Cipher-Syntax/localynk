import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const About = () => {
    return (
        <View style={styles.container}>
            <View style={styles.contentRow}>

                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>LOGO HERE</Text>
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
        width: 200,
        height: 300,
        backgroundColor: '#00BCD4',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
        flexShrink: 0,
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
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