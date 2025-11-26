import { Tabs } from "expo-router";
import { User, Map, Home } from "lucide-react-native";
import { View, Platform } from "react-native";

const HomeLayout = () => {
    const TABS = [
        { name: "index", title: "Explore", icon: Home },
        { name: "tourGuide", title: "Dashboard", icon: Map },
        { name: "profile", title: "Profile", icon: User },
    ];

    const COLORS = {
        background: "#0C1424",
        focusedBackground: "#1A2238",
        activeTint: "#FFFFFF",
        inactiveTint: "#9CA3AF",
    };

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: {
                    backgroundColor: COLORS.background,
                    borderTopWidth: 0,
                    // Increased height slightly to accommodate the circle + text
                    height: Platform.OS === "ios" ? 100 : 80, 
                    paddingBottom: Platform.OS === "ios" ? 30 : 12,
                    paddingTop: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "500",
                    marginTop: 4,
                },
                tabBarActiveTintColor: COLORS.activeTint,
                tabBarInactiveTintColor: COLORS.inactiveTint,
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
                                        // EQUAL width and height makes it a square
                                        width: 46,
                                        height: 46,
                                        // Half of the width/height makes it a perfect circle
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
                                </View>
                            );
                        },
                    }}
                />
            ))}
        </Tabs>
    );
};

export default HomeLayout;