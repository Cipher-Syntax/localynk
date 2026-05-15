import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    
    header: { position: 'relative', height: 120, justifyContent: 'center' },
    headerImage: { width: '100%', height: '100%', resizeMode: 'cover', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    overlay: { ...StyleSheet.absoluteFillObject, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
    headerTitle: { position: 'absolute', bottom: 15, left: 20, color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },

    // --- ADDED BACK BUTTON STYLE ---
    backButton: { position: 'absolute', top: 20, left: 20, padding: 5, zIndex: 10 },

    heroContainer: { height: 280, margin: 15, borderRadius: 24, overflow: 'hidden', position: 'relative', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: {width:0, height: 5} },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    heroOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%' },
    heroContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 4 },
    
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    ratingText: { fontSize: 13, color: '#fff', fontWeight: '600' },
    
    categoryBadge: { position: 'absolute', top: 15, left: 15, backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width:0,height:2} },
    categoryText: { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    
    imageIndicators: { position: 'absolute', top: 20, right: 20, flexDirection: 'row', gap: 4 },
    indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    activeIndicator: { width: 20, backgroundColor: '#fff' },

    infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 16, marginHorizontal: 15, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
    infoLabel: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    infoText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },

    section: { paddingHorizontal: 15, marginTop: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
    sectionText: { fontSize: 15, color: '#475569', lineHeight: 24 },

    imageCard: { width: 140, height: 100, borderRadius: 12, overflow: 'hidden', marginRight: 12, borderWidth: 2, borderColor: 'transparent' },
    activeImageCard: { borderColor: '#3B82F6' },
    imageCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    imageOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%', backgroundColor: 'rgba(0,0,0,0.1)' },
    
    attractionCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, padding: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: '#F1F5F9' },
    attractionImage: { width: 80, height: 80, borderRadius: 12, marginRight: 12 },
    attractionContent: { flex: 1, justifyContent: 'center' },
    attractionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    attractionDesc: { fontSize: 13, color: '#64748B', lineHeight: 18 },

    // Reviews Styles
    reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
    ratingBadgeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    
    // Empty Reviews Styling
    emptyReviewsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginTop: 8
    },
    emptyReviewsImage: {
        width: 80, 
        height: 80, 
        opacity: 0.5, 
        marginBottom: 12
    },
    emptyReviewsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4
    },
    emptyReviewsText: { 
        fontSize: 14, 
        color: '#94A3B8', 
        textAlign: 'center' 
    },
    
    reviewCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    reviewerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 16, fontWeight: '700', color: '#0284C7' },
    reviewerName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    reviewDate: { fontSize: 11, color: '#94A3B8' },
    starsRow: { flexDirection: 'row', gap: 2 },
    reviewComment: { fontSize: 14, color: '#475569', lineHeight: 20 },

    stickyFooter: { padding: 20, paddingBottom: 40 },
    bookButton: { borderRadius: 16, overflow: 'hidden', shadowColor: '#0072FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    gradientBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
    bookButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
