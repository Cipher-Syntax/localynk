import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../utils/useNetworkStatus';

const OfflineBanner = () => {
    const isConnected = useNetworkStatus();

    if (isConnected) return null;

    return (
        <SafeAreaView edges={['top']} style={[styles.banner]}>
            <Ionicons name="cloud-offline" size={16} color="#fff" />
            <Text style={styles.text}>No Internet Connection</Text>
        </SafeAreaView>
    );
};

export default OfflineBanner;

const styles = StyleSheet.create({
    banner: {
        backgroundColor: '#EF4444',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    text: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
        marginLeft: 8,
    }
});