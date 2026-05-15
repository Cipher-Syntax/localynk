import { StyleSheet, Platform } from "react-native";

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    
    // Header
    headerContainer: { height: 260, position: 'relative' },
    headerBg: { width: '100%', height: '100%', position: 'absolute' },
    headerOverlay: { ...StyleSheet.absoluteFillObject },
    headerContent: { flex: 1, paddingHorizontal: 20 },
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
    headerTextContainer: { paddingLeft: 5 },
    greeting: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 5 },
    subGreeting: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

    // Body
    body: { flex: 1, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#F8FAFC', paddingTop: 30 },
    
    // Role Toggle
    roleToggleContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4, marginHorizontal: 20, marginBottom: 30 },
    roleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    roleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity:0.1, elevation: 2 },
    roleText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    roleTextActive: { color: '#0F172A', fontWeight: '700' },

    // Sections
    section: { paddingHorizontal: 20 },
    sectionHeader: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
    sectionSubHeader: { fontSize: 14, color: '#64748B', marginBottom: 20 },
    
    divider: { height: 8, backgroundColor: '#F1F5F9', marginVertical: 30 },

    // Guide Steps
    stepsGrid: { gap: 16 },
    stepCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity:0.03, elevation: 2 },
    stepHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    stepIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    stepNumberBox: { backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    stepNumber: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },
    stepTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 6 },
    stepDesc: { fontSize: 13, color: '#64748B', lineHeight: 20 },

    tipBox: { flexDirection: 'row', backgroundColor: '#FFFBEB', padding: 16, borderRadius: 16, marginTop: 20, gap: 12, borderWidth: 1, borderColor: '#FEF3C7' },
    tipTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 4 },
    tipText: { fontSize: 13, color: '#B45309', lineHeight: 19 },

    // FAQ
    faqList: { gap: 12 },
    accordionContainer: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    accordionHeaderActive: { backgroundColor: '#F0F9FF' },
    accordionTitle: { fontSize: 15, fontWeight: '600', color: '#475569', flex: 1, paddingRight: 10 },
    accordionTitleActive: { color: '#0284C7' },
    accordionContent: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0 },
    accordionText: { fontSize: 14, color: '#64748B', lineHeight: 22 },

    // Contact
    contactSupport: { marginTop: 40, alignItems: 'center', backgroundColor: '#1E293B', padding: 30, borderRadius: 24 },
    contactIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    contactTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    contactText: { fontSize: 14, color: '#94A3B8', marginTop: 5, marginBottom: 20, textAlign: 'center' },
    contactBtn: { backgroundColor: '#fff', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 30 },
    contactBtnText: { color: '#1E293B', fontWeight: '700', fontSize: 14 },

    // Message Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)', 
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
    },
    closeModalBtn: {
        padding: 4,
    },
    modalInstruction: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 20,
        lineHeight: 20,
    },
    modalInput: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 16,
        color: '#0F172A',
        fontSize: 15,
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 24,
    },
    modalSubmitBtn: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    modalSubmitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    modalSubmitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    modalBottomBleed: {
        position: 'absolute',
        bottom: -500, // Extends way off the bottom of the screen
        left: 0,
        right: 0,
        height: 500,
        backgroundColor: '#fff',
        zIndex: -1,
    },

    // Custom Alert Modal Styles
    alertOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    alertContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        elevation: 10,
    },
    alertIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    alertTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    alertMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    alertBtn: {
        backgroundColor: '#0F172A',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    alertBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    }
});