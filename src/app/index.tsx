import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, ActivityIndicator } from "react-native";

export default function IndexPage() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  // EĞER GİRİŞ YAPMIŞSA: (Klasöre değil, tam dosyaya yönlendiriyoruz)
  if (isSignedIn) {
    return <Redirect href="/(drawer)/(home)/(tabs)/chats" />;
  }

  // EĞER GİRİŞ YAPMAMIŞSA:
  return <Redirect href="/(auth)/sign-in" />;
}
