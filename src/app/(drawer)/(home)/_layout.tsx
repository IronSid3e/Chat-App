import { Stack } from "expo-router";
import { StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

function HeaderBlur() {
  return (
    <BlurView tint="dark" intensity={45} style={StyleSheet.absoluteFill} />
  );
}

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: "transparent" } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="channel/[id]"
        options={{
          headerTransparent: true,
          headerTintColor: "#ffffff",
          headerBackground: () => <HeaderBlur />,
          title: "",
          animation: "slide_from_right",
          animationDuration: 280,
        }}
      />
      <Stack.Screen
        name="status/[userId]"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="new/chat"
        options={{
          title: "New Chat",
          headerTransparent: true,
          headerTintColor: "#ffffff",
          headerBackground: () => <HeaderBlur />,
          animation: "slide_from_right",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
