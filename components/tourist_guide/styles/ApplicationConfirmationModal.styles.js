import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    confirmationContainer: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmationContent: {
        width: '90%',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    confirmationHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#F5A623', 
        letterSpacing: 1,
        marginBottom: 40,
        opacity: 0.8
    },
    confirmationIcon: {
        marginBottom: 24,
    },
    confirmationTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1A2332',
        marginBottom: 12,
    },
    confirmationMessage: {
        fontSize: 15,
        color: '#8B98A8',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 40,
    },
    confirmationButton: {
        backgroundColor: '#00A8FF',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
    },
    confirmationButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
});
