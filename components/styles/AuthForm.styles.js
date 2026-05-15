import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { flex: 1 },
    bgImage: { flex: 1, width: '100%', height: '100%' },
    gradientOverlay: { flex: 1 }, 
    keyboardView: { flex: 1 },
    
    scrollContentContainer: {
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    
    innerContentWrapper: {
        width: '100%',
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },

    headerContainer: {
        width: '100%',
        marginBottom: 25,
        paddingHorizontal: 10,
    },
    welcomeText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitleText: {
        fontSize: 16,
        color: '#E2E8F0',
        marginTop: 5,
        fontWeight: '500',
    },

    formCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingVertical: 30,
        paddingHorizontal: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
        marginBottom: 20
    },

    progressContainer: {
        marginBottom: 18,
    },
    progressInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    stepDotActive: {
        backgroundColor: '#0072FF',
        borderColor: '#0072FF',
    },
    stepNumber: {
        color: '#9CA3AF',
        fontWeight: '700',
        fontSize: 13,
    },
    stepNumberActive: {
        color: '#fff',
    },
    stepLine: {
        width: 58,
        height: 3,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
        borderRadius: 2,
    },
    stepLineActive: {
        backgroundColor: '#0072FF',
    },
    stepCaption: {
        marginTop: 10,
        textAlign: 'center',
        color: '#475569',
        fontSize: 12,
        fontWeight: '600',
    },

    inputWrapper: { marginBottom: 15 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        height: 56,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    iconContainer: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        height: '100%',
    },
    dateValueText: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
    },
    datePlaceholderText: {
        color: '#94A3B8',
    },
    birthdatePickerWrap: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
    },
    birthdateDoneButton: {
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingVertical: 10,
        paddingHorizontal: 16,
        alignItems: 'flex-end',
    },
    birthdateDoneText: {
        color: '#0072FF',
        fontSize: 14,
        fontWeight: '700',
    },
    eyeIcon: {
        padding: 10,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginLeft: 5,
        marginTop: 4,
        fontWeight: '500'
    },

    messageBox: {
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },
    msgError: { backgroundColor: '#FEF2F2' },
    msgSuccess: { backgroundColor: '#ECFDF5' },
    messageText: { fontSize: 13, textAlign: 'center', fontWeight: '600' },
    
    actionButtonsRow: {
        flexDirection: 'row',
        marginTop: 10,
        gap: 15,
        justifyContent: 'center'
    },
    actionButton: {
        backgroundColor: 'rgba(0, 114, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0072FF'
    },
    actionText: {
        color: '#0072FF',
        fontWeight: '700',
        fontSize: 12
    },

    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
        marginTop: 5,
    },
    rememberRow: { flexDirection: 'row', alignItems: 'center' },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#0072FF',
        borderColor: '#0072FF',
    },
    rememberText: { color: '#64748B', fontSize: 14, fontWeight: '500' },
    forgotText: { color: '#0072FF', fontSize: 14, fontWeight: '600' },

    secondaryActionButton: {
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    secondaryActionText: {
        color: '#334155',
        fontSize: 15,
        fontWeight: '700',
    },

    mainButtonShadow: {
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        borderRadius: 16,
    },
    mainButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginRight: 10,
    },

    footerContainer: { marginTop: 25, alignItems: 'center' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
    divider: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
    orText: { marginHorizontal: 15, color: '#94A3B8', fontSize: 14, fontWeight: '600' },
    
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    googleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
        marginLeft: 12,
    },

    switchContainer: { flexDirection: 'row', alignItems: 'center' },
    switchText: { color: '#64748B', fontSize: 15 },
    switchLink: { color: '#0072FF', fontSize: 15, fontWeight: '700' },
});