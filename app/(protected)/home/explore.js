import { View, Text } from "react-native";

export default function Home() {
    return (
        <View style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center"
        }}>
            <Text style={{textAlign: "center", fontWeight: 900, fontSize: 30}}>Explore Screen</Text>
        </View>
    );
}
