import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Image,
	Dimensions,
	FlatList,
	ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../api/api'; // Import your API utility

// Fallback image in case API has no image
import FallbackImage from '../../assets/localynk_images/discover1.png';

const { width } = Dimensions.get('window');
const COLUMNS = 3;
const ITEM_WIDTH = (width - 48) / COLUMNS;

const PlaceCard = ({ item, onPress }) => {
	// Determine image source: API URL or fallback local asset
	const imageSource = item.image || item.first_image || item.thumbnail
		? { uri: item.image || item.first_image || item.thumbnail }
		: FallbackImage;

	return (
		<TouchableOpacity
			style={[styles.placeCard, { width: ITEM_WIDTH, height: ITEM_WIDTH }]}
			onPress={onPress}
			activeOpacity={0.8}
		>
			<Image source={imageSource} style={styles.placeImage} resizeMode="cover" />
			<LinearGradient
				colors={['transparent', 'rgba(0,0,0,0.7)']}
				style={styles.gradient}
			/>
			<View style={styles.infoOverlay}>
				<Text style={styles.placeName} numberOfLines={1}>
					{item.name}
				</Text>
				<View style={styles.locationRow}>
					<Ionicons name="location" size={11} color="#fff" />
					<Text style={styles.placeLocation} numberOfLines={1}>
						{item.location || 'Zamboanga City'}
					</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
};

const HomePlacesBrowse = ({ isPublic = false }) => {
	const router = useRouter();
	const { isAuthenticated } = useAuth();
	
	// State for API data
	const [destinations, setDestinations] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchDestinations = async () => {
			try {
				const response = await api.get('/api/destinations/');
				// Slice to 12 items to keep the grid tidy (4 rows of 3)
				// You can change this number or remove .slice() to show all
				setDestinations(response.data.slice(0, 12));
			} catch (error) {
				console.error("Failed to fetch browse places:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchDestinations();
	}, []);

	const handlePlacePress = (item) => {
		if (isPublic && !isAuthenticated) {
				router.push('/auth/login');
		} else {
				router.push({
					pathname: '/(protected)/placesDetails',
					params: {
						id: item.id.toString(),
						// Pass the string URI if available
						image: item.image || item.first_image || '', 
					},
				});
		}
	};

	const handleViewAll = () => {
		if (isPublic && !isAuthenticated) {
				router.push('/auth/login');
		} else {
				router.push({
					pathname: '/(protected)/explore',
					params: {
						tab: 'places',
					},
				});
		}
	};

	if (loading) {
		return (
			<View style={[styles.container, { height: 200, justifyContent: 'center', alignItems: 'center' }]}>
				<ActivityIndicator size="small" color="#0072FF" />
			</View>
		);
	}

	// If no data, return nothing or a message
	if (!destinations || destinations.length === 0) {
		return null; 
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.headerLeft}>
					<Text style={styles.title}>Browse Destinations</Text>
					<Text style={styles.subtitle}>Zamboanga's Hidden Gems & Landmarks</Text>
				</View>
				<TouchableOpacity
					style={styles.viewAllButton}
					onPress={handleViewAll}
					hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
				>
					<Text style={styles.viewAllText}>View All</Text>
					<Ionicons name="arrow-forward" size={14} color="#0072FF" />
				</TouchableOpacity>
			</View>

			<FlatList
				data={destinations}
				renderItem={({ item }) => (
					<PlaceCard
						item={item}
						onPress={() => handlePlacePress(item)}
					/>
				)}
				keyExtractor={(item) => item.id.toString()}
				numColumns={COLUMNS}
				scrollEnabled={false}
				columnWrapperStyle={styles.columnWrapper}
				contentContainerStyle={styles.gridContent}
			/>
		</View>
	);
};

export default HomePlacesBrowse;

const styles = StyleSheet.create({
	container: {
		marginTop: 20,
		marginBottom: 20,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		paddingHorizontal: 15,
		marginBottom: 16,
	},
	headerLeft: {
		flex: 1,
		marginRight: 10,
	},
	title: {
		fontSize: 16,
		textTransform: 'uppercase',
		letterSpacing: 1,
		fontWeight: '600',
		color: '#000',
	},
	subtitle: {
		fontSize: 12,
		color: '#666',
		marginTop: 4,
		lineHeight: 16,
	},
	viewAllButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: 20,
	},
	viewAllText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#0072FF',
		marginRight: 4,
	},
	gridContent: {
		paddingHorizontal: 12,
	},
	columnWrapper: {
		justifyContent: 'space-between',
		marginBottom: 12,
		gap: 6,
	},
	placeCard: {
		borderRadius: 12,
		overflow: 'hidden',
		backgroundColor: '#fff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.12,
		shadowRadius: 4,
		elevation: 3,
	},
	placeImage: {
		width: '100%',
		height: '100%',
		resizeMode: 'cover',
	},
	gradient: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: '60%',
	},
	infoOverlay: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		padding: 8,
	},
	placeName: {
		fontSize: 12,
		fontWeight: '700',
		color: '#fff',
		marginBottom: 3,
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	placeLocation: {
		fontSize: 10,
		color: '#fff',
		marginLeft: 3,
		flex: 1,
	},
});