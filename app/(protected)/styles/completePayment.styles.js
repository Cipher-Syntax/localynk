import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
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
        fontWeight: '700',
        letterSpacing: 1,
    },
    contentContainer: {
        padding: 16,
    },
    guideInfoCard: {
        backgroundColor: '#253347',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    guideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    guideIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0072FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    guideInfo: {
        flex: 1,
    },
    guideName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    guideDetail: {
        color: '#E0E0E0',
        fontSize: 14,
        marginTop: 2,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A2332',
        marginBottom: 12,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateInput: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        marginHorizontal: 4,
    },
    dateInputText: {
        fontSize: 14,
        color: '#1A2332',
    },
    readOnly: {
        backgroundColor: '#E0E0E0',
    },
    priceCard: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    priceLabel: {
        fontSize: 14,
        color: '#5B6878',
    },
    priceValue: {
        fontSize: 14,
        color: '#1A2332',
        fontWeight: '600',
    },
    priceDivider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 10,
    },
    totalLabel: {
        fontSize: 16,
        color: '#1A2332',
        fontWeight: '700',
    },
    totalValue: {
        fontSize: 18,
        color: '#0072FF',
        fontWeight: '700',
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#0072FF',
        marginRight: 12,
    },
    radioButtonActive: {
        backgroundColor: '#0072FF',
    },
    paymentOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A2332',
    },
    confirmButton: {
        backgroundColor: '#0072FF',
        borderRadius: 50,
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    readOnlyContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        flex: 1,
        marginHorizontal: 4,
    },
    readOnlyLabel: {
        fontSize: 12,
        color: '#8B98A8',
        marginBottom: 4,
    },
    readOnlyValue: {
        fontSize: 14,
        color: '#1A2332',
        fontWeight: '600',
    },
    billingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
});
