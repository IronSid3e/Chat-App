import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
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
        router.replace("/(drawer)");
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
        router.replace("/(drawer)");
      } else {
        console.log(result);
      }
    } catch (err: any) {
      alert(err.errors?.[0]?.message || "Kod geçersiz.");
    } finally {
      setLoading(false);
    }
  };

  if (isSignedIn) {
    router.replace("/(drawer)");
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50 justify-center p-5"
    >
      <View className="bg-white p-6 rounded-[20px] shadow-lg shadow-black/10 elevation-md">
        <Text className="text-[26px] font-extrabold mb-6 text-center text-gray-900">
          {pendingMfa ? "Doğrulama Gerekli" : "Giriş Yap"}
        </Text>

        {!pendingMfa ? (
          <>
            <Text className="text-sm font-semibold text-gray-700 mb-1.5">
              E-posta
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-3.5 text-base mb-4 bg-white"
              autoCapitalize="none"
              placeholder="email@adres.com"
              value={emailAddress}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
            />

            <Text className="text-sm font-semibold text-gray-700 mb-1.5">
              Şifre
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-3.5 text-base mb-4 bg-white"
              placeholder="Şifreniz"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              className={`bg-red-500 p-4 rounded-xl items-center mt-2 ${
                !emailAddress || !password || loading ? "opacity-60" : ""
              }`}
              onPress={onSignInPress}
              disabled={!emailAddress || !password || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">Devam Et</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-center mb-5 text-gray-500 leading-5">
              E-postanıza gönderilen 6 haneli kodu girin.
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl p-3.5 text-base mb-4 bg-white"
              placeholder="000000"
              keyboardType="numeric"
              value={code}
              onChangeText={setCode}
            />

            <TouchableOpacity
              className={`bg-red-500 p-4 rounded-xl items-center mt-2 ${
                !code || loading ? "opacity-60" : ""
              }`}
              onPress={onVerifyPress}
              disabled={!code || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">
                  Doğrula ve Bitir
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPendingMfa(false)}
              className="mt-4 items-center"
            >
              <Text className="text-gray-500 text-sm">Geri Dön</Text>
            </TouchableOpacity>
          </>
        )}

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-700">Hesabın yok mu? </Text>
          <Link href="/sign-up" asChild>
            <TouchableOpacity>
              <Text className="text-blue-500 font-bold">Kayıt Ol</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
