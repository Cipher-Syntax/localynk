import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUSH_TOKEN_KEY = 'expo_push_token';

let handlerConfigured = false;

export function configureForegroundNotificationHandler() {
    if (handlerConfigured) return;

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });

    handlerConfigured = true;
}

export async function ensureAndroidNotificationChannel() {
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0072FF',
    });
}

export async function requestPushPermissionAsync() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

export async function getExpoPushTokenAsync() {
    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId;

    if (!projectId) {
        throw new Error('Missing EAS projectId for Expo push token retrieval.');
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token?.data;
}

export async function persistPushToken(token) {
    if (!token) return;
    await AsyncStorage.setItem(EXPO_PUSH_TOKEN_KEY, token);
}

export async function getPersistedPushToken() {
    return AsyncStorage.getItem(EXPO_PUSH_TOKEN_KEY);
}

export async function clearPersistedPushToken() {
    await AsyncStorage.removeItem(EXPO_PUSH_TOKEN_KEY);
}

export function resolveNotificationRoute(data = {}) {
    const type = data?.type;

    if (type === 'new_message' && data?.partner_id) {
        return {
            pathname: '/(protected)/message',
            params: {
                partnerId: String(data.partner_id),
                partnerName: data.partner_name || 'User',
            },
        };
    }

    if (type === 'review_reminder' && data?.related_object_id) {
        return {
            pathname: '/(protected)/reviewModal',
            params: { bookingId: String(data.related_object_id) },
        };
    }

    if (type === 'guide_approved' || type === 'agency_approved') {
        return { pathname: '/(protected)/home/tourGuide' };
    }

    if (type === 'new_booking_request' || type === 'booking_confirmed') {
        return { pathname: '/(protected)/bookings' };
    }

    if (type === 'booking_accepted' || type === 'payment_success') {
        return { pathname: '/(protected)/notification' };
    }

    return { pathname: '/(protected)/notification' };
}
