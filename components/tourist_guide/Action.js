import React, { useState } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import IsTourist from './IsTourist';
import RegisterModalForm from './RegisterOpenModalForm';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaskedView from '@react-native-masked-view/masked-view'
import { useRouter } from 'expo-router';

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
        <SafeAreaView style={styles.container}>
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
                    // onPress={() => setIsModalOpen(true)}
                    onPress={() => router.push({pathname: "/(protected)/termsAndAgreement"})}
                >
                    <LinearGradient
                        colors={['#00C6FF', '#0072FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.primaryButton}
                    >
                        <Text style={styles.primaryButtonText}>Let's Go!</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.8} style={styles.secondaryButton} onPress={() => router.push({pathname: "/(protected)/termsAndAgreement"})}>
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
        </SafeAreaView>
    );
};

export default Action;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: '#fff',
    },
    header: {
        height: 120,
        justifyContent: 'center',
        position: 'relative',
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
    body: {
        backgroundColor: "#D9E2E9",
        borderTopLeftRadius: 60,
        borderTopRightRadius: 60,
        paddingTop: 30,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingBottom: 20,
        height: 490
    },
    title: {
        fontSize: 30,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 5,
        letterSpacing: 2
    },
    subtitle: {
        fontSize: 13,
        color: '#333',
        textAlign: 'center',
        marginBottom: 35,
    },
    primaryButton: {
        paddingVertical: 10,
        paddingHorizontal: 35,
        borderRadius: 30,
        marginBottom: 15,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    secondaryButton: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#00C6FF',
    },
    secondaryButtonText: {
        color: '#00C6FF',
        fontWeight: '500',
        fontSize: 13,
    },
});
