import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F5F7FA', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    contentContainer: { padding: 16, paddingBottom: 30 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1A2332', marginBottom: 12 },
    
    priceCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E0E6ED' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    priceLabel: { fontSize: 12, color: '#1A2332', fontWeight: '500' },
    priceValue: { fontSize: 12, color: '#1A2332', fontWeight: '600' },
    priceDivider: { height: 1, backgroundColor: '#E0E6ED', marginVertical: 10 },
    totalLabel: { fontSize: 13, fontWeight: '700', color: '#1A2332' },
    totalValue: { fontSize: 13, fontWeight: '700', color: '#00A8FF' },
    
    paymentCard: { backgroundColor: '#F5F7FA', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E0E6ED', alignItems: 'center' },
    paymentMethod: { fontSize: 13, fontWeight: '700', color: '#1A2332' },
    
    billingCard: { backgroundColor: '#F5F7FA', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E0E6ED' },
    billingRow: { flexDirection: 'row', marginBottom: 12 },
    billingFullRow: { paddingVertical: 8 },
    billingItem: { flex: 1, marginRight: 12 },
    billingLabel: { fontSize: 10, color: '#8B98A8', fontWeight: '600' },
    billingValue: { fontSize: 12, fontWeight: '600', color: '#1A2332', marginTop: 3 },
    
    confirmButton: { backgroundColor: '#00A8FF', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    cancelButton: { backgroundColor: '#fff', paddingVertical: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#00A8FF' },
    cancelButtonText: { color: '#00A8FF', fontWeight: '700', fontSize: 14 },

    confirmationContainer: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center' },
    confirmationContent: { width: '90%', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 30 },
    confirmationHeader: { fontSize: 18, fontWeight: '700', letterSpacing: 1, marginBottom: 40, opacity: 0.8, color: '#00A8FF' },
    confirmationIcon: { marginBottom: 24 },
    confirmationTitle: { fontSize: 26, fontWeight: '800', color: '#1A2332', marginBottom: 12 },
    confirmationMessage: { fontSize: 15, color: '#8B98A8', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
    confirmationButton: { backgroundColor: '#00A8FF', paddingVertical: 14, borderRadius: 8, alignItems: 'center', width: '100%' },
    confirmationButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
