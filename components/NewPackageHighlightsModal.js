import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatHighlightDateLabel } from '../utils/newPackageHighlights';

const NewPackageHighlightsModal = ({
    visible,
    onClose,
    destinationName,
    targetDate,
    packages = [],
    onSelectPackage,
    title = 'New Packages Yesterday',
    emptyMessage = 'No new packages were added yesterday.',
}) => {
    const formattedDate = formatHighlightDateLabel(targetDate);
    const safePackages = Array.isArray(packages) ? packages : [];
    const guidePackages = safePackages.filter((pkg) => String(pkg?.owner_type || '').toLowerCase() !== 'agency');
    const agencyPackages = safePackages.filter((pkg) => String(pkg?.owner_type || '').toLowerCase() === 'agency');

    const renderPackageList = (items, emptyLabel) => {
        if (!Array.isArray(items) || items.length === 0) {
            return <Text style={styles.sectionEmptyText}>{emptyLabel}</Text>;
        }

        return items.map((pkg) => {
            const ownerLabel = pkg.owner_type === 'agency' ? 'Agency' : 'Guide';
            const durationDays = Number.parseInt(pkg.duration_days, 10) || 1;

            return (
                <TouchableOpacity
                    key={pkg.id}
                    style={styles.packageCard}
                    activeOpacity={0.85}
                    onPress={() => onSelectPackage?.(pkg)}
                    disabled={!onSelectPackage}
                >
                    <View style={styles.packageHeader}>
                        <View style={styles.ownerBadge}>
                            <Text style={styles.ownerBadgeText}>{ownerLabel}</Text>
                        </View>
                        <Text style={styles.ownerName} numberOfLines={1}>{pkg.owner_name}</Text>
                    </View>

                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packageMeta}>{durationDays} day package</Text>

                    {onSelectPackage && (
                        <View style={styles.selectHintRow}>
                            <Ionicons name="flash-outline" size={13} color="#1D4ED8" />
                            <Text style={styles.selectHintText}>Tap to view this package</Text>
                        </View>
                    )}
                </TouchableOpacity>
            );
        });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <SafeAreaView edges={['bottom']} style={styles.overlay}>
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.title}>{title}</Text>
                            <Text style={styles.subtitle}>
                                {destinationName || 'This destination'} added new tour packages on {formattedDate}.
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Ionicons name="close" size={18} color="#0F172A" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                        {safePackages.length === 0 ? (
                            <View style={styles.emptyWrap}>
                                <Ionicons name="sparkles-outline" size={30} color="#94A3B8" />
                                <Text style={styles.emptyText}>{emptyMessage}</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.summaryCard}>
                                    <Text style={styles.summaryTitle}>NEW TOUR PACKAGE {safePackages.length}</Text>
                                    <Text style={styles.summarySubtitle}>
                                        Tourist Guide: {guidePackages.length} • Agency: {agencyPackages.length}
                                    </Text>
                                </View>

                                <View style={styles.sectionCard}>
                                    <View style={styles.sectionHeader}>
                                        <View style={styles.sectionHeaderLeft}>
                                            <Ionicons name="person-outline" size={14} color="#1D4ED8" />
                                            <Text style={styles.sectionTitle}>Tourist Guide Packages</Text>
                                        </View>
                                        <Text style={styles.sectionCount}>{guidePackages.length}</Text>
                                    </View>
                                    {renderPackageList(guidePackages, 'No new tourist guide packages yesterday.')}
                                </View>

                                <View style={styles.sectionCard}>
                                    <View style={styles.sectionHeader}>
                                        <View style={styles.sectionHeaderLeft}>
                                            <Ionicons name="business-outline" size={14} color="#0E7490" />
                                            <Text style={styles.sectionTitle}>Agency Packages</Text>
                                        </View>
                                        <Text style={styles.sectionCount}>{agencyPackages.length}</Text>
                                    </View>
                                    {renderPackageList(agencyPackages, 'No new agency packages yesterday.')}
                                </View>
                            </>
                        )}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default NewPackageHighlightsModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
    },
    sheet: {
        maxHeight: '85%',
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    subtitle: {
        marginTop: 4,
        fontSize: 12,
        color: '#475569',
        lineHeight: 18,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E2E8F0',
    },
    content: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingBottom: 26,
        gap: 10,
    },
    summaryCard: {
        backgroundColor: '#E0F2FE',
        borderWidth: 1,
        borderColor: '#BAE6FD',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    summaryTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#075985',
    },
    summarySubtitle: {
        marginTop: 4,
        fontSize: 11,
        color: '#0369A1',
        fontWeight: '600',
    },
    sectionCard: {
        borderWidth: 1,
        borderColor: '#D8E3F0',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 10,
        gap: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0F172A',
    },
    sectionCount: {
        minWidth: 22,
        textAlign: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor: '#E2E8F0',
        color: '#334155',
        fontSize: 11,
        fontWeight: '800',
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 26,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    emptyText: {
        marginTop: 8,
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
    },
    sectionEmptyText: {
        fontSize: 12,
        color: '#64748B',
        fontStyle: 'italic',
    },
    packageCard: {
        borderWidth: 1,
        borderColor: '#D8E3F0',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
    },
    packageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ownerBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: '#E0F2FE',
        borderWidth: 1,
        borderColor: '#BAE6FD',
        marginRight: 8,
    },
    ownerBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#0369A1',
    },
    ownerName: {
        flex: 1,
        fontSize: 12,
        color: '#334155',
        fontWeight: '600',
    },
    packageName: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F172A',
    },
    packageMeta: {
        marginTop: 4,
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    selectHintRow: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    selectHintText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1D4ED8',
    },
});
