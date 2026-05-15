import { StyleSheet } from "react-native";
const GAP = 12;
const PADDING = 16;

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { alignItems: 'center', marginTop: 50 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#8B98A8', fontSize: 16 },
    listFooterLoader: { paddingVertical: 16, alignItems: 'center' },

    header: { position: 'relative', height: 120, justifyContent: 'center', width: '100%' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },

    backButton: {
        position: 'absolute',
        top: 20, 
        left: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.3)', 
        padding: 6,
        borderRadius: 20,
    },

    searchFilterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF0F5', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#D0DAE3' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#1A2332' },
    searchHintContainer: { paddingHorizontal: 16, marginBottom: 8 },
    searchHintText: { fontSize: 12, color: '#64748B' },

    filterButton: { position: 'relative', backgroundColor: '#EBF0F5', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#D0DAE3' },
    filterActiveDot: { position: 'absolute', top: -3, right: -3, width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF5A5F', borderWidth: 2, borderColor: '#fff' },

    toggleRow: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 16, marginBottom: 10 },
    toggleContainer: { flexDirection: 'row', width: '100%', gap: 12 },
    toggleButton: { flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#00A8FF', backgroundColor: '#fff', alignItems: 'center' },
    toggleButtonActive: { backgroundColor: '#00A8FF' },
    toggleButtonText: { fontSize: 14, fontWeight: '600', color: '#00A8FF' },
    toggleButtonTextActive: { color: '#fff' },

    activeFilterContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10, backgroundColor: '#E8F6FF', paddingVertical: 8, marginHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: '#BFE4FF' },
    activeFilterText: { fontSize: 13, color: '#006699', fontWeight: '600' },
    clearFilterBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00A8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    clearFilterText: { color: '#fff', fontSize: 11, fontWeight: '700', marginLeft: 2 },

    contentContainer: { paddingBottom: 40 },

    // ── Grid & White Place Card Styles ──
    placesRow: { flexDirection: 'row', gap: GAP, marginBottom: GAP, paddingHorizontal: PADDING },
    cardPlaceholder: { flex: 1 },
    
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
    // ─────────────────────────────────────

    guideCardStack: { 
        backgroundColor: '#F5F7FA', 
        borderRadius: 15, 
        padding: 16, 
        borderWidth: 1, 
        borderColor: '#E0E6ED', 
        marginBottom: 16,
        marginHorizontal: 16,
        alignSelf: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cardProfileSection: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    iconWrapper: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EBF0F5', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    iconWrapperWithImage: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#D0DAE3' },
    guideAvatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    profileInfo: { flex: 1, marginLeft: 12 },

    nameRow: { flexDirection: 'column', alignItems: 'flex-start' },
    guideName: { fontSize: 16, fontWeight: '700', color: '#1A2332', marginBottom: 4 },
    guideAddress: { fontSize: 12, color: '#8B98A8' },
    guideRating: { fontSize: 12, color: '#C99700', marginTop: 2 },

    availabilityContainer: { flexDirection: 'row', gap: 4, marginTop: 4, marginBottom: 4 },
    dayBadge: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    dayAvailable: { backgroundColor: '#28A745' },
    dayUnavailable: { backgroundColor: '#E0E0E0' },
    dayText: { fontSize: 9, fontWeight: '700' },
    dayTextAvailable: { color: '#fff' },
    dayTextUnavailable: { color: '#A0A0A0' },

    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    detailItem: { width: '48%', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
    detailLabel: { fontSize: 11, color: '#8B98A8', fontWeight: '600', textTransform: 'uppercase' },
    detailValue: { fontSize: 13, color: '#1A2332', fontWeight: '600', marginTop: 4 },

    buttonContainer: { alignItems: 'center' },
    bookButton: { backgroundColor: '#00C6FF', color: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, fontSize: 14, fontWeight: '700', textAlign: 'center', width: '100%', overflow: 'hidden' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#1A2332' },
    modalBody: { marginBottom: 20 },

    filterSectionTitle: { fontSize: 15, fontWeight: '600', color: '#1A2332', marginBottom: 12, marginTop: 16 },

    ratingFilterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    ratingPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E0E6ED', backgroundColor: '#F5F7FA' },
    ratingPillActive: { backgroundColor: '#00A8FF', borderColor: '#00A8FF' },
    ratingPillText: { fontSize: 14, fontWeight: '600', color: '#8B98A8', marginLeft: 4 },
    ratingPillTextActive: { color: '#fff' },

    categoryFilterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E0E6ED', backgroundColor: '#F5F7FA' },
    categoryPillActive: { backgroundColor: '#00A8FF', borderColor: '#00A8FF' },
    categoryPillText: { fontSize: 14, fontWeight: '500', color: '#1A2332' },
    categoryPillTextActive: { color: '#fff', fontWeight: '600' },

    toggleFilterRow: {
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        backgroundColor: '#F8FAFC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleFilterRowActive: {
        borderColor: '#7DD3FC',
        backgroundColor: '#E8F6FF',
    },
    toggleFilterTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1A2332',
    },
    toggleFilterSubtitle: {
        marginTop: 2,
        fontSize: 11,
        color: '#64748B',
    },

    filterInput: { backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 10, padding: 12, fontSize: 15, color: '#1A2332' },

    modalFooter: { flexDirection: 'row', gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E0E6ED' },
    modalClearButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#EBF0F5', alignItems: 'center' },
    modalClearButtonText: { fontSize: 15, fontWeight: '600', color: '#1A2332' },
    modalApplyButton: { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: '#00A8FF', alignItems: 'center' },
    modalApplyButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});