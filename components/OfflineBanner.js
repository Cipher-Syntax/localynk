import React from 'react';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../utils/useNetworkStatus';
import { styles } from './styles/OfflineBanner.styles';

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

