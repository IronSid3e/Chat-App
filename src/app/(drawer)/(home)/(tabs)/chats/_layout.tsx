import { Link, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function ChatLayout() {
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: "transparent" } }}>
      <Stack.Screen
        name="index"
        options={({ navigation }) => ({
          title: "Chats",
          headerTransparent: true,
          headerTintColor: "#ffffff",
          headerTitleStyle: { color: "#ffffff" },
          headerLeft: () => (
            <Ionicons
              onPress={() => {
                navigation.openDrawer();
              }}
              name="menu-outline"
              size={28}
              className="px-1"
              color="white"
            />
          ),
          headerRight: () => (
            <Link href={"/new/chat"} asChild>
              <Ionicons name="add" size={28} className="px-1" color="white" />
            </Link>
          ),
        })}
      />
    </Stack>
  );
}
