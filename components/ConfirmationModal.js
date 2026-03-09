import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ConfirmationModal({ visible, title, description, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDestructive = true }) {
    return (
        <Modal transparent={true} visible={visible} animationType="fade" onRequestClose={onCancel}>
            <View style={styles.modalOverlay}>
                <View style={styles.confirmModalBox}>
                    <View style={[styles.confirmIconBg, !isDestructive && { backgroundColor: '#E0F2FE' }]}>
                        <Ionicons name={isDestructive ? "alert" : "help-circle"} size={32} color={isDestructive ? "#EF4444" : "#0284C7"} />
                    </View>
                    <Text style={styles.confirmTitle}>{title}</Text>
                    <Text style={styles.confirmDesc}>{description}</Text>
                    <View style={styles.confirmBtnRow}>
                        <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={onCancel}>
                            <Text style={styles.modalBtnTextCancel}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalBtn, isDestructive ? styles.modalBtnDestructive : styles.modalBtnPrimary]} onPress={onConfirm}>
                            <Text style={styles.modalBtnTextConfirm}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    confirmModalBox: { width: '80%', backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' },
    confirmIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    confirmTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
    confirmDesc: { textAlign: 'center', color: '#6B7280', marginBottom: 20 },
    confirmBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
    modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    modalBtnCancel: { backgroundColor: '#F3F4F6' },
    modalBtnDestructive: { backgroundColor: '#DC2626' },
    modalBtnPrimary: { backgroundColor: '#007AFF' },
    modalBtnTextCancel: { fontWeight: '600', color: '#374151' },
    modalBtnTextConfirm: { fontWeight: '600', color: '#fff' },
});