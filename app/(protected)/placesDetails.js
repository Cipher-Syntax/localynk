// import React, { useState, useEffect, useRef } from 'react';
// import { ScrollView, View, Text, Image, StyleSheet, StatusBar, FlatList, TouchableOpacity, Animated, Easing, ActivityIndicator } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { Star, MapPin, User, Calendar, MessageCircle, ChevronRight } from 'lucide-react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';

// export default function PlacesDetails() {
//   const [loading, setLoading] = useState(true);
//   const [activeImageIndex, setActiveImageIndex] = useState(0);
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const bounceValue = useRef(new Animated.Value(0)).current;

//   const startBounce = () => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(bounceValue, { toValue: -10, duration: 400, easing: Easing.linear, useNativeDriver: true }),
//         Animated.timing(bounceValue, { toValue: 0, duration: 400, easing: Easing.linear, useNativeDriver: true }),
//       ])
//     ).start();
//   };

//   useEffect(() => {
//     startBounce();
//     const timer = setTimeout(() => setLoading(false), 2000);
//     return () => clearTimeout(timer);
//   }, []);

//   const destinationImages = [
//     { id: 1, image: { uri: params.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop' }, caption: 'Main waterfall view' },
//     { id: 2, image: { uri: params.image || 'https://images.unsplash.com/photo-1472552154091-7bedd7e01d16?w=800&h=600&fit=crop' }, caption: 'Crystal pool' },
//     { id: 3, image: { uri: params.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop' }, caption: 'Forest trails' },
//   ];

//   const attractions = [
//     { id: 1, name: 'Upper Waterfall', description: 'A magnificent 25-meter cascade with a shallow pool perfect for wading.', average_rating: 4.9, photo: { uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' } },
//     { id: 2, name: 'Emerald Pool', description: 'Crystal-clear turquoise waters ideal for swimming and snorkeling.', average_rating: 4.7, photo: { uri: 'https://images.unsplash.com/photo-1472552154091-7bedd7e01d16?w=400&h=300&fit=crop' } },
//     { id: 3, name: 'Jungle Path', description: 'Scenic hiking trail through dense forest with exotic flora and fauna.', average_rating: 4.6, photo: { uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop' } },
//   ];

//   const destinationInfo = {
//     title: 'BAGACAY FALLS',
//     category: 'Nature',
//     location: 'Zamboanga City, Philippines',
//     average_rating: 4.8,
//     total_reviews: 156,
//     creator: 'Maria Santos',
//     description: "Tucked away in the greenery of Zamboanga City, Bagacay Falls offers a refreshing escape with its clear waters and calm, natural pool. Surrounded by rocks and trees, it’s a peaceful spot for swimming, relaxing, or simply enjoying nature’s quiet charm.",
//   };

//   if (loading) {
//     return (
//       <View style={styles.loader}>
//         <ActivityIndicator size="large" color="#00A8FF" />
//       </View>
//     );
//   }

//   return (
//     <ScrollView style={styles.container}>
//       <SafeAreaView>
//         <StatusBar barStyle="dark-content" backgroundColor="#fff" />

// 			<View style={styles.header}>
// 				<Image
// 					source={require('../../assets/localynk_images/header.png')}
// 					style={styles.headerImage}
// 					/>
// 				<LinearGradient
// 					colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
// 					style={styles.overlay}
// 				/>
// 				<Text style={styles.headerTitle}>EXPLORE YOUR NEXT DESTINATION HERE</Text>
// 			</View>

//         {/* Hero Image Section */}
//         <View style={styles.heroContainer}>
//           <Image source={destinationImages[activeImageIndex].image} style={styles.heroImage} />
//           <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.heroOverlay} />
//           <View style={styles.heroContent}>
//             <Text style={styles.heroTitle}>{destinationInfo.title}</Text>
//             <View style={styles.ratingRow}>
//               <Star size={16} color="#FACC15" />
//               <Text style={styles.ratingText}>{destinationInfo.average_rating} ({destinationInfo.total_reviews} reviews)</Text>
//             </View>
//           </View>

//           {/* Category Badge */}
//           <View style={styles.categoryBadge}>
//             <Text style={styles.categoryText}>{destinationInfo.category}</Text>
//           </View>

//           {/* Image Indicators */}
//           <View style={styles.imageIndicators}>
//             {destinationImages.map((_, idx) => (
//               <View key={idx} style={[styles.indicator, activeImageIndex === idx && styles.activeIndicator]} />
//             ))}
//           </View>
//         </View>

//         {/* Location */}
//         <View style={styles.infoCard}>
//           <MapPin size={20} color="#3B82F6" />
//           <View style={{ marginLeft: 8 }}>
//             <Text style={styles.infoLabel}>Location</Text>
//             <Text style={styles.infoText}>{destinationInfo.location}</Text>
//           </View>
//         </View>

//         {/* About */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>About</Text>
//           <Text style={styles.sectionText}>{destinationInfo.description}</Text>
//         </View>

//         {/* Photo Gallery */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Photo Gallery</Text>
//           <FlatList
//             horizontal
//             data={destinationImages}
//             keyExtractor={(item) => item.id.toString()}
//             showsHorizontalScrollIndicator={false}
//             contentContainerStyle={{ paddingVertical: 5 }}
//             renderItem={({ item, index }) => (
//               <TouchableOpacity onPress={() => setActiveImageIndex(index)} activeOpacity={0.8}>
//                 <View style={styles.imageCard}>
//                   <Image source={item.image} style={styles.imageCardImage} />
//                   <View style={styles.imageOverlay} />
//                   <Text style={styles.imageCaption}>{item.caption}</Text>
//                 </View>
//               </TouchableOpacity>
//             )}
//           />
//         </View>

//         {/* Featured Attractions */}
//         {/* <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Featured Attractions</Text>
//           {attractions.map((item) => (
//             <TouchableOpacity key={item.id} style={styles.attractionCard} activeOpacity={0.8}>
//               <Image source={item.photo} style={styles.attractionImage} />
//               <View style={styles.attractionContent}>
//                 <View style={styles.attractionHeader}>
//                   <Text style={styles.attractionTitle}>{item.name}</Text>
//                   <View style={styles.attractionRating}>
//                     <Star size={12} color="#FACC15" />
//                     <Text style={styles.attractionRatingText}>{item.average_rating}</Text>
//                   </View>
//                 </View>
//                 <Text style={styles.attractionDesc}>{item.description}</Text>
//               </View>
//               <ChevronRight size={20} color="#3B82F6" />
//             </TouchableOpacity>
//           ))}
//         </View> */}

//         {/* Creator Info */}
//         {/* <View style={styles.infoCard}>
//           <View style={styles.creatorAvatar}>
//             <User size={20} color="#fff" />
//           </View>
//           <View style={{ marginLeft: 8 }}>
//             <Text style={styles.infoLabel}>Created by</Text>
//             <Text style={styles.infoText}>{destinationInfo.creator}</Text>
//           </View>
//         </View> */}

//         {/* Action Buttons */}
//         <View style={{ paddingHorizontal: 15, paddingVertical: 20 }}>
//           <TouchableOpacity style={styles.bookButton} onPress={() => router.push({ pathname: '/(protected)/bookingChoice' })}>
//             <Calendar size={20} color="#fff" />
//             <Text style={styles.bookButtonText}>Choose A Guide</Text>
//           </TouchableOpacity>

//           {/* <TouchableOpacity style={styles.contactButton}>
//             <MessageCircle size={20} color="#3B82F6" />
//             <Text style={styles.contactButtonText}>CONTACT</Text>
//           </TouchableOpacity> */}
//         </View>
//       </SafeAreaView>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
// 	container: {
//         flex: 1,
//         backgroundColor: '#fff',
//     },
//     header: {
//         position: 'relative',
//         height: 120,
//         justifyContent: 'center',
//     },
//     headerImage: {
//         width: '100%',
//         height: '100%',
//         resizeMode: 'cover',
//         borderBottomLeftRadius: 25,
//         borderBottomRightRadius: 25,
//     },
//     overlay: {
//         ...StyleSheet.absoluteFillObject,
//         borderBottomLeftRadius: 25,
//         borderBottomRightRadius: 25,
//     },
//     headerTitle: {
//         position: 'absolute',
//         bottom: 15,
//         left: 20,
//         color: '#fff',
//         fontSize: 18,
//         fontWeight: '700',
//         letterSpacing: 1,
//     },
// 	loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
// 	heroContainer: { height: 300, margin: 15, borderRadius: 20, overflow: 'hidden', position: 'relative' },
// 	heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
// 	heroOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%' },
// 	heroContent: { position: 'absolute', bottom: 15, left: 15, right: 15 },
// 	heroTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
// 	ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
// 	ratingText: { fontSize: 14, color: '#fff', marginLeft: 4 },
// 	categoryBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
// 	categoryText: { color: '#fff', fontSize: 12, fontWeight: '600' },
// 	imageIndicators: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 4 },
// 	indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
// 	activeIndicator: { width: 16, backgroundColor: '#fff' },
// 	infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, marginHorizontal: 15, borderRadius: 12, marginVertical: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 2 },
// 	infoLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },
// 	infoText: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },
// 	section: { paddingHorizontal: 15, paddingVertical: 12 },
// 	sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8, textTransform: 'uppercase' },
// 	sectionText: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
// 	imageCard: { width: 160, height: 160, borderRadius: 15, overflow: 'hidden', marginRight: 12 },
// 	imageCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
// 	imageOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%', backgroundColor: 'rgba(0,0,0,0.2)' },
// 	imageCaption: { position: 'absolute', bottom: 8, left: 8, color: '#fff', fontSize: 12, fontWeight: '600' },
// 	attractionCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginVertical: 6, overflow: 'hidden', padding: 8, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 2 },
// 	attractionImage: { width: 80, height: 80, borderRadius: 12, marginRight: 8 },
// 	attractionContent: { flex: 1 },
// 	attractionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
// 	attractionTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
// 	attractionRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
// 	attractionRatingText: { fontSize: 12, fontWeight: '600', color: '#FACC15', marginLeft: 2 },
// 	attractionDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
// 	creatorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
// 	bookButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 10, marginBottom: 10 },
// 	bookButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
// 	contactButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 2, borderColor: '#3B82F6', paddingVertical: 14, borderRadius: 10 },
// 	contactButtonText: { color: '#3B82F6', fontWeight: '700', fontSize: 16 },
// });

import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, View, Text, Image, StyleSheet, StatusBar, FlatList, TouchableOpacity, Animated, Easing, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, MapPin, User, Calendar, ChevronRight } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Import API
import api from '../../api/api';

export default function PlacesDetails() {
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState(null); // State for the fetched destination
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Get ID from navigation
  
  const bounceValue = useRef(new Animated.Value(0)).current;

  const startBounce = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, { toValue: -10, duration: 400, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(bounceValue, { toValue: 0, duration: 400, easing: Easing.linear, useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => {
    startBounce();
    fetchDestinationDetails();
  }, [id]);

  // Fetch specific destination by ID
  const fetchDestinationDetails = async () => {
    try {
        const response = await api.get(`/api/destinations/${id}/`);
        setDestination(response.data);
    } catch (error) {
        console.error("Error fetching destination details:", error);
    } finally {
        setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#00A8FF" />
      </View>
    );
  }

  if (!destination) {
    return (
        <View style={styles.loader}>
            <Text>Destination not found.</Text>
        </View>
    );
  }

  // Helper to get current hero image safely
  const heroImageUri = destination.images && destination.images.length > 0 
    ? destination.images[activeImageIndex]?.image 
    : null;

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.header}>
            <Image
            source={require('../../assets/localynk_images/header.png')}
            style={styles.headerImage}
            />
            <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
            style={styles.overlay}
            />
            <Text style={styles.headerTitle}>EXPLORE YOUR NEXT DESTINATION HERE</Text>
        </View>

        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
            {/* Dynamic Hero Image */}
            <Image 
                source={heroImageUri ? { uri: heroImageUri } : require('../../assets/localynk_images/login_background.png')} 
                style={styles.heroImage} 
            />
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.heroOverlay} />
            
            <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{destination.name}</Text>
                <View style={styles.ratingRow}>
                    <Star size={16} color="#FACC15" />
                    <Text style={styles.ratingText}>{destination.average_rating || 'New'}</Text>
                </View>
            </View>

            {/* Category Badge */}
            <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{destination.category}</Text>
            </View>

            {/* Image Indicators */}
            <View style={styles.imageIndicators}>
                {destination.images?.map((_, idx) => (
                    <View key={idx} style={[styles.indicator, activeImageIndex === idx && styles.activeIndicator]} />
                ))}
            </View>
        </View>

        {/* Location */}
        <View style={styles.infoCard}>
          <MapPin size={20} color="#3B82F6" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoText}>{destination.location}</Text>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.sectionText}>{destination.description}</Text>
        </View>

        {/* Photo Gallery */}
        {destination.images && destination.images.length > 0 && (
            <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photo Gallery</Text>
            <FlatList
                horizontal
                data={destination.images}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 5 }}
                renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => setActiveImageIndex(index)} activeOpacity={0.8}>
                    <View style={styles.imageCard}>
                    <Image source={{ uri: item.image }} style={styles.imageCardImage} />
                    <View style={styles.imageOverlay} />
                    <Text style={styles.imageCaption}>{item.caption || 'View'}</Text>
                    </View>
                </TouchableOpacity>
                )}
            />
            </View>
        )}

        {/* Featured Attractions (Fetched from Backend) */}
        {destination.attractions && destination.attractions.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Featured Attractions</Text>
                {destination.attractions.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.attractionCard} activeOpacity={0.8}>
                        {/* If Attraction has photo */}
                        {item.photo && (
                             <Image source={{ uri: item.photo }} style={styles.attractionImage} />
                        )}
                       
                        <View style={styles.attractionContent}>
                            <View style={styles.attractionHeader}>
                                <Text style={styles.attractionTitle}>{item.name}</Text>
                                {/* Optional rating if your model has it */}
                                {/* <View style={styles.attractionRating}>
                                    <Star size={12} color="#FACC15" />
                                    <Text style={styles.attractionRatingText}>{item.average_rating}</Text>
                                </View> */}
                            </View>
                            <Text style={styles.attractionDesc}>{item.description}</Text>
                        </View>
                        {/* <ChevronRight size={20} color="#3B82F6" /> */}
                    </TouchableOpacity>
                ))}
            </View>
        )}

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 15, paddingVertical: 20 }}>
          <TouchableOpacity style={styles.bookButton} onPress={() => router.push({ pathname: '/(protected)/bookingChoice' })}>
            <Calendar size={20} color="#fff" />
            <Text style={styles.bookButtonText}>Choose A Guide for {destination.name}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTitle: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
    },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  heroContainer: { height: 300, margin: 15, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%' },
  heroContent: { position: 'absolute', bottom: 15, left: 15, right: 15 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { fontSize: 14, color: '#fff', marginLeft: 4 },
  categoryBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  categoryText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  imageIndicators: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', gap: 4 },
  indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  activeIndicator: { width: 16, backgroundColor: '#fff' },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, marginHorizontal: 15, borderRadius: 12, marginVertical: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 2 },
  infoLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' },
  infoText: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 2 },
  section: { paddingHorizontal: 15, paddingVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8, textTransform: 'uppercase' },
  sectionText: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  imageCard: { width: 160, height: 160, borderRadius: 15, overflow: 'hidden', marginRight: 12 },
  imageCardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%', backgroundColor: 'rgba(0,0,0,0.2)' },
  imageCaption: { position: 'absolute', bottom: 8, left: 8, color: '#fff', fontSize: 12, fontWeight: '600' },
  attractionCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, marginVertical: 6, overflow: 'hidden', padding: 8, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, elevation: 2 },
  attractionImage: { width: 80, height: 80, borderRadius: 12, marginRight: 8 },
  attractionContent: { flex: 1 },
  attractionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attractionTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  attractionRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  attractionRatingText: { fontSize: 12, fontWeight: '600', color: '#FACC15', marginLeft: 2 },
  attractionDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  creatorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  bookButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#3B82F6', paddingVertical: 14, borderRadius: 10, marginBottom: 10 },
  bookButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});