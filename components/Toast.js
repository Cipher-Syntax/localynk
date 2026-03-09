import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Toast({ visible, message, type = 'success', onHide }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            const timer = setTimeout(() => {
                Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
                    if (onHide) onHide();
                });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }, type === 'success' ? styles.toastSuccess : styles.toastError]}>
            <Ionicons name={type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={24} color="#fff" />
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    toastContainer: { position: 'absolute', top: 50, zIndex: 9999, alignSelf: 'center', backgroundColor: '#1F2937', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, width: '90%', shadowOpacity: 0.2, elevation: 5 },
    toastSuccess: { borderLeftWidth: 4, borderLeftColor: '#22C55E' },
    toastError: { borderLeftWidth: 4, borderLeftColor: '#EF4444' },
    toastText: { color: '#fff', marginLeft: 10, fontWeight: '600' }
});