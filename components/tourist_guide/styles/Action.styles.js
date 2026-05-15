import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 120,
        justifyContent: 'center',
        position: 'relative',
        marginTop: 0,
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerTitle: {
        position: 'absolute',
        bottom: 15,
        left: 20,
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
    },
    body: {
        flex: 1,
        marginTop: 50,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 5,
        letterSpacing: 2
    },
    subtitle: {
        fontSize: 13,
        color: '#333',
        textAlign: 'center',
        marginBottom: 35,
    },
    primaryButton: {
        paddingVertical: 10,
        paddingHorizontal: 35,
        borderRadius: 30,
        marginVertical: 15,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    secondaryButton: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#00C6FF',
    },
    secondaryButtonText: {
        color: '#00C6FF',
        fontWeight: '500',
        fontSize: 13,
    },
});
