import { View, Text, ScrollView } from "react-native";
import { FeaturedPlaces, Header } from "../../../components/home";
import { SafeAreaView } from "react-native-safe-area-context";

const Home = () => {
    return (
        <ScrollView>
            <SafeAreaView>
                <Header />
                <FeaturedPlaces />
            </SafeAreaView>
        </ScrollView>
    );
}

export default Home