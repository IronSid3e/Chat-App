import React, { useEffect, useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Text from "@/components/AppText";
import { useSignIn, useAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingMfa, setPendingMfa] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/(drawer)/(home)/(tabs)/chats");
    }
  }, [isSignedIn, router]);

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      });

      const status = result.status as string;

      if (status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(drawer)/(home)/(tabs)/chats");
      } else if (
        status === "needs_first_factor" ||
        status === "needs_second_factor"
      ) {
        const factor = result.supportedFirstFactors?.find(
          (f: any) => f.strategy === "email_code",
        ) as any;

        if (factor && factor.emailAddressId) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: factor.emailAddressId,
          });
          setPendingMfa(true);
        } else {
          alert("Bu hesap için e-posta doğrulaması desteklenmiyor.");
        }
      } else {
        console.log("Mevcut durum:", status);
        alert("Giriş tamamlanamadı, lütfen bilgilerinizi kontrol edin.");
      }
    } catch (err: any) {
      console.error("Giriş Hatası:", JSON.stringify(err, null, 2));
      alert(err.errors?.[0]?.message || "Giriş yapılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(drawer)/(home)/(tabs)/chats");
      } else {
        console.log(result);
      }
    } catch (err: any) {
      alert(err.errors?.[0]?.message || "Kod geçersiz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 justify-center p-5"
    >
      <View className="rounded-[20px] border border-white/15 bg-white/10 p-6">
        <Text className="mb-6 text-center text-[26px] font-extrabold text-white">
          {pendingMfa ? "Doğrulama Gerekli" : "Giriş Yap"}
        </Text>

        {!pendingMfa ? (
          <>
            <Text className="mb-1.5 text-sm font-semibold text-white/80">
              E-posta
            </Text>
            <TextInput
              className="mb-4 rounded-xl border border-white/20 bg-white/10 p-3.5 text-base text-white"
              autoCapitalize="none"
              placeholder="email@adres.com"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={emailAddress}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
            />

            <Text className="mb-1.5 text-sm font-semibold text-white/80">
              Şifre
            </Text>
            <TextInput
              className="mb-4 rounded-xl border border-white/20 bg-white/10 p-3.5 text-base text-white"
              placeholder="Şifreniz"
              placeholderTextColor="rgba(255,255,255,0.4)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              className={`mt-2 items-center rounded-xl bg-red-500 p-4 ${
                !emailAddress || !password || loading ? "opacity-60" : ""
              }`}
              onPress={onSignInPress}
              disabled={!emailAddress || !password || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-bold text-white">Devam Et</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="mb-5 text-center leading-5 text-white/60">
              E-postanıza gönderilen 6 haneli kodu girin.
            </Text>
            <TextInput
              className="mb-4 rounded-xl border border-white/20 bg-white/10 p-3.5 text-base text-white"
              placeholder="000000"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="numeric"
              value={code}
              onChangeText={setCode}
            />

            <TouchableOpacity
              className={`mt-2 items-center rounded-xl bg-red-500 p-4 ${
                !code || loading ? "opacity-60" : ""
              }`}
              onPress={onVerifyPress}
              disabled={!code || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-base font-bold text-white">
                  Doğrula ve Bitir
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPendingMfa(false)}
              className="mt-4 items-center"
            >
              <Text className="text-sm text-gray-500">Geri Dön</Text>
            </TouchableOpacity>
          </>
        )}

        <View className="mt-6 flex-row justify-center">
          <Text className="text-white/70">Hesabın yok mu? </Text>
          <Link href="/sign-up" asChild>
            <TouchableOpacity>
              <Text className="font-bold text-sky-400">Kayıt Ol</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
