import { Tabs } from "expo-router";
import { User, Map, Home } from "lucide-react-native";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HomeLayout = () => {
    const TABS = [
        { name: "index", title: "Explore", icon: Home },
        { name: "tourGuide", title: "Dashboard", icon: Map },
        { name: "profile", title: "Profile", icon: User },
    ];

    const FOCUSED_COLOR = "#1A2238";

    return (
        <SafeAreaView style={{ flex: 1 }}>
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
                                            backgroundColor: focused
                                                ? FOCUSED_COLOR
                                                : "transparent",
                                            borderWidth: focused ? 1 : 0,
                                            borderColor: focused ? "#fff" : "transparent",
                                            borderRadius: 9999,
                                            padding: focused ? 20 : 8,
                                            transform: [{ scale: focused ? 1.15 : 1 }],
                                        }}
                                    >
                                        <Icon color={color} size={22} />
                                    </View>
                                );
                            },
                        }}
                    />
                ))}
            </Tabs>
        </SafeAreaView>
    );
};

export default HomeLayout;
