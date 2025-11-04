import { View, Text, ScrollView } from "react-native";
import { ExplorePlaces } from "../../../components/explore";

export default function Home() {
    return (
        <ScrollView>
            <ExplorePlaces />
        </ScrollView>
    );
}
