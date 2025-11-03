import React from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Action = () => {
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header Section */}
            <View style={styles.header}>
                <Image
                    source={require('../../assets/localynk_images/header.png')}
                    style={styles.headerImage}
                />

                {/* Gradient Overlay */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                    style={styles.overlay}
                />

                <Text style={styles.headerTitle}>TOUR GUIDES</Text>
            </View>

            {/* Body Section */}
            <View>
                <View style={styles.body}>
                    <Text style={styles.title}>Want to be a local guide?</Text>
                    <Text style={styles.subtitle}>
                        Join our community of locals showing off their hometown pride.
                    </Text>

                    <TouchableOpacity activeOpacity={0.8}>
                        <LinearGradient
                            colors={['#00C6FF', '#0072FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.primaryButton}
                        >
                            <Text style={styles.primaryButtonText}>Let's Go!</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.8} style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>View Requirements</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default Action;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D9E2E9', // light blue background
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTitle: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
    },
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 25,
        paddingVertical: 60,
        borderTopLeftRadius: 60,
        borderTopRightRadius: 60,
        backgroundColor: '#D9E2E9',
        marginTop: 300,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 13,
        color: '#333',
        textAlign: 'center',
        marginBottom: 35,
    },
    primaryButton: {
        paddingVertical: 10,
        paddingHorizontal: 35,
        borderRadius: 30,
        marginBottom: 15,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    secondaryButton: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#00C6FF',
    },
    secondaryButtonText: {
        color: '#00C6FF',
        fontWeight: '500',
        fontSize: 13,
    },
});
