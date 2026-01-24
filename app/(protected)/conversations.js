import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../api/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const ConversationList = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await api.get('/api/conversations/');
                setConversations(response.data);
            } catch (error) {
                console.error('Failed to fetch conversations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, []);

    const getImageUrl = (imgPath) => {
        if (!imgPath) return null;
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000';
        return `${base}${imgPath}`;
    };

    const handlePressConversation = (partner) => {
        router.push({
            pathname: '/(protected)/message',
            params: {
                partnerId: partner.id,
                partnerName: partner.full_name,
                partnerImage: partner.profile_picture || null // PASS IMAGE
            },
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A8FF" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Conversations</Text>
            </View>
            <FlatList
                data={conversations}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.conversationItem} onPress={() => handlePressConversation(item)}>
                        {item.profile_picture ? (
                            <Image 
                                source={{ uri: getImageUrl(item.profile_picture) }} 
                                style={styles.avatarImage} 
                            />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{item.full_name.charAt(0)}</Text>
                            </View>
                        )}
                        <Text style={styles.conversationName}>{item.full_name}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No conversations yet.</Text>}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#00A8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        backgroundColor: '#f0f0f0'
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    conversationName: {
        fontSize: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#888',
    }
});

export default ConversationList;