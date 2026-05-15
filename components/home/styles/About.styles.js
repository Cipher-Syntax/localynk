import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        marginTop: 50,
    },
    headerContainer: {
        marginBottom: 25,
        alignItems: 'center',
    },
    overline: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0072FF',
        letterSpacing: 1.5,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
        lineHeight: 34,
    },
    highlight: {
        color: '#00C6FF',
    },
    cardContainer: {
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
        borderRadius: 24,
    },
    card: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 15,
    },
    logo: {
        width: 120,
        height: 150,
    },
    description: {
        fontSize: 14,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 20,
    },
    featuresContainer: {
        gap: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
        gap: 12,
    },
    brandLine: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    }
});