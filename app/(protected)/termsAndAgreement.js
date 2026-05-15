import { Image } from 'expo-image';
import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import RegisterModalForm from '../../components/tourist_guide/RegisterOpenModalForm';
import IsTourist from '../../components/tourist_guide/IsTourist';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import { styles } from './styles/termsAndAgreement.styles';

const TermsAndAgreement = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTourist, setIsTourist] = useState(false);

    const { showActions } = useLocalSearchParams();


    const router = useRouter();

    const handleFormSubmit = () => {
        setIsModalOpen(false);
        setIsTourist(true);
    };

    if (isTourist) {
        return <IsTourist />;
    }

    const handleDecline = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace('/(protected)/home/tourGuide');
    };

    return (
        <ScreenSafeArea edges={['bottom']} style={styles.safeArea}>
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
                    <Text style={styles.cardSubtitle}>Last Updated: April 2026</Text>

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
                        All payments and cancellations made through MFLG must follow the platform&apos;s policies, and MFLG reserves the right to review and manage refunds or disputes when necessary.
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
                        By continuing to use the app, you accept any updates or changes made to these terms. For any questions or concerns, you may contact us at <Text style={{ fontStyle: 'italic', color: '#007AFF' }}>localynk@my-friendly-local-guide.com</Text>.
                    </Text>

                    {
                        showActions === "true" && (
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.declineButton]}
                                    onPress={handleDecline}
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
                        )
                    }
                </View>
            </ScrollView>

            <RegisterModalForm
                isModalOpen={isModalOpen}
                setIsOpenModal={setIsModalOpen}
                onSubmit={handleFormSubmit}
            />
        </ScreenSafeArea>
    );
};

export default TermsAndAgreement;
