import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, Map, Heart } from 'lucide-react-native';

const { width } = Dimensions.get('window');

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
            {/* Header Section */}
            <View style={styles.headerContainer}>
                <Text style={styles.overline}>OUR MISSION</Text>
                <Text style={styles.title}>
                    Connecting <Text style={styles.highlight}>People</Text>,{'\n'}Creating Memories
                </Text>
            </View>

            {/* Main Card */}
            <View style={styles.cardContainer}>
                <LinearGradient
                    colors={['#ffffff', '#F8FAFC']}
                    style={styles.card}
                >
                     <View style={styles.logoSection}>
                        <Image 
                            source={require("../../assets/localynk_images/logo.png")} 
                            style={styles.logo} 
                            resizeMode="contain" 
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

            {/* Footer */}
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

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        marginTop: 50,
    },
    headerContainer: {
        marginBottom: 25,
        alignItems: 'center',
    },
    overline: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0072FF',
        letterSpacing: 1.5,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
        lineHeight: 34,
    },
    highlight: {
        color: '#00C6FF',
    },
    cardContainer: {
        shadowColor: '#0072FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 6,
        borderRadius: 24,
    },
    card: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 15,
    },
    logo: {
        width: 120,
        height: 40,
    },
    description: {
        fontSize: 14,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 20,
    },
    featuresContainer: {
        gap: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    featureDescription: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
    footer: {
        alignItems: 'center',
        marginTop: 40,
        gap: 12,
    },
    brandLine: {
        width: 40,
        height: 4,
        borderRadius: 2,
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    }
});

export default About;