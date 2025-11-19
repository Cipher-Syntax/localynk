// import { Stack } from "expo-router";
// // 1. Import the AuthProvider component
// // NOTE: Assuming "./context/AuthContext" is the correct relative path from /app/
// import { AuthProvider } from "../context/AuthContext";
// import Toast from "../components/Toast";

// export default function Layout() {
//     return (
//         // 2. Wrap the entire Stack with AuthProvider
//         <AuthProvider>
//             <Stack screenOptions={{ headerShown: false }}>
//                 {/* <Stack.Screen name="auth/landingPage" /> */}
//                 <Stack.Screen name="auth/login" />
//                 <Stack.Screen name="auth/register" />
//                 <Stack.Screen name="(protected)" />
//             </Stack>
//             <Toast />
//         </AuthProvider>
//     );
// }

import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import Toast from "../components/Toast";

export default function Layout() {
    return (
        <AuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="public/index" />
                <Stack.Screen name="auth/landingPage" />
                <Stack.Screen name="auth/login" />
                <Stack.Screen name="auth/register" />
                <Stack.Screen name="(protected)" />
            </Stack>
            <Toast />
        </AuthProvider>
    );
}