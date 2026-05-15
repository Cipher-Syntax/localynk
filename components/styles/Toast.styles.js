import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    toastContainer: { position: 'absolute', top: 50, zIndex: 9999, alignSelf: 'center', backgroundColor: '#1F2937', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, width: '90%', shadowOpacity: 0.2, elevation: 5 },
    toastSuccess: { borderLeftWidth: 4, borderLeftColor: '#22C55E' },
    toastError: { borderLeftWidth: 4, borderLeftColor: '#EF4444' },
    toastText: { color: '#fff', marginLeft: 10, fontWeight: '600' }
});