import React from 'react';
import { View, Text, TextInput, ImageBackground, StyleSheet, TouchableOpacity, Dimensions} from 'react-native';
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
        logo: "DISCOVER NATURE’S SERENITY!",
        name: "MUTI, GRASSLAND",
        description: "Nestled in the heart of nature, Muti Grassland offers a breathtaking escape into rolling green hills and open skies. Perfect for hiking, sightseeing, or simply unwinding, this serene landscape invites you to explore the untouched beauty of Zamboanga’s countryside. Feel the breeze, embrace the calm, and discover nature at its finest!"
    },
    {
        id: 2,
        image: RegisterBackground,
        logo: "DISCOVER COASTAL TRANQUILITY!",
        name: "BOLONG BEACH",
        description: "Breathe in the sea breeze and let your worries drift away at Bolong Beach — where calm waters meet golden sands. Whether you’re up for a quiet morning stroll, a refreshing swim, or simply soaking in the horizon, this serene coastal gem captures the tranquil charm of Zamboanga’s shores. Relax, explore, and let nature’s peace surround you."
    },
    {
        id: 3,
        image: RegisterBackground,
        logo: "DISCOVER SUNSET BLISS!",
        name: "ZAMBOANGA CITY, BOULEVARD",
        description: "Watch the sky come alive at Zamboanga’s Boulevard, where every sunset paints a masterpiece over calm waves and golden sands. Stroll along the shore, enjoy the sea breeze, and take in the vibrant evening glow that makes this coastal spot a local favorite. Relax, unwind, and let the rhythm of the ocean soothe your soul."
    }
];

const Header = () => {


    return (
        <View style={{ flex: 1 }}>
            <View style={[styles.headerBar, { width: width * 0.9, gap: 15 }]}>
                <MaterialCommunityIcons name='menu' size={24} color="black" />
                <View style={styles.searchBox}>
                    <Feather name='search' size={18} color="gray" />
                    <TextInput placeholder='Explore new place...' style={styles.input}/>
                </View>
            </View>
           
            <View style={{ height: 400 }}>
                <Swiper 
                    autoplay 
                    loop 
                    showsPagination
                    autoplayTimeout={5}
                >
                    {dataSlider.map(item => (
                        <ImageBackground
                            key={item.id}
                            source={item.image}
                            style={styles.slide}
                            resizeMode="cover"
                        >
                            <View style={styles.slideContent}>
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
    
                                <Text style={styles.description}>{item.description.substring(0, 150) + "..."}</Text>
    
                                <TouchableOpacity style={styles.exploreBtn}>
                                    <Text style={styles.exploreText}>Explore Now</Text>
                                    <Ionicons name="arrow-forward" size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                        </ImageBackground>
                    ))}
                </Swiper>
            </View>
        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    headerBar: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D9E2E9',
        borderRadius: 100,
        paddingHorizontal: 10,
        paddingVertical: 5,
        paddingHorizontal: 20
    },
    input: {
        marginLeft: 5,
        flex: 1,
        height: 40,
        fontSize: 14,
    },
    slide: {
        width: "100%",
        height: "100%",
        justifyContent: 'flex-end'
    },
    slideContent: {
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.3)',
        height: 170
    },
    logo: {
        fontSize: 20,
        fontWeight: 900
    },
    name: {
        fontSize: 20,
        fontWeight: 300,
        marginVertical: 5
    },
    description: {
        color: 'white',
        fontSize: 13
    },
    exploreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    exploreText: {
        color: 'white',
        marginRight: 5,
        fontSize: 14,
        fontWeight: 900
    }
});