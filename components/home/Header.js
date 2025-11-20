// import React, { useState, useRef, useCallback } from 'react';
// import { View, Text, TextInput, ImageBackground, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
// import { Feather, Ionicons } from '@expo/vector-icons';
// import Swiper from 'react-native-swiper';
// import MaskedView from '@react-native-masked-view/masked-view';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useRouter, useFocusEffect } from 'expo-router';

// // Import your API utility
// import api from '../../api/api'; 

// import LoginBackground from '../../assets/localynk_images/login_background.png';
// import RegisterBackground from '../../assets/localynk_images/register_background.png';

// const { width } = Dimensions.get('window');

// const dataSlider = [
//     {
//         id: 1,
//         image: LoginBackground,
//         logo: "DISCOVER NATURE'S SERENITY!",
//         name: "MUTI, GRASSLAND",
//         description: "Nestled in the heart of nature, Muti Grassland offers a breathtaking escape into rolling green hills and open skies.",
//         rating: 4.8,
//         reviews: 234
//     },
//     {
//         id: 2,
//         image: RegisterBackground,
//         logo: "DISCOVER COASTAL TRANQUILITY!",
//         name: "BOLONG BEACH",
//         description: "Breathe in the sea breeze and let your worries drift away at Bolong Beach — where calm waters meet golden sands.",
//         rating: 4.9,
//         reviews: 512
//     },
//     {
//         id: 3,
//         image: RegisterBackground,
//         logo: "DISCOVER SUNSET BLISS!",
//         name: "ZAMBOANGA CITY, BOULEVARD",
//         description: "Watch the sky come alive at Zamboanga's Boulevard, where every sunset paints a masterpiece over calm waves.",
//         rating: 4.7,
//         reviews: 189
//     }
// ];

// const Header = () => {
//     const [activeIndex, setActiveIndex] = useState(0);
//     const [unreadCount, setUnreadCount] = useState(0); // State for dynamic count
//     const swiperRef = useRef(null);
//     const router = useRouter();

//     // Function to fetch the unread count from backend
//     const fetchUnreadCount = async () => {
//         try {
//             const response = await api.get('/api/alerts/unread-count/');
//             if (response.data && response.data.unread_count !== undefined) {
//                 setUnreadCount(response.data.unread_count);
//             }
//         } catch (error) {
//             console.log("Failed to fetch unread count:", error);
//         }
//     };

//     // useFocusEffect runs every time this screen comes into focus
//     useFocusEffect(
//         useCallback(() => {
//             fetchUnreadCount();
//         }, [])
//     );

//     const handleIndexChanged = (index) => {
//         setActiveIndex(index);
//     };

//     const handleNotificationPress = () => {
//         // Optimistically clear count or wait for return
//         router.push('/(protected)/notification');
//     };

//     const handleExplorePress = () => {
//         router.push({
//             pathname: "/(protected)/placesDetails",
//             params: {
//                 id: "1",
//                 image: Image.resolveAssetSource(LoginBackground).uri,
//             },
//         });
//     };

//     return (
//         <View style={{ flex: 1 }}>
//             <View style={[styles.headerBar, { width: width * 1 }]}>
//                 <View style={styles.searchBox}>
//                     <Feather name='search' size={18} color="#666" />
//                     <TextInput 
//                         placeholder='Explore new place...' 
//                         style={styles.input}
//                         placeholderTextColor="#999"
//                     />
//                 </View>
//                 <TouchableOpacity 
//                     style={styles.notificationBtn}
//                     onPress={handleNotificationPress}
//                 >
//                     <Ionicons name='notifications' size={24} color="white" />
                    
//                     {/* CONDITIONAL RENDERING: Only show if count > 0 */}
//                     {unreadCount > 0 && (
//                         <View style={styles.notificationBadge}>
//                             <Text style={styles.badgeText}>
//                                 {unreadCount > 9 ? '9+' : unreadCount}
//                             </Text>
//                         </View>
//                     )}

//                 </TouchableOpacity>
//             </View>
           
//             <View style={{ height: 380 }}>
//                 <Swiper 
//                     ref={swiperRef}
//                     autoplay 
//                     loop 
//                     showsPagination={false}
//                     autoplayTimeout={6}
//                     onIndexChanged={handleIndexChanged}
//                 >
//                     {dataSlider.map(item => (
//                         <ImageBackground
//                             key={item.id}
//                             source={item.image}
//                             style={styles.slide}
//                             resizeMode="cover"
//                         >
//                             <LinearGradient
//                                 colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
//                                 style={styles.gradientOverlay}
//                             />
                            
//                             <View style={styles.slideContent}>
//                                 <View style={styles.topBadge}>
//                                     <Ionicons name="star" size={14} color="#FFD700" />
//                                     <Text style={styles.ratingValue}>{item.rating}</Text>
//                                     <Text style={styles.reviewCount}>({item.reviews} reviews)</Text>
//                                 </View>

//                                 <View style={styles.textContainer}>
//                                     <MaskedView maskElement={<Text style={styles.logo}>{item.logo}</Text>}>
//                                         <LinearGradient colors={['#FFFFFF', '#00C6FF']}>
//                                             <Text style={[styles.logo, { opacity: 0 }]}>{item.logo}</Text>
//                                         </LinearGradient>
//                                     </MaskedView>
        
//                                     <MaskedView maskElement={<Text style={styles.name}>{item.name}</Text>}>
//                                         <LinearGradient colors={['#FFFFFF', '#00C6FF']}>
//                                             <Text style={[styles.name, { opacity: 0 }]}>{item.name}</Text>
//                                         </LinearGradient>
//                                     </MaskedView>
        
//                                     <Text style={styles.description}>{item.description}</Text>
//                                 </View>

//                                 <TouchableOpacity style={styles.exploreBtn} activeOpacity={0.8} onPress={handleExplorePress}>
//                                     <Text style={styles.exploreText}>Explore Now</Text>
//                                     <Ionicons name="arrow-forward" size={16} color="white" />
//                                 </TouchableOpacity>
//                             </View>
//                         </ImageBackground>
//                     ))}
//                 </Swiper>
//             </View>

//             <View style={styles.indicatorContainer}>
//                 {dataSlider.map((_, index) => (
//                     <TouchableOpacity
//                         key={index}
//                         style={[
//                             styles.paginationDot,
//                             activeIndex === index && styles.activeDot,
//                         ]}
//                         onPress={() => swiperRef.current?.scrollBy(index - activeIndex)}
//                     />
//                 ))}
//             </View>
//         </View>
//     )
// }

// export default Header

// const styles = StyleSheet.create({
//     headerBar: {
//         position: 'absolute',
//         top: 40,
//         left: 0,
//         right: 0,
//         zIndex: 10,
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 15,
//         gap: 10
//     },
//     searchBox: {
//         flex: 1,
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: 'rgba(217, 226, 233, 0.95)',
//         borderRadius: 50,
//         paddingHorizontal: 15,
//         paddingVertical: 8,
//         elevation: 3,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//     },
//     input: {
//         marginLeft: 10,
//         flex: 1,
//         height: 40,
//         fontSize: 14,
//         color: '#333',
//     },
//     notificationBtn: {
//         width: 50,
//         height: 50,
//         borderRadius: 25,
//         backgroundColor: '#00C6FF',
//         justifyContent: 'center',
//         alignItems: 'center',
//         elevation: 3,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         position: 'relative',
//     },
//     notificationBadge: {
//         position: 'absolute',
//         top: -2,
//         right: -2,
//         minWidth: 22, // Changed to minWidth for 2 digits
//         height: 22,
//         borderRadius: 11,
//         backgroundColor: '#FF3B30', // iOS Standard Red
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderWidth: 2,
//         borderColor: '#fff',
//         paddingHorizontal: 4,
//     },
//     badgeText: {
//         color: '#fff',
//         fontSize: 10,
//         fontWeight: '700',
//     },
//     slide: {
//         width: "100%",
//         height: "100%",
//         justifyContent: 'flex-end'
//     },
//     gradientOverlay: {
//         position: 'absolute',
//         top: 0,
//         left: 0,
//         right: 0,
//         bottom: 0,
//     },
//     slideContent: {
//         padding: 20,
//         paddingBottom: 25,
//         zIndex: 2,
//     },
//     topBadge: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         alignSelf: 'flex-start',
//         backgroundColor: 'rgba(255, 255, 255, 0.95)',
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         borderRadius: 20,
//         marginBottom: 15,
//     },
//     ratingValue: {
//         fontSize: 12,
//         fontWeight: '700',
//         color: '#1a1a1a',
//         marginLeft: 4,
//     },
//     reviewCount: {
//         fontSize: 11,
//         color: '#666',
//         marginLeft: 4,
//     },
//     textContainer: {
//         marginBottom: 15,
//     },
//     logo: {
//         fontSize: 18,
//         fontWeight: '900',
//         lineHeight: 24,
//     },
//     name: {
//         fontSize: 22,
//         fontWeight: '600',
//         marginVertical: 6,
//         lineHeight: 28,
//     },
//     description: {
//         color: 'rgba(255, 255, 255, 0.9)',
//         fontSize: 13,
//         lineHeight: 18,
//         marginTop: 8,
//     },
//     exploreBtn: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginTop: 14,
//         paddingHorizontal: 16,
//         paddingVertical: 10,
//         backgroundColor: '#00C6FF',
//         borderRadius: 12,
//         alignSelf: 'flex-start',
//         elevation: 4,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.15,
//         shadowRadius: 6,
//     },
//     exploreText: {
//         color: 'white',
//         marginRight: 8,
//         fontSize: 14,
//         fontWeight: '700',
//     },
//     indicatorContainer: {
//         flexDirection: 'row',
//         justifyContent: 'center',
//         alignItems: 'center',
//         paddingVertical: 12,
//         gap: 8,
//         zIndex: 5,
//     },
//     paginationDot: {
//         width: 8,
//         height: 8,
//         borderRadius: 4,
//         backgroundColor: 'rgba(0, 198, 255, 0.3)',
//         borderWidth: 1.5,
//         borderColor: 'rgba(0, 198, 255, 0.5)',
//     },
//     activeDot: {
//         backgroundColor: '#00C6FF',
//         borderColor: '#00C6FF',
//         width: 28,
//     },
// });

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, TextInput, ImageBackground, StyleSheet, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';

// Import your API utility
import api from '../../api/api'; // Ensure this path matches your project structure

const { width } = Dimensions.get('window');

const Header = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // 1. State for Destinations
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);

    const swiperRef = useRef(null);
    const router = useRouter();

    // 2. Fetch Destinations from API
    const fetchDestinations = async () => {
        try {
            const response = await api.get('/api/destinations/');
            setDestinations(response.data);
        } catch (error) {
            console.error("Failed to fetch destinations:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/api/alerts/unread-count/');
            if (response.data && response.data.unread_count !== undefined) {
                setUnreadCount(response.data.unread_count);
            }
        } catch (error) {
            console.log("Failed to fetch unread count:", error);
        }
    };

    // Run on mount
    useEffect(() => {
        fetchDestinations();
    }, []);

    // Auto-refresh unread alerts every 5 seconds
    useEffect(() => {
            fetchUnreadCount(); // run immediately

            const interval = setInterval(() => {
                    fetchUnreadCount(); // refresh every 5s
            }, 2000);

            return () => clearInterval(interval); // clean when component unmounts
    }, []);


    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();
        }, [])
    );

    const handleIndexChanged = (index) => {
        setActiveIndex(index);
    };

    const handleNotificationPress = () => {
        router.push('/(protected)/notification');
    };

    // 3. Updated Explore Press to pass the specific ID
    const handleExplorePress = (destinationId) => {
        router.push({
            pathname: "/(protected)/placesDetails",
            params: { id: destinationId }, // Pass the ID to the details page
        });
    };

    if (loading) {
        return <View style={{height: 380, justifyContent:'center'}}><ActivityIndicator size="large" color="#00C6FF"/></View>;
    }

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
                        {/* 4. Map through API Data */}
                        {destinations.map(item => (
                            <ImageBackground
                                key={item.id}
                                // Use first_image from API, or a placeholder if null
                                source={item.first_image ? { uri: item.first_image } : require('../../assets/localynk_images/login_background.png')}
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
                                        {/* Use API data for rating */}
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
                {destinations.map((_, index) => (
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
        position: 'relative',
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