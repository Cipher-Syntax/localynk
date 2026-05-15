import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import ScreenSafeArea from '../../components/ScreenSafeArea';
import ProfileLocationMapPicker from '../../components/location/ProfileLocationMapPicker';
import { styles } from './styles/viewAccommodations.styles';


const normalizeTransportCapacities = (rawValue) => {
    const source = Array.isArray(rawValue)
        ? rawValue
        : typeof rawValue === 'string'
            ? rawValue.split(',')
            : [];

    const normalized = [];
    const seen = new Set();

    source.forEach((value) => {
        const parsed = parseInt(String(value || '').trim(), 10);
        if (!Number.isFinite(parsed) || parsed <= 0 || seen.has(parsed)) {
            return;
        }
        seen.add(parsed);
        normalized.push(parsed);
    });

    return normalized;
};

const normalizeTransportOptions = (rawValue) => {
    const source = Array.isArray(rawValue) ? rawValue : [];
    const normalized = [];

    source.forEach((item) => {
        const vehicleType = String(item?.vehicle_type || '').trim();
        const capacities = normalizeTransportCapacities(item?.transport_capacities || []);
        if (!vehicleType || capacities.length === 0) {
            return;
        }

        normalized.push({
            vehicle_type: vehicleType,
            transport_capacities: capacities,
        });
    });

    return normalized;
};

export default function ViewAccommodations() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const normalizeRouteId = (value) => {
        const raw = Array.isArray(value) ? value[0] : value;
        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    };

    const currentUserId = normalizeRouteId(currentUser?.id);
    const requestedUserId = normalizeRouteId(params.userId);
    const userId = currentUserId;

    const isOwner = currentUserId !== null && (requestedUserId === null || requestedUserId === currentUserId);
    const canManageAccommodations = Boolean(currentUser?.is_local_guide || currentUser?.agency_profile);
    const canEditAccommodations = isOwner && canManageAccommodations;

    const [loading, setLoading] = useState(true);
    const [guide, setGuide] = useState(null);
    const [accommodations, setAccommodations] = useState([]);
    const [error, setError] = useState(null);

    // Toast State
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Edit Modal State
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [editingAcc, setEditingAcc] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Delete Confirmation State
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [editForm, setEditForm] = useState({
        title: '',
        price: '',
        location: '',
        latitude: null,
        longitude: null,
        description: '',
        accommodation_type: 'Room',
        room_type: 'Single',
        amenities: { wifi: false, breakfast: false, ac: false, parking: false, pool: false },
        offer_transportation: false,
        transport_options: [],
        draft_vehicle_type: '',
        draft_transport_capacities: [],
        draft_transport_capacity_input: '',
    });

    const [editImages, setEditImages] = useState({
        photo: null,
        room_image: null,
        transport_image: null,
    });

    const accommodationTypes = ['Room', 'Hostel', 'Hotel', 'Apartment'];
    const roomTypes = ['Single', 'Double', 'Suite', 'Family'];
    const vehicleTypeOptions = ['Van', 'Car', 'Boat', 'Tricycle', 'Motorcycle', 'Bus', 'SUV'];

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

    const getImageUrl = (imgPath) => {
        if (!imgPath) return 'https://via.placeholder.com/400x250';
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000';
        return `${base}${imgPath}`;
    };

    const getEditImageUrl = (imgPath) => {
        if (!imgPath) return null;
        if (imgPath.startsWith('http')) return imgPath;
        const base = api.defaults.baseURL || 'http://127.0.0.1:8000';
        return `${base}${imgPath}`;
    };

    

    useEffect(() => {
        if (!userId) return;
        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                if (!canManageAccommodations) {
                    setGuide(null);
                    setAccommodations([]);
                    setError('Only accommodation owners can access this screen.');
                    return;
                }

                if (!isOwner) {
                    setGuide(null);
                    setAccommodations([]);
                    setError('You can only view accommodations for your own account.');
                    return;
                }

                try {
                    const guideRes = await api.get(`/api/guides/${userId}/`);
                    setGuide(guideRes.data);
                } catch (_guideError) {
                    setGuide({
                        first_name: currentUser?.first_name || '',
                        last_name: currentUser?.last_name || '',
                        location: currentUser?.location || '',
                        profile_picture: currentUser?.profile_picture || null,
                    });
                }

                const r = await api.get('/api/accommodations/');
                let accs = [];
                if (Array.isArray(r.data)) accs = r.data;
                else if (Array.isArray(r.data.results)) accs = r.data.results;
                else if (r.data && typeof r.data === 'object') {
                    if (Array.isArray(r.data.results)) accs = r.data.results;
                    else if (Array.isArray(r.data.data)) accs = r.data.data;
                    else accs = [r.data];
                }

                setAccommodations(accs || []);

            } catch (err) {
                console.warn('ViewAccommodations load error', err);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [userId, isOwner, canManageAccommodations, currentUser]);

    const promptDelete = (id) => {
        setItemToDelete(id);
        setDeleteConfirmVisible(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await api.delete(`/api/accommodations/${itemToDelete}/`);
            setAccommodations(prev => prev.filter(a => a.id !== itemToDelete));
            showToast("Accommodation deleted successfully", "success");
        } catch (_error) {
            showToast("Failed to delete accommodation", "error");
        } finally {
            setDeleteConfirmVisible(false);
            setItemToDelete(null);
        }
    };

    const openEditModal = (acc) => {
        setEditingAcc(acc);

        const resolvedTransportOptions = normalizeTransportOptions(
            Array.isArray(acc.transport_options) && acc.transport_options.length > 0
                ? acc.transport_options
                : [{
                    vehicle_type: acc.vehicle_type,
                    transport_capacities: Array.isArray(acc.transport_capacities) && acc.transport_capacities.length > 0
                        ? acc.transport_capacities
                        : [acc.transport_capacity],
                }]
        );
        
        let parsedAmenities = { wifi: false, breakfast: false, ac: false, parking: false, pool: false };
        if (acc.amenities) {
            try {
                const parsed = typeof acc.amenities === 'string' ? JSON.parse(acc.amenities) : acc.amenities;
                parsedAmenities = { ...parsedAmenities, ...parsed };
            } catch (e) { console.log("Failed parsing amenities", e); }
        } else {
            parsedAmenities.wifi = !!acc.wifi;
            parsedAmenities.parking = !!acc.parking;
            parsedAmenities.breakfast = !!acc.breakfast;
        }

        setEditForm({
            title: acc.title || acc.name || '',
            price: (acc.price ?? acc.rate ?? '').toString(),
            location: acc.location || '',
            latitude: acc.latitude ?? null,
            longitude: acc.longitude ?? null,
            description: acc.description || '',
            accommodation_type: acc.accommodation_type || 'Room',
            room_type: acc.room_type || 'Single',
            amenities: parsedAmenities,
            offer_transportation: !!acc.offer_transportation,
            transport_options: resolvedTransportOptions,
            draft_vehicle_type: '',
            draft_transport_capacities: [],
            draft_transport_capacity_input: '',
        });

        setEditImages({
            photo: getEditImageUrl(acc.photo || acc.image),
            room_image: getEditImageUrl(acc.room_image),
            transport_image: getEditImageUrl(acc.transport_image),
        });

        setEditModalVisible(true);
    };

    const toggleAmenity = (key) => {
        setEditForm(prev => ({
            ...prev,
            amenities: { ...prev.amenities, [key]: !prev.amenities[key] }
        }));
    };

    const addEditTransportCapacity = () => {
        const nextCapacities = normalizeTransportCapacities([
            ...(editForm.draft_transport_capacities || []),
            editForm.draft_transport_capacity_input,
        ]);

        if (nextCapacities.length === (editForm.draft_transport_capacities || []).length) {
            showToast('Enter a valid transport capacity before adding.', 'error');
            return;
        }

        setEditForm((prev) => ({
            ...prev,
            draft_transport_capacities: nextCapacities,
            draft_transport_capacity_input: '',
        }));
    };

    const removeEditTransportCapacity = (capacityToRemove) => {
        setEditForm((prev) => ({
            ...prev,
            draft_transport_capacities: (prev.draft_transport_capacities || []).filter((capacity) => capacity !== capacityToRemove),
        }));
    };

    const addEditTransportOption = () => {
        const vehicleType = String(editForm.draft_vehicle_type || '').trim();
        const capacities = normalizeTransportCapacities(editForm.draft_transport_capacities || []);

        if (!vehicleType) {
            showToast('Select or type a vehicle type before adding transportation.', 'error');
            return;
        }

        if (capacities.length === 0) {
            showToast('Add at least one capacity for this vehicle.', 'error');
            return;
        }

        setEditForm((prev) => ({
            ...prev,
            transport_options: normalizeTransportOptions([
                ...(prev.transport_options || []),
                { vehicle_type: vehicleType, transport_capacities: capacities },
            ]),
            draft_vehicle_type: '',
            draft_transport_capacities: [],
            draft_transport_capacity_input: '',
        }));
    };

    const removeEditTransportOption = (indexToRemove) => {
        setEditForm((prev) => ({
            ...prev,
            transport_options: (prev.transport_options || []).filter((_, index) => index !== indexToRemove),
        }));
    };

    const pickImage = async (type) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Permission required: Need access to your photos.', 'error');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            setEditImages(prev => ({ ...prev, [type]: result.assets[0].uri }));
        }
    };

    const handleUpdateAccommodation = async () => {
        if (!editForm.title || !editForm.price || !editForm.location) {
            showToast("Title, Price, and Location are required.", "error");
            return;
        }

        const finalTransportOptions = editForm.offer_transportation
            ? normalizeTransportOptions(editForm.transport_options || [])
            : [];

        if (editForm.offer_transportation && finalTransportOptions.length === 0) {
            showToast('Please add at least one transportation entry.', 'error');
            return;
        }

        setIsUpdating(true);
        try {
            const payload = new FormData();
            payload.append('title', editForm.title);
            payload.append('price', parseFloat(editForm.price));
            payload.append('location', editForm.location);

            if (editForm.latitude !== null && editForm.latitude !== undefined && String(editForm.latitude).trim() !== '') {
                payload.append('latitude', String(editForm.latitude));
            }

            if (editForm.longitude !== null && editForm.longitude !== undefined && String(editForm.longitude).trim() !== '') {
                payload.append('longitude', String(editForm.longitude));
            }

            payload.append('description', editForm.description);
            payload.append('accommodation_type', editForm.accommodation_type);
            payload.append('room_type', editForm.room_type);
            payload.append('amenities', JSON.stringify(editForm.amenities));
            payload.append('offer_transportation', editForm.offer_transportation ? "true" : "false");
            
            if (editForm.offer_transportation) {
                const firstTransport = finalTransportOptions[0] || null;
                payload.append('transport_options', JSON.stringify(finalTransportOptions));
                payload.append('vehicle_type', firstTransport?.vehicle_type || '');
                payload.append('transport_capacities', JSON.stringify(firstTransport?.transport_capacities || []));
                payload.append('transport_capacity', firstTransport?.transport_capacities?.[0] || 0);
            } else {
                payload.append('vehicle_type', '');
                payload.append('transport_options', JSON.stringify([]));
                payload.append('transport_capacities', JSON.stringify([]));
                payload.append('transport_capacity', '');
            }

            const appendImage = (uri, fieldName) => {
                if (uri && !uri.startsWith('http')) {
                    const filename = uri.split('/').pop();
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image/jpeg`;
                    payload.append(fieldName, {
                        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                        name: filename,
                        type: type,
                    });
                }
            };

            appendImage(editImages.photo, 'photo');
            appendImage(editImages.room_image, 'room_image');
            if (editForm.offer_transportation) {
                appendImage(editImages.transport_image, 'transport_image');
            }

            const response = await api.patch(`/api/accommodations/${editingAcc.id}/`, payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            setAccommodations(prev => prev.map(a => a.id === editingAcc.id ? { ...a, ...response.data } : a));
            
            setEditModalVisible(false);
            showToast("Accommodation updated successfully.", "success");
        } catch (err) {
            console.error("Update error:", err);
            showToast("Failed to update accommodation. Please try again.", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#00A8FF" />
            </View>
        );
    }

    return (
        <ScreenSafeArea edges={['top']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                <View style={styles.headerRow}>
                    <Ionicons name="arrow-back" size={24} onPress={() => router.back()} color="#1A2332" />
                    <Text style={styles.title}>Accommodations</Text>
                </View>

                {error && (
                    <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
                )}

                {guide && (
                    <View style={styles.guideCard}>
                        <View style={styles.iconWrapper}>
                            {guide.profile_picture ? (
                                <Image source={{ uri: getImageUrl(guide.profile_picture) }} style={styles.profilePicture} />
                            ) : (
                                <Ionicons name="person" size={30} color="#fff" />
                            )}
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.guideName}>{guide.first_name} {guide.last_name}</Text>
                            <Text style={styles.guideSub}>{guide.location || "Local Guide"}</Text>
                        </View>
                    </View>
                )}

                <View style={styles.sectionHeader}>
                    <Ionicons name="bed" size={18} color="#1A2332" />
                    <Text style={styles.sectionTitle}>Accommodations ({accommodations.length})</Text>
                </View>
                
                {accommodations.length === 0 && <Text style={styles.empty}>No accommodations listed.</Text>}

                {accommodations.map((acc, index) => {
                    const img = acc.photo || acc.image || acc.images?.[0]?.image || acc.photos?.[0]?.url;
                    
                    let amenities = { wifi: false, parking: false, breakfast: false };
                    if (acc.amenities) {
                        try {
                            const parsed = typeof acc.amenities === 'string' ? JSON.parse(acc.amenities) : acc.amenities;
                            amenities = { ...amenities, ...parsed };
                        } catch (_e) {}
                    } else {
                        amenities.wifi = acc.wifi;
                        amenities.parking = acc.parking;
                        amenities.breakfast = acc.breakfast;
                    }

                    return (
                        <View key={acc.id || index} style={styles.verticalCard}>
                            <View style={styles.imageContainer}>
                                {img ? (
                                    <Image source={{ uri: getImageUrl(img) }} style={styles.cardImage} />
                                ) : (
                                    <View style={styles.placeholderImage}>
                                        <Ionicons name="image-outline" size={40} color="#ccc" />
                                    </View>
                                )}
                                <View style={styles.priceBadge}>
                                    <Text style={styles.priceText}>₱{acc.price ?? acc.rate ?? 'N/A'}</Text>
                                </View>
                            </View>

                            <View style={styles.cardContent}>
                                <View style={styles.cardHeaderRow}>
                                    <Text style={styles.cardTitle}>{acc.title || acc.name || 'Untitled Accommodation'}</Text>
                                    {canEditAccommodations && (
                                        <View style={{flexDirection: 'row', gap: 8}}>
                                            <TouchableOpacity onPress={() => openEditModal(acc)} style={styles.iconBtn}>
                                                <Ionicons name="pencil" size={18} color="#00A8FF" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => promptDelete(acc.id)} style={[styles.iconBtn, {backgroundColor: '#fee2e2'}]}>
                                                <Ionicons name="trash" size={18} color="#ef4444" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                                
                                {acc.location && (
                                    <View style={styles.locationRow}>
                                        <Ionicons name="location-sfcvharp" size={12} color="#888" />
                                        <Text style={styles.locationText} numberOfLines={1}>{acc.location}</Text>
                                    </View>
                                )}

                                {acc.description && (
                                    <Text style={styles.cardDesc} numberOfLines={2}>{acc.description}</Text>
                                )}

                                <View style={styles.amenitiesRow}>
                                    {amenities.wifi && (
                                        <View style={styles.amenityTag}><Ionicons name="wifi" size={12} color="#666" /><Text style={styles.amenityText}>Wifi</Text></View>
                                    )}
                                    {amenities.parking && (
                                        <View style={styles.amenityTag}><Ionicons name="car" size={12} color="#666" /><Text style={styles.amenityText}>Parking</Text></View>
                                    )}
                                    {amenities.breakfast && (
                                        <View style={styles.amenityTag}><Ionicons name="cafe" size={12} color="#666" /><Text style={styles.amenityText}>Breakfast</Text></View>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                })}

            </ScrollView>

            {/* Custom Delete Confirmation Modal */}
            <Modal
                visible={deleteConfirmVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeleteConfirmVisible(false)}
            >
                <View style={styles.confirmModalContainer}>
                    <View style={styles.confirmModalContent}>
                        <Ionicons name="warning" size={40} color="#ef4444" style={{ marginBottom: 10 }} />
                        <Text style={styles.confirmTitle}>Delete Accommodation?</Text>
                        <Text style={styles.confirmText}>Are you sure you want to delete this listing? This action cannot be undone.</Text>
                        <View style={styles.confirmButtonRow}>
                            <TouchableOpacity 
                                style={[styles.confirmBtn, styles.cancelBtn]} 
                                onPress={() => setDeleteConfirmVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.confirmBtn, styles.deleteBtn]} 
                                onPress={confirmDelete}
                            >
                                <Text style={styles.deleteBtnText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Accommodation Modal */}
            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Listing Details</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#1A2332" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
                            
                            <Text style={styles.sectionSubTitle}>Basic Info</Text>

                            <Text style={styles.inputLabel}>Listing Title</Text>
                            <TextInput
                                style={styles.input}
                                value={editForm.title}
                                onChangeText={(text) => setEditForm({ ...editForm, title: text })}
                                placeholder="Accommodation Name"
                            />

                            <Text style={styles.inputLabel}>Location</Text>
                            <TextInput
                                style={styles.input}
                                value={editForm.location}
                                onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                                placeholder="Address or Landmark"
                            />

                            <ProfileLocationMapPicker
                                latitude={editForm.latitude}
                                longitude={editForm.longitude}
                                onChangeCoordinates={({ latitude, longitude }) => {
                                    setEditForm(prev => ({ ...prev, latitude, longitude }));
                                }}
                            />

                            <Text style={styles.inputLabel}>Price per Night (₱)</Text>
                            <TextInput
                                style={styles.input}
                                value={editForm.price}
                                onChangeText={(text) => setEditForm({ ...editForm, price: text })}
                                placeholder="0.00"
                                keyboardType="numeric"
                            />

                            <Text style={styles.inputLabel}>Property Type</Text>
                            <View style={styles.pillContainer}>
                                {accommodationTypes.map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.pill, editForm.accommodation_type === type && styles.pillActive]}
                                        onPress={() => setEditForm({ ...editForm, accommodation_type: type })}
                                    >
                                        <Text style={[styles.pillText, editForm.accommodation_type === type && styles.pillTextActive]}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editForm.description}
                                onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                                placeholder="Describe the accommodation..."
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />

                            <View style={styles.divider} />
                            <Text style={styles.sectionSubTitle}>Room & Amenities</Text>

                            <Text style={styles.inputLabel}>Room Arrangement</Text>
                            <View style={styles.pillContainer}>
                                {roomTypes.map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[styles.pill, editForm.room_type === type && styles.pillActive]}
                                        onPress={() => setEditForm({ ...editForm, room_type: type })}
                                    >
                                        <Text style={[styles.pillText, editForm.room_type === type && styles.pillTextActive]}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Amenities</Text>
                            <View style={styles.gridContainer}>
                                {Object.keys(editForm.amenities).map(key => {
                                    const icons = { wifi: 'wifi', breakfast: 'restaurant', ac: 'snow', parking: 'car', pool: 'water' };
                                    return (
                                        <TouchableOpacity
                                            key={key}
                                            style={[styles.gridItem, editForm.amenities[key] && styles.gridItemActive]}
                                            onPress={() => toggleAmenity(key)}
                                        >
                                            <Ionicons name={icons[key]} size={24} color={editForm.amenities[key] ? '#fff' : '#666'} />
                                            <Text style={[styles.gridText, editForm.amenities[key] && styles.gridTextActive]}>
                                                {key.charAt(0).toUpperCase() + key.slice(1)}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={styles.divider} />
                            <Text style={styles.sectionSubTitle}>Photos</Text>

                            <Text style={styles.inputLabel}>Cover Photo</Text>
                            <TouchableOpacity style={styles.imageUploadLarge} onPress={() => pickImage('photo')}>
                                {editImages.photo ? (
                                    <Image source={{ uri: editImages.photo }} style={styles.uploadedImage} />
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Ionicons name="image-outline" size={40} color="#0072FF" />
                                        <Text style={styles.uploadText}>Upload Main Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.inputLabel}>Room Photo</Text>
                            <TouchableOpacity style={styles.imageUploadLarge} onPress={() => pickImage('room_image')}>
                                {editImages.room_image ? (
                                    <Image source={{ uri: editImages.room_image }} style={styles.uploadedImage} />
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Ionicons name="bed-outline" size={40} color="#0072FF" />
                                        <Text style={styles.uploadText}>Upload Interior Photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.divider} />
                            
                            <View style={styles.switchRow}>
                                <View>
                                    <Text style={styles.switchTitle}>Offer Transportation?</Text>
                                    <Text style={styles.switchSub}>Do you pick up guests?</Text>
                                </View>
                                <TouchableOpacity 
                                    style={[styles.toggle, editForm.offer_transportation && styles.toggleActive]}
                                    onPress={() => setEditForm((prev) => {
                                        const nextState = !prev.offer_transportation;
                                        if (!nextState) {
                                            return {
                                                ...prev,
                                                offer_transportation: false,
                                                transport_options: [],
                                                draft_vehicle_type: '',
                                                draft_transport_capacities: [],
                                                draft_transport_capacity_input: '',
                                            };
                                        }

                                        return {
                                            ...prev,
                                            offer_transportation: true,
                                        };
                                    })}
                                >
                                    <View style={[styles.toggleCircle, editForm.offer_transportation && styles.toggleCircleActive]} />
                                </TouchableOpacity>
                            </View>

                            {editForm.offer_transportation && (
                                <View style={styles.transportContainer}>
                                    <Text style={styles.inputLabel}>Vehicle Selection</Text>
                                    <View style={styles.pillContainer}>
                                        {vehicleTypeOptions.map((vehicleType) => (
                                            <TouchableOpacity
                                                key={vehicleType}
                                                style={[styles.pill, editForm.draft_vehicle_type === vehicleType && styles.pillActive]}
                                                onPress={() => setEditForm((prev) => ({ ...prev, draft_vehicle_type: vehicleType }))}
                                            >
                                                <Text style={[styles.pillText, editForm.draft_vehicle_type === vehicleType && styles.pillTextActive]}>{vehicleType}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={styles.inputLabel}>Vehicle Type (Editable)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Van, Boat, Tricycle"
                                        value={editForm.draft_vehicle_type}
                                        onChangeText={t => setEditForm({ ...editForm, draft_vehicle_type: t })}
                                    />

                                    <Text style={styles.inputLabel}>Transport Capacities (Pax)</Text>
                                    <View style={styles.capacityInputRow}>
                                        <TextInput
                                            style={[styles.input, styles.capacityInput]}
                                            placeholder="e.g. 4"
                                            keyboardType="numeric"
                                            value={editForm.draft_transport_capacity_input}
                                            onChangeText={t => setEditForm({ ...editForm, draft_transport_capacity_input: t })}
                                        />
                                        <TouchableOpacity style={styles.addCapacityButton} onPress={addEditTransportCapacity}>
                                            <Text style={styles.addCapacityButtonText}>Add</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.capacityChipsContainer}>
                                        {(editForm.draft_transport_capacities || []).map((capacity) => (
                                            <View key={`edit-capacity-${capacity}`} style={styles.capacityChip}>
                                                <Text style={styles.capacityChipText}>{capacity} pax</Text>
                                                <TouchableOpacity onPress={() => removeEditTransportCapacity(capacity)}>
                                                    <Ionicons name="close" size={14} color="#1F2937" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={{flexDirection: 'row', gap: 15}}>
                                        <View style={{flex: 1}}>
                                            <Text style={styles.inputLabel}>Vehicle Photo</Text>
                                            <TouchableOpacity style={styles.imageUploadSmall} onPress={() => pickImage('transport_image')}>
                                                {editImages.transport_image ? (
                                                    <Image source={{ uri: editImages.transport_image }} style={styles.uploadedImage} />
                                                ) : (
                                                    <Ionicons name="camera" size={24} color="#ccc" />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <TouchableOpacity style={styles.addTransportOptionButton} onPress={addEditTransportOption}>
                                        <Text style={styles.addTransportOptionButtonText}>Add Transportation</Text>
                                    </TouchableOpacity>

                                    <View style={styles.transportOptionsList}>
                                        {(editForm.transport_options || []).map((option, index) => (
                                            <View key={`edit-transport-option-${index}`} style={styles.transportOptionCard}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.transportOptionTitle}>{option.vehicle_type}</Text>
                                                    <Text style={styles.transportOptionSubtitle}>Capacities: {option.transport_capacities.join(', ')} pax</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => removeEditTransportOption(index)}>
                                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <TouchableOpacity 
                                style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]} 
                                onPress={handleUpdateAccommodation}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Custom Toast Integration */}
            {toast.visible && (
                <View style={[
                    styles.toastContainer, 
                    toast.type === 'error' ? styles.toastError : styles.toastSuccess
                ]}>
                    <Ionicons 
                        name={toast.type === 'error' ? "alert-circle" : "checkmark-circle"} 
                        size={24} color="#fff" 
                    />
                    <Text style={styles.toastText}>{toast.message}</Text>
                </View>
            )}

        </ScreenSafeArea>
    );
}
