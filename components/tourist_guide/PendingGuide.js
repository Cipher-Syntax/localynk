// PendingGuide.js

import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

                <TouchableOpacity style={styles.contactButton}>
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

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    container: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
        maxWidth: 600,
        marginTop: 50,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#253347',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#555',
        marginBottom: 30,
        textAlign: 'center',
    },
    infoBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 30,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#253347',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#4A4A4A',
        lineHeight: 24,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0072FF',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 50,
        marginBottom: 20,
        gap: 8,
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerText: {
        fontSize: 12,
        color: '#888',
    }
});