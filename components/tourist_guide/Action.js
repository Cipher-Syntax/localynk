import React, { useState } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { IsTourist, RegisterModalForm } from '../tourist_guide';
import IsTourist from './IsTourist';
import RegisterModalForm from './RegisterOpenModalForm';
import { SafeAreaView } from 'react-native-safe-area-context';

const Action = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTourist, setIsTourist] = useState(false);

    const handleFormSubmit = () => {
        setIsModalOpen(false);
        setIsTourist(true);
    };

    if (isTourist) {
        return <IsTourist />;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View>
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
            </View>

            <View style={styles.body}>
                <Text style={styles.title}>Want to be a local guide?</Text>
                <Text style={styles.subtitle}>
                    Join our community of locals showing off their hometown pride.
                </Text>

                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsModalOpen(true)}
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

                <TouchableOpacity activeOpacity={0.8} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>View Requirements</Text>
                </TouchableOpacity>
            </View>

            {
                isModalOpen && (
                    <RegisterModalForm isModalOpen={isModalOpen} setIsOpenModal={setIsModalOpen} onSubmit={handleFormSubmit}/>
                )
            }
        </View>
    );
};

export default Action;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
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
        marginTop: 250,
        backgroundColor: "#D9E2E9",
        borderTopRightRadius: 60,
        borderTopLeftRadius: 60,
        height: 490,
        paddingTop: 10,
        flex: 1,
        flexShrink: 0,
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 5,
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
