import { Image } from 'expo-image';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import { styles } from './styles/myTourPackages.styles';


const MyTourPackages = () => {
    const { user } = useAuth();
    const router = useRouter();
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    const [destinations, setDestinations] = useState([]);
    const [myTours, setMyTours] = useState([]);
    const [myAccommodations, setMyAccommodations] = useState([]);
    
    const [expandedDestId, setExpandedDestId] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'error' });
    const [confirmModal, setConfirmModal] = useState({ visible: false, destId: null, destName: '' });

    // --- FULL EDIT MODAL STATE (Mirrors addTour.js) ---
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editingTour, setEditingTour] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    
    const [editForm, setEditForm] = useState({
        name: '', description: '', duration: '', durationDays: '1',
        maxGroupSize: '1', whatToBring: '', pricePerDay: '',
        soloPrice: '', additionalFee: ''
    });

    const [featuredPlaces, setFeaturedPlaces] = useState([]); 
    const [placeNames, setPlaceNames] = useState([]); 

    const [timeline, setTimeline] = useState([]);
    const [currentDayTab, setCurrentDayTab] = useState(1);
    
    // Timeline Pickers
    const [pickerStart, setPickerStart] = useState(new Date());
    const [pickerEnd, setPickerEnd] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [tempTimelineRow, setTempTimelineRow] = useState({ startTime: '', endTime: '', selectedActivityIndex: '' });
    
    const [activityModalVisible, setActivityModalVisible] = useState(false);

    const extractArray = (data) => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
    };

    const getImageUrl = (imgPath) => {
        if (!imgPath || typeof imgPath !== 'string') return 'https://via.placeholder.com/300';
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000'; 
        return `${base}${imgPath}`;
    };

    const fetchAllData = useCallback(async () => {
        if (!user) return;
        try {
            const [destRes, toursRes, accomRes] = await Promise.all([
                api.get(`/api/guides/${user.id}/destinations/`).catch(() => ({ data: [] })),
                api.get('/api/my-tours/').catch(() => ({ data: [] })),
                api.get('/api/accommodations/list/').catch(() => ({ data: [] }))
            ]);
            
            const fetchedDestinations = extractArray(destRes.data);
            const fetchedTours = extractArray(toursRes.data);
            const fetchedAccommodations = extractArray(accomRes.data);
            
            setDestinations(fetchedDestinations);
            setMyTours(fetchedTours);
            
            const userAccommodations = fetchedAccommodations.filter(acc => 
                acc.host === user.id || (acc.host && acc.host.id === user.id)
            );
            setMyAccommodations(userAccommodations);
            
        } catch (error) {
            console.error('Error fetching tour packages data:', error);
            setToast({ visible: true, message: "Could not load all tour packages data right now.", type: 'error' });
        }
    }, [user]);


    const onRefresh = async () => {
        setRefreshing(true);
        await fetchAllData();
        setRefreshing(false);
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchAllData();
            setLoading(false);
        };
        loadData();
    }, [user, fetchAllData]);

    const toggleExpand = (destId) => setExpandedDestId(expandedDestId === destId ? null : destId);

    // --- DESTINATION DELETION ---
    const initiateDelete = (destId, destName) => setConfirmModal({ visible: true, destId, destName });

    const executeDelete = async () => {
        const { destId } = confirmModal;
        setConfirmModal({ visible: false, destId: null, destName: '' });
        try {
            setLoading(true);
            const toursToDelete = myTours.filter(t => t.main_destination === destId || (t.main_destination && t.main_destination.id === destId));
            const accomToDelete = myAccommodations.filter(a => a.destination === destId || (a.destination && a.destination.id === destId));
            
            for (let t of toursToDelete) await api.delete(`/api/tours/${t.id}/`).catch(() => {});
            for (let a of accomToDelete) await api.delete(`/api/accommodations/${a.id}/`).catch(() => {});
            
            setToast({ visible: true, message: "Successfully removed from destination.", type: 'success' });
            await fetchAllData(); 
        } catch (_error) {
            setToast({ visible: true, message: "Failed to delete items. Please try again.", type: 'error' });
        } finally { setLoading(false); }
    };

    // --- INDIVIDUAL TOUR DELETION ---
    const handleDeleteTour = (tourId, tourName) => {
        Alert.alert(
            "Delete Tour Package",
            `Are you sure you want to delete "${tourName}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: async () => {
                    try {
                        await api.delete(`/api/tours/${tourId}/`);
                        setMyTours(prev => prev.filter(t => t.id !== tourId));
                        setToast({ visible: true, message: "Tour package deleted successfully.", type: "success" });
                    } catch (_error) { setToast({ visible: true, message: "Failed to delete tour package.", type: "error" }); }
                }}
            ]
        );
    };

    // --- EDIT LOGIC (Mirrors addTour.js) ---
    const openEditModal = (tour) => {
        setEditingTour(tour);
        setEditForm({
            name: tour.name || '',
            description: tour.description || '',
            duration: tour.duration || '',
            durationDays: (tour.duration_days || 1).toString(),
            maxGroupSize: (tour.max_group_size || 1).toString(),
            whatToBring: tour.what_to_bring || '',
            pricePerDay: (tour.price_per_day || '').toString(),
            soloPrice: (tour.solo_price || '').toString(),
            additionalFee: (tour.additional_fee_per_head || '').toString(),
        });

        // Load existing stops
        const existingStops = tour.stops || [];
        setFeaturedPlaces(existingStops.map(s => getImageUrl(s.image)));
        setPlaceNames(existingStops.map(s => s.name));
        
        try { setTimeline(typeof tour.itinerary_timeline === 'string' ? JSON.parse(tour.itinerary_timeline) : (tour.itinerary_timeline || [])); } 
        catch(_e) { setTimeline([]); }
        
        setCurrentDayTab(1);
        setTempTimelineRow({ startTime: '', endTime: '', selectedActivityIndex: '' });
        setEditModalVisible(true);
    };

    const pickImage = async (index) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return setToast({ visible: true, message: 'Permission required', type: 'error' });
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.7 });
        if (!result.canceled) {
            const newPlaces = [...featuredPlaces];
            newPlaces[index] = result.assets[0].uri;
            setFeaturedPlaces(newPlaces);
        }
    };

    const handlePlaceNameChange = (text, index) => {
        const newNames = [...placeNames];
        newNames[index] = text;
        setPlaceNames(newNames);
    };

    const addPlace = () => {
        setFeaturedPlaces([...featuredPlaces, null]);
        setPlaceNames([...placeNames, '']);
    };

    const removePlace = (index) => {
        const newPlaces = [...featuredPlaces];
        const newNames = [...placeNames];
        newPlaces.splice(index, 1);
        newNames.splice(index, 1);
        setFeaturedPlaces(newPlaces);
        setPlaceNames(newNames);
    };

    const formatTime = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; 
        const strMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${strMinutes} ${ampm}`;
    };

    const onStartTimeChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowStartPicker(false);
        if (selectedDate) {
            setPickerStart(selectedDate);
            setTempTimelineRow(prev => ({ ...prev, startTime: formatTime(selectedDate) }));
        }
    };

    const onEndTimeChange = (event, selectedDate) => {
        if (Platform.OS === 'android') setShowEndPicker(false);
        if (selectedDate) {
            setPickerEnd(selectedDate);
            setTempTimelineRow(prev => ({ ...prev, endTime: formatTime(selectedDate) }));
        }
    };

    const getSelectedActivityLabel = () => {
        const val = tempTimelineRow.selectedActivityIndex;
        if (!val) return "Select Activity...";
        const [type, index] = val.split('|');
        if (type === 'stop') return `📍 ${placeNames[parseInt(index)] || `Stop ${parseInt(index) + 1}`}`;
        else if (type === 'accom') {
            const accom = myAccommodations[parseInt(index)];
            return accom ? `🏨 ${accom.title}` : "Select Activity...";
        }
        return "Select Activity...";
    };

    const addToTimeline = () => {
        const { startTime, endTime, selectedActivityIndex } = tempTimelineRow;
        if (!startTime || !endTime || !selectedActivityIndex) {
            Alert.alert("Error", "Please fill Start Time, End Time, and Activity.");
            return;
        }

        const [type, index] = selectedActivityIndex.split('|');
        let activityName = '';
        let activityId = null;

        if (type === 'stop') activityName = placeNames[parseInt(index)] || `Stop ${parseInt(index) + 1}`;
        else if (type === 'accom') {
            const accom = myAccommodations[parseInt(index)];
            activityName = accom.title;
            activityId = accom.id;
        }

        const newRow = { day: currentDayTab, startTime, endTime, activityName, type, refId: activityId };
        setTimeline([...timeline, newRow]);
        setTempTimelineRow({ startTime: '', endTime: '', selectedActivityIndex: '' }); 
    };

    const removeTimelineRow = (rowToDelete) => setTimeline(timeline.filter(item => item !== rowToDelete));

    const handleUpdateTour = async () => {
        if (!editForm.name || !editForm.pricePerDay) {
            Alert.alert("Validation Error", "Tour Name and Group Price/Day are required.");
            return;
        }

        setIsUpdating(true);
        try {
            const maxDays = parseInt(editForm.durationDays) || 1;
            const cleanedTimeline = timeline.filter(t => (parseInt(t.day) || 1) <= maxDays);

            const payload = new FormData();
            payload.append('name', editForm.name);
            payload.append('description', editForm.description);
            payload.append('duration', editForm.duration);
            payload.append('duration_days', maxDays);
            payload.append('max_group_size', parseInt(editForm.maxGroupSize) || 1);
            payload.append('what_to_bring', editForm.whatToBring);
            payload.append('price_per_day', parseFloat(editForm.pricePerDay));
            payload.append('solo_price', parseFloat(editForm.soloPrice) || 0);
            payload.append('additional_fee_per_head', parseFloat(editForm.additionalFee) || 0);
            payload.append('itinerary_timeline', JSON.stringify(cleanedTimeline));

            featuredPlaces.forEach((uri, index) => {
                const name = placeNames[index];
                payload.append('stops_names', name || `Stop ${index + 1}`);
                if (uri && !uri.startsWith('http')) {
                    const filename = uri.split('/').pop() || `stop_${index}.jpg`;
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image/jpeg`;
                    payload.append('stops_images', {
                        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                        name: filename,
                        type: type,
                    });
                }
            });

            await api.patch(`/api/tours/${editingTour.id}/`, payload, { headers: { 'Content-Type': 'multipart/form-data' } });
            
            await fetchAllData(); 
            setEditModalVisible(false);
            setToast({ visible: true, message: "Tour updated successfully.", type: "success" });
        } catch (error) {
            console.error("Update error:", error);
            Alert.alert("Error", "Failed to update tour. Please try again.");
        } finally { setIsUpdating(false); }
    };

    const renderDestinationCard = (dest) => {
        if (!dest || !dest.id) return null;
        const isExpanded = expandedDestId === dest.id;
        const destTours = myTours.filter(t => t.main_destination === dest.id || (t.main_destination && t.main_destination.id === dest.id));

        let destImage = 'https://via.placeholder.com/300';
        if (dest.images && dest.images.length > 0) destImage = getImageUrl(dest.images[0].image);
        else if (destTours.length > 0 && destTours[0].stops && destTours[0].stops.length > 0) destImage = getImageUrl(destTours[0].stops[0].image);

        return (
            <View key={`dest-${dest.id}`} style={styles.cardContainer}>
                <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(dest.id)} activeOpacity={0.8}>
                    <Image source={{ uri: destImage }} style={styles.cardImage} />
                    <View style={styles.cardInfo}>
                        <View style={styles.cardTitleRow}>
                            <Text style={styles.cardTitle} numberOfLines={1}>{dest.name || "Unknown Destination"}</Text>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => initiateDelete(dest.id, dest.name)}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.cardDetailRow}>
                            <Ionicons name="location-outline" size={14} color="#64748B" />
                            <Text style={styles.cardDetailText} numberOfLines={1}>{dest.location || "Location not set"}</Text>
                        </View>
                        <View style={styles.cardBottomRow}>
                            <View style={styles.badge}><Text style={styles.badgeText}>{dest.category || "General"}</Text></View>
                            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#94A3B8" />
                        </View>
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.expandedContent}>
                        <Text style={styles.sectionHeader}>Tour Packages</Text>
                        {destTours.length > 0 ? (
                            destTours.map(tour => {
                                let tourImage = 'https://via.placeholder.com/50';
                                if (tour.stops && tour.stops.length > 0 && tour.stops[0].image) {
                                    tourImage = getImageUrl(tour.stops[0].image);
                                }
                                
                                return (
                                    <View key={`tour-${tour.id}`} style={styles.itemRow}>
                                        <Image source={{ uri: tourImage }} style={styles.tourItemImage} />
                                        
                                        <View style={styles.itemTextContainer}>
                                            <Text style={styles.itemName} numberOfLines={1}>{tour.name || "Unnamed Tour"}</Text>
                                            <Text style={styles.itemSubText}>{tour.duration_days || 1} Day Package • Max {tour.max_group_size || 0} pax</Text>
                                        </View>
                                        
                                        <View style={styles.tourActions}>
                                            {/* <Text style={styles.itemPrice}>₱{tour.price_per_day || "0.00"}</Text> */}
                                            <View style={styles.actionIconsRow}>
                                                <TouchableOpacity onPress={() => openEditModal(tour)} style={styles.iconBtn}>
                                                    <Ionicons name="pencil" size={16} color="#00A8FF" />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleDeleteTour(tour.id, tour.name)} style={[styles.iconBtn, {backgroundColor: '#fee2e2'}]}>
                                                    <Ionicons name="trash" size={16} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        ) : ( <Text style={styles.emptyText}>No active tour packages</Text> )}
                    </View>
                )}
            </View>
        );
    };

    const durationNum = parseInt(editForm.durationDays) || 1;
    const dayTabs = Array.from({length: durationNum}, (_, i) => i + 1);
    const filteredTimeline = timeline.filter(r => r.day === currentDayTab || (!r.day && currentDayTab === 1));

    return (
        <ScreenSafeArea style={styles.container} edges={['top']}>
            <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
            <ConfirmationModal visible={confirmModal.visible} title="Remove Destination" description={`Are you sure you want to delete all your tour packages for ${confirmModal.destName}?`} confirmText="Delete" onConfirm={executeDelete} onCancel={() => setConfirmModal({ visible: false, destId: null, destName: '' })} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#1E293B" /></TouchableOpacity>
                <Text style={styles.headerTitle}>My Tour Packages</Text>
                <View style={{ width: 24 }} /> 
            </View>

            {loading ? (
                <View style={styles.centerContainer}><ActivityIndicator size="large" color="#0072FF" /></View>
            ) : (
                <ScrollView 
                    style={styles.scrollContent} showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0072FF"]} />}
                >
                    <Text style={styles.pageDescription}>Manage the destinations you operate in. Deleting a destination removes all its associated tour packages. Use the pencil icon to edit specific packages.</Text>
                    {destinations.length > 0 ? destinations.map(renderDestinationCard) : (
                        <View style={styles.emptyStateContainer}>
                            <Ionicons name="briefcase-outline" size={60} color="#CBD5E1" />
                            <Text style={styles.emptyStateTitle}>No Tour Packages Found</Text>
                            <Text style={styles.emptyStateText}>You haven&apos;t set up any tour packages or destinations yet.</Text>
                        </View>
                    )}
                    <View style={{height: 40}} /> 
                </ScrollView>
            )}

            {/* --- FULL EDIT TOUR MODAL --- */}
            <Modal visible={isEditModalVisible} animationType="slide" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlayFull}>
                    <View style={styles.modalContentFull}>
                        <View style={styles.modalHeaderFull}>
                            <Text style={styles.modalTitleFull}>Edit Tour Package</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeBtn}><Ionicons name="close" size={24} color="#1E293B" /></TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
                            
                            <Text style={styles.sectionSubTitle}>Basic Information</Text>
                            <Text style={styles.inputLabel}>Tour Name *</Text>
                            <TextInput style={styles.input} value={editForm.name} onChangeText={(t) => setEditForm({ ...editForm, name: t })} placeholder="e.g. Grand Island Hopping" />

                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput style={[styles.input, styles.textArea]} value={editForm.description} onChangeText={(t) => setEditForm({ ...editForm, description: t })} placeholder="Describe the experience..." multiline numberOfLines={4} textAlignVertical="top" />

                            <View style={styles.row}>
                                <View style={{flex: 1, marginRight: 10}}>
                                    <Text style={styles.inputLabel}>Duration Text</Text>
                                    <TextInput style={styles.input} value={editForm.duration} onChangeText={(t) => setEditForm({ ...editForm, duration: t })} placeholder="e.g. 8 Hours" />
                                </View>
                                <View style={{flex: 1, marginRight: 10}}>
                                    <Text style={styles.inputLabel}>Package Days</Text>
                                    <TextInput style={styles.input} value={editForm.durationDays} onChangeText={(t) => setEditForm({ ...editForm, durationDays: t })} placeholder="e.g. 2" keyboardType="numeric" />
                                </View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.inputLabel}>Max Pax</Text>
                                    <TextInput style={styles.input} value={editForm.maxGroupSize} onChangeText={(t) => setEditForm({ ...editForm, maxGroupSize: t })} placeholder="e.g. 10" keyboardType="numeric" />
                                </View>
                            </View>

                            <View style={styles.divider} />
                            
                            <Text style={styles.sectionSubTitle}>Tour Stops & Photos</Text>
                            <Text style={[styles.inputLabel, {fontWeight: '400', fontSize: 12, marginBottom: 10}]}>Update your featured stops below.</Text>
                            <View style={styles.gridContainer}>
                                {featuredPlaces.map((uri, index) => (
                                    <View key={index} style={styles.gridItemCard}>
                                        <TouchableOpacity style={styles.imageUploadSmall} onPress={() => pickImage(index)}>
                                            {uri ? ( <Image source={{ uri: uri }} style={styles.uploadedImage} /> ) : (
                                                <View style={{ alignItems: 'center' }}><Ionicons name="camera" size={24} color="#ccc" /><Text style={{ fontSize: 10, color: '#999' }}>Upload</Text></View>
                                            )}
                                            <TouchableOpacity style={styles.removeIcon} onPress={() => removePlace(index)}><Ionicons name="close" size={12} color="#fff" /></TouchableOpacity>
                                        </TouchableOpacity>
                                        <TextInput style={styles.cardInput} placeholder={`Stop ${index + 1} Name`} placeholderTextColor="#9CA3AF" value={placeNames[index]} onChangeText={(t) => handlePlaceNameChange(t, index)} />
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.addStopButton} onPress={addPlace}>
                                    <Ionicons name="add-circle" size={30} color="#0072FF" />
                                    <Text style={styles.addStopText}>Add Another Stop</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabel}>What to Bring</Text>
                            <TextInput style={styles.input} value={editForm.whatToBring} onChangeText={(t) => setEditForm({ ...editForm, whatToBring: t })} placeholder="e.g. Sunblock, Water..." />

                            <View style={styles.divider} />

                            <Text style={styles.sectionSubTitle}>Pricing</Text>
                            <View style={styles.row}>
                                <View style={{flex: 1, marginRight: 10}}>
                                    <Text style={styles.inputLabel}>Group Price/Day (₱) *</Text>
                                    <TextInput style={styles.input} value={editForm.pricePerDay} onChangeText={(t) => setEditForm({ ...editForm, pricePerDay: t })} placeholder="0.00" keyboardType="numeric" />
                                </View>
                                <View style={{flex: 1}}>
                                    <Text style={styles.inputLabel}>Solo Price/Day</Text>
                                    <TextInput style={styles.input} value={editForm.soloPrice} onChangeText={(t) => setEditForm({ ...editForm, soloPrice: t })} placeholder="0.00" keyboardType="numeric" />
                                </View>
                            </View>
                            <View style={{marginTop: 5}}>
                                <Text style={styles.inputLabel}>Additional Fee per Extra Pax</Text>
                                <TextInput style={styles.input} value={editForm.additionalFee} onChangeText={(t) => setEditForm({ ...editForm, additionalFee: t })} placeholder="0.00" keyboardType="numeric" />
                            </View>

                            <View style={styles.divider} />

                            <Text style={styles.sectionSubTitle}>Itinerary Builder</Text>
                            {durationNum > 1 && (
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.dayTabsScroll}
                                    data={dayTabs}
                                    keyExtractor={(day) => `edit-day-${day}`}
                                    renderItem={({ item: day }) => (
                                        <TouchableOpacity style={[styles.dayTab, currentDayTab === day && styles.dayTabActive]} onPress={() => setCurrentDayTab(day)}>
                                            <Text style={[styles.dayTabText, currentDayTab === day && styles.dayTabTextActive]}>Day {day}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            )}

                            <View style={styles.builderContainer}>
                                <View style={styles.row}>
                                    <View style={{flex: 1, marginRight: 5}}>
                                        <Text style={{fontSize:12, color:'#666', marginBottom:4}}>Start Time</Text>
                                        <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowStartPicker(true)}>
                                            <Text style={styles.timePickerText}>{tempTimelineRow.startTime || "Select"}</Text>
                                            <Ionicons name="time-outline" size={18} color="#666" />
                                        </TouchableOpacity>
                                        {showStartPicker && ( <DateTimePicker value={pickerStart} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onStartTimeChange} /> )}
                                    </View>
                                    <View style={{flex: 1, marginLeft: 5}}>
                                        <Text style={{fontSize:12, color:'#666', marginBottom:4}}>End Time</Text>
                                        <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowEndPicker(true)}>
                                            <Text style={styles.timePickerText}>{tempTimelineRow.endTime || "Select"}</Text>
                                            <Ionicons name="time-outline" size={18} color="#666" />
                                        </TouchableOpacity>
                                        {showEndPicker && ( <DateTimePicker value={pickerEnd} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={onEndTimeChange} /> )}
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.pickerTrigger} onPress={() => setActivityModalVisible(true)}>
                                    <Text style={{ color: tempTimelineRow.selectedActivityIndex ? '#1F2937' : '#9CA3AF', fontSize: 14 }}>{getSelectedActivityLabel()}</Text>
                                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.addTimeBtn} onPress={addToTimeline}>
                                    <Text style={styles.addTimeBtnText}>+ Add to Schedule</Text>
                                </TouchableOpacity>

                                <View style={styles.timelineList}>
                                    {filteredTimeline.length === 0 ? (
                                        <Text style={styles.emptyTimelineText}>No activities added for Day {currentDayTab}.</Text>
                                    ) : (
                                        filteredTimeline.map((row, index) => (
                                            <View key={index} style={styles.timelineItemBox}>
                                                <View style={styles.timelineLeft}>
                                                    <Text style={styles.timeTextItem}>{row.startTime}</Text>
                                                    <View style={styles.dotLine} />
                                                    <Text style={styles.timeTextItem}>{row.endTime}</Text>
                                                </View>
                                                <View style={styles.timelineContentInner}>
                                                    <Text style={styles.activityNameItem}>{row.type === 'stop' ? '📍' : '🏨'} {row.activityName}</Text>
                                                    <TouchableOpacity onPress={() => removeTimelineRow(row)}><Ionicons name="trash-outline" size={18} color="#FF3B30" /></TouchableOpacity>
                                                </View>
                                            </View>
                                        ))
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]} onPress={handleUpdateTour} disabled={isUpdating}>
                                {isUpdating ? ( <ActivityIndicator color="#fff" size="small" /> ) : ( <Text style={styles.saveButtonText}>Save Changes</Text> )}
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Custom Activity Picker Modal */}
            <Modal visible={activityModalVisible} animationType="fade" transparent={true}>
                <TouchableOpacity style={styles.activityModalOverlay} activeOpacity={1} onPress={() => setActivityModalVisible(false)}>
                    <View style={styles.activityModalContent}>
                        <View style={styles.activityModalHeader}>
                            <Text style={styles.activityModalTitle}>Select Activity</Text>
                            <TouchableOpacity onPress={() => setActivityModalVisible(false)}><Ionicons name="close-circle" size={26} color="#9CA3AF" /></TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.activitySectionTitle}>--- YOUR STOPS ---</Text>
                            {placeNames.map((name, idx) => (
                                <TouchableOpacity key={`stop-${idx}`} style={styles.activityOption} onPress={() => { setTempTimelineRow({...tempTimelineRow, selectedActivityIndex: `stop|${idx}`}); setActivityModalVisible(false); }}>
                                    <Text style={styles.activityOptionText}>📍 {name || `Stop ${idx+1}`}</Text>
                                </TouchableOpacity>
                            ))}
                            <Text style={[styles.activitySectionTitle, {marginTop: 20}]}>--- ACCOMMODATIONS ---</Text>
                            {myAccommodations.length === 0 && <Text style={styles.activityEmptyText}>No accommodations available</Text>}
                            {myAccommodations.map((accom, idx) => (
                                <TouchableOpacity key={`accom-${idx}`} style={styles.activityOption} onPress={() => { setTempTimelineRow({...tempTimelineRow, selectedActivityIndex: `accom|${idx}`}); setActivityModalVisible(false); }}>
                                    <Text style={styles.activityOptionText}>🏨 {accom.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

        </ScreenSafeArea>
    );
};

export default MyTourPackages;
