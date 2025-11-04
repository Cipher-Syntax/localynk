import { View, Text, ScrollView } from "react-native";
import { Notifications } from "../../../components/notifications";

export default function Notification() {
    return (
        <ScrollView>
            <Notifications />
        </ScrollView>
    );
}
