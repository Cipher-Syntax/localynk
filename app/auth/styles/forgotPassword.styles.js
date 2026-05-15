import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { flex: 1 },
    bgImage: { flex: 1, width: '100%', height: '100%' },
    gradientOverlay: { flex: 1, justifyContent: 'center' },
    keyboardView: { flex: 1, justifyContent: 'center' },
    
    contentContainer: {
        width: '100%',
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 20,
        padding: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    headerContainer: {
        width: '100%',
        marginBottom: 25,
        paddingHorizontal: 10,
    },
    titleText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8
    },
    subtitleText: {
        fontSize: 16,
        color: '#E2E8F0',
        fontWeight: '500',
    },
    formCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 30,
        paddingHorizontal: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 8,
    },
    inputWrapper: { marginBottom: 20 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        height: 50,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        height: '100%',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginLeft: 5,
        marginTop: 4,
        fontWeight: '500'
    },
    submitErrorBox: {
        borderWidth: 1,
        borderColor: '#FCA5A5',
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
    },
    submitErrorText: {
        color: '#B91C1C',
        fontSize: 13,
        fontWeight: '600',
    },
    mainButtonShadow: {
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        borderRadius: 16,
        marginTop: 10
    },
    mainButton: {
        height: 50,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    successBox: {
        alignItems: 'center',
        padding: 20,
    },
    successText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#065F46',
        marginTop: 10,
        marginBottom: 20,
    },
    loginLink: {
        color: '#0072FF',
        fontWeight: '700',
        fontSize: 16,
    },
    footerLink: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#64748B',
        fontSize: 14,
    },
    linkText: {
        color: '#0072FF',
        fontWeight: '700',
        fontSize: 14,
    }
});