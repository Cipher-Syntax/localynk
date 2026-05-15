import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' },
    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60, paddingHorizontal: 20 },
    emptyText: { fontSize: 18, color: '#1A2332', fontWeight: '600', textAlign: 'center' },
    emptySubtext: { fontSize: 14, color: '#8B98A8', marginTop: 8, textAlign: 'center' },
    
    header: { height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700' },
    
    backButton: { 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        padding: 5, 
        zIndex: 10 
    },

    destinationInfo: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#F5F7FA', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
    destinationName: { fontSize: 18, fontWeight: '700', color: '#1A2332', marginBottom: 4 },
    guideCount: { fontSize: 13, color: '#8B98A8' },

    filterCard: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        padding: 12,
    },
    searchInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 10,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 10,
        fontSize: 13,
        color: '#0F172A',
    },
    filterChipRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        borderRadius: 999,
        backgroundColor: '#F8FAFC',
    },
    filterChipActive: {
        backgroundColor: '#E0F2FE',
        borderColor: '#0EA5E9',
    },
    filterChipText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#0369A1',
        fontWeight: '700',
    },
    
    contentContainer: { padding: 16, gap: 12 },
    filteredEmptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 28,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
    },
    filteredEmptyText: {
        marginTop: 10,
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
        textAlign: 'center',
    },
    
    guideCard: { backgroundColor: '#F5F7FA', borderRadius: 15, padding: 16, borderWidth: 1, borderColor: '#E0E6ED', marginBottom: 10 },
    guideCardBusy: { backgroundColor: '#FAFAFA', borderColor: '#EEE', opacity: 0.9 }, // Style for busy guides

    cardProfileSection: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    iconWrapper: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EBF0F5', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    imageWrapper: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
    profileImage: { width: '100%', height: '100%', resizeMode: 'cover' },

    profileInfo: { flex: 1, marginLeft: 12 },
    
    nameRow: { flexDirection: 'column', alignItems: 'flex-start' },
    guideName: { fontSize: 16, fontWeight: '700', color: '#1A2332', marginBottom: 4 },
    guideAddress: { fontSize: 12, color: '#8B98A8' },
    guideRating: { fontSize: 12, color: '#C99700', marginTop: 2 },
    
    // Busy Badge Styles
    busyBadge: { backgroundColor: '#CFD8DC', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
    busyText: { fontSize: 10, color: '#455A64', fontWeight: '700', textTransform: 'uppercase' },

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
    buttonBusy: { opacity: 0.6 },
    bookButton: { backgroundColor: '#00C6FF', color: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, fontSize: 14, fontWeight: '700', textAlign: 'center', width: '100%', overflow: 'hidden' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
    modalIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#253347', marginBottom: 8, textAlign: 'center' },
    modalMessage: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    modalButton: { backgroundColor: '#253347', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, width: '100%', alignItems: 'center' },
    modalButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' }
});
