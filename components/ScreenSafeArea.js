import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ScreenSafeArea = ({
    children,
    style,
    edges = ["bottom"],
    showStatusBar = true,
    statusBarStyle = "dark-content",
    statusBarBackgroundColor = "transparent",
    translucent = true,
}) => {
    return (
        <SafeAreaView edges={edges} style={[{ flex: 1 }, style]}>
            {showStatusBar && (
                <StatusBar
                    translucent={translucent}
                    backgroundColor={statusBarBackgroundColor}
                    barStyle={statusBarStyle}
                />
            )}
            {children}
        </SafeAreaView>
    );
};

export default ScreenSafeArea;
