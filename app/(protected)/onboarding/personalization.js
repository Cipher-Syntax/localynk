import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    ActivityIndicator, 
    ScrollView, 
    LayoutAnimation, 
    Platform, 
    UIManager,
    Animated,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/api';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ITEMS_PER_CATEGORY = 10;
const { width } = Dimensions.get('window');

export default function PersonalizationScreen() {
    const { user, refreshUser, setHasSkippedOnboarding } = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const [groupedDestinations, setGroupedDestinations] = useState({});
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [scrollProgress] = useState(new Animated.Value(0));

    const isEditMode = params.mode === 'edit';
    const categoryOrder = ['Beach', 'Mountain', 'City', 'Adventure', 'Cultural', 'Relaxation', 'Others'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const destRes = await api.get('/api/onboarding-destinations/');
            const allDestinations = destRes.data;

            const groups = {};
            allDestinations.forEach(item => {
                const cat = item.category || "Others";
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(item);
            });

            Object.keys(groups).forEach(cat => {
                groups[cat].sort((a, b) => {
                    if (a.is_featured && !b.is_featured) return -1;
                    if (!a.is_featured && b.is_featured) return 1;
                    return (parseFloat(b.average_rating || 0) - parseFloat(a.average_rating || 0));
                });
                groups[cat] = groups[cat].slice(0, ITEMS_PER_CATEGORY);
            });

            setGroupedDestinations(groups);

            const categories = Object.keys(groups);
            if (categories.length > 0) {
                setExpandedCategory(categories[0]);
            }

            if (isEditMode && user?.personalization_profile?.preferred_destinations) {
                const currentPrefs = user.personalization_profile.preferred_destinations;
                const currentIds = currentPrefs.map(d => typeof d === 'object' ? d.id : d);
                setSelectedIds(currentIds);
            }
        } catch (error) {
            console.error("Error loading personalization data:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = (category) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedCategory(prev => prev === category ? null : category);
    };

    const toggleSelection = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleSkip = () => {
        if (isEditMode) {
            router.back();
        } else {
            setHasSkippedOnboarding(true);
            router.replace('/home');
        }
    };

    const handleConfirm = async () => {
        setSaving(true);
        try {
            await api.patch('/api/update/', {
                destination_ids: selectedIds,
                mark_complete: true 
            });
            await refreshUser(); 
            setHasSkippedOnboarding(true); 

            if (isEditMode) router.back();
            else router.replace('/home');
        } catch (error) {
            alert("Failed to save preferences.");
        } finally {
            setSaving(false);
        }
    };

    const getCategoryIcon = (category) => {
        const iconMap = {
            'Beach': 'water',
            'Mountain': 'mountain',
            'City': 'business',
            'Adventure': 'flame',
            'Cultural': 'book',
            'Relaxation': 'spa',
            'Others': 'ellipsis-horizontal'
        };
        return iconMap[category] || 'pin';
    };

    const getCategoryColor = (category) => {
        const colorMap = {
            'Beach': '#00D4FF',
            'Mountain': '#7B68EE',
            'City': '#FF6B6B',
            'Adventure': '#FF8C42',
            'Cultural': '#4ECDC4',
            'Relaxation': '#95E1D3',
            'Others': '#A8A8A8'
        };
        return colorMap[category] || '#00C6FF';
    };

    const renderDestinationItem = (item) => {
        const imageUrl = item.images && item.images.length > 0 ? item.images[0].image : null;
        const rating = item.average_rating ? parseFloat(item.average_rating).toFixed(1) : "0.0";
        const isSelected = selectedIds.includes(item.id);

        return (
            <TouchableOpacity 
                key={item.id}
                style={[styles.gridItem, isSelected && styles.selectedGridItem]} 
                onPress={() => toggleSelection(item.id)}
                activeOpacity={0.7}
            >
                <Image 
                    source={imageUrl ? { uri: imageUrl } : { uri: 'https://via.placeholder.com/150' }} 
                    style={styles.gridImage} 
                    resizeMode="cover" 
                />
                
                {isSelected && (
                    <View style={styles.selectedOverlay}>
                        <View style={styles.checkMark}>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                        </View>
                    </View>
                )}

                <View style={styles.gradientOverlay} />

                <View style={styles.gridTextOverlay}>
                    <Text style={styles.gridTitle} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.gridRatingRow}>
                        <Ionicons name="star-sharp" size={11} color="#FFD700" />
                        <Text style={styles.gridRatingText}>{rating}</Text>
                        {item.is_featured && (
                            <View style={styles.featuredBadge}>
                                <Ionicons name="flash" size={8} color="#fff" />
                                <Text style={styles.featuredText}>Featured</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C6FF" />
            </View>
        );
    }

    const sortedCategories = Object.keys(groupedDestinations).sort((a, b) => {
        return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Enhanced Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <View style={styles.headerIcon}>
                            <Ionicons name="sparkles" size={28} color="#00C6FF" />
                        </View>
                        <View style={styles.headerText}>
                            <Text style={styles.title}>{isEditMode ? "Update Interests" : "Discover Your Vibe"}</Text>
                            <Text style={styles.subtitle}>Pick destinations that match your style</Text>
                        </View>
                    </View>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${Math.min((selectedIds.length / 5) * 100, 100)}%` }]} />
                    </View>
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollProgress } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                >
                    {sortedCategories.map((category, index) => {
                        const isOpen = expandedCategory === category;
                        const selectedCountInCategory = groupedDestinations[category].filter(d => selectedIds.includes(d.id)).length;
                        const categoryColor = getCategoryColor(category);
                        const categoryIcon = getCategoryIcon(category);

                        return (
                            <View key={category} style={[styles.accordionContainer, { marginTop: index === 0 ? 8 : 10 }]}>
                                <TouchableOpacity 
                                    style={[styles.accordionHeader, isOpen && styles.accordionHeaderActive]} 
                                    onPress={() => toggleCategory(category)}
                                    activeOpacity={0.6}
                                >
                                    <View style={styles.headerLeftContent}>
                                        <View style={[styles.categoryIconBg, { backgroundColor: categoryColor + '20' }]}>
                                            <Ionicons name={categoryIcon} size={20} color={categoryColor} />
                                        </View>
                                        <View style={styles.categoryLabelContainer}>
                                            <Text style={[styles.categoryTitle, isOpen && { color: categoryColor }]}>
                                                {category}
                                            </Text>
                                            <Text style={styles.categorySubtitle}>
                                                {groupedDestinations[category].length} {groupedDestinations[category].length === 1 ? 'place' : 'places'}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={styles.headerRightContent}>
                                        {selectedCountInCategory > 0 && (
                                            <View style={[styles.badgeContainer, { backgroundColor: categoryColor }]}>
                                                <Text style={styles.badgeText}>{selectedCountInCategory}</Text>
                                            </View>
                                        )}
                                        <Ionicons 
                                            name={isOpen ? "chevron-up" : "chevron-down"} 
                                            size={22} 
                                            color={isOpen ? categoryColor : "#999"} 
                                            style={{ marginLeft: 12 }}
                                        />
                                    </View>
                                </TouchableOpacity>

                                {isOpen && (
                                    <View style={styles.accordionBody}>
                                        <View style={styles.gridContainer}>
                                            {groupedDestinations[category].map(renderDestinationItem)}
                                        </View>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                    <View style={{ height: 20 }} />
                </ScrollView>

                {/* Enhanced Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity 
                        onPress={handleSkip} 
                        style={styles.skipButton} 
                        disabled={saving}
                    >
                        <Ionicons name="close" size={20} color="#999" />
                        <Text style={styles.skipText}>{isEditMode ? "Cancel" : "Skip"}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={handleConfirm} 
                        style={[styles.confirmButton, !selectedIds.length && styles.confirmButtonDisabled]} 
                        disabled={saving || !selectedIds.length}
                    >
                        {saving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.confirmText}>Save ({selectedIds.length})</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
    
    // Header Styles
    header: { 
        paddingHorizontal: 20, 
        paddingTop: 16, 
        paddingBottom: 20,
        backgroundColor: '#fff', 
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    headerIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#E0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    headerText: {
        flex: 1
    },
    title: { 
        fontSize: 26, 
        fontWeight: '800', 
        color: '#1a1a1a',
        letterSpacing: -0.5
    },
    subtitle: { 
        fontSize: 13, 
        color: '#888', 
        marginTop: 4,
        fontWeight: '500'
    },
    
    progressBar: {
        height: 4,
        backgroundColor: '#E8E8E8',
        borderRadius: 2,
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#00C6FF',
        borderRadius: 2
    },

    scrollContent: { 
        paddingHorizontal: 16, 
        paddingBottom: 120, 
        paddingTop: 8
    },

    // Accordion Styles
    accordionContainer: { 
        marginBottom: 8,
        backgroundColor: '#fff', 
        borderRadius: 14, 
        overflow: 'hidden', 
        shadowColor: '#000', 
        shadowOpacity: 0.06, 
        shadowRadius: 10, 
        shadowOffset: { width: 0, height: 2 },
        elevation: 3
    },
    accordionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 16,
        backgroundColor: '#fff',
        paddingVertical: 14
    },
    accordionHeaderActive: { 
        backgroundColor: '#FAFBFC',
        borderBottomWidth: 1, 
        borderBottomColor: '#F0F0F0'
    },
    
    headerLeftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
    },
    
    categoryIconBg: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    
    categoryLabelContainer: {
        flex: 1
    },
    
    categoryTitle: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#1a1a1a',
        letterSpacing: -0.3
    },
    categorySubtitle: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
        fontWeight: '500'
    },
    
    headerRightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end'
    },
    
    badgeContainer: { 
        borderRadius: 12, 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        marginRight: 8
    },
    badgeText: { 
        color: '#fff', 
        fontSize: 12, 
        fontWeight: '700'
    },

    accordionBody: { 
        padding: 16, 
        backgroundColor: '#FAFBFC',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0'
    },
    
    // Grid Layout
    gridContainer: { 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        marginHorizontal: -4
    },
    gridItem: { 
        width: '48%', 
        height: 140, 
        borderRadius: 12, 
        marginHorizontal: 4,
        marginBottom: 12, 
        backgroundColor: '#eee', 
        overflow: 'hidden', 
        position: 'relative',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2
    },
    selectedGridItem: { 
        borderWidth: 3, 
        borderColor: '#00C6FF',
        shadowColor: '#00C6FF',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    gridImage: { 
        width: '100%', 
        height: '100%' 
    },
    
    // Item Overlays
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        zIndex: 1
    },
    
    selectedOverlay: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(0, 198, 255, 0.2)', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 3 
    },
    checkMark: { 
        position: 'absolute', 
        top: 8, 
        right: 8, 
        backgroundColor: '#00C6FF', 
        borderRadius: 14, 
        width: 28, 
        height: 28, 
        justifyContent: 'center', 
        alignItems: 'center',
        shadowColor: '#00C6FF',
        shadowOpacity: 0.5,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 5,
        zIndex: 4
    },
    
    gridTextOverlay: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: 10,
        zIndex: 2
    },
    gridTitle: { 
        color: '#fff', 
        fontSize: 13, 
        fontWeight: '700', 
        marginBottom: 4
    },
    gridRatingRow: { 
        flexDirection: 'row', 
        alignItems: 'center'
    },
    gridRatingText: { 
        color: '#fff', 
        fontSize: 11, 
        marginLeft: 4,
        fontWeight: '600'
    },
    
    featuredBadge: { 
        backgroundColor: '#FFB800', 
        paddingHorizontal: 6, 
        paddingVertical: 3, 
        borderRadius: 4, 
        marginLeft: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3
    },
    featuredText: { 
        color: '#fff', 
        fontSize: 9, 
        fontWeight: '700'
    },

    // Footer
    footer: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: '#fff', 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        paddingBottom: 20,
        borderTopWidth: 1, 
        borderTopColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
        elevation: 8,
        gap: 12
    },
    skipButton: { 
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        justifyContent: 'center',
        gap: 8
    },
    skipText: { 
        color: '#999', 
        fontSize: 15, 
        fontWeight: '600' 
    },
    confirmButton: { 
        flex: 1,
        backgroundColor: '#00C6FF', 
        paddingVertical: 13, 
        paddingHorizontal: 20, 
        borderRadius: 12, 
        justifyContent: 'center', 
        alignItems: 'center',
        flexDirection: 'row',
        shadowColor: '#00C6FF',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4
    },
    confirmButtonDisabled: {
        backgroundColor: '#D0D0D0',
        shadowOpacity: 0.1
    },
    confirmText: { 
        color: '#fff', 
        fontWeight: '700', 
        fontSize: 15
    }
});