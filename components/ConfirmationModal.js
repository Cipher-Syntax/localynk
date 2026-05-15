import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles/ConfirmationModal.styles';

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
