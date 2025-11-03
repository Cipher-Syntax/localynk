import { Tabs } from "expo-router";
import { Search, User, Map, Settings, Home, Bell } from "lucide-react-native";
import { View } from "react-native";
import Profile from "./profile";

const HomeLayout = () => {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: true,
                tabBarStyle: {
                    backgroundColor: "#0C1424",
                    borderTopWidth: 0,
                    height: 100,
                    paddingBottom: 10,
                },
                tabBarActiveTintColor: "#fff",
                tabBarInactiveTintColor: "#9CA3AF",
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={{
                                backgroundColor: focused ? "#1A2238" : "transparent",
                                borderWidth: focused ? 1 : 0,
                                borderColor: focused ? "#fff" : "transparent",
                                borderRadius: 9999,
                                padding: focused ? 20 : 8,
                                transform: [{ scale: focused ? 1.15 : 1 }],
                            }}
                        >
                            <Home color={color} size={22} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="tourGuide"
                options={{
                    title: "Tour Guide",
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={{
                                backgroundColor: focused ? "#1A2238" : "transparent",
                                borderWidth: focused ? 1 : 0,
                                borderColor: focused ? "#fff" : "transparent",
                                borderRadius: 9999,
                                padding: focused ? 20 : 8,
                                transform: [{ scale: focused ? 1.15 : 1 }],
                            }}
                        >
                            <Map color={color} size={22} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="notification"
                options={{
                    title: "Notification",
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={{
                                backgroundColor: focused ? "#1A2238" : "transparent",
                                borderWidth: focused ? 1 : 0,
                                borderColor: focused ? "#fff" : "transparent",
                                borderRadius: 9999,
                                padding: focused ? 20 : 8,
                                transform: [{ scale: focused ? 1.15 : 1 }],
                            }}
                        >
                            <Bell color={color} size={22} />
                        </View>
                    ),
                }}
            />
            
            <Tabs.Screen
                name="explore"
                options={{
                    title: "Explore",
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={{
                                backgroundColor: focused ? "#1A2238" : "transparent",
                                borderWidth: focused ? 1 : 0,
                                borderColor: focused ? "#fff" : "transparent",
                                borderRadius: 9999,
                                padding: focused ? 20 : 8,
                                transform: [{ scale: focused ? 1.15 : 1 }],
                            }}
                        >
                            <Search color={color} size={22} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, focused }) => (
                        <View
                            style={{
                                backgroundColor: focused ? "#1A2238" : "transparent",
                                borderWidth: focused ? 1 : 0,
                                borderColor: focused ? "#fff" : "transparent",
                                borderRadius: 9999,
                                padding: focused ? 20 : 8,
                                transform: [{ scale: focused ? 1.15 : 1 }],
                            }}
                        >
                            <User color={color} size={22} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

export default HomeLayout
