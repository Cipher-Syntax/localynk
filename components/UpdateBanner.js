import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
            <View style={styles.banner}>
                <View style={styles.headerRow}>
                    <Ionicons name="cloud-download-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.title}>{title}</Text>
                </View>

                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={[styles.updateButton, isUpdating && styles.updateButtonDisabled]}
                        onPress={onUpdatePress}
                        disabled={isUpdating}
                        activeOpacity={0.85}
                    >
                        {isUpdating ? (
                            <View style={styles.updatingContent}>
                                <ActivityIndicator size="small" color="#0F172A" />
                                <Text style={styles.updateButtonText}>Updating...</Text>
                            </View>
                        ) : (
                            <Text style={styles.updateButtonText}>Update now</Text>
                        )}
                    </TouchableOpacity>

                    {typeof onDismissPress === "function" ? (
                        <TouchableOpacity
                            style={[styles.dismissButton, isUpdating && styles.dismissButtonDisabled]}
                            onPress={onDismissPress}
                            disabled={isUpdating}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.dismissText}>Later</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>
        </SafeAreaView>
    );
};

export default UpdateBanner;

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: "#0F766E",
        zIndex: 998,
    },
    banner: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.18)",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    title: {
        color: "#FFFFFF",
        marginLeft: 8,
        fontWeight: "700",
        fontSize: 14,
    },
    actionsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    updateButton: {
        minHeight: 34,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: "#F8FAFC",
        justifyContent: "center",
    },
    updateButtonDisabled: {
        opacity: 0.8,
    },
    updateButtonText: {
        color: "#0F172A",
        fontWeight: "700",
        fontSize: 13,
    },
    updatingContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    dismissButton: {
        minHeight: 34,
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    dismissButtonDisabled: {
        opacity: 0.6,
    },
    dismissText: {
        color: "#E2E8F0",
        fontWeight: "600",
        fontSize: 13,
    },
});