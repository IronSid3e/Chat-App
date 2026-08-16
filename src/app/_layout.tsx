// src/app/_layout.tsx
import "../../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { ActivityIndicator, View } from "react-native";
import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import SupabaseProvider from "@/providers/SupabaseProvider";
import SettingsProvider from "@/providers/SettingsProvider";
import NotificationListener from "@/components/NotificationListener";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Gizli Bekçi: Kullanıcının nerede olduğunu ve giriş yapıp yapmadığını dinler
  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const atRoot = (segments as string[]).length === 0;

    if (isSignedIn && (inAuthGroup || atRoot)) {
      // Burayı da klasörden tam dosyaya çevirdik
      router.replace("/(drawer)/(home)/(tabs)/chats");
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    }
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  // <Stack.Protected> yerine normal Stack kullanıyoruz, korumayı useEffect yapıyor
  return (
    <>
      <NotificationListener />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(drawer)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SettingsProvider>
        <SupabaseProvider>
          <RootStack />
        </SupabaseProvider>
      </SettingsProvider>
    </ClerkProvider>
  );
}
