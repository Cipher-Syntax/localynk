import React, { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles/Toast.styles';

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
    }, [visible, fadeAnim, onHide]);

    if (!visible) return null;

    return (
        <Animated.View style={[styles.toastContainer, { opacity: fadeAnim }, type === 'success' ? styles.toastSuccess : styles.toastError]}>
            <Ionicons name={type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={24} color="#fff" />
            <Text style={styles.toastText}>{message}</Text>
        </Animated.View>
    );
}
