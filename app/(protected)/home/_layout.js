import { Tabs, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { User, Map, Home } from "lucide-react-native";
import { View, Platform } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../api/api";
import { getLatestBookingTimestamp, getSeenBookingTabTimestamp } from "../../../utils/bookingNotifications";
import { isCoreProfileIncomplete } from "../../../utils/profileCompleteness";
import { ScreenSafeArea } from "../../../components";

const HomeLayout = () => {
    const { role, user } = useAuth();
    const [hasNewBookingDot, setHasNewBookingDot] = useState(false);
    const hasIncompleteProfileDot = isCoreProfileIncomplete(user);

    const guideTabTitle = role === 'guide' ? "Dashboard" : "Apply";

    const TABS = [
        { name: "index", title: "Explore", icon: Home },
        { name: "tourGuide", title: guideTabTitle, icon: Map },
        { name: "profile", title: "Profile", icon: User },
    ];

    const COLORS = {
        background: "#0C1424",
        focusedBackground: "#1A2238",
        activeTint: "#FFFFFF",
        inactiveTint: "#9CA3AF",
    };

    const refreshBookingBadge = useCallback(async () => {
        if (!user?.id) {
            setHasNewBookingDot(false);
            return;
        }

        try {
            const response = await api.get('/api/bookings/');
            const bookings = Array.isArray(response.data)
                ? response.data
                : (Array.isArray(response.data?.results) ? response.data.results : []);

            const myTrips = bookings.filter((booking) => Number(booking?.tourist_id) === Number(user.id));
            const clientBookings = bookings.filter((booking) => Number(booking?.tourist_id) !== Number(user.id));

            const latestMyTripTs = getLatestBookingTimestamp(myTrips);
            const latestClientBookingTs = getLatestBookingTimestamp(clientBookings);
            const seenMyTripTs = await getSeenBookingTabTimestamp(user.id, 'my_trip');
            const seenClientBookingTs = await getSeenBookingTabTimestamp(user.id, 'client_booking');

            setHasNewBookingDot(
                latestMyTripTs > seenMyTripTs || latestClientBookingTs > seenClientBookingTs
            );
        } catch (_error) {
            setHasNewBookingDot(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            refreshBookingBadge();

            const interval = setInterval(() => {
                refreshBookingBadge();
            }, 5000);

            return () => clearInterval(interval);
        }, [refreshBookingBadge])
    );

    return (
        <ScreenSafeArea statusBarStyle="light-content" edges={['bottom']}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: true,
                    tabBarStyle: {
                        backgroundColor: COLORS.background,
                        borderTopWidth: 0,
                        height: Platform.OS === "ios" ? 100 : 80,
                        paddingBottom: Platform.OS === "ios" ? 30 : 12,
                        paddingTop: 12,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: "500",
                        marginTop: 4,
                        flex: 1
                    },
                    tabBarActiveTintColor: COLORS.activeTint,
                    tabBarInactiveTintColor: COLORS.inactiveTint,
                    sceneStyle: {
                        backgroundColor: "#fff",
                    },
                }}
            >
                {TABS.map((tab) => (
                    <Tabs.Screen
                        key={tab.name}
                        name={tab.name}
                        options={{
                            title: tab.title,
                            tabBarIcon: ({ color, focused }) => {
                                const Icon = tab.icon;
                                return (
                                    <View
                                        style={{
                                            width: 46,
                                            height: 46,
                                            borderRadius: 23,
                                            justifyContent: "center",
                                            alignItems: "center",
                                            backgroundColor: focused
                                                ? COLORS.focusedBackground
                                                : "transparent",
                                            borderWidth: focused ? 1 : 0,
                                            borderColor: focused ? "rgba(255,255,255,0.1)" : "transparent",
                                        }}
                                    >
                                        <Icon
                                            color={color}
                                            size={22}
                                            fill={focused ? color : "transparent"}
                                        />
                                        {tab.name === 'profile' && (hasNewBookingDot || hasIncompleteProfileDot) && !focused && (
                                            <View
                                                style={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: 5,
                                                    backgroundColor: '#EF4444',
                                                }}
                                            />
                                        )}
                                    </View>
                                );
                            },
                        }}
                    />
                ))}
            </Tabs>
        </ScreenSafeArea>
    );
};

export default HomeLayout;