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

    const getDisplayName = (partner) => {
        const direct = String(partner?.display_name || partner?.full_name || '').trim();
        if (direct) return direct;

        const username = String(partner?.username || '').trim();
        if (!username) return 'User';

        if (username.includes('@')) {
            const local = username.split('@', 1)[0].replace(/[._-]+/g, ' ').trim();
            if (local) {
                return local
                    .split(' ')
                    .filter(Boolean)
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                    .join(' ');
            }
        }

        return username;
    };

    const handlePressConversation = (partner) => {
        const displayName = getDisplayName(partner);
        router.push({
            pathname: '/(protected)/message',
            params: {
                partnerId: partner.id,
                partnerName: displayName,
                partnerImage: partner.profile_picture || null // PASS IMAGE
            },
        });
    };

    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                    <View style={{ width: 150, height: 28, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                </View>
                {[1, 2, 3, 4, 5].map(i => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                        <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E6ED', marginRight: 15 }} />
                        <View style={{ width: 120, height: 18, backgroundColor: '#E0E6ED', borderRadius: 4 }} />
                    </View>
                ))}
            </SafeAreaView>
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
                        {(() => {
                            const displayName = getDisplayName(item);
                            return (
                                <>
                        {item.profile_picture ? (
                            <Image 
                                source={{ uri: getImageUrl(item.profile_picture) }} 
                                style={styles.avatarImage} 
                            />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
                            </View>
                        )}
                        <Text style={styles.conversationName}>{displayName}</Text>
                                </>
                            );
                        })()}
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