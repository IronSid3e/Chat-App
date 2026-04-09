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
import { useSignUp, useAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setPendingVerification(true);
    } catch (err: any) {
      alert(err.errors?.[0]?.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/drawer/");
      }
    } catch (err: any) {
      alert(err.errors?.[0]?.message || "Kod hatalı.");
    } finally {
      setLoading(false);
    }
  };

  if (isSignedIn) {
    router.replace("/drawer/");
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50 justify-center p-5"
    >
      <View className="bg-white p-6 rounded-2xl shadow-lg shadow-black/10 elevation-md">
        <Text className="text-2xl font-bold mb-5 text-center text-gray-800">
          {pendingVerification ? "Kodu Doğrula" : "Yeni Hesap Oluştur"}
        </Text>

        {!pendingVerification ? (
          <>
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              E-posta
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-base mb-4 bg-gray-50"
              autoCapitalize="none"
              placeholder="email@adres.com"
              value={emailAddress}
              onChangeText={setEmailAddress}
            />

            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Şifre
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-base mb-4 bg-gray-50"
              placeholder="Minimum 8 karakter"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              className={`bg-red-500 p-4 rounded-lg items-center mt-2.5 ${
                loading ? "opacity-60" : ""
              }`}
              onPress={onSignUpPress}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">Kayıt Ol</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-center mb-5 text-gray-500">
              E-postana gelen 6 haneli kodu gir.
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 text-base mb-4 bg-gray-50"
              placeholder="000000"
              keyboardType="numeric"
              value={code}
              onChangeText={setCode}
            />

            <TouchableOpacity
              className={`bg-red-500 p-4 rounded-lg items-center mt-2.5 ${
                loading ? "opacity-60" : ""
              }`}
              onPress={onVerifyPress}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">
                  Doğrula ve Bitir
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <View className="flex-row justify-center mt-5">
          <Text className="text-gray-700">Zaten bir hesabın var mı? </Text>
          <Link href="/sign-in" asChild>
            <TouchableOpacity>
              <Text className="text-blue-500 font-bold">Giriş Yap</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
