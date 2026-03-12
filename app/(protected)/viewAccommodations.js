import React, { useEffect, useState } from 'react';
import { 
    View, Text, ScrollView, ActivityIndicator, StyleSheet, 
    Image, Dimensions, TouchableOpacity, Modal, TextInput, 
    KeyboardAvoidingView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/api';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function ViewAccommodations() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const userId = params.userId || currentUser?.id;

    const isOwner = currentUser?.id == userId;

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
        description: '',
        accommodation_type: 'Room',
        room_type: 'Single',
        amenities: { wifi: false, breakfast: false, ac: false, parking: false, pool: false },
        offer_transportation: false,
        vehicle_type: '',
        transport_capacity: '',
    });

    const [editImages, setEditImages] = useState({
        photo: null,
        room_image: null,
        transport_image: null,
    });

    const accommodationTypes = ['Room', 'Hostel', 'Hotel', 'Apartment'];
    const roomTypes = ['Single', 'Double', 'Suite', 'Family'];

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

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const guideRes = await api.get(`/api/guides/${userId}/`);
            setGuide(guideRes.data);

            let accs = [];
            const tryEndpoints = [
                `/api/guides/${userId}/accommodations/`,
                `/api/accommodations/?guide=${userId}`,
                `/api/accommodations/?owner=${userId}`,
                `/api/accommodations/`
            ];

            for (const ep of tryEndpoints) {
                try {
                    const r = await api.get(ep);
                    if (Array.isArray(r.data)) accs = r.data;
                    else if (Array.isArray(r.data.results)) accs = r.data.results;
                    else if (r.data && typeof r.data === 'object') {
                        if (Array.isArray(r.data.results)) accs = r.data.results;
                        else if (Array.isArray(r.data.data)) accs = r.data.data;
                        else accs = [r.data];
                    }
                    if (accs.length > 0) break;
                } catch (e) { console.log(e) }
            }
            setAccommodations(accs || []);

        } catch (err) {
            console.warn('ViewAccommodations load error', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userId) return;
        loadData();
    }, [userId]);

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
        } catch (error) {
            showToast("Failed to delete accommodation", "error");
        } finally {
            setDeleteConfirmVisible(false);
            setItemToDelete(null);
        }
    };

    const openEditModal = (acc) => {
        setEditingAcc(acc);
        
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
            description: acc.description || '',
            accommodation_type: acc.accommodation_type || 'Room',
            room_type: acc.room_type || 'Single',
            amenities: parsedAmenities,
            offer_transportation: !!acc.offer_transportation,
            vehicle_type: acc.vehicle_type || '',
            transport_capacity: (acc.transport_capacity || '').toString(),
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

        setIsUpdating(true);
        try {
            const payload = new FormData();
            payload.append('title', editForm.title);
            payload.append('price', parseFloat(editForm.price));
            payload.append('location', editForm.location);
            payload.append('description', editForm.description);
            payload.append('accommodation_type', editForm.accommodation_type);
            payload.append('room_type', editForm.room_type);
            payload.append('amenities', JSON.stringify(editForm.amenities));
            payload.append('offer_transportation', editForm.offer_transportation ? "true" : "false");
            
            if (editForm.offer_transportation) {
                payload.append('vehicle_type', editForm.vehicle_type);
                payload.append('transport_capacity', editForm.transport_capacity || 0);
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
        <SafeAreaView style={styles.container}>
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
                        } catch (e) {}
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
                                    {isOwner && (
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
                                        <Ionicons name="location-sharp" size={12} color="#888" />
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
                                    onPress={() => setEditForm({ ...editForm, offer_transportation: !editForm.offer_transportation })}
                                >
                                    <View style={[styles.toggleCircle, editForm.offer_transportation && styles.toggleCircleActive]} />
                                </TouchableOpacity>
                            </View>

                            {editForm.offer_transportation && (
                                <View style={styles.transportContainer}>
                                    <Text style={styles.inputLabel}>Vehicle Type</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. Van, Boat, Tricycle"
                                        value={editForm.vehicle_type}
                                        onChangeText={t => setEditForm({ ...editForm, vehicle_type: t })}
                                    />
                                    
                                    <View style={{flexDirection: 'row', gap: 15}}>
                                        <View style={{flex: 1}}>
                                            <Text style={styles.inputLabel}>Capacity</Text>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Pax"
                                                keyboardType="numeric"
                                                value={editForm.transport_capacity}
                                                onChangeText={t => setEditForm({ ...editForm, transport_capacity: t })}
                                            />
                                        </View>
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

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    content: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 20, fontWeight: '700', marginLeft: 12, color: '#1A2332' },
    
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 10, gap: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    
    guideCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E0E6ED' },
    iconWrapper: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#1A2332', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    profilePicture: { width: '100%', height: '100%' },
    guideName: { fontSize: 16, fontWeight: '700', color: '#1A2332' },
    guideSub: { fontSize: 13, color: '#666' },

    verticalCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E6ED',
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    imageContainer: { height: 180, width: '100%', position: 'relative' },
    cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderImage: { width: '100%', height: '100%', backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
    
    priceBadge: {
        position: 'absolute', bottom: 10, right: 10,
        backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6
    },
    priceText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    cardContent: { padding: 12 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A2332', flex: 1 },
    iconBtn: { padding: 6, backgroundColor: '#EBF6FF', borderRadius: 6 },
    
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    locationText: { fontSize: 12, color: '#888', marginLeft: 4 },
    
    cardDesc: { fontSize: 13, color: '#555', lineHeight: 18, marginBottom: 8 },

    amenitiesRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
    amenityTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7FA', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4 },
    amenityText: { fontSize: 11, color: '#666' },

    empty: { color: '#888', fontSize: 13, fontStyle: 'italic', marginBottom: 10, marginLeft: 4 },
    errorBox: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 8, marginBottom: 12 },
    errorText: { color: '#b91c1c' },

    // Confirmation Modal Styles
    confirmModalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    confirmModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
    confirmTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 12, textAlign: 'center' },
    confirmText: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    confirmButtonRow: { flexDirection: 'row', width: '100%', gap: 12 },
    confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    cancelBtn: { backgroundColor: '#F3F4F6' },
    deleteBtn: { backgroundColor: '#ef4444' },
    cancelBtnText: { color: '#4B5563', fontSize: 15, fontWeight: '600' },
    deleteBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

    // Edit Modal & Form Styles
    modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#1A2332' },
    sectionSubTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 5, marginTop: 10 },
    
    inputLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 15 },
    input: { borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 8, padding: 12, fontSize: 15, backgroundColor: '#F9FAFB', color: '#1A2332' },
    textArea: { height: 100 },
    
    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
    pillActive: { backgroundColor: '#EFF6FF', borderColor: '#0072FF' },
    pillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
    pillTextActive: { color: '#0072FF' },

    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridItem: { width: (width - 64) / 3, aspectRatio: 1, backgroundColor: '#fff', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', gap: 8 },
    gridItemActive: { backgroundColor: '#0072FF', borderColor: '#0072FF' },
    gridText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    gridTextActive: { color: '#fff' },

    imageUploadLarge: { height: 160, backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 2, borderColor: '#DBEAFE', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    imageUploadSmall: { height: 45, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    uploadPlaceholder: { alignItems: 'center', gap: 8 },
    uploadText: { fontSize: 13, color: '#0072FF', fontWeight: '600' },

    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 20 },

    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    switchTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
    switchSub: { fontSize: 12, color: '#6B7280' },
    toggle: { width: 44, height: 24, backgroundColor: '#E5E7EB', borderRadius: 12, padding: 2, justifyContent: 'center' },
    toggleActive: { backgroundColor: '#0072FF' },
    toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
    toggleCircleActive: { alignSelf: 'flex-end' },
    
    transportContainer: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginTop: 10 },

    saveButton: { backgroundColor: '#00A8FF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // Toast Styles
    toastContainer: { 
        position: 'absolute', 
        bottom: 80, 
        left: 20, 
        right: 20, 
        borderRadius: 12, 
        padding: 16, 
        flexDirection: 'row', 
        alignItems: 'center', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 8, 
        elevation: 10, 
        zIndex: 1000 
    },
    toastSuccess: { backgroundColor: '#00c853' },
    toastError: { backgroundColor: '#ff5252' },
    toastText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 12, flexShrink: 1 }
});