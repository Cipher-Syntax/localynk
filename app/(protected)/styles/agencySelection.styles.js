import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTitle: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase'
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        padding: 5,
        zIndex: 10,
    },

    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },

    heroSection: {
        marginTop: 20,
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
    },

    filterCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        padding: 12,
        marginBottom: 14,
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
    filterSummaryText: {
        marginTop: 10,
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },

    agencyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardProfileSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        marginRight: 12,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    profilePicture: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderIcon: {
        width: '100%',
        height: '100%',
        backgroundColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    businessName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
    },
    viewProfileMiniBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    viewProfileMiniText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#00A8FF',
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#B45309', 
    },
    reviewCount: {
        fontSize: 12,
        color: '#94A3B8',
    },
    verifiedBadge: {
        padding: 4,
    },

    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 12,
    },

    scheduleWrap: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        padding: 10,
        gap: 8,
        marginBottom: 12,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    scheduleLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    scheduleValue: {
        fontSize: 12,
        color: '#0F172A',
        fontWeight: '700',
        marginLeft: 'auto',
    },

    detailsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 12,
        color: '#64748B',
    },

    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#0072FF',
        borderRadius: 12,
        gap: 8,
        backgroundColor: '#EFF6FF',
    },
    detailsButtonText: {
        color: '#0072FF',
        fontSize: 14,
        fontWeight: '700',
    },
    messageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        marginTop: 10,
        backgroundColor: '#0072FF',
        borderWidth: 1,
        borderColor: '#0072FF',
    },
    messageButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },

    loadingContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#F8FAFC'
    },
    loadingText: { 
        marginTop: 12, 
        color: '#64748B',
        fontSize: 14,
        fontWeight: '500'
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 15,
        color: '#94A3B8',
        textAlign: 'center',
        width: '80%',
        lineHeight: 22,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end', 
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        height: 'auto',        
        maxHeight: '90%',      
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    modalImageContainer: {
        width: '100%',     
        height: 200,       
        borderRadius: 16,  
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F1F5F9', 
    },
    modalImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover', 
    },
    modalPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 4,
    },
    modalRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    modalRatingText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    
    modalInfoList: {
       marginBottom: 10
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    infoIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoLabel: {
        fontSize: 12,
        color: '#64748B',
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '600',
    },

    modalFooter: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 10,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtnText: {
        color: '#64748B',
        fontWeight: '700',
        fontSize: 15,
    },
    confirmBtn: {
        flex: 2, 
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    confirmGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});
