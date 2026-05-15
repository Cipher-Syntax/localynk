import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    card: { marginTop: 10, borderWidth: 1, borderColor: '#DBEAFE', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    title: { fontSize: 12, fontWeight: '700', color: '#1E3A8A' },
    subtitle: { fontSize: 11, color: '#334155', marginTop: 1 },
    map: { width: '100%', height: 130, borderRadius: 10, overflow: 'hidden' },
    resolvingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.75)', alignItems: 'center', justifyContent: 'center', gap: 6 },
    resolvingText: { fontSize: 11, color: '#1E3A8A', fontWeight: '700' },
    mapUnavailable: { width: '100%', height: 130, borderRadius: 10, borderWidth: 1, borderColor: '#FCD34D', backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', gap: 4 },
    mapUnavailableText: { fontSize: 11, color: '#92400E', fontWeight: '600' },
    coordinatesText: { marginTop: 8, fontSize: 11, color: '#334155', fontWeight: '700' },
    coordinatesHint: { marginTop: 8, fontSize: 11, color: '#64748B', fontWeight: '600' },
    openButton: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BFDBFE', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
    openButtonText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
});