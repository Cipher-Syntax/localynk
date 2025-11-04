import { View, Text, ScrollView, } from "react-native";
import { IsTourist, Action } from "../../../components/tourist_guide"


export default function TourGuide() {
    return (
        <ScrollView>
            <Action />
            {/* <IsTourist /> */}
        </ScrollView>
    );
}
