import { Image } from 'expo-image';
import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, Map, Heart } from 'lucide-react-native';
import { styles } from './styles/About.styles';

const FeatureItem = ({ icon: Icon, title, description }) => (
    <View style={styles.featureItem}>
        <View style={styles.iconBox}>
            <Icon size={20} color="#0072FF" />
        </View>
        <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription}>{description}</Text>
        </View>
    </View>
);

const About = () => {
    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.overline}>OUR MISSION</Text>
                <Text style={styles.title}>
                    Connecting <Text style={styles.highlight}>People</Text>, Creating Memories
                </Text>
            </View>

            <View style={styles.cardContainer}>
                <LinearGradient
                    colors={['#ffffff', '#F8FAFC']}
                    style={styles.card}
                >
                     <View style={styles.logoSection}>
                        <Image 
                            source={require("../../assets/localynk_images/logo.png")} 
                            style={styles.logo} 
                            contentFit="contain" 
                        />
                     </View>

                    <Text style={styles.description}>
                        LocalYnk connects curious travelers with passionate local guides, bridging you to hidden gems, cultural experiences, and real stories that only locals can share.
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.featuresContainer}>
                        <FeatureItem 
                            icon={Map} 
                            title="Authentic Journeys" 
                            description="Go beyond tourist traps. Experience places like a local." 
                        />
                        <FeatureItem 
                            icon={ShieldCheck} 
                            title="Verified & Safe" 
                            description="Connect with trusted guides for a secure adventure." 
                        />
                        <FeatureItem 
                            icon={Heart} 
                            title="Passion Driven" 
                            description="Support local communities and their stories." 
                        />
                    </View>
                </LinearGradient>
            </View>

            <View style={styles.footer}>
                <LinearGradient
                    colors={['#00C6FF', '#0072FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.brandLine}
                />
                <Text style={styles.footerText}>Your Gateway to Authentic Adventures</Text>
            </View>
        </View>
    );
};


export default About;