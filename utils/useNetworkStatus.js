// utils/useNetworkStatus.js
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export const useNetworkStatus = () => {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        // This listener runs automatically whenever the network changes
        const unsubscribe = NetInfo.addEventListener(state => {
            // Check if connected AND if it actually has internet access
            setIsConnected(state.isConnected && state.isInternetReachable !== false);
        });

        // Cleanup the listener when the app closes
        return () => unsubscribe();
    }, []);

    return isConnected;
};