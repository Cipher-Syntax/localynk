import { Image } from 'expo-image';
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager, TextInput, Modal, KeyboardAvoidingView, Keyboard, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/api'; 
import { styles } from './styles/support.styles';

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
    const [activeTab, setActiveTab] = useState('tourist'); 
    const [openSection, setOpenSection] = useState(null);
    
    // Support Message Modal states
    const [isModalVisible, setModalVisible] = useState(false);
    const [supportMessage, setSupportMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Custom Alert Modal states
    const [isAlertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('error'); 

    const toggleSection = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpenSection(openSection === index ? null : index);
    };

    const showCustomAlert = (title, message, type = 'error') => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertType(type);
        setAlertVisible(true);
    };

    const handleContactSupport = async () => {
        if (!supportMessage.trim()) {
            showCustomAlert("Empty Message", "Please type your issue before sending so we can help you out!", "error");
            return;
        }

        setIsSending(true); 

        try {
            await api.post('/api/support/', { 
                message: supportMessage 
            });

            setSupportMessage(''); 
            setModalVisible(false);
            showCustomAlert("Success!", "Your message was sent safely to our support team. We'll email you back soon.", "success");
            
        } catch (error) {
            console.error('API Error:', error);
            // Safely grab the error message from Django if it exists
            const errorMessage = error.response?.data?.error || "Failed to send message. Please try again.";
            showCustomAlert("Error", errorMessage, "error");
        } finally {
            setIsSending(false); // Re-enable button whether it succeeded or failed
        }
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
            answer: "Go to your Apply Tab > Let's Go > Read Terms and Conditon. Submit your valid ID and any required tourism certificates. Once approved by Admin, you can start accepting bookings."
        },
        {
            question: "What happens if a guide doesn't show up?",
            answer: "You can report the issue immediately via the 'Support' page. We will investigate and process a full refund of your down payment if the guide is at fault."
        }
    ];

    return (
        <View style={styles.container}>
            
            {/* --- HEADER --- */}
            <SafeAreaView edges={['top']} style={styles.headerContainer}>
                <Image 
                    source={require('../../assets/localynk_images/header.png')} 
                    style={styles.headerBg}
                    blurRadius={2}
                />
                <LinearGradient
                    colors={['rgba(0,198,255,0.85)', 'rgba(0,114,255,0.95)']}
                    style={styles.headerOverlay}
                />
                <SafeAreaView edges={['bottom']} style={styles.headerContent}>
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
            </SafeAreaView>

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

                    {/* --- CONTACT SUPPORT TRIGGER --- */}
                    <View style={styles.contactSupport}>
                        <View style={styles.contactIconCircle}>
                            <MaterialIcons name="support-agent" size={32} color="#fff" />
                        </View>
                        <Text style={styles.contactTitle}>Still need help?</Text>
                        <Text style={styles.contactText}>Our team is available 24/7 to assist you.</Text>
                        <TouchableOpacity style={styles.contactBtn} onPress={() => setModalVisible(true)}>
                            <Text style={styles.contactBtnText}>Contact Support</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    {/* Tapping the dark overlay dismisses the keyboard */}
                    <TouchableOpacity 
                        style={{ flex: 1 }} 
                        activeOpacity={1} 
                        onPress={() => Keyboard.dismiss()} 
                    />
                    
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "padding"}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Contact Support</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                                    <Ionicons name="close" size={24} color="#64748B" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalInstruction}>
                                Briefly describe your issue below, and our team will investigate and email you a response.
                            </Text>

                            <TextInput
                                style={styles.modalInput}
                                placeholder="Type your message here..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                numberOfLines={5}
                                value={supportMessage}
                                onChangeText={setSupportMessage}
                                editable={!isSending} // Prevent typing while sending
                            />

                            <TouchableOpacity 
                                style={styles.modalSubmitBtn} 
                                onPress={handleContactSupport}
                                disabled={isSending} // Disable button to prevent double-clicks
                            >
                                <LinearGradient
                                    colors={isSending ? ['#94A3B8', '#64748B'] : ['#00C6FF', '#0072FF']} // Turns gray when sending
                                    style={styles.modalSubmitGradient}
                                >
                                    <Text style={styles.modalSubmitText}>
                                        {isSending ? 'Sending...' : 'Send Message'}
                                    </Text>
                                    
                                    {/* Show spinner if sending, otherwise show paper-plane icon */}
                                    {isSending ? (
                                        <ActivityIndicator size="small" color="#fff" style={{marginLeft: 8}} />
                                    ) : (
                                        <Ionicons name="paper-plane" size={18} color="#fff" style={{marginLeft: 8}} />
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.modalBottomBleed} />
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            <Modal
                animationType="fade"
                transparent={true}
                visible={isAlertVisible}
                onRequestClose={() => setAlertVisible(false)}
            >
                <View style={styles.alertOverlay}>
                    <View style={styles.alertContainer}>
                        <View style={[styles.alertIconContainer, { backgroundColor: alertType === 'success' ? '#D1FAE5' : '#FEF3C7' }]}>
                            <Ionicons 
                                name={alertType === 'success' ? "checkmark-circle" : "warning"} 
                                size={32} 
                                color={alertType === 'success' ? "#10B981" : "#F59E0B"} 
                            />
                        </View>
                        <Text style={styles.alertTitle}>{alertTitle}</Text>
                        <Text style={styles.alertMessage}>{alertMessage}</Text>
                        <TouchableOpacity 
                            style={styles.alertBtn} 
                            onPress={() => setAlertVisible(false)}
                        >
                            <Text style={styles.alertBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

export default Support;
