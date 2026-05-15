import { StyleSheet } from "react-native";
const PADDING = 16;
const COLUMN_GAP = 12;

export const styles = StyleSheet.create({
    container: { marginTop: 28 },

    // ── HEADER ──
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
        paddingHorizontal: PADDING, marginBottom: 8,
    },
    sectionLabel: { fontSize: 10, fontWeight: '800', color: '#0072FF', letterSpacing: 1.5, marginBottom: 3 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0F1923', letterSpacing: -0.3 },
    viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewAllText: { fontSize: 13, color: '#0072FF', fontWeight: '600' },

    countRow: { paddingHorizontal: PADDING, marginBottom: 14 },
    countBadge: {
        alignSelf: 'flex-start', backgroundColor: '#EEF4FF',
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    },
    countText: { fontSize: 11, color: '#0072FF', fontWeight: '600' },

    // ── GRID ──
    grid: { paddingHorizontal: PADDING, gap: COLUMN_GAP },
    row: { flexDirection: 'row', gap: COLUMN_GAP, marginBottom: COLUMN_GAP },
    cardPlaceholder: { flex: 1 },

    // ── CARD ──
    card: {
        flex: 1, borderRadius: 16, backgroundColor: '#fff', overflow: 'hidden',
        elevation: 3, shadowColor: '#003580',
        shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10,
    },
    photoWrap: { width: '100%', height: 140, position: 'relative' },
    photo: { width: '100%', height: '100%' },
    newBadge: {
        position: 'absolute', top: 8, right: 8,
        flexDirection: 'row', alignItems: 'flex-start', gap: 4,
        backgroundColor: 'rgba(2,132,199,0.92)',
        borderWidth: 1, borderColor: 'rgba(186,230,253,0.95)',
        paddingHorizontal: 7, paddingVertical: 5,
        borderRadius: 10, zIndex: 6, maxWidth: '82%',
    },
    newBadgeTextWrap: { flexShrink: 1 },
    newBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', lineHeight: 10 },
    newBadgeTapHint: { color: '#E0F2FE', fontSize: 7, fontWeight: '700', lineHeight: 9, marginTop: 1 },

    // ── INFO ──
    infoWrap: { padding: 10, gap: 4 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    catTag: {
        backgroundColor: '#F0F4FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
    },
    catTagText: { fontSize: 9, fontWeight: '700', color: '#0072FF', textTransform: 'uppercase', letterSpacing: 0.3 },
    ratingTag: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    ratingTagText: { fontSize: 10, fontWeight: '700', color: '#1a1a1a' },
    name: { fontSize: 13, fontWeight: '700', color: '#0F1923', marginTop: 2 },
    locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    locText: { fontSize: 10, color: '#888', flex: 1 },
    divider: { height: 0.5, backgroundColor: '#EEF0F4', marginVertical: 6 },
    cta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ctaText: { fontSize: 12, fontWeight: '700', color: '#0072FF' },
});