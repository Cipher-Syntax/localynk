import { StyleSheet } from "react-native";
const CARD_WIDTH = 200;
const CARD_GAP = 14;


export const styles = StyleSheet.create({
    container: { marginTop: 24 },
    loadingContainer: { height: 240, justifyContent: 'center', alignItems: 'center' },

    // ── HEADER ──
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
        paddingHorizontal: 16, marginBottom: 14,
    },
    sectionLabel: { fontSize: 10, fontWeight: '800', color: '#0072FF', letterSpacing: 1.5, marginBottom: 3 },
    sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0F1923', letterSpacing: -0.3 },
    seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    seeAllText: { fontSize: 13, color: '#0072FF', fontWeight: '600' },

    // ── CARDS ──
    listContent: { paddingHorizontal: 16, paddingBottom: 4 },
    cardWrap: { marginRight: CARD_GAP },
    card: {
        width: CARD_WIDTH, borderRadius: 18, overflow: 'hidden',
        backgroundColor: '#fff',
        elevation: 4, shadowColor: '#003580',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
    },
    photoContainer: { width: '100%', height: 200, position: 'relative' },
    photo: { width: '100%', height: '100%' },
    photoOverlay: { position: 'absolute', inset: 0 },
    featuredBadge: {
        position: 'absolute', top: 10, left: 10,
        flexDirection: 'row', alignItems: 'center', gap: 3,
        backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 7, paddingVertical: 3,
        borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)',
    },
    featuredBadgeText: { color: '#FFD700', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
    photoRating: {
        position: 'absolute', bottom: 8, right: 8,
        flexDirection: 'row', alignItems: 'center', gap: 2,
        backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
    },
    photoRatingText: { color: '#fff', fontSize: 10, fontWeight: '700' },

    // ── INFO ──
    infoBlock: { padding: 12, gap: 5 },
    nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    placeName: { fontSize: 14, fontWeight: '700', color: '#0F1923', flex: 1, marginRight: 4 },
    verifiedBadge: {},
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    locationText: { fontSize: 11, color: '#888', flex: 1 },
    bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
    reviewCount: { fontSize: 10, color: '#999', marginLeft: 3 },
    viewBtn: {
        backgroundColor: '#0072FF', paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 8,
    },
    viewBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

    // ── DOTS ──
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 12 },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#D1DDE8' },
    dotActive: { width: 18, backgroundColor: '#0072FF' },
});