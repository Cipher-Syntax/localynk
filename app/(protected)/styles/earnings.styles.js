import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    backButton: { padding: 4 },

    listContent: { paddingBottom: 40 },
    listFooterLoader: { paddingVertical: 16, alignItems: 'center' },
    dashboardContainer: { padding: 20 },

    filterCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    filterCardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
    pendingChangesBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10 },
    pendingChangesText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
    searchInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#0F172A', marginBottom: 10, backgroundColor: '#F8FAFC' },
    filterLabel: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: 8, marginTop: 6 },
    chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
    amountRow: { flexDirection: 'row', gap: 8 },
    amountInput: { flex: 1, marginBottom: 0 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
    filterChipActive: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
    filterChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
    filterChipTextActive: { color: '#1D4ED8' },
    filterActionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    applyFiltersButton: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1D4ED8' },
    applyFiltersButtonDisabled: { backgroundColor: '#93C5FD' },
    applyFiltersText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
    clearFiltersButton: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#EFF6FF' },
    clearFiltersText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8' },

    totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderRadius: 20, marginBottom: 20, shadowColor: '#0072FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4 },
    totalAmount: { color: '#fff', fontSize: 30, fontWeight: '800' },
    totalIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },

    statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    statBox: { flex: 1, padding: 15, borderRadius: 16, justifyContent: 'center' },
    statLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
    statValue: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    statSub: { fontSize: 11, color: '#64748B' },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
    sectionDesc: { fontSize: 13, color: '#64748B', marginBottom: 15 },

    transactionCard: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    transactionLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
    iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    iconSettled: { backgroundColor: '#D1FAE5' },
    iconPending: { backgroundColor: '#FEF3C7' },
    
    transTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
    transSubtitle: { fontSize: 12, color: '#64748B' },
    transId: { fontSize: 10, color: '#94A3B8', marginTop: 4 },

    transactionRight: { alignItems: 'flex-end' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeSettled: { backgroundColor: '#ECFDF5' },
    badgePending: { backgroundColor: '#FFFBEB' },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    textSettled: { color: '#059669' },
    textPending: { color: '#D97706' },

    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E2E8F0' },
    
    breakdownContainer: { paddingHorizontal: 4 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    breakdownLabel: { fontSize: 12, color: '#64748B', fontWeight: '500' },
    breakdownValue: { fontSize: 12, color: '#334155', fontWeight: '600' },
    
    netPayoutRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    netPayoutLabel: { fontSize: 13, color: '#00A8FF', fontWeight: '700', textTransform: 'uppercase' },
    netPayoutValue: { fontSize: 16, color: '#00A8FF', fontWeight: '800' },
    payoutMetaBox: { marginTop: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
    payoutMetaText: { fontSize: 11, color: '#475569', fontWeight: '600', marginBottom: 2 },

    emptyContainer: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
    emptyText: { marginTop: 10, fontSize: 14, color: '#64748B' }
});
