import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header, FeaturedPlaces, About, HomePlacesBrowse, DiscoverWhatYouWant } from "../../components/home";
import PublicHeader from "../../components/home/PublicHeader";
import { useAuth } from "../../context/AuthContext";

const PublicHome = () => {
    const [loading, setLoading] = useState(true);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#fff"
            }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <ScrollView>
            <SafeAreaView>
                {!isAuthenticated ? <PublicHeader /> : <Header />}
                <FeaturedPlaces isPublic={!isAuthenticated} />
                <HomePlacesBrowse isPublic={!isAuthenticated} />
                <DiscoverWhatYouWant isPublic={!isAuthenticated} />
                <About />
            </SafeAreaView>
        </ScrollView>
    );
}

export default PublicHome;