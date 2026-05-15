import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 15, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
    },
    headerTitleText: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    closeButton: { padding: 5 },

    progressContainer: { backgroundColor: '#fff', paddingVertical: 20, marginBottom: 10 },
    progressInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' },
    stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', zIndex: 2 },
    stepDotActive: { backgroundColor: '#0072FF', borderColor: '#0072FF', elevation: 4, shadowColor: '#0072FF', shadowOpacity: 0.3 },
    stepNumber: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
    stepNumberActive: { color: '#fff' },
    stepLine: { width: 60, height: 3, backgroundColor: '#E5E7EB', marginHorizontal: 4, borderRadius: 2 },
    stepLineActive: { backgroundColor: '#0072FF' },

    stepContainer: { padding: 20 },
    stepTitle: { fontSize: 24, fontWeight: '800', color: '#1F2937', marginBottom: 5 },
    stepSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 25 },
    
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: '#1F2937' },
    row: { flexDirection: 'row', alignItems: 'center' },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
    gridItem: { width: '48%', marginBottom: 20 },
    gridLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    imagePicker: { 
        height: 120, backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1, 
        borderColor: '#BFDBFE', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' 
    },
    uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    uploadText: { fontSize: 12, color: '#0072FF', fontWeight: '600', marginTop: 5 },

    footer: { 
        position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', 
        borderTopWidth: 1, borderTopColor: '#F3F4F6', padding: 20, flexDirection: 'row', gap: 15, elevation: 10 
    },
    secondaryButton: { 
        paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', 
        backgroundColor: '#F3F4F6', borderRadius: 12, height: 50 
    },
    secondaryButtonText: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
    primaryButton: { flex: 1, height: 50, borderRadius: 12, overflow: 'hidden' },
    gradientBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' }
});