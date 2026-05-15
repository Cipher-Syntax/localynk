import { Image } from 'expo-image';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, LayoutAnimation, Platform, UIManager, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/api';
import ScreenSafeArea from '../../../components/ScreenSafeArea';
import { styles } from './styles/personalization.styles';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ITEMS_PER_CATEGORY = 10;

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
    const preferredDestinations = user?.personalization_profile?.preferred_destinations;

    useEffect(() => {
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

                if (isEditMode && Array.isArray(preferredDestinations)) {
                    const currentIds = preferredDestinations.map(d => typeof d === 'object' ? d.id : d);
                    setSelectedIds(currentIds);
                }
            } catch (error) {
                console.error("Error loading personalization data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [isEditMode, preferredDestinations]);

    
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
        } catch (_error) {
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
                    contentFit="cover" 
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
            <ScreenSafeArea statusBarStyle='dark-content' edges={['bottom']} style={styles.safeArea}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <View style={styles.headerContent}>
                            <View style={[styles.headerIcon, { backgroundColor: '#E0E6ED' }]} />
                            <View style={styles.headerText}>
                                <View style={{ width: 200, height: 26, backgroundColor: '#E0E6ED', borderRadius: 4, marginBottom: 8 }} />
                                <View style={{ width: 150, height: 14, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                            </View>
                        </View>
                        <View style={styles.progressBar} />
                    </View>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {[1, 2, 3].map(i => (
                            <View key={i} style={styles.accordionContainer}>
                                <View style={styles.accordionHeader}>
                                     <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#E0E6ED', marginRight: 12 }} />
                                     <View style={{ flex: 1, gap: 6 }}>
                                         <View style={{ width: 120, height: 16, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                                         <View style={{ width: 60, height: 12, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                                     </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </ScreenSafeArea>
        );
    }

    const sortedCategories = Object.keys(groupedDestinations).sort((a, b) => {
        const left = String(a || '').toLowerCase();
        const right = String(b || '').toLowerCase();

        if (left === 'others' && right !== 'others') return 1;
        if (right === 'others' && left !== 'others') return -1;

        return left.localeCompare(right);
    });

    return (
        <ScreenSafeArea edges={['bottom']} statusBarStyle='dark-content' style={styles.safeArea}>
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
        </ScreenSafeArea>
    );
}
