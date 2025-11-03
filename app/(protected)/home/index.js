import { View, Text, ScrollView } from "react-native";
import { FeaturedPlaces, Header } from "../../../components/home";

const Home = () => {
    return (
        <ScrollView>
            <Header />
            <FeaturedPlaces />
        </ScrollView>
    );
}

export default Home