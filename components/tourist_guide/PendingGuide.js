import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles/PendingGuide.styles';

const PendingGuide = () => {
    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <Ionicons name="timer-outline" size={80} color="#FF9800" style={styles.icon} />
                
                <Text style={styles.title}>Application Under Review</Text>
                
                <Text style={styles.message}>
                    Thank you for applying to become a Localynk Guide!
                </Text>
                
                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>What Happens Next?</Text>
                    <Text style={styles.infoText}>
                        <Ionicons name="document-text-outline" size={16} color="#4A4A4A" /> Your profile and submitted information are being reviewed by our team.
                    </Text>
                    <Text style={styles.infoText}>
                        <Ionicons name="mail-outline" size={16} color="#4A4A4A" /> This process typically takes **24 to 48 hours**.
                    </Text>
                    <Text style={styles.infoText}>
                        <Ionicons name="notifications-outline" size={16} color="#4A4A4A" /> We will notify you via email and directly within the app once a decision has been made.
                    </Text>
                </View>

                <TouchableOpacity style={styles.contactButton} onPress={router.push({pathname: '/(protected)/support'})}>
                    <Ionicons name="help-circle-outline" size={20} color="#fff" />
                    <Text style={styles.contactButtonText}>Contact Support</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>
                    In the meantime, you can continue to use Localynk as a tourist.
                </Text>
            </View>
        </ScrollView>
    );
};

export default PendingGuide;
