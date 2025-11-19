import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const GuideAvailability = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    // Parse data
    const guideId = params.guideId;
    const guideName = params.guideName || "Guide";
    const availableDays = params.availableDays ? JSON.parse(params.availableDays) : [];
    const itinerary = params.itinerary || "No itinerary available.";
    const accommodations = params.accommodations ? JSON.parse(params.accommodations) : [];
    // Parse Inclusions
    const inclusions = params.inclusions ? JSON.parse(params.inclusions) : ["Professional Guide Fee"];

    // --- READ-ONLY CALENDAR LOGIC ---
    const renderCalendar = () => {
        const daysInMonth = 30; 
        const startingDay = 2; 
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const currentMonth = "November 2025";
        const calendarGrid = [];
        
        for (let i = 0; i < startingDay; i++) {
            calendarGrid.push(<View key={`blank-${i}`} style={styles.calDay} />);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayIndex = (startingDay + i - 1) % 7;
            const dayName = days[dayIndex];
            const isAvailable = availableDays.includes(dayName) || availableDays.includes("All");

            calendarGrid.push(
                <View key={i} style={[styles.calDay, isAvailable && styles.calDayAvailable, !isAvailable && styles.calDayDisabled]}>
                    <Text style={[styles.calDayText, isAvailable && styles.calDayTextAvailable]}>{i}</Text>
                </View>
            );
        }

        return (
            <View style={styles.calendarContainer}>
                <Text style={styles.monthTitle}>{currentMonth}</Text>
                <View style={styles.weekRow}>
                    {days.map(d => <Text key={d} style={styles.weekHeader}>{d}</Text>)}
                </View>
                <View style={styles.daysGrid}>{calendarGrid}</View>
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: '#E0F7FA' }]} />
                        <Text style={styles.legendText}>Available Days</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Guide Preview</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                <Text style={styles.sectionTitle}>Availability & Plans</Text>
                <Text style={styles.subText}>
                    This is {guideName}'s standard schedule.
                </Text>
                
                {renderCalendar()}

                {/* ITINERARY + JUSTIFICATION */}
                <View style={styles.sectionBox}>
                    <View style={styles.boxHeader}>
                        <Feather name="map" size={20} color="#00A8FF" />
                        <Text style={styles.boxTitle}>Proposed Itinerary</Text>
                    </View>
                    <Text style={styles.itineraryText}>{itinerary}</Text>

                    {/* Inclusions Section to justify price */}
                    <View style={styles.divider} />
                    <Text style={styles.inclusionsTitle}>Why this price?</Text>
                    <Text style={styles.inclusionsSub}>Includes the following services & fees:</Text>
                    <View style={styles.inclusionsContainer}>
                        {inclusions.map((item, index) => (
                            <View key={index} style={styles.inclusionTag}>
                                <Ionicons name="checkmark-circle" size={14} color="#28A745" />
                                <Text style={styles.inclusionText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ACCOMMODATIONS (Always Shown) */}
                <View style={styles.sectionBox}>
                    <View style={styles.boxHeader}>
                        <Ionicons name="bed-outline" size={20} color="#00A8FF" />
                        <Text style={styles.boxTitle}>Accommodation</Text>
                    </View>

                    <Text style={styles.justificationText}>
                        Included in package.
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accScroll}>
                        {accommodations.map((acc, index) => (
                            <View key={index} style={styles.accCard}>
                                <Image source={{ uri: acc.image }} style={styles.accImage} />
                                <View style={styles.accInfo}>
                                    <Text style={styles.accTitle}>{acc.title}</Text>
                                    <Text style={styles.accPrice}>{acc.price}</Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.footerTextContainer}>
                    <Text style={styles.footerLabel}>Interested?</Text>
                    <Text style={styles.footerSub}>View full details to book.</Text>
                </View>
                <TouchableOpacity 
                    style={styles.proceedBtn}
                    onPress={() => router.push({
                        pathname: "/(protected)/touristGuideDetails", 
                        params: { guideId: guideId }
                    })}
                >
                    <Text style={styles.proceedText}>View Profile</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default GuideAvailability;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff', elevation: 2 },
    backBtn: { marginRight: 15 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
    scrollContent: { padding: 20, paddingBottom: 100 },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1A2332' },
    subText: { fontSize: 14, color: '#8B98A8', marginBottom: 20 },
    
    // Calendar Styles
    calendarContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, marginBottom: 20 },
    monthTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 15, color: '#333' },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    weekHeader: { width: width / 9, textAlign: 'center', color: '#8B98A8', fontSize: 12, fontWeight: '600' },
    daysGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, justifyContent: 'flex-start' },
    calDay: { width: (width - 72) / 7, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
    calDayAvailable: { backgroundColor: '#E0F7FA' },
    calDayDisabled: { opacity: 0.3 },
    calDayText: { color: '#333', fontWeight: '500' },
    calDayTextAvailable: { color: '#007AFF', fontWeight: '700' },
    legendContainer: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 15, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: '#666' },

    // Section Boxes
    sectionBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
    boxHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    boxTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
    itineraryText: { fontSize: 14, color: '#555', lineHeight: 22 },

    // New Inclusions Styles
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
    inclusionsTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 4 },
    inclusionsSub: { fontSize: 12, color: '#888', marginBottom: 8 },
    inclusionsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    inclusionTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FFF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4, borderWidth: 1, borderColor: '#C3E6CB' },
    inclusionText: { fontSize: 11, color: '#155724', fontWeight: '600' },

    // Accommodations
    justificationText: { fontSize: 12, color: '#00A8FF', fontStyle: 'italic', marginBottom: 10 },
    accScroll: { marginTop: 5 },
    accCard: { width: 140, marginRight: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee', overflow: 'hidden' },
    accImage: { width: '100%', height: 90 },
    accInfo: { padding: 8 },
    accTitle: { fontSize: 12, fontWeight: '700', color: '#333' },
    accPrice: { fontSize: 11, color: '#00A8FF', fontWeight: '600', marginTop: 2 },

    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 10, borderTopWidth: 1, borderTopColor: '#eee' },
    footerTextContainer: { justifyContent: 'center' },
    footerLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
    footerSub: { fontSize: 12, color: '#888' },
    proceedBtn: { backgroundColor: '#00A8FF', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, gap: 8 },
    proceedText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});