import { View, Text, ScrollView } from "react-native";
import { Notifications } from "../../../components/notifications";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Notification() {
    return (
        <ScrollView>
            <SafeAreaView>
                <Notifications />
            </SafeAreaView>
        </ScrollView>
    );
}
