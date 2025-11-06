import React, { useState } from 'react';
import { ScrollView, View, Text, Image, StatusBar, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import RegisterModalForm from '../../components/tourist_guide/RegisterOpenModalForm';
import IsTourist from '../../components/tourist_guide/IsTourist';
import Action from "../../components/tourist_guide/Action";

const TermsAndAgreement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTourist, setIsTourist] = useState(false);
    const [action, setAction] = useState(false);


    const router = useRouter();

    const handleFormSubmit = () => {
        setIsModalOpen(false);
        setIsTourist(true);
    };

    if (isTourist) {
        return <IsTourist />;
    }

    if(action){
        return <Action />
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/localynk_images/header.png')}
                        style={styles.headerImage}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                        style={styles.overlay}
                    />
                    <Text style={styles.headerTitle}>TERMS AND AGREEMENT</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>MFLG – Terms of Agreement</Text>
                    <Text style={styles.cardSubtitle}>Last Updated: November 2025</Text>

                    <Text style={styles.paragraphTitle}>1. Introduction</Text>
                    <Text style={styles.bodyText}>
                        By using the MFLG (My Friendly Local Guide) application you agree to the following terms and conditions. MFLG serves as a platform that connects travelers with local tour guides who provide tours, accommodations, and other travel-related services.
                    </Text>

                    <Text style={styles.paragraphTitle}>2. User Responsibilities</Text>
                    <Text style={styles.bodyText}>
                        Users must provide accurate information, respect local laws, and take responsibility for their own safety and belongings during tours.
                    </Text>

                    <Text style={styles.paragraphTitle}>3. Tour Guide Responsibilities</Text>
                    <Text style={styles.bodyText}>
                        Tour guides are expected to give honest details about their services, prices, and schedules, ensuring that all inclusions such as accommodation and transportation are clearly stated before booking.
                    </Text>

                    <Text style={styles.paragraphTitle}>4. Payments and Cancellations</Text>
                    <Text style={styles.bodyText}>
                        All payments and cancellations made through MFLG must follow the platform's policies, and MFLG reserves the right to review and manage refunds or disputes when necessary.
                    </Text>

                    <Text style={styles.paragraphTitle}>5. Limitation of Liability</Text>
                    <Text style={styles.bodyText}>
                        The app is not liable for any accidents, losses, or damages that may occur during tours, as it only serves as a connecting platform between guides and travelers.
                    </Text>

                    <Text style={styles.paragraphTitle}>6. Content Policy</Text>
                    <Text style={styles.bodyText}>
                        Users must avoid posting false, offensive, or inappropriate content, and MFLG may suspend or remove accounts that violate these terms.
                    </Text>

                    <Text style={styles.paragraphTitle}>7. Privacy Policy</Text>
                    <Text style={styles.bodyText}>
                        Personal data collected by MFLG will be managed in accordance with its Privacy Policy and will not be shared without consent.
                    </Text>

                    <Text style={styles.paragraphTitle}>8. Acceptance of Terms</Text>
                    <Text style={styles.bodyText}>
                        By continuing to use the app, you accept any updates or changes made to these terms. For any questions or concerns, you may contact us at support@mflg.com.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.declineButton]}
                            onPress={() => setAction(true)}
                        >
                            <Text style={styles.declineButtonText}>DECLINE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.agreeButton]}
                            onPress={() => setIsModalOpen(true)}
                        >
                            <Text style={styles.agreeButtonText}>AGREE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Register Modal */}
            <RegisterModalForm
                isModalOpen={isModalOpen}
                setIsOpenModal={setIsModalOpen}
                onSubmit={handleFormSubmit}
            />
        </SafeAreaView>
    );
};

export default TermsAndAgreement;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#D9E2E9',
    },
    container: {
        flex: 1,
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
        marginBottom: 15,
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
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 25,
        marginHorizontal: 15,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 5,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    paragraphTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#222',
        marginTop: 10,
        marginBottom: 5,
    },
    bodyText: {
        fontSize: 13,
        color: '#444',
        lineHeight: 21,
        textAlign: 'justify',
        marginBottom: 10
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#007AFF',
        marginRight: 8,
    },
    declineButtonText: {
        color: '#007AFF',
        fontWeight: '700',
        fontSize: 14,
    },
    agreeButton: {
        backgroundColor: '#007AFF',
        borderWidth: 1.5,
        borderColor: '#007AFF',
        marginLeft: 8,
    },
    agreeButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
})