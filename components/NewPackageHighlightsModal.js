import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatHighlightDateLabel } from '../utils/newPackageHighlights';
import { styles } from './styles/NewPackageHightlightsModal.styles';

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
