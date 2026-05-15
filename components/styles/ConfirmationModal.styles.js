import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    confirmModalBox: { width: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' },
    confirmIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    confirmTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    confirmDesc: { textAlign: 'center', color: '#6B7280', marginBottom: 20 },
    confirmBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    modalBtnCancel: { backgroundColor: '#F3F4F6' },
    modalBtnDestructive: { backgroundColor: '#DC2626' },
    modalBtnPrimary: { backgroundColor: '#007AFF' },
    modalBtnTextCancel: { fontWeight: '600', color: '#374151' },
    modalBtnTextConfirm: { fontWeight: '600', color: '#fff' },
});