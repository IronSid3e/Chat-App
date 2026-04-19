import { View, Text, Button } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useSupabase } from "@/providers/SupabaseProvider";

export default function SettingsScreen() {
  const { signOut } = useAuth();

  const supabase = useSupabase();

  const testInsert = async () => {
    const { data, error } = await supabase
      .from("Test")
      .insert({ test: "testing inserts 2" });
    console.log(error);
  };
  const testFetch = async () => {
    const { data, error } = await supabase.from("Test").select("*");

    console.log(JSON.stringify(data, null, 2));
  };
  return (
    <View className="flex-1 items-center justify-center gap-3">
      <Text className="text-3xl">Settings</Text>

      <Button
        color={"purple"}
        onPress={() => signOut()}
        title="Sign out"
      ></Button>
      <Button
        color={"purple"}
        onPress={testInsert}
        title="test insert"
      ></Button>
      <Button color={"purple"} onPress={testFetch} title="test fetch"></Button>
    </View>
  );
}
