import React, { useEffect } from 'react';
import { Animated, StyleSheet, Text, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function Toast() {
    const { message, messageType, clearMessage } = useAuth();
    const slideAnim = React.useRef(new Animated.Value(-100)).current; // start above screen

    useEffect(() => {
        if (message) {
            // Slide in
            Animated.timing(slideAnim, {
                toValue: 30,
                duration: 300,
                useNativeDriver: true,
            }).start();

            // Auto hide after 3 seconds
            const timer = setTimeout(() => {
                Animated.timing(slideAnim, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => clearMessage());
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [message]);

    if (!message) return null;

    let backgroundColor = '#007AFF'; // default info
    if (messageType === 'error') backgroundColor = '#FF4D4F';
    else if (messageType === 'success') backgroundColor = '#4BB543';

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }], backgroundColor }]}>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 20,
        alignSelf: 'center',
        width: width * 0.9,
        padding: 15,
        borderRadius: 8,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    text: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
