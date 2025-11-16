import React, { useState, useRef } from 'react';
import { View, Text, TextInput, ImageBackground, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient'

import LoginBackground from '../../assets/localynk_images/login_background.png';
import RegisterBackground from '../../assets/localynk_images/register_background.png';

const { width } = Dimensions.get('window');

const dataSlider = [
    {
        id: 1,
        image: LoginBackground,
        logo: "DISCOVER NATURE'S SERENITY!",
        name: "MUTI, GRASSLAND",
        description: "Nestled in the heart of nature, Muti Grassland offers a breathtaking escape into rolling green hills and open skies. Perfect for hiking, sightseeing, or simply unwinding, this serene landscape invites you to explore the untouched beauty of Zamboanga's countryside.",
        rating: 4.8,
        reviews: 234
    },
    {
        id: 2,
        image: RegisterBackground,
        logo: "DISCOVER COASTAL TRANQUILITY!",
        name: "BOLONG BEACH",
        description: "Breathe in the sea breeze and let your worries drift away at Bolong Beach — where calm waters meet golden sands. Whether you're up for a quiet morning stroll, a refreshing swim, or simply soaking in the horizon.",
        rating: 4.9,
        reviews: 512
    },
    {
        id: 3,
        image: RegisterBackground,
        logo: "DISCOVER SUNSET BLISS!",
        name: "ZAMBOANGA CITY, BOULEVARD",
        description: "Watch the sky come alive at Zamboanga's Boulevard, where every sunset paints a masterpiece over calm waves and golden sands. Stroll along the shore, enjoy the sea breeze, and take in the vibrant evening glow.",
        rating: 4.7,
        reviews: 189
    }
];

const Header = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const swiperRef = useRef(null);

    const handleIndexChanged = (index) => {
        setActiveIndex(index);
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={[styles.headerBar, { width: width * 1 }]}>
                <View style={styles.searchBox}>
                    <Feather name='search' size={18} color="#666" />
                    <TextInput 
                        placeholder='Explore new place...' 
                        style={styles.input}
                        placeholderTextColor="#999"
                    />
                </View>
                <TouchableOpacity style={styles.filterBtn}>
                    <Ionicons name='options' size={20} color="white" />
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
                    {dataSlider.map(item => (
                        <ImageBackground
                            key={item.id}
                            source={item.image}
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
                                    <Text style={styles.ratingValue}>{item.rating}</Text>
                                    <Text style={styles.reviewCount}>({item.reviews} reviews)</Text>
                                </View>

                                <View style={styles.textContainer}>
                                    <MaskedView maskElement={<Text style={styles.logo}>{item.logo}</Text>}>
                                        <LinearGradient colors={['#FFFFFF', '#00C6FF']}>
                                            <Text style={[styles.logo, { opacity: 0 }]}>{item.logo}</Text>
                                        </LinearGradient>
                                    </MaskedView>
        
                                    <MaskedView maskElement={<Text style={styles.name}>{item.name}</Text>}>
                                        <LinearGradient colors={['#FFFFFF', '#00C6FF']}>
                                            <Text style={[styles.name, { opacity: 0 }]}>{item.name}</Text>
                                        </LinearGradient>
                                    </MaskedView>
        
                                    <Text style={styles.description}>{item.description}</Text>
                                </View>

                                <TouchableOpacity style={styles.exploreBtn} activeOpacity={0.8}>
                                    <Text style={styles.exploreText}>Explore Now</Text>
                                    <Ionicons name="arrow-forward" size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        </ImageBackground>
                    ))}
                </Swiper>
            </View>

            <View style={styles.indicatorContainer}>
                {dataSlider.map((_, index) => (
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
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        gap: 10
    },
    searchBox: {
        flex: 1,
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
    },
    input: {
        marginLeft: 10,
        flex: 1,
        height: 40,
        fontSize: 14,
        color: '#333',
    },
    filterBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#00C6FF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
    reviewCount: {
        fontSize: 11,
        color: '#666',
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