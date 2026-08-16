import React, { useState } from "react";
import {
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Text from "@/components/AppText";
import { useSignUp, useAuth } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";

export default function SignUpPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
        firstName,
        lastName,
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
      className="flex-1 justify-center p-5"
    >
      <View className="bg-white/10 p-6 rounded-2xl border border-white/15">
        <Text className="text-2xl font-bold mb-5 text-center text-white">
          {pendingVerification ? "Kodu Doğrula" : "Yeni Hesap Oluştur"}
        </Text>

        {!pendingVerification ? (
          <>
            <Text className="text-sm font-semibold text-white/80 mb-2">
              E-posta
            </Text>
            <TextInput
              className="border border-white/20 rounded-lg p-3 text-base mb-4 bg-white/10 text-white"
              autoCapitalize="none"
              placeholder="email@adres.com"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={emailAddress}
              onChangeText={setEmailAddress}
            />
            <Text className="text-sm font-semibold text-white/80 mb-2">
              Name
            </Text>
            <TextInput
              className="border border-white/20 rounded-lg p-3 text-base mb-4 bg-white/10 text-white"
              placeholder="First Name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              className="border border-white/20 rounded-lg p-3 text-base mb-4 bg-white/10 text-white"
              placeholder="Last Name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={lastName}
              onChangeText={setLastName}
            />

            <Text className="text-sm font-semibold text-white/80 mb-2">
              Şifre
            </Text>
            <TextInput
              className="border border-white/20 rounded-lg p-3 text-base mb-4 bg-white/10 text-white"
              placeholder="Minimum 8 karakter"
              placeholderTextColor="rgba(255,255,255,0.4)"
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
            <Text className="text-center mb-5 text-white/60">
              E-postana gelen 6 haneli kodu gir.
            </Text>
            <TextInput
              className="border border-white/20 rounded-lg p-3 text-base mb-4 bg-white/10 text-white"
              placeholder="000000"
              placeholderTextColor="rgba(255,255,255,0.4)"
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
          <Text className="text-white/70">Zaten bir hesabın var mı? </Text>
          <Link href="/sign-in" asChild>
            <TouchableOpacity>
              <Text className="text-sky-400 font-bold">Giriş Yap</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
