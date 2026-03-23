import { Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPO_PUSH_TOKEN_KEY = 'expo_push_token';

let handlerConfigured = false;

// Helper function to pause execution for our retry delays
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

export async function getPushPermissionStatusAsync() {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    return { status, canAskAgain };
}

export async function openNotificationSettingsAsync() {
    try {
        await Linking.openSettings();
    } catch {
        // Ignore settings navigation failures.
    }
}

export async function getExpoPushTokenAsync(maxRetries = 3) {
    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId;

    if (!projectId) {
        throw new Error('Missing EAS projectId for Expo push token retrieval.');
    }

    let attempt = 0;
    let delayMs = 1000; // Start with a 1-second delay for the first retry

    // The Retry Loop (Exponential Backoff)
    while (attempt < maxRetries) {
        try {
            attempt++;
            
            // Try to fetch the token from Expo
            const token = await Notifications.getExpoPushTokenAsync({ projectId });
            
            // If successful, return the data immediately
            return token?.data;
            
        } catch (error) {
            console.warn(`[getExpoPushTokenAsync] Attempt ${attempt} failed:`, error.message);
            
            // If we hit our max retries, throw the error so the app knows it failed
            if (attempt >= maxRetries) {
                console.error('[getExpoPushTokenAsync] Max retries reached. Expo servers might be down.');
                throw error; 
            }
            
            // Wait, then double the wait time for the next loop (1s, then 2s, etc.)
            await delay(delayMs);
            delayMs *= 2; 
        }
    }
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

function parseMaybeJson(value) {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (!trimmed) return value;
    if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return value;

    try {
        return JSON.parse(trimmed);
    } catch {
        return value;
    }
}

function normalizeNotificationData(raw = {}) {
    const level1 = parseMaybeJson(raw);
    const level2 = level1 && typeof level1 === 'object' ? parseMaybeJson(level1.data) : level1;

    if (level2 && typeof level2 === 'object' && !Array.isArray(level2)) {
        return { ...level1, ...level2 };
    }

    if (level1 && typeof level1 === 'object' && !Array.isArray(level1)) {
        return level1;
    }

    return {};
}

function getFirstDefined(obj, keys) {
    for (const key of keys) {
        const value = obj?.[key];
        if (value !== undefined && value !== null && value !== '') {
            return value;
        }
    }
    return null;
}

function toValidPartnerId(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : null;
}

export function resolveNotificationRoute(data = {}) {
    const normalized = normalizeNotificationData(data);
    const type = getFirstDefined(normalized, ['type', 'alert_type', 'notification_type']);

    if (type === 'new_message') {
        const partnerIdRaw = getFirstDefined(normalized, [
            'partner_id',
            'partnerId',
            'sender_id',
            'senderId',
            'from_user_id',
            'fromUserId',
            'user_id',
            'userId',
        ]);
        const partnerId = toValidPartnerId(partnerIdRaw);
        const partnerName = getFirstDefined(normalized, [
            'partner_name',
            'partnerName',
            'sender_name',
            'senderName',
            'username',
        ]);

        if (!partnerId) {
            return { pathname: '/(protected)/conversations' };
        }

        return {
            pathname: '/(protected)/message',
            params: {
                partnerId,
                partnerName: String(partnerName || 'User'),
            },
        };
    }

    if (type === 'review_reminder' && normalized?.related_object_id) {
        return {
            pathname: '/(protected)/reviewModal',
            params: { bookingId: String(normalized.related_object_id) },
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