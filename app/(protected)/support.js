import React, { useState } from 'react';
import { 
    View, Text, StyleSheet, ScrollView, TouchableOpacity, 
    Image, Dimensions, StatusBar, LayoutAnimation, Platform, UIManager 
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Enable layout animation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AccordionItem = ({ title, content, isOpen, onPress }) => {
    return (
        <View style={styles.accordionContainer}>
            <TouchableOpacity 
                style={[styles.accordionHeader, isOpen && styles.accordionHeaderActive]} 
                onPress={onPress} 
                activeOpacity={0.8}
            >
                <Text style={[styles.accordionTitle, isOpen && styles.accordionTitleActive]}>{title}</Text>
                <Ionicons 
                    name={isOpen ? "chevron-up-circle" : "chevron-down-circle-outline"} 
                    size={24} 
                    color={isOpen ? "#00C6FF" : "#94A3B8"} 
                />
            </TouchableOpacity>
            {isOpen && (
                <View style={styles.accordionContent}>
                    <Text style={styles.accordionText}>{content}</Text>
                </View>
            )}
        </View>
    );
};

const GuideStep = ({ number, title, description, icon, color }) => (
    <View style={styles.stepCard}>
        <View style={styles.stepHeader}>
            <View style={[styles.stepIconBox, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.stepNumberBox}>
                <Text style={styles.stepNumber}>{number}</Text>
            </View>
        </View>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{description}</Text>
    </View>
);

const Support = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('tourist'); // 'tourist' or 'guide'
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpenSection(openSection === index ? null : index);
    };

    const faqData = [
        {
            question: "How do I book a tour?",
            answer: "Navigate to the Home tab and select a destination. Click 'Book Now', choose your preferred dates, and select a Local Guide (if available). You'll be asked to pay a down payment to secure the slot."
        },
        {
            question: "Is my payment secure?",
            answer: "Yes. We use secure payment processing. Your down payment is held in escrow until the booking is confirmed by the guide or agency."
        },
        {
            question: "Can I cancel my booking?",
            answer: "Yes, via the 'My Bookings' tab. If you cancel before the guide confirms, you get a full refund. If confirmed, cancellation fees may apply based on our policy."
        },
        {
            question: "How do I become a Local Guide?",
            answer: "Go to your Profile > Guide Settings or 'Upgrade Membership'. Submit your valid ID and any required tourism certificates. Once approved by Admin, you can start accepting bookings."
        },
        {
            question: "What happens if a guide doesn't show up?",
            answer: "You can report the issue immediately via the 'Support' page. We will investigate and process a full refund of your down payment if the guide is at fault."
        }
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* --- HEADER --- */}
            <View style={styles.headerContainer}>
                <Image 
                    source={require('../../assets/localynk_images/header.png')} 
                    style={styles.headerBg}
                    blurRadius={2}
                />
                <LinearGradient
                    colors={['rgba(0,198,255,0.85)', 'rgba(0,114,255,0.95)']}
                    style={styles.headerOverlay}
                />
                <SafeAreaView style={styles.headerContent}>
                    <View style={styles.navBar}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Help Center</Text>
                        <View style={{width: 40}} /> 
                    </View>
                    
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.greeting}>How can we help?</Text>
                        <Text style={styles.subGreeting}>Guides, tutorials, and FAQs.</Text>
                    </View>
                </SafeAreaView>
            </View>

            <ScrollView 
                style={styles.body} 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{paddingBottom: 60}}
            >
                {/* --- TOGGLE ROLE --- */}
                <View style={styles.roleToggleContainer}>
                    <TouchableOpacity 
                        style={[styles.roleBtn, activeTab === 'tourist' && styles.roleBtnActive]}
                        onPress={() => setActiveTab('tourist')}
                    >
                        <Text style={[styles.roleText, activeTab === 'tourist' && styles.roleTextActive]}>For Tourists</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.roleBtn, activeTab === 'guide' && styles.roleBtnActive]}
                        onPress={() => setActiveTab('guide')}
                    >
                        <Text style={[styles.roleText, activeTab === 'guide' && styles.roleTextActive]}>For Guides</Text>
                    </TouchableOpacity>
                </View>

                {/* --- GUIDE SECTION --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>
                        {activeTab === 'tourist' ? "How to Travel" : "How to Earn"}
                    </Text>
                    <Text style={styles.sectionSubHeader}>Step-by-step guide to using the app.</Text>

                    {activeTab === 'tourist' ? (
                        <View style={styles.stepsGrid}>
                            <GuideStep 
                                number="01" 
                                title="Explore Places" 
                                description="Browse featured destinations and hidden gems on the Home feed."
                                icon="map"
                                color="#00C6FF"
                            />
                            <GuideStep 
                                number="02" 
                                title="Book a Trip" 
                                description="Select dates and a local guide. Pay the down payment to request booking."
                                icon="calendar"
                                color="#8B5CF6"
                            />
                            <GuideStep 
                                number="03" 
                                title="Enjoy & Review" 
                                description="Meet your guide, enjoy the tour, and pay the balance. Leave a review!"
                                icon="star"
                                color="#10B981"
                            />
                        </View>
                    ) : (
                        <View style={styles.stepsGrid}>
                            <GuideStep 
                                number="01" 
                                title="Get Verified" 
                                description="Complete your profile and submit valid IDs to become a verified Guide."
                                icon="shield-checkmark"
                                color="#F59E0B"
                            />
                            <GuideStep 
                                number="02" 
                                title="Accept Bookings" 
                                description="Receive requests from tourists. Accept them to fill your schedule."
                                icon="chatbubble-ellipses"
                                color="#EC4899"
                            />
                            <GuideStep 
                                number="03" 
                                title="Earn Money" 
                                description="Get paid the remaining balance directly by tourists upon meeting."
                                icon="wallet"
                                color="#22C55E"
                            />
                        </View>
                    )}

                    <View style={styles.tipBox}>
                        <Ionicons name="bulb" size={24} color="#D97706" />
                        <View style={{flex: 1}}>
                            <Text style={styles.tipTitle}>Did you know?</Text>
                            <Text style={styles.tipText}>
                                {activeTab === 'tourist' 
                                    ? "You can chat with your guide immediately after they accept your booking request." 
                                    : "Guides with complete profiles and high ratings appear at the top of search results."}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* --- FAQ SECTION --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Frequently Asked Questions</Text>
                    <Text style={styles.sectionSubHeader}>Common questions answered.</Text>
                    
                    <View style={styles.faqList}>
                        {faqData.map((item, index) => (
                            <AccordionItem 
                                key={index}
                                title={item.question}
                                content={item.answer}
                                isOpen={openSection === index}
                                onPress={() => toggleSection(index)}
                            />
                        ))}
                    </View>

                    {/* --- CONTACT SUPPORT --- */}
                    <View style={styles.contactSupport}>
                        <View style={styles.contactIconCircle}>
                            <MaterialIcons name="support-agent" size={32} color="#fff" />
                        </View>
                        <Text style={styles.contactTitle}>Still need help?</Text>
                        <Text style={styles.contactText}>Our team is available 24/7 to assist you.</Text>
                        <TouchableOpacity style={styles.contactBtn}>
                            <Text style={styles.contactBtnText}>Contact Support</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

export default Support;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    
    // Header
    headerContainer: { height: 260, position: 'relative' },
    headerBg: { width: '100%', height: '100%', position: 'absolute' },
    headerOverlay: { ...StyleSheet.absoluteFillObject },
    headerContent: { flex: 1, paddingHorizontal: 20 },
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
    headerTextContainer: { paddingLeft: 5 },
    greeting: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 5 },
    subGreeting: { fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },

    // Body
    body: { flex: 1, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#F8FAFC', paddingTop: 30 },
    
    // Role Toggle
    roleToggleContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4, marginHorizontal: 20, marginBottom: 30 },
    roleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    roleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity:0.1, elevation: 2 },
    roleText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    roleTextActive: { color: '#0F172A', fontWeight: '700' },

    // Sections
    section: { paddingHorizontal: 20 },
    sectionHeader: { fontSize: 20, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
    sectionSubHeader: { fontSize: 14, color: '#64748B', marginBottom: 20 },
    
    divider: { height: 8, backgroundColor: '#F1F5F9', marginVertical: 30 },

    // Guide Steps
    stepsGrid: { gap: 16 },
    stepCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity:0.03, elevation: 2 },
    stepHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    stepIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    stepNumberBox: { backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    stepNumber: { fontSize: 12, fontWeight: '800', color: '#94A3B8' },
    stepTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 6 },
    stepDesc: { fontSize: 13, color: '#64748B', lineHeight: 20 },

    tipBox: { flexDirection: 'row', backgroundColor: '#FFFBEB', padding: 16, borderRadius: 16, marginTop: 20, gap: 12, borderWidth: 1, borderColor: '#FEF3C7' },
    tipTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 4 },
    tipText: { fontSize: 13, color: '#B45309', lineHeight: 19 },

    // FAQ
    faqList: { gap: 12 },
    accordionContainer: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    accordionHeaderActive: { backgroundColor: '#F0F9FF' },
    accordionTitle: { fontSize: 15, fontWeight: '600', color: '#475569', flex: 1, paddingRight: 10 },
    accordionTitleActive: { color: '#0284C7' },
    accordionContent: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 0 },
    accordionText: { fontSize: 14, color: '#64748B', lineHeight: 22 },

    // Contact
    contactSupport: { marginTop: 40, alignItems: 'center', backgroundColor: '#1E293B', padding: 30, borderRadius: 24 },
    contactIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
    contactTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    contactText: { fontSize: 14, color: '#94A3B8', marginTop: 5, marginBottom: 20, textAlign: 'center' },
    contactBtn: { backgroundColor: '#fff', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 30 },
    contactBtnText: { color: '#1E293B', fontWeight: '700', fontSize: 14 }
});