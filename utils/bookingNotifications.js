import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKING_SEEN_KEY_PREFIX = 'booking_last_seen_ts_';
const EARNINGS_SEEN_KEY_PREFIX = 'earnings_last_seen_ts_';

export function getBookingSortTimestamp(booking) {
    const createdAt = booking?.created_at ? new Date(booking.created_at).getTime() : 0;
    const updatedAt = booking?.updated_at ? new Date(booking.updated_at).getTime() : 0;
    const checkInAt = booking?.check_in ? new Date(booking.check_in).getTime() : 0;
    const idFallback = Number(booking?.id || 0);

    return Math.max(
        Number.isFinite(createdAt) ? createdAt : 0,
        Number.isFinite(updatedAt) ? updatedAt : 0,
        Number.isFinite(checkInAt) ? checkInAt : 0,
        Number.isFinite(idFallback) ? idFallback : 0
    );
}

export function getLatestBookingTimestamp(bookings = []) {
    if (!Array.isArray(bookings) || bookings.length === 0) return 0;
    return bookings.reduce((maxTs, booking) => {
        const ts = getBookingSortTimestamp(booking);
        return ts > maxTs ? ts : maxTs;
    }, 0);
}

export async function getSeenBookingTimestamp(userId) {
    if (!userId) return 0;
    const key = `${BOOKING_SEEN_KEY_PREFIX}${userId}`;
    const raw = await AsyncStorage.getItem(key);
    const parsed = Number(raw || 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

export async function setSeenBookingTimestamp(userId, timestamp) {
    if (!userId) return;
    const key = `${BOOKING_SEEN_KEY_PREFIX}${userId}`;
    const safeTs = Number(timestamp || 0);
    await AsyncStorage.setItem(key, String(Number.isFinite(safeTs) ? safeTs : 0));
}

export async function hasUnseenBookings(userId, bookings = []) {
    const latestTs = getLatestBookingTimestamp(bookings);
    const seenTs = await getSeenBookingTimestamp(userId);
    return latestTs > seenTs;
}

export function getLatestEarningsTimestamp(bookings = [], userId) {
    if (!Array.isArray(bookings) || bookings.length === 0 || !userId) return 0;

    const related = bookings.filter((booking) => {
        const isMyGuideBooking = Number(booking?.guide) === Number(userId);
        if (!isMyGuideBooking) return false;

        const normalizedStatus = String(booking?.status || '').toLowerCase();
        const statusEligible = ['confirmed', 'completed', 'accepted'].includes(normalizedStatus);
        return statusEligible;
    });

    return getLatestBookingTimestamp(related);
}

export async function getSeenEarningsTimestamp(userId) {
    if (!userId) return 0;
    const key = `${EARNINGS_SEEN_KEY_PREFIX}${userId}`;
    const raw = await AsyncStorage.getItem(key);
    const parsed = Number(raw || 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

export async function setSeenEarningsTimestamp(userId, timestamp) {
    if (!userId) return;
    const key = `${EARNINGS_SEEN_KEY_PREFIX}${userId}`;
    const safeTs = Number(timestamp || 0);
    await AsyncStorage.setItem(key, String(Number.isFinite(safeTs) ? safeTs : 0));
}

export async function hasUnseenEarnings(userId, bookings = []) {
    const latestTs = getLatestEarningsTimestamp(bookings, userId);
    const seenTs = await getSeenEarningsTimestamp(userId);
    return latestTs > seenTs;
}
