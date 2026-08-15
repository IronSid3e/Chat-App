import { View, Text, Button } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

export default function SettingsScreen() {
  const { signOut } = useAuth();

  return (
    <View className="flex-1 items-center justify-center gap-3">
      <Text className="text-3xl">Settings</Text>

      <Button
        color={"purple"}
        onPress={() => signOut()}
        title="Sign out"
      ></Button>
    </View>
  );
}
