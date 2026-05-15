import { StyleSheet } from "react-native";


export const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
    
    // Header Styles
    header: { 
        paddingHorizontal: 20, 
        paddingTop: 40, 
        paddingBottom: 20,
        backgroundColor: '#fff', 
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    headerIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#E0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    headerText: {
        flex: 1,
    },
    title: { 
        fontSize: 26, 
        fontWeight: '800', 
        color: '#1a1a1a',
        letterSpacing: -0.5
    },
    subtitle: { 
        fontSize: 13, 
        color: '#888', 
        marginTop: 4,
        fontWeight: '500'
    },
    
    progressBar: {
        height: 4,
        backgroundColor: '#E8E8E8',
        borderRadius: 2,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#00C6FF',
        borderRadius: 2
    },

    scrollContent: { 
        paddingHorizontal: 16, 
        paddingBottom: 120, 
        paddingTop: 8
    },

    // Accordion Styles
    accordionContainer: { 
        marginBottom: 8,
        backgroundColor: '#fff', 
        borderRadius: 14, 
        overflow: 'hidden', 
        shadowColor: '#000', 
        shadowOpacity: 0.06, 
        shadowRadius: 10, 
        shadowOffset: { width: 0, height: 2 },
        elevation: 3
    },
    accordionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 16,
        backgroundColor: '#fff',
        paddingVertical: 14
    },
    accordionHeaderActive: { 
        backgroundColor: '#FAFBFC',
        borderBottomWidth: 1, 
        borderBottomColor: '#F0F0F0'
    },
    
    headerLeftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    
    categoryIconBg: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    
    categoryLabelContainer: {
        flex: 1
    },
    
    categoryTitle: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#1a1a1a',
        letterSpacing: -0.3
    },
    categorySubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
        fontWeight: '500'
    },
    
    headerRightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    
    badgeContainer: { 
        borderRadius: 12, 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        marginRight: 8
    },
    badgeText: { 
        color: '#fff', 
        fontSize: 12, 
        fontWeight: '700'
    },

    accordionBody: { 
        padding: 16, 
        backgroundColor: '#FAFBFC',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0'
    },
    
    // Grid Layout
    gridContainer: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        marginHorizontal: -4
    },
    gridItem: { 
        width: '48%', 
        height: 140, 
        borderRadius: 12, 
        marginHorizontal: 4,
        marginBottom: 12, 
        backgroundColor: '#eee', 
        overflow: 'hidden', 
        position: 'relative',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2
    },
    selectedGridItem: { 
        borderWidth: 3, 
        borderColor: '#00C6FF',
        shadowColor: '#00C6FF',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    gridImage: { 
        width: '100%', 
        height: '100%' 
    },
    
    // Item Overlays
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        zIndex: 1
    },
    
    selectedOverlay: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(0, 198, 255, 0.2)', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 3 
    },
    checkMark: { 
        position: 'absolute', 
        top: 8, 
        right: 8, 
        backgroundColor: '#00C6FF', 
        borderRadius: 14, 
        width: 28, 
        height: 28, 
        justifyContent: 'center', 
        alignItems: 'center',
        shadowColor: '#00C6FF',
        shadowOpacity: 0.5,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 5,
        zIndex: 4
    },
    
    gridTextOverlay: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: 10,
        zIndex: 2
    },
    gridTitle: { 
        color: '#fff', 
        fontSize: 13, 
        fontWeight: '700', 
        marginBottom: 4
    },
    gridRatingRow: { 
        flexDirection: 'row', 
        alignItems: 'center'
    },
    gridRatingText: { 
        color: '#fff', 
        fontSize: 11, 
        marginLeft: 4,
        fontWeight: '600'
    },
    
    featuredBadge: { 
        backgroundColor: '#FFB800', 
        paddingHorizontal: 6, 
        paddingVertical: 3, 
        borderRadius: 4, 
        marginLeft: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3
    },
    featuredText: { 
        color: '#fff', 
        fontSize: 9, 
        fontWeight: '700'
    },

    // Footer
    footer: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: '#fff', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingBottom: 20,
        borderTopWidth: 1, 
        borderTopColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
        elevation: 8,
        gap: 12
    },
    skipButton: { 
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        gap: 8
    },
    skipText: { 
        color: '#999', 
        fontSize: 15, 
        fontWeight: '600' 
    },
    confirmButton: { 
        flex: 1,
        backgroundColor: '#00C6FF', 
        paddingVertical: 13, 
        paddingHorizontal: 20, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: '#00C6FF',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4
    },
    confirmButtonDisabled: {
        backgroundColor: '#D0D0D0',
        shadowOpacity: 0.1
    },
    confirmText: { 
        color: '#fff', 
        fontWeight: '700', 
        fontSize: 15
    }
});