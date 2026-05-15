import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    wrapper: { marginTop: 2, marginBottom: 10, borderWidth: 1, borderColor: '#DBEAFE', borderRadius: 12, backgroundColor: '#EFF6FF', padding: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    title: { fontSize: 13, fontWeight: '700', color: '#1E3A8A' },
    subtitle: { marginTop: 4, fontSize: 12, color: '#334155', marginBottom: 8 },
    mapContainer: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#BFDBFE' },
    map: { width: '100%', height: 190 },
    mapUnavailable: { minHeight: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFBEB' },
    mapUnavailableTitle: { fontSize: 12, fontWeight: '700', color: '#78350F' },
});