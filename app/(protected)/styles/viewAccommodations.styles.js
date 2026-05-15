import { StyleSheet, Dimensions } from "react-native";
const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 20, fontWeight: '700', marginLeft: 12, color: '#1A2332' },
    
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 10, gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    
    guideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E0E6ED' },
    iconWrapper: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1A2332', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    profilePicture: { width: '100%', height: '100%' },
    guideName: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    guideSub: { fontSize: 13, color: '#666' },

    verticalCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    imageContainer: { height: 180, width: '100%', position: 'relative' },
    cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderImage: { width: '100%', height: '100%', backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
    
    priceBadge: {
        position: 'absolute', bottom: 10, right: 10,
        backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6
    },
    priceText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    cardContent: { padding: 12 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A2332', flex: 1 },
    iconBtn: { padding: 6, backgroundColor: '#EBF6FF', borderRadius: 6 },
    
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    locationText: { fontSize: 12, color: '#888', marginLeft: 4 },
    
    cardDesc: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 8 },

    amenitiesRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    amenityTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4 },
    amenityText: { fontSize: 11, color: '#666' },

    empty: { color: '#888', fontSize: 13, fontStyle: 'italic', marginBottom: 10, marginLeft: 4 },
    errorBox: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, marginBottom: 12 },
    errorText: { color: '#b91c1c' },

    // Confirmation Modal Styles
    confirmModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    confirmModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
    confirmTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 12, textAlign: 'center' },
    confirmText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    confirmButtonRow: { flexDirection: 'row', width: '100%', gap: 12 },
    confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    cancelBtn: { backgroundColor: '#F3F4F6' },
    deleteBtn: { backgroundColor: '#ef4444' },
    cancelBtnText: { color: '#4B5563', fontSize: 15, fontWeight: '600' },
    deleteBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    // Edit Modal & Form Styles
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A2332' },
    sectionSubTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 5, marginTop: 10 },
    
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 15 },
    input: { borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#F9FAFB', color: '#1A2332' },
    textArea: { height: 100 },
    
    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
    pillActive: { backgroundColor: '#EFF6FF', borderColor: '#0072FF' },
    pillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    pillTextActive: { color: '#0072FF' },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: (width - 64) / 3, aspectRatio: 1, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', gap: 8 },
    gridItemActive: { backgroundColor: '#0072FF', borderColor: '#0072FF' },
    gridText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    gridTextActive: { color: '#fff' },

    imageUploadLarge: { height: 160, backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 2, borderColor: '#DBEAFE', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    imageUploadSmall: { height: 45, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    uploadPlaceholder: { alignItems: 'center', gap: 8 },
    uploadText: { fontSize: 13, color: '#0072FF', fontWeight: '600' },

    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },

    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    switchTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    switchSub: { fontSize: 12, color: '#6B7280' },
    toggle: { width: 44, height: 24, backgroundColor: '#E5E7EB', borderRadius: 12, padding: 2, justifyContent: 'center' },
    toggleActive: { backgroundColor: '#0072FF' },
    toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    toggleCircleActive: { alignSelf: 'flex-end' },
    
    transportContainer: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 10 },
    capacityInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    capacityInput: { flex: 1 },
    addCapacityButton: { backgroundColor: '#0072FF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12 },
    addCapacityButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    capacityChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 6 },
    capacityChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DBEAFE', borderColor: '#93C5FD', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    capacityChipText: { color: '#1E3A8A', fontSize: 12, fontWeight: '600' },
    addTransportOptionButton: { backgroundColor: '#0F766E', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
    addTransportOptionButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    transportOptionsList: { marginTop: 12, gap: 8 },
    transportOptionCard: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
    transportOptionTitle: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
    transportOptionSubtitle: { color: '#475569', fontSize: 12, marginTop: 2 },

    saveButton: { backgroundColor: '#00A8FF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Toast Styles
    toastContainer: { 
        position: 'absolute', 
        bottom: 80, 
        left: 20, 
        right: 20, 
        borderRadius: 12, 
        padding: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 8, 
        elevation: 10, 
        zIndex: 1000 
    },
    toastSuccess: { backgroundColor: '#00c853' },
    toastError: { backgroundColor: '#ff5252' },
    toastText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 12, flexShrink: 1 }
});