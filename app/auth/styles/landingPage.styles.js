import { StyleSheet, Dimensions } from "react-native";
const { width } = Dimensions.get('window');
export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000A1E',
    },

    // ── BACKGROUND ──
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },

    // ── LAYOUT ──
    safeArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },

    // ── LOGO ──
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    logoGlow: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(0, 198, 255, 0.18)',
        shadowColor: '#00C6FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 40,
        elevation: 20,
    },
    logo: {
        width: 220,
        height: 260,
    },

    // ── TEXT ──
    textContainer: {
        alignItems: 'center',
        marginBottom: 36,
        paddingHorizontal: 10,
    },
    titleWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: 3,
        textAlign: 'center',
        lineHeight: 38,
    },
    titleGradientBox: {
        width: width - 56,
        height: 42,
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        width: 160,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(0,198,255,0.45)',
    },
    dividerDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#00C6FF',
        marginHorizontal: 8,
    },

    subtitle: {
        color: '#C8EEFF',
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
        letterSpacing: 0.8,
        opacity: 0.92,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },

    // ── BUTTON ──
    buttonWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    buttonTouchable: {
        width: '80%',
        maxWidth: 280,
    },
    buttonGradient: {
        paddingVertical: 17,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#00C6FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 2,
    },
    legalText: {
        marginTop: 14,
        color: 'rgba(200,238,255,0.5)',
        fontSize: 11,
        letterSpacing: 2.5,
        textAlign: 'center',
        fontWeight: '600',
    },
});
