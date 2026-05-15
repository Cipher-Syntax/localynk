import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    headerBar: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        gap: 10
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white', // Changed to white to match the authenticated search bar wrapper
        borderRadius: 50,
        paddingHorizontal: 15,
        paddingVertical: 10, // Slightly increased padding to match previous dimensions
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    input: {
        marginLeft: 10,
        flex: 1,
        height: 30, // Adjusted to fit vertical padding
        fontSize: 14,
        color: '#333',
    },
    loginBtn: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'white', // Changed to white to match the requested aesthetic
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    loginBtnText: {
        color: '#00C6FF', // Changed to blue to pop against the white background
        fontSize: 15,
        fontWeight: '800',
    },
    slide: {
        width: "100%",
        height: "100%",
        justifyContent: 'flex-end'
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    slideContent: {
        padding: 20,
        paddingBottom: 25,
        zIndex: 2,
    },
    topBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 15,
    },
    ratingValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1a1a1a',
        marginLeft: 4,
    },
    reviewCount: {
        fontSize: 11,
        color: '#666',
        marginLeft: 4,
    },
    textContainer: {
        marginBottom: 15,
    },
    logo: {
        fontSize: 14,
        fontWeight: '900',
        lineHeight: 24,
    },
    name: {
        fontSize: 22,
        fontWeight: '600',
        marginVertical: 4,
        lineHeight: 28,
    },
    description: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 13,
        lineHeight: 18,
        marginTop: 6,
    },
    exploreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#00C6FF',
        borderRadius: 12,
        alignSelf: 'flex-start',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    exploreText: {
        color: 'white',
        marginRight: 8,
        fontSize: 14,
        fontWeight: '700',
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 8,
        zIndex: 5,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 198, 255, 0.3)',
        borderWidth: 1.5,
        borderColor: 'rgba(0, 198, 255, 0.5)',
    },
    activeDot: {
        backgroundColor: '#00C6FF',
        borderColor: '#00C6FF',
        width: 28,
    },
});