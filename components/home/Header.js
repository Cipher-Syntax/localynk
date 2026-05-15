import { Image } from 'expo-image';
import React, { useState, useRef } from 'react';
import { View, Text, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import HomeSearchBar from './HomeSearchBar';
import { styles } from './styles/Header.styles';
const { width } = Dimensions.get('window');

const Header = ({ destinations = [], unreadCount = 0 }) => {
    const [activeIndex, setActiveIndex] = useState(0);
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

    const handleSearchResultSelect = (result) => {
        if (!result) return;

        if (result.category === 'destinations') {
            const destinationIdFromResult =
                result.raw?.id ??
                result.raw?.destination_id ??
                result.raw?.destination?.id ??
                result.rawId;

            let destinationId = destinationIdFromResult;

            if (!destinationId && result.title) {
                const matchedDestination = destinations.find(
                    (item) =>
                        String(item?.name || '').trim().toLowerCase() ===
                        String(result.title || '').trim().toLowerCase(),
                );

                destinationId = matchedDestination?.id;
            }

            if (!destinationId) {
                router.push({
                    pathname: '/(protected)/explore',
                    params: {
                        q: result.title,
                        category: 'destinations',
                    },
                });
                return;
            }

            handleExplorePress(destinationId);
            return;
        }

        router.push({
            pathname: '/(protected)/explore',
            params: {
                q: result.title,
                category: result.category,
            },
        });
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={[styles.headerBar, { width: width * 1 }]}>
                
                <View style={styles.searchWrapper}>
                    <HomeSearchBar
                        destinations={destinations}
                        onSelectResult={handleSearchResultSelect}
                        allowedCategories={['destinations']}
                        placeholder="Search destinations..."
                    />
                </View>

                <TouchableOpacity 
                    style={styles.notificationBtn}
                    onPress={handleNotificationPress}
                >
                    <Ionicons name='notifications' size={24} color="#00C6FF" />
                    {unreadCount > 0 && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.badgeText}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
           
            <View style={{ height: 380 }}>
                {destinations.length > 0 ? (
                    <Swiper 
                        ref={swiperRef}
                        autoplay
                        autoplayTimeout={5}
                        loop
                        showsPagination={false}
                        onIndexChanged={handleIndexChanged}
                        removeClippedSubviews={false}
                    >
                        {destinations.map(item => (
                            <ImageBackground
                                key={item.id}
                                source={item.image ? { uri: item.image || item.first_image || item.thumbnail || '' } : require('../../assets/localynk_images/login_background.jpg')}
                                style={styles.slide}
                                resizeMode="cover"
                                fadeDuration={300}
                                blurRadius={2}
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
                                        <Text style={{color: "white", fontSize: 13}} numberOfLines={2}>
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
                        <View>
                            <Image 
                                source={require("../../assets/localynk_images/logo.png")}  
                                contentFit="cover"
                            />
                            </View>
                        <Text style={{color:'#666'}}>No destinations found.</Text>
                    </View>
                )}
            </View>

            <View style={styles.indicatorContainer}>
                {destinations.slice(0, 5).map((_, index) => (
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
