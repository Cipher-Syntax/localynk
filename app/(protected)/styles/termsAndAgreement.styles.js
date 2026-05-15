import { StyleSheet } from "react-native"

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        position: 'relative',
        height: 120,
        justifyContent: 'center',
        marginBottom: 15,
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
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 25,
        marginHorizontal: 15,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        textAlign: 'center',
        marginBottom: 5,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    paragraphTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#222',
        marginTop: 10,
        marginBottom: 5,
    },
    bodyText: {
        fontSize: 13,
        color: '#444',
        lineHeight: 21,
        textAlign: 'justify',
        marginBottom: 10
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#007AFF',
        marginRight: 8,
    },
    declineButtonText: {
        color: '#007AFF',
        fontWeight: '700',
        fontSize: 14,
    },
    agreeButton: {
        backgroundColor: '#007AFF',
        borderWidth: 1.5,
        borderColor: '#007AFF',
        marginLeft: 8,
    },
    agreeButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
})
