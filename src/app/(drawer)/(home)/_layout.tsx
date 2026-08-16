import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: "transparent" } }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="channel/[id]"
        options={{
          headerTransparent: true,
          headerTintColor: "#ffffff",
          title: "",
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
          animation: "slide_from_right",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
