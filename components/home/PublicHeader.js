import React, { useState, useRef } from 'react'
import { View, Text, TextInput, ImageBackground, TouchableOpacity, Dimensions } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { styles } from './styles/PublicHeader.styles';

import LoginBackground from '../../assets/localynk_images/login_background.jpg';

const { width } = Dimensions.get('window');

const PublicHeader = ({ destinations }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const swiperRef = useRef(null);
    const router = useRouter();

    const handleIndexChanged = (index) => {
        setActiveIndex(index);
    };

    const handleExplore = () => {
        router.push('/auth/login');
    };

    // If backend data is empty during the transition, provide a simple fallback
    const sliderData = destinations && destinations.length > 0 
        ? destinations.slice(0, 5).map((item, index) => {
            const imageUri = item.images && item.images.length > 0 
                ? item.images[0].image 
                : item.image;

            return {
                id: item.id || index,
                image: imageUri ? { uri: imageUri } : LoginBackground,
                logo: item.category ? `DISCOVER ${item.category.toUpperCase()}!` : "DISCOVER NEW PLACES!",
                name: item.name || "Unknown Destination",
                description: item.description || "Explore this beautiful destination with LocaLynk.",
                rating: item.average_rating ? parseFloat(item.average_rating).toFixed(1) : "New",
                reviews: item.review_count || 0
            }
        })
        : [{
            id: 1,
            image: LoginBackground,
            logo: "WELCOME TO LOCALYNK",
            name: "DISCOVER ZAMBOANGA",
            description: "Explore the untouched beauty of Zamboanga. Perfect for hiking, sightseeing, or simply unwinding.",
            rating: "5.0",
            reviews: 0
        }];

    return (
        <View style={{ flex: 1 }}>
            <View style={[styles.headerBar, { width: width * 1 }]}>
                <View style={styles.searchBox}>
                    <Feather name='search' size={18} color="#666" />
                    <TextInput 
                        placeholder='Explore new place...' 
                        style={styles.input}
                        placeholderTextColor="#999"
                        editable={false}
                    />
                </View>
                <TouchableOpacity 
                    style={styles.loginBtn}
                    onPress={() => router.push('/auth/login')}
                >
                    <Text style={styles.loginBtnText}>Login</Text>
                </TouchableOpacity>
            </View>
           
            <View style={{ height: 380 }}>
                <Swiper 
                    ref={swiperRef}
                    autoplay 
                    loop 
                    showsPagination={false}
                    autoplayTimeout={6}
                    onIndexChanged={handleIndexChanged}
                >
                    {sliderData.map(item => (
                        <ImageBackground
                            key={item.id}
                            source={item.image}
                            style={styles.slide}
                            resizeMode="cover"
                        >
                            <LinearGradient
                                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                                style={styles.gradientOverlay}
                            />
                            
                            <View style={styles.slideContent}>
                                <View style={styles.topBadge}>
                                    <Ionicons name="star" size={14} color="#FFD700" />
                                    <Text style={styles.ratingValue}>{item.rating}</Text>
                                    <Text style={styles.reviewCount}>({item.reviews} reviews)</Text>
                                </View>

                                <View style={styles.textContainer}>
                                    <MaskedView maskElement={<Text style={styles.logo}>{item.logo}</Text>}>
                                        <LinearGradient colors={['#FFFFFF', '#00C6FF']}>
                                            <Text style={[styles.logo, { opacity: 0 }]}>{item.logo}</Text>
                                        </LinearGradient>
                                    </MaskedView>
    
                                    <MaskedView maskElement={<Text style={styles.name} numberOfLines={1}>{item.name}</Text>}>
                                        <LinearGradient colors={['#FFFFFF', '#00C6FF']}>
                                            <Text style={[styles.name, { opacity: 0 }]} numberOfLines={1}>{item.name}</Text>
                                        </LinearGradient>
                                    </MaskedView>
    
                                    <Text style={styles.description} numberOfLines={3}>{item.description}</Text>
                                </View>

                                <TouchableOpacity 
                                    style={styles.exploreBtn} 
                                    activeOpacity={0.8}
                                    onPress={handleExplore}
                                >
                                    <Text style={styles.exploreText}>Explore Now</Text>
                                    <Ionicons name="arrow-forward" size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        </ImageBackground>
                    ))}
                </Swiper>
            </View>

            <View style={styles.indicatorContainer}>
                {sliderData.map((_, index) => (
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

export default PublicHeader
