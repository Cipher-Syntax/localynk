import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const ApplicationConfirmationModal = ({ isModalOpen, setIsModalOpen }) => {
    const router = useRouter();

    const handleDismiss = () => {
        setIsModalOpen(false);
        router.replace('/(protected)/home'); 
    };

    return (
        <Modal
            visible={isModalOpen}
            animationType="fade"
            transparent={false}
        >
            <SafeAreaView style={styles.confirmationContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
                <View style={styles.confirmationContent}>
                    <Text style={styles.confirmationHeader}>APPLICATION SUBMITTED</Text>
                    
                    <Ionicons 
                        name="hourglass-outline" 
                        size={100} 
                        style={[styles.confirmationIcon, { color: '#F5A623' }]} 
                    />
                    
                    <Text style={styles.confirmationTitle}>
                        Application Sent!
                    </Text>
                    
                    <Text style={styles.confirmationMessage}>
                        Thank you for applying to be a local guide! Your submission is now **under review by our admin team**. We will notify you within **1-3 business days**.
                    </Text>

                    <TouchableOpacity 
                        style={styles.confirmationButton} 
                        onPress={handleDismiss}
                    >
                        <Text style={styles.confirmationButtonText}>
                            OK
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default ApplicationConfirmationModal;

const styles = StyleSheet.create({
    confirmationContainer: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmationContent: {
        width: '90%',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    confirmationHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F5A623', 
        letterSpacing: 1,
        marginBottom: 40,
        opacity: 0.8
    },
    confirmationIcon: {
        marginBottom: 24,
    },
    confirmationTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1A2332',
        marginBottom: 12,
    },
    confirmationMessage: {
        fontSize: 15,
        color: '#8B98A8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    confirmationButton: {
        backgroundColor: '#00A8FF',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
    },
    confirmationButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});