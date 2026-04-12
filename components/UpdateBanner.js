import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const UpdateBanner = ({
    visible,
    isUpdating = false,
    onUpdatePress,
    onDismissPress,
    title = "Update available",
}) => {
    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={typeof onDismissPress === "function" ? onDismissPress : undefined}
        >
            <View style={styles.backdrop}>
                <View style={styles.modalCard}>
                    <View style={styles.iconWrap}>
                        <Ionicons name="cloud-download-outline" size={34} color="#1D4ED8" />
                    </View>

                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.subtitle}>A newer version is ready. Update now for the latest fixes and features. </Text>
                    </View>

                    <View style={styles.actionsRow}>
                        {typeof onDismissPress === "function" ? (
                            <TouchableOpacity
                                style={[styles.dismissButton, isUpdating && styles.dismissButtonDisabled]}
                                onPress={onDismissPress}
                                disabled={isUpdating}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.dismissText}>Later</Text>
                            </TouchableOpacity>
                        ) : null}

                        <TouchableOpacity
                            style={[
                                styles.updateButton,
                                typeof onDismissPress !== "function" && styles.singleButton,
                                isUpdating && styles.updateButtonDisabled,
                            ]}
                            onPress={onUpdatePress}
                            disabled={isUpdating}
                            activeOpacity={0.9}
                        >
                            {isUpdating ? (
                                <View style={styles.updatingContent}>
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                    <Text style={styles.updateButtonText}>Updating...</Text>
                                </View>
                            ) : (
                                <Text style={styles.updateButtonText}>Update now</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default UpdateBanner;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalCard: {
        width: "100%",
        maxWidth: 360,
        borderRadius: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 16,
        shadowColor: "#0F172A",
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
    },
    iconWrap: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#DBEAFE",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        alignSelf: "center",
    },
    headerRow: {
        marginBottom: 16,
        alignItems: "center",
    },
    title: {
        color: "#0F172A",
        fontWeight: "800",
        fontSize: 18,
        marginBottom: 6,
        textAlign: "center",
    },
    subtitle: {
        color: "#475569",
        fontWeight: "500",
        fontSize: 13,
        lineHeight: 18,
        textAlign: "center",
    },
    actionsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        width: "100%",
    },
    updateButton: {
        minHeight: 42,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: "#2563EB",
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
    },
    singleButton: {
        flex: 0,
        minWidth: 160,
        alignSelf: "center",
    },
    updateButtonDisabled: {
        opacity: 0.75,
    },
    updateButtonText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 13,
    },
    updatingContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    dismissButton: {
        minHeight: 42,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#CBD5E1",
        backgroundColor: "#F8FAFC",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 14,
        flex: 1,
    },
    dismissButtonDisabled: {
        opacity: 0.6,
    },
    dismissText: {
        color: "#334155",
        fontWeight: "700",
        fontSize: 13,
    },
});