import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { position: 'relative', zIndex: 9999, elevation: 9999, marginBottom: 10, overflow: 'visible' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12 },
    icon: { marginRight: 8 },
    input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#1F2937' },
    dropdown: { position: 'absolute', top: 55, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, elevation: 10, zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
    resultItem: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    existingBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 },
    existingText: { fontSize: 11, fontWeight: '700', color: '#0891B2', letterSpacing: 0.5 },
    resultName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
    resultSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});