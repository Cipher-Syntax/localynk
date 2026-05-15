import { Image } from 'expo-image';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import IsTourist from './IsTourist';
import RegisterModalForm from './RegisterOpenModalForm';
import MaskedView from '@react-native-masked-view/masked-view';
import { useRouter } from 'expo-router';
import { styles } from './styles/Action.styles';

const Action = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTourist, setIsTourist] = useState(false);
    const router = useRouter();

    const handleFormSubmit = () => {
        setIsModalOpen(false);
        setIsTourist(true);
    };

    if (isTourist) {
        return <IsTourist />;
    }

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <Image
                    source={require('../../assets/localynk_images/header.png')}
                    style={styles.headerImage}
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
                    style={styles.overlay}
                />
                <Text style={styles.headerTitle}>TOUR GUIDES</Text>
            </View>

            <View style={styles.body}>
                <MaskedView
                    maskElement={
                        <Text style={[styles.title, { backgroundColor: 'transparent' }]}>
                            Want to be a local guide?
                        </Text>
                    }
                >
                    <LinearGradient
                        colors={['#00C6FF', '#0072FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={[styles.title, { opacity: 0 }]}>
                            Want to be a local guide?
                        </Text>
                    </LinearGradient>
                </MaskedView>

                <Text style={styles.subtitle}>
                    Join our community of locals showing off their hometown pride.
                </Text>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push({pathname: "/(protected)/termsAndAgreement", params: {showActions: true}})}
                >
                    <LinearGradient
                        colors={['#00C6FF', '#0072FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.primaryButton}
                    >
                        <Text style={styles.primaryButtonText}>Let&#39;s Go!</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity 
                    activeOpacity={0.8} 
                    style={styles.secondaryButton} 
                    onPress={() => router.push({pathname: "/(protected)/termsAndAgreement", params: {showActions: false}})}
                >
                    <Text style={styles.secondaryButtonText}>View Requirements</Text>
                </TouchableOpacity>
            </View>

            {isModalOpen && (
                <RegisterModalForm
                    isModalOpen={isModalOpen}
                    setIsOpenModal={setIsModalOpen}
                    onSubmit={handleFormSubmit}
                />
            )}
        </View>
    );
};

export default Action;
