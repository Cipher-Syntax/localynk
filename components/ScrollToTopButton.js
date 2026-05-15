import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles/ScrollToTopButton.styles';

const ScrollToTopButton = ({ visible, onPress, bottom = 26, right = 18 }) => {
    if (!visible) return null;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.85}
            style={[styles.button, { bottom, right }]}
        >
            <Ionicons name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
    );
};


export default ScrollToTopButton;
