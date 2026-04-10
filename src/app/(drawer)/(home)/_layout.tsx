import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="channel/[id]" />
      <Stack.Screen
        name="new/chat"
        options={{
          title: "New Chat",
          animation: "slide_from_right",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
