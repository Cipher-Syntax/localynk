import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    button: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0EA5E9',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0EA5E9',
        shadowOpacity: 0.28,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        zIndex: 40,
    },
});
