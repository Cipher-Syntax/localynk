import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff"
    },
    safeArea: {
        flex: 1,
        backgroundColor: "#F5F7FA"
    },
    scrollContent: { 
        flexGrow: 1 
    },
    
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalCard: {
        width: '85%',
        backgroundColor: "white",
        borderRadius: 24,
        padding: 30,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10
    },
    crownContainer: {
        marginTop: -50,
        marginBottom: 15,
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF', 
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        textAlign: "center",
        marginBottom: 5,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: "center",
        marginBottom: 20,
    },
    pricingSection: {
        width: '100%',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    bestValueTag: {
        position: 'absolute',
        top: -10,
        backgroundColor: '#FFD700',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    bestValueText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 10,
    },
    modalBodyText: {
        fontSize: 13,
        color: '#374151',
        textAlign: "center",
        marginBottom: 15,
        lineHeight: 20,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    currencySymbol: {
        fontSize: 18,
        color: '#111827',
        fontWeight: '600',
        marginTop: 6,
        marginRight: 2,
    },
    priceText: {
        fontSize: 36,
        color: '#111827',
        fontWeight: '800',
    },
    perYearText: {
        fontSize: 14,
        color: '#6B7280',
        alignSelf: 'flex-end',
        marginBottom: 8,
        marginLeft: 2,
    },
    subscribeButton: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        marginBottom: 12,
    },
    gradientButton: {
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    buttonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    closeButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    closeButtonText: {
        color: "#9CA3AF",
        fontWeight: "600",
        fontSize: 14,
    }
});