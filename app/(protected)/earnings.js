import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
    View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; 
import { useRouter, useFocusEffect } from 'expo-router';

import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import ScreenSafeArea from '../../components/ScreenSafeArea';

const DEFAULT_SERVER_FILTERS = {
    statusFilter: 'all',
    dateRangeFilter: 'all',
    sortBy: 'latest',
    minAmount: '',
    maxAmount: '',
};

const Earnings = () => {
    useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(DEFAULT_SERVER_FILTERS.statusFilter);
    const [dateRangeFilter, setDateRangeFilter] = useState(DEFAULT_SERVER_FILTERS.dateRangeFilter);
    const [sortBy, setSortBy] = useState(DEFAULT_SERVER_FILTERS.sortBy);
    const [minAmount, setMinAmount] = useState(DEFAULT_SERVER_FILTERS.minAmount);
    const [maxAmount, setMaxAmount] = useState(DEFAULT_SERVER_FILTERS.maxAmount);
    const [appliedFilters, setAppliedFilters] = useState(DEFAULT_SERVER_FILTERS);
    const filtersRef = useRef(DEFAULT_SERVER_FILTERS);
    
    // Stats
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [pendingPayout, setPendingPayout] = useState(0);
    const [settledPayout, setSettledPayout] = useState(0);

    const getDateRangeStart = (range) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const start = new Date(now);

        if (range === '7d') start.setDate(now.getDate() - 7);
        if (range === '30d') start.setDate(now.getDate() - 30);
        if (range === '90d') start.setDate(now.getDate() - 90);

        return start.toISOString().split('T')[0];
    };

    const hasPendingFilterChanges = useMemo(() => {
        const normalize = (value) => String(value || '').trim();
        return (
            statusFilter !== appliedFilters.statusFilter
            || dateRangeFilter !== appliedFilters.dateRangeFilter
            || sortBy !== appliedFilters.sortBy
            || normalize(minAmount) !== normalize(appliedFilters.minAmount)
            || normalize(maxAmount) !== normalize(appliedFilters.maxAmount)
        );
    }, [appliedFilters, dateRangeFilter, maxAmount, minAmount, sortBy, statusFilter]);

    const fetchEarningsData = useCallback(async (filters = {}, options = {}) => {
        const { showLoader = false, showRefresh = false } = options;

        if (showLoader) setLoading(true);
        if (showRefresh) setRefreshing(true);

        try {
            // Fetch financial records for guide payouts with user-selected filters.
            const {
                statusFilter: selectedStatus = 'all',
                dateRangeFilter: selectedDateRange = 'all',
                sortBy: selectedSortBy = 'latest',
                minAmount: selectedMinAmount = '',
                maxAmount: selectedMaxAmount = '',
            } = filters;

            const params = {
                view_as: 'guide',
                financial_only: '1',
                sort: selectedSortBy,
            };

            if (selectedStatus !== 'all') {
                params.payout_status = selectedStatus;
            }

            if (selectedDateRange !== 'all') {
                params.date_from = getDateRangeStart(selectedDateRange);
                params.date_to = new Date().toISOString().split('T')[0];
            }

            const trimmedMinAmount = String(selectedMinAmount || '').trim();
            const trimmedMaxAmount = String(selectedMaxAmount || '').trim();
            if (trimmedMinAmount) {
                params.min_amount = trimmedMinAmount;
            }
            if (trimmedMaxAmount) {
                params.max_amount = trimmedMaxAmount;
            }

            const response = await api.get('/api/bookings/', { params });
            const raw = response.data;
            const data = Array.isArray(raw) ? raw : (Array.isArray(raw?.results) ? raw.results : []);
            
            setBookings(data);
            calculateStats(data);
        } catch (error) {
            console.error('Failed to fetch earnings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const filteredBookings = useMemo(() => {
        const query = String(searchTerm || '').trim().toLowerCase();
        if (!query) return bookings;

        return bookings.filter((item) => {
            const touristName = [
                String(item?.tourist_detail?.first_name || '').trim(),
                String(item?.tourist_detail?.last_name || '').trim(),
            ].filter(Boolean).join(' ').toLowerCase();

            const destinationName = String(item?.destination_detail?.name || '').toLowerCase();
            const accommodationTitle = String(item?.accommodation_detail?.title || '').toLowerCase();
            const bookingId = String(item?.id || '');

            return touristName.includes(query)
                || destinationName.includes(query)
                || accommodationTitle.includes(query)
                || bookingId.includes(query);
        });
    }, [bookings, searchTerm]);

    const calculateStats = (data) => {
        let total = 0;
        let pending = 0;
        let settled = 0;

        data.forEach(booking => {
            // Only count confirmed or completed bookings for earnings
            if (['Confirmed', 'Completed'].includes(booking.status)) {
                
                // Calculate Net Payout (Down Payment - 2% Platform Fee)
                // Use backend value if available, otherwise calculate manually
                const downPayment = parseFloat(booking.down_payment || 0);
                const totalBookingPrice = parseFloat(booking.total_price || 0);
                
                // If backend provides specific payout amount, use it, else calculate
                let netPayout = parseFloat(booking.guide_payout_amount || 0);
                
                if (netPayout === 0 && downPayment > 0) {
                    const commission = booking.platform_fee ? parseFloat(booking.platform_fee) : (totalBookingPrice * 0.02);
                    netPayout = downPayment - commission;
                }

                if (netPayout > 0) {
                    total += netPayout;
                    
                    if (booking.is_payout_settled) {
                        settled += netPayout;
                    } else {
                        pending += netPayout;
                    }
                }
            }
        });

        setTotalEarnings(total);
        setPendingPayout(pending);
        setSettledPayout(settled);
    };

    useFocusEffect(useCallback(() => {
        fetchEarningsData(filtersRef.current, { showLoader: true });
    }, [fetchEarningsData]));

    const onRefresh = useCallback(() => { 
        fetchEarningsData(filtersRef.current, { showRefresh: true }); 
    }, [fetchEarningsData]);

    const handleApplyFilters = () => {
        const selectedFilters = {
            statusFilter,
            dateRangeFilter,
            sortBy,
            minAmount: String(minAmount || '').trim(),
            maxAmount: String(maxAmount || '').trim(),
        };
        setMinAmount(selectedFilters.minAmount);
        setMaxAmount(selectedFilters.maxAmount);
        setAppliedFilters(selectedFilters);
        filtersRef.current = selectedFilters;
        fetchEarningsData(selectedFilters, { showRefresh: true });
    };

    const handleResetFilters = () => {
        const defaults = { ...DEFAULT_SERVER_FILTERS };

        setSearchTerm('');
        setStatusFilter(defaults.statusFilter);
        setDateRangeFilter(defaults.dateRangeFilter);
        setSortBy(defaults.sortBy);
        setMinAmount(defaults.minAmount);
        setMaxAmount(defaults.maxAmount);
        setAppliedFilters(defaults);
        filtersRef.current = defaults;
        fetchEarningsData(defaults, { showRefresh: true });
    };

    const renderPayoutItem = ({ item }) => {
        // Skip bookings that aren't financially relevant (e.g. Cancelled/Declined or no downpayment)
        if (!['Confirmed', 'Completed'].includes(item.status)) return null;

        const downPayment = parseFloat(item.down_payment || 0);
        const totalBookingPrice = parseFloat(item.total_price || 0);
        const commission = parseFloat(item.platform_fee || (totalBookingPrice * 0.02));
        
        let payoutAmount = parseFloat(item.guide_payout_amount || 0);
        
        // Fallback calculation if backend is 0
        if (payoutAmount === 0) {
            payoutAmount = downPayment - commission;
        }

        if (payoutAmount <= 0) return null;

        const isSettled = item.is_payout_settled;
        const touristName = [
            String(item?.tourist_detail?.first_name || '').trim(),
            String(item?.tourist_detail?.last_name || '').trim(),
        ].filter(Boolean).join(' ') || 'Guest';
        const createdAt = item.created_at ? new Date(item.created_at) : null;
        const date = createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toLocaleDateString() : 'N/A';
        const settledAt = item.payout_settled_at ? new Date(item.payout_settled_at) : null;
        const settledAtText = settledAt && !Number.isNaN(settledAt.getTime()) ? settledAt.toLocaleString() : null;
        const payoutChannel = item.payout_channel || null;
        const payoutReference = String(item.payout_reference_id || '').trim();

        return (
            <View style={styles.transactionCard}>
                {/* Top Section */}
                <View style={styles.transactionHeader}>
                    <View style={styles.transactionLeft}>
                        <View style={[styles.iconBox, isSettled ? styles.iconSettled : styles.iconPending]}>
                            <Ionicons name={isSettled ? "checkmark" : "time"} size={18} color={isSettled ? "#059669" : "#D97706"} />
                        </View>
                        <View>
                            <Text style={styles.transTitle}>{item.accommodation_detail?.title || item.destination_detail?.name || "Tour Service"}</Text>
                            <Text style={styles.transSubtitle}>{touristName} • {date}</Text>
                            <Text style={styles.transId}>ID: #{item.id}</Text>
                        </View>
                    </View>
                    <View style={styles.transactionRight}>
                        <View style={[styles.statusBadge, isSettled ? styles.badgeSettled : styles.badgePending]}>
                            <Text style={[styles.statusText, isSettled ? styles.textSettled : styles.textPending]}>
                                {isSettled ? "Settled" : "Processing"}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* PAYOUT BREAKDOWN SECTION */}
                <View style={styles.breakdownContainer}>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Total Trip Price</Text>
                        <Text style={styles.breakdownValue}>₱{totalBookingPrice.toLocaleString()}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Downpayment (Paid)</Text>
                        <Text style={styles.breakdownValue}>₱{downPayment.toLocaleString()}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownLabel, { color: '#EF4444' }]}>Less: App Fee (2%)</Text>
                        <Text style={[styles.breakdownValue, { color: '#EF4444' }]}>- ₱{commission.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                    </View>
                    
                    <View style={styles.netPayoutRow}>
                        <Text style={styles.netPayoutLabel}>Net Payout ({isSettled ? "Received" : "Incoming"})</Text>
                        <Text style={styles.netPayoutValue}>+ ₱{payoutAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</Text>
                    </View>

                    {isSettled && (payoutChannel || payoutReference || settledAtText) && (
                        <View style={styles.payoutMetaBox}>
                            {!!payoutChannel && <Text style={styles.payoutMetaText}>Channel: {payoutChannel}</Text>}
                            {!!payoutReference && <Text style={styles.payoutMetaText}>Reference: {payoutReference}</Text>}
                            {!!settledAtText && <Text style={styles.payoutMetaText}>Settled At: {settledAtText}</Text>}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A8FF" />
            </View>
        );
    }

    return (
        <ScreenSafeArea edges={['top', 'bottom']} style={styles.container}>
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Earnings & Payments</Text>
                <View style={{width: 24}} /> 
            </View>

            <FlatList
                data={filteredBookings}
                renderItem={renderPayoutItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#00A8FF"]} />}
                ListHeaderComponent={
                    <View style={styles.dashboardContainer}>
                        

                        {/* Total Balance Card */}
                        <LinearGradient
                            colors={['#00A8FF', '#0072FF']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 1}}
                            style={styles.totalCard}
                        >
                            <View>
                                <Text style={styles.totalLabel}>Total Lifetime Earnings</Text>
                                <Text style={styles.totalAmount}>{totalEarnings.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</Text>
                            </View>
                            <View style={styles.totalIconBg}>
                                <Ionicons name="wallet" size={24} color="#fff" />
                            </View>
                        </LinearGradient>

                        {/* Status Breakdown */}
                        <View style={styles.statsRow}>
                            <View style={[styles.statBox, { backgroundColor: '#FEF3C7' }]}>
                                <Text style={[styles.statLabel, { color: '#D97706' }]}>Pending Payout</Text>
                                <Text style={[styles.statValue, { color: '#B45309' }]}>{pendingPayout.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</Text>
                                <Text style={styles.statSub}>From App Admin</Text>
                            </View>
                            
                            <View style={[styles.statBox, { backgroundColor: '#D1FAE5' }]}>
                                <Text style={[styles.statLabel, { color: '#059669' }]}>Settled / Paid</Text>
                                <Text style={[styles.statValue, { color: '#047857' }]}>{settledPayout.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</Text>
                                <Text style={styles.statSub}>Received</Text>
                            </View>
                        </View>

                        <View style={styles.filterCard}>
                            <Text style={styles.filterCardTitle}>Quick Filters</Text>
                            {hasPendingFilterChanges && (
                                <View style={styles.pendingChangesBadge}>
                                    <Ionicons name="alert-circle" size={12} color="#92400E" />
                                    <Text style={styles.pendingChangesText}>Changes not applied</Text>
                                </View>
                            )}
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by tourist, destination, or booking ID"
                                placeholderTextColor="#94A3B8"
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                            />

                            <Text style={styles.filterLabel}>Payout Status</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                                {[
                                    { key: 'all', label: 'All' },
                                    { key: 'pending', label: 'Pending' },
                                    { key: 'settled', label: 'Settled' },
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.key}
                                        onPress={() => setStatusFilter(option.key)}
                                        style={[styles.filterChip, statusFilter === option.key && styles.filterChipActive]}
                                    >
                                        <Text style={[styles.filterChipText, statusFilter === option.key && styles.filterChipTextActive]}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.filterLabel}>Date Range</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                                {[
                                    { key: 'all', label: 'All Time' },
                                    { key: '7d', label: 'Last 7 Days' },
                                    { key: '30d', label: 'Last 30 Days' },
                                    { key: '90d', label: 'Last 90 Days' },
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.key}
                                        onPress={() => setDateRangeFilter(option.key)}
                                        style={[styles.filterChip, dateRangeFilter === option.key && styles.filterChipActive]}
                                    >
                                        <Text style={[styles.filterChipText, dateRangeFilter === option.key && styles.filterChipTextActive]}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.filterLabel}>Sort</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                                {[
                                    { key: 'latest', label: 'Latest' },
                                    { key: 'oldest', label: 'Oldest' },
                                    { key: 'amount_desc', label: 'Highest Amount' },
                                    { key: 'amount_asc', label: 'Lowest Amount' },
                                ].map((option) => (
                                    <TouchableOpacity
                                        key={option.key}
                                        onPress={() => setSortBy(option.key)}
                                        style={[styles.filterChip, sortBy === option.key && styles.filterChipActive]}
                                    >
                                        <Text style={[styles.filterChipText, sortBy === option.key && styles.filterChipTextActive]}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.filterLabel}>Payout Amount Range</Text>
                            <View style={styles.amountRow}>
                                <TextInput
                                    style={[styles.searchInput, styles.amountInput]}
                                    placeholder="Min amount"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                    value={minAmount}
                                    onChangeText={setMinAmount}
                                />
                                <TextInput
                                    style={[styles.searchInput, styles.amountInput]}
                                    placeholder="Max amount"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                    value={maxAmount}
                                    onChangeText={setMaxAmount}
                                />
                            </View>

                            <View style={styles.filterActionsRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.applyFiltersButton,
                                        (!hasPendingFilterChanges || refreshing) && styles.applyFiltersButtonDisabled,
                                    ]}
                                    onPress={handleApplyFilters}
                                    disabled={refreshing || !hasPendingFilterChanges}
                                >
                                    <Text style={styles.applyFiltersText}>{hasPendingFilterChanges ? 'Apply Filters' : 'Applied'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.clearFiltersButton}
                                    onPress={handleResetFilters}
                                    disabled={refreshing}
                                >
                                    <Text style={styles.clearFiltersText}>Reset Filters</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Transaction History</Text>
                        <Text style={styles.sectionDesc}>Payouts from down payments collected by the app.</Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>{String(searchTerm || '').trim() ? 'No matching transactions found.' : 'No transactions yet.'}</Text>
                    </View>
                }
            />
        </ScreenSafeArea>
    );
};

export default Earnings;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
    backButton: { padding: 4 },

    listContent: { paddingBottom: 40 },
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
