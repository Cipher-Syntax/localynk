import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    container: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
        maxWidth: 600,
        marginTop: 50,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#253347',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#555',
        marginBottom: 30,
        textAlign: 'center',
    },
    infoBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        marginBottom: 30,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#253347',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#4A4A4A',
        lineHeight: 24,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0072FF',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 50,
        marginBottom: 20,
        gap: 8,
    },
    contactButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footerText: {
        fontSize: 12,
        color: '#888',
    }
});