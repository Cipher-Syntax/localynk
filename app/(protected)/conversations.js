import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Modal, StatusBar } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import { SafeAreaView } from 'react-native-safe-area-context';

const PREFS_KEY = 'conversation_list_prefs_v1';

const normalizeConversationList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.conversations)) return payload.conversations;
    if (Array.isArray(payload?.data)) return payload.data;

    if (payload && typeof payload === 'object') {
        const objectValues = Object.values(payload).filter((value) => value && typeof value === 'object');
        if (objectValues.length > 0 && objectValues.every((value) => !Array.isArray(value) && (value.id || value.partner_id || value.user_id))) {
            return objectValues;
        }
    }

    return [];
};

const ConversationList = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [prefs, setPrefs] = useState({ pinned: [], muted: [], archived: [], forceUnread: [] });
    const [errorText, setErrorText] = useState('');
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [menuVisible, setMenuVisible] = useState(false);
    const router = useRouter();

    const handleGoBack = useCallback(() => {
        if (typeof router.canGoBack === 'function' && router.canGoBack()) {
            router.back();
            return;
        }
        router.replace('/(protected)/home');
    }, [router]);

    const statusBarStyle = menuVisible ? 'light-content' : 'dark-content';
    const statusBarBackgroundColor = menuVisible ? '#0F172A' : '#FFFFFF';

    const fetchConversations = useCallback(async () => {
        try {
            setErrorText('');
            const response = await api.get('/api/conversations/');
            setConversations(normalizeConversationList(response.data));
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            const detail =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                error?.message ||
                'Could not load conversations.';
            setErrorText(String(detail));
            setConversations([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useFocusEffect(
        useCallback(() => {
            fetchConversations();
        }, [fetchConversations])
    );

    useEffect(() => {
        const loadPrefs = async () => {
            try {
                const raw = await AsyncStorage.getItem(PREFS_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    setPrefs({
                        pinned: Array.isArray(parsed.pinned) ? parsed.pinned : [],
                        muted: Array.isArray(parsed.muted) ? parsed.muted : [],
                        archived: Array.isArray(parsed.archived) ? parsed.archived : [],
                        forceUnread: Array.isArray(parsed.forceUnread) ? parsed.forceUnread : [],
                    });
                }
            } catch (error) {
                console.error('Failed to load conversation prefs:', error);
            }
        };
        loadPrefs();
    }, []);

    const persistPrefs = async (nextPrefs) => {
        setPrefs(nextPrefs);
        try {
            await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(nextPrefs));
        } catch (error) {
            console.error('Failed to save conversation prefs:', error);
        }
    };

    const togglePref = (key, id) => {
        const next = { ...prefs };
        const list = next[key] || [];
        next[key] = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
        persistPrefs(next);
    };

    const setReadState = (id, forceUnread) => {
        const list = prefs.forceUnread || [];
        const next = {
            ...prefs,
            forceUnread: forceUnread ? [...new Set([...list, id])] : list.filter((x) => x !== id),
        };
        persistPrefs(next);
    };

    const getImageUrl = (imgPath) => {
        if (!imgPath) return null;
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000';
        return `${base}${imgPath}`;
    };

    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '';

        const now = Date.now();
        const diffMs = now - date.getTime();
        const mins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMs / 3600000);
        const days = Math.floor(diffMs / 86400000);

        if (mins < 1) return 'Now';
        if (mins < 60) return `${mins}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString();
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

    const decoratedConversations = useMemo(() => {
        const normalized = conversations.map((item) => {
            const id = Number(item.id ?? item.partner_id ?? item.user_id);
            const serverUnread = Number(item.unread_count || 0);
            const hasForcedUnread = prefs.forceUnread.includes(id);
            const unreadCount = hasForcedUnread ? Math.max(serverUnread, 1) : serverUnread;

            return {
                ...item,
                _id: id,
                _name: getDisplayName(item),
                _preview: String(item.last_message || '').trim() || 'Start chatting now',
                _time: formatRelativeTime(item.last_message_timestamp),
                _unreadCount: unreadCount,
                _isPinned: prefs.pinned.includes(id),
                _isMuted: prefs.muted.includes(id),
                _isArchived: prefs.archived.includes(id),
            };
        });

        const queryLower = query.trim().toLowerCase();

        const filtered = normalized.filter((item) => {
            const matchesQuery = !queryLower || item._name.toLowerCase().includes(queryLower) || item._preview.toLowerCase().includes(queryLower);
            if (!matchesQuery) return false;

            if (activeFilter === 'unread') return item._unreadCount > 0;
            if (activeFilter === 'pinned') return item._isPinned;
            if (activeFilter === 'archived') return item._isArchived;
            if (activeFilter === 'active') return !item._isArchived;
            return true;
        });

        filtered.sort((a, b) => {
            if (a._isPinned !== b._isPinned) return a._isPinned ? -1 : 1;
            if (a._unreadCount !== b._unreadCount) return b._unreadCount - a._unreadCount;
            return Number(b.last_message_ts || 0) - Number(a.last_message_ts || 0);
        });

        return filtered;
    }, [conversations, prefs, query, activeFilter]);

    const handlePressConversation = (partner) => {
        const displayName = getDisplayName(partner);
        const partnerId = Number(partner.id ?? partner.partner_id ?? partner.user_id);
        if (!Number.isFinite(partnerId) || partnerId <= 0) {
            return;
        }
        setReadState(partnerId, false);
        router.push({
            pathname: '/(protected)/message',
            params: {
                partnerId,
                partnerName: displayName,
                partnerImage: partner.profile_picture || null // PASS IMAGE
            },
        });
    };

    const openConversationMenu = (conversation) => {
        setSelectedConversation(conversation);
        setMenuVisible(true);
    };

    if (loading) {
        return (
            <SafeAreaView edges={['bottom', 'top']} style={{ flex: 1, backgroundColor: '#fff' }}>
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
        <SafeAreaView edges={['bottom', 'top']} style={styles.container}>
            <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBackgroundColor} translucent={false} />
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity onPress={handleGoBack} style={styles.headerBackButton}>
                        <Ionicons name="arrow-back" size={20} color="#0F172A" />
                    </TouchableOpacity>
                    <View style={styles.headerHeadingWrap}>
                        <Text style={styles.headerTitle}>Conversations</Text>
                        <Text style={styles.headerSubtitle}>{decoratedConversations.length} thread{decoratedConversations.length === 1 ? '' : 's'}</Text>
                    </View>
                </View>
                <View style={styles.searchWrap}>
                    <Ionicons name="search" size={16} color="#64748B" />
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search conversations"
                        placeholderTextColor="#94A3B8"
                        style={styles.searchInput}
                    />
                </View>
                <View style={styles.filterRow}>
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'unread', label: 'Unread' },
                        { key: 'pinned', label: 'Pinned' },
                        { key: 'archived', label: 'Archived' },
                    ].map((filter) => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
                            onPress={() => setActiveFilter(filter.key)}
                        >
                            <Text style={[styles.filterChipText, activeFilter === filter.key && styles.filterChipTextActive]}>{filter.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <FlatList
                data={decoratedConversations}
                keyExtractor={(item) => String(item._id || item.id || item.partner_id || item.user_id)}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.conversationItem, item._unreadCount > 0 && styles.conversationUnread]}
                        onPress={() => handlePressConversation(item)}
                        onLongPress={() => openConversationMenu(item)}
                    >
                        {(() => {
                            const displayName = item._name;
                            return (
                                <>
                        {item.profile_picture ? (
                            <Image 
                                source={{ uri: getImageUrl(item.profile_picture) }} 
                                style={styles.avatarImage} 
                            />
                        ) : (
                            <View style={styles.avatar}>
                                <Ionicons name="person-circle" size={30} color="#94A3B8" />
                            </View>
                        )}
                        <View style={styles.metaWrap}>
                            <View style={styles.topLine}>
                                <Text numberOfLines={1} style={[styles.conversationName, item._unreadCount > 0 && styles.conversationNameUnread]}>{displayName}</Text>
                                <View style={styles.topRight}>
                                    {!!item._time && <Text style={styles.timeText}>{item._time}</Text>}
                                    {item._isPinned && <Ionicons name="pin" size={13} color="#2563EB" style={{ marginLeft: 6 }} />}
                                    {item._isMuted && <Ionicons name="notifications-off" size={13} color="#64748B" style={{ marginLeft: 6 }} />}
                                </View>
                            </View>
                            <View style={styles.bottomLine}>
                                <Text numberOfLines={1} style={styles.previewText}>{item._preview}</Text>
                                {item._unreadCount > 0 && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadBadgeText}>{item._unreadCount > 99 ? '99+' : item._unreadCount}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                                </>
                            );
                        })()}
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyText}>{errorText ? 'Unable to load conversations.' : 'No conversations yet.'}</Text>
                        {!!errorText && <Text style={styles.emptySubtext}>{errorText}</Text>}
                        {!!errorText && (
                            <TouchableOpacity style={styles.retryButton} onPress={fetchConversations}>
                                <Text style={styles.retryButtonText}>Retry</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                }
            />

            <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
                    <SafeAreaView edges={['bottom']} style={styles.menuCard}>
                        <Text style={styles.menuTitle}>{selectedConversation?._name || 'Conversation'}</Text>
                        <TouchableOpacity style={styles.menuAction} onPress={() => { togglePref('pinned', selectedConversation?._id); setMenuVisible(false); }}>
                            <Text style={styles.menuActionText}>{selectedConversation?._isPinned ? 'Unpin' : 'Pin'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuAction} onPress={() => { togglePref('muted', selectedConversation?._id); setMenuVisible(false); }}>
                            <Text style={styles.menuActionText}>{selectedConversation?._isMuted ? 'Unmute' : 'Mute'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuAction} onPress={() => { togglePref('archived', selectedConversation?._id); setMenuVisible(false); }}>
                            <Text style={styles.menuActionText}>{selectedConversation?._isArchived ? 'Unarchive' : 'Archive'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuAction} onPress={() => { setReadState(selectedConversation?._id, selectedConversation?._unreadCount === 0); setMenuVisible(false); }}>
                            <Text style={styles.menuActionText}>{selectedConversation?._unreadCount > 0 ? 'Mark as read' : 'Mark as unread'}</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                </TouchableOpacity>
            </Modal>
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
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerBackButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerHeadingWrap: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        marginTop: 2,
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },
    searchWrap: {
        marginTop: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#0F172A',
    },
    filterRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    filterChip: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FFFFFF',
    },
    filterChipActive: {
        backgroundColor: '#DBEAFE',
        borderColor: '#93C5FD',
    },
    filterChipText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '700',
    },
    filterChipTextActive: {
        color: '#1D4ED8',
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
        backgroundColor: '#fff',
    },
    conversationUnread: {
        backgroundColor: '#F8FAFF',
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
        color: '#0F172A',
        fontWeight: '600',
    },
    conversationNameUnread: {
        fontWeight: '800',
    },
    metaWrap: {
        flex: 1,
    },
    topLine: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    topRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    bottomLine: {
        marginTop: 3,
        flexDirection: 'row',
        alignItems: 'center',
    },
    previewText: {
        flex: 1,
        fontSize: 13,
        color: '#64748B',
    },
    unreadBadge: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        marginLeft: 8,
    },
    unreadBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#888',
    },
    emptyWrap: {
        marginTop: 50,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    emptySubtext: {
        marginTop: 8,
        textAlign: 'center',
        fontSize: 13,
        color: '#64748B',
    },
    retryButton: {
        marginTop: 14,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#2563EB',
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.35)',
        justifyContent: 'flex-end',
        padding: 16,
    },
    menuCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
    },
    menuTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 6,
        paddingHorizontal: 6,
    },
    menuAction: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    menuActionText: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
    },
});

export default ConversationList;