import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './styles/ApplicationConfirmationModal.styles';

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
            <SafeAreaView edges={['bottom']} style={styles.confirmationContainer}>
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
