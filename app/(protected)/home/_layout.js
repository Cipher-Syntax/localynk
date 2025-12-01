import { Tabs } from "expo-router";
import { User, Map, Home } from "lucide-react-native";
import { View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/AuthContext";

const HomeLayout = () => {
    const { role } = useAuth();

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

    return (
        <SafeAreaView style={{flex: 1}}>
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
                        // marginBottom: 40
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: "500",
                        marginTop: 4,
                        flex: 1
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