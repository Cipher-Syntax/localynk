import { View, Text, ScrollView, } from "react-native";
import { IsTourist, Action } from "../../../components/tourist_guide";
import { SafeAreaView } from "react-native-safe-area-context";


export default function TourGuide() {
    return (
        <ScrollView>
            <SafeAreaView>
                <Action />
            </SafeAreaView>
        </ScrollView>
    );
}
