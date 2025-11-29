import React, { useState, useRef } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    ImageBackground, 
    StyleSheet, 
    TouchableOpacity, 
    Dimensions, 
    FlatList, 
    Image 
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const Header = ({ destinations = [], unreadCount = 0 }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    
    // --- 1. SEARCH STATE ---
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredDestinations, setFilteredDestinations] = useState([]);

    const swiperRef = useRef(null);
    const router = useRouter();

    const handleIndexChanged = (index) => {
        setActiveIndex(index);
    };

    const handleNotificationPress = () => {
        router.push('/(protected)/notification');
    };

    const handleExplorePress = (destinationId) => {
        router.push({
            pathname: "/(protected)/placesDetails",
            params: { id: destinationId },
        });
    };

    // --- 2. SEARCH FUNCTION ---
    const onSearch = (text) => {
        setSearchQuery(text);
        if (text) {
            const filtered = destinations.filter(item => 
                item.name.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredDestinations(filtered);
        } else {
            setFilteredDestinations([]);
        }
    };

    // --- 3. HANDLE SELECTION ---
    const onSelectDestination = (id) => {
        setSearchQuery(''); // Clear search bar
        setFilteredDestinations([]); // Hide list
        handleExplorePress(id);
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Header Bar */}
            <View style={[styles.headerBar, { width: width * 1 }]}>
                
                {/* 4. SEARCH WRAPPER */}
                <View style={styles.searchWrapper}>
                    <View style={styles.searchBox}>
                        <Feather name='search' size={18} color="#666" />
                        <TextInput 
                            placeholder='Explore new place...' 
                            style={styles.input}
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={onSearch}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => onSearch('')}>
                                <Feather name="x" size={18} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* 5. SEARCH RESULTS DROPDOWN LIST */}
                    {searchQuery.length > 0 && (
                        <View style={styles.dropdownContainer}>
                            {filteredDestinations.length > 0 ? (
                                <FlatList
                                    data={filteredDestinations}
                                    keyExtractor={(item) => item.id.toString()}
                                    keyboardShouldPersistTaps="handled"
                                    renderItem={({ item }) => (
                                        <TouchableOpacity 
                                            style={styles.dropdownItem}
                                            onPress={() => onSelectDestination(item.id)}
                                        >
                                            {/* Image on Left */}
                                            <Image 
                                                source={item.image ? { uri: item.image || item.first_image || item.thumbnail } : require('../../assets/localynk_images/login_background.png')} 
                                                style={styles.dropdownImage} 
                                            />
                                            {/* Name on Right */}
                                            <Text style={styles.dropdownText}>{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            ) : (
                                <View style={{padding: 15, alignItems: 'center'}}>
                                    <Text style={{color: '#888'}}>No places found</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Notification Button */}
                <TouchableOpacity 
                    style={styles.notificationBtn}
                    onPress={handleNotificationPress}
                >
                    <Ionicons name='notifications' size={24} color="white" />
                    {unreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.badgeText}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
           
            {/* Swiper Slider */}
            <View style={{ height: 380 }}>
                {destinations.length > 0 ? (
                    <Swiper 
                        ref={swiperRef}
                        autoplay 
                        loop 
                        showsPagination={false}
                        autoplayTimeout={6}
                        onIndexChanged={handleIndexChanged}
                    >
                        {destinations.map(item => (
                            <ImageBackground
                                key={item.id}
                                source={item.image ? { uri: item.image || item.first_image || item.thumbnail || '' } : require('../../assets/localynk_images/login_background.png')}
                                style={styles.slide}
                                resizeMode="cover"
                            >
                                <LinearGradient
                                    colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
                                    style={styles.gradientOverlay}
                                />
                                
                                <View style={styles.slideContent}>
                                    <View style={styles.topBadge}>
                                        <Ionicons name="star" size={14} color="#FFD700" />
                                        <Text style={styles.ratingValue}>{item.average_rating || 'New'}</Text>
                                    </View>

                                    <View style={styles.textContainer}>
                                        <MaskedView maskElement={<Text style={styles.logo}>DISCOVER {item.category}!</Text>}>
                                            <LinearGradient colors={['#FFFFFF', '#00C6FF']}>
                                                <Text style={[styles.logo, { opacity: 0 }]}>DISCOVER {item.category}!</Text>
                                            </LinearGradient>
                                        </MaskedView>
        
                                        <MaskedView maskElement={<Text style={styles.name}>{item.name}</Text>}>
                                            <LinearGradient colors={['#FFFFFF', '#00C6FF']}>
                                                <Text style={[styles.name, { opacity: 0 }]}>{item.name}</Text>
                                            </LinearGradient>
                                        </MaskedView>
        
                                        <Text style={styles.description} numberOfLines={2}>
                                            {item.location}
                                        </Text>
                                        <Text style={{color: "white", fontSize: 11}} numberOfLines={2}>
                                            {item.description}
                                        </Text>
                                    </View>

                                    <TouchableOpacity 
                                        style={styles.exploreBtn} 
                                        activeOpacity={0.8} 
                                        onPress={() => handleExplorePress(item.id)}
                                    >
                                        <Text style={styles.exploreText}>Explore Now</Text>
                                        <Ionicons name="arrow-forward" size={16} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </ImageBackground>
                        ))}
                    </Swiper>
                ) : (
                    <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#eee'}}>
                        <Text style={{color:'#666'}}>No destinations found.</Text>
                    </View>
                )}
            </View>

            <View style={styles.indicatorContainer}>
                {destinations.slice(0, 3).map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.paginationDot,
                            activeIndex === index && styles.activeDot,
                        ]}
                        onPress={() => swiperRef.current?.scrollBy(index - activeIndex)}
                    />
                ))}
            </View>
        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    headerBar: {
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        zIndex: 100, 
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', 
        paddingHorizontal: 15,
        gap: 10
    },
    searchWrapper: {
        flex: 1,
        position: 'relative',
        zIndex: 101,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(217, 226, 233, 0.95)',
        borderRadius: 50,
        paddingHorizontal: 15,
        paddingVertical: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        height: 50,
    },
    input: {
        marginLeft: 10,
        flex: 1,
        height: 40,
        fontSize: 14,
        color: '#333',
    },
    
    // --- DROPDOWN STYLES (Glassmorphism / Not too bright) ---
    dropdownContainer: {
        position: 'absolute',
        top: 55, 
        left: 0,
        right: 0,
        // Semi-transparent off-white for glass effect
        backgroundColor: 'rgba(255, 255, 255, 0.92)', 
        borderRadius: 16,
        // Soft shadows
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        // Layout
        maxHeight: 250, 
        zIndex: 102,
        overflow: 'hidden',
        // Glass border effect
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        // Very subtle divider
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    dropdownImage: {
        width: 44,
        height: 44,
        borderRadius: 10,
        marginRight: 12,
        backgroundColor: '#eee'
    },
    dropdownText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
        flex: 1,
    },
    // ----------------------------------------------------

    notificationBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#00C6FF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 22, 
        height: 22,
        borderRadius: 11,
        backgroundColor: '#FF3B30', 
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    slide: {
        width: "100%",
        height: "100%",
        justifyContent: 'flex-end'
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    slideContent: {
        padding: 20,
        paddingBottom: 25,
        zIndex: 2,
    },
    topBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 15,
    },
    ratingValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1a1a1a',
        marginLeft: 4,
    },
    textContainer: {
        marginBottom: 15,
    },
    logo: {
        fontSize: 18,
        fontWeight: '900',
        lineHeight: 24,
    },
    name: {
        fontSize: 22,
        fontWeight: '600',
        marginVertical: 6,
        lineHeight: 28,
    },
    description: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 13,
        lineHeight: 18,
        marginTop: 8,
    },
    exploreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 14,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#00C6FF',
        borderRadius: 12,
        alignSelf: 'flex-start',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    exploreText: {
        color: 'white',
        marginRight: 8,
        fontSize: 14,
        fontWeight: '700',
    },
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 8,
        zIndex: 5,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 198, 255, 0.3)',
        borderWidth: 1.5,
        borderColor: 'rgba(0, 198, 255, 0.5)',
    },
    activeDot: {
        backgroundColor: '#00C6FF',
        borderColor: '#00C6FF',
        width: 28,
    },
});