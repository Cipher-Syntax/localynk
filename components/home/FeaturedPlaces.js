import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Dimensions, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

import FeaturePlace1 from '../../assets/localynk_images/featured1.png';
import FeaturePlace2 from '../../assets/localynk_images/featured2.png';
import FeaturePlace3 from '../../assets/localynk_images/featured3.png';

import DiscoverPlace1 from '../../assets/localynk_images/discover1.png';
import DiscoverPlace2 from '../../assets/localynk_images/discover2.png';
import DiscoverPlace3 from '../../assets/localynk_images/discover3.png';
import DiscoverPlace4 from '../../assets/localynk_images/discover4.png';

const { width } = Dimensions.get('window');

const FeaturedPlaces = () => {
    const [isActive, setIsActive] = useState(2);

    const FeatureCards = [
        { id: 1, image: FeaturePlace1 },
        { id: 2, image: FeaturePlace2 },
        { id: 3, image: FeaturePlace3 },
        { id: 4, image: FeaturePlace1 },
        { id: 5, image: FeaturePlace2 },
        { id: 6, image: FeaturePlace3 },
    ];

    const DiscoverWhatYouWant = [
        { id: 1, image: DiscoverPlace1, name: 'BEACHES' },
        { id: 2, image: DiscoverPlace2, name: 'MOUNTAINS' },
        { id: 3, image: DiscoverPlace3, name: 'RIVERS' },
        { id: 4, image: DiscoverPlace4, name: 'CITY' },
    ];

    return (
        <View style={{ paddingBottom: 50, }}>
            <View style={styles.container}>

                <View style={styles.header}>
                    <Text style={styles.title}>Featured Places</Text>
                    <Text style={styles.subtitle}>
                        Handpicked by locals. Loved by travelers. Discover your next stop!
                    </Text>
                </View>

                <FlatList
                    horizontal
                    data={FeatureCards}
                    keyExtractor={(item) => item.id.toString()}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.featureList}
                    renderItem={({ item }) => (
                        <TouchableOpacity activeOpacity={0.8}>
                            <View style={styles.featureCard}>
                                <Image source={item.image} style={styles.featureImage} />
                                <View style={styles.featureOverlay} />
                                <View style={styles.featureBottom}>
                                    <Text style={styles.featureText}>Discover More</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />

                <View style={styles.discoverSection}>
                    <Text style={styles.discoverTitle}>Discover What You Want</Text>
                    <View style={styles.discoverRow}>
                        {DiscoverWhatYouWant.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.9}
                                onPress={() => setIsActive(item.id)}
                                style={[
                                    styles.discoverItem,
                                    { flex: isActive === item.id ? 4 : 1 },
                                ]}
                            >
                                <Image
                                    source={item.image}
                                    style={[
                                        styles.discoverImage,
                                        { opacity: isActive === item.id ? 1 : 0.7 },
                                    ]}
                                />

                                <View style={styles.discoverCenter}>
                                    <MaskedView
                                        maskElement={
                                            <Text
                                                style={[
                                                    styles.discoverText,
                                                    isActive === item.id
                                                        ? styles.activeDiscoverText
                                                        : styles.inactiveDiscoverText,
                                                ]}
                                            >
                                                {item.name}
                                            </Text>
                                        }
                                    >
                                        <LinearGradient
                                            colors={['#FFFFFF', '#00C6FF']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Text
                                                style={[
                                                    styles.discoverText,
                                                    isActive === item.id
                                                        ? styles.activeDiscoverText
                                                        : styles.inactiveDiscoverText,
                                                    { opacity: 0 },
                                                ]}
                                            >
                                                {item.name}
                                            </Text>
                                        </LinearGradient>
                                    </MaskedView>
                                </View>

                                {isActive === item.id && (
                                    <View style={styles.discoverBottom}>
                                        <Text style={styles.discoverSubtext}>
                                            Discover more breathtaking {item.name.toLowerCase()} spots
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Pick your paradise — from golden beaches to buzzing cities and serene mountains. Discover your kind of escape!
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default FeaturedPlaces;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 30,
    },
    header: {
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    title: {
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
        color: '#444',
        marginTop: 2,
    },
    featureList: {
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    featureCard: {
        width: 180,
        height: 180,
        borderRadius: 15,
        overflow: 'hidden',
        marginRight: 12,
    },
    featureImage: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
    },
    featureOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    featureBottom: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
        marginRight: 5,
    },
    discoverSection: {
        marginTop: 20,
    },
    discoverTitle: {
        textAlign: 'center',
        fontSize: 18,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontWeight: '600',
        marginBottom: 10,
    },
    discoverRow: {
        flexDirection: 'row',
        width: '100%',
        height: 400,
        overflow: 'hidden',
    },
    discoverItem: {
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
        transition: 'flex 0.5s ease-in-out',
        width: "100"
    },
    discoverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    discoverCenter: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
    },
    discoverText: {
        fontWeight: '600',
        letterSpacing: 1,
    },
    activeDiscoverText: {
        fontSize: 20,
        color: '#00C6FF',
    },
    inactiveDiscoverText: {
        fontSize: 24,
        transform: [{ rotate: '-90deg' }],
        color: '#ffffff',
    },
    discoverBottom: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    discoverSubtext: {
        textAlign: 'center',
        fontSize: 10,
        color: '#00C6FF',
    },
    footer: {
        paddingHorizontal: 15,
        marginTop: 15,
    },
    footerText: {
        fontSize: 10,
        textAlign: 'center',
        color: '#444',
    },
});
