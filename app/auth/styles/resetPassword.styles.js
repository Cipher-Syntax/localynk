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
    tokenContainer: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 8
    },
    helperText: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 8
    },
    smallInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 6,
        padding: 8,
        fontSize: 12,
        marginBottom: 8
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
    
    messageBox: {
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    msgError: { 
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA' 
    },
    msgSuccess: { 
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0' 
    },
    messageText: {
        fontSize: 14, 
        fontWeight: '700', 
    },
    messageSubText: {
        fontSize: 13,
        color: '#334155',
        textAlign: 'center',
        marginBottom: 8
    },
    loginLinkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        padding: 8
    },
    loginLinkText: {
        color: '#0072FF',
        fontWeight: '700',
        fontSize: 14,
    }
});