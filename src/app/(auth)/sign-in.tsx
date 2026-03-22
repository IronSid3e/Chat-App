import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
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

  // 1. Giriş işlemini başlat
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
        // Giriş başarılı, oturumu aktif et
        await setActive({ session: result.createdSessionId });

        // DİKKAT: Unmatched Route hatası almamak için burayı klasör ismine göre ayarla
        // Eğer klasörün adı (drawer) ise "/", eğer drawer ise "/drawer" yap.
        router.replace("/(drawer)");
      } else if (
        status === "needs_first_factor" ||
        status === "needs_second_factor"
      ) {
        // Doğrulama kodu gönderilecek e-posta ID'sini bul
        const factor = result.supportedFirstFactors?.find(
          (f: any) => f.strategy === "email_code",
        ) as any; // TypeScript hatasını aşmak için

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

  // 2. Doğrulama Kodunu Onayla
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

        // Aynı şekilde yönlendirmeyi klasör yapına uygun yap
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

  // Eğer zaten giriş yapılmışsa, direkt içeri yönlendir
  if (isSignedIn) {
    router.replace("/(drawer)");
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>
          {pendingMfa ? "Doğrulama Gerekli" : "Giriş Yap"}
        </Text>

        {!pendingMfa ? (
          <>
            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              placeholder="email@adres.com"
              value={emailAddress}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
            />

            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="Şifreniz"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={[
                styles.button,
                (!emailAddress || !password || loading) && styles.disabled,
              ]}
              onPress={onSignInPress}
              disabled={!emailAddress || !password || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Devam Et</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              E-postanıza gönderilen 6 haneli kodu girin.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="000000"
              keyboardType="numeric"
              value={code}
              onChangeText={setCode}
            />

            <TouchableOpacity
              style={[styles.button, (!code || loading) && styles.disabled]}
              onPress={onVerifyPress}
              disabled={!code || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Doğrula ve Bitir</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPendingMfa(false)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Geri Dön</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.footer}>
          <Text>Hesabın yok mu? </Text>
          <Link href="/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.link}>Kayıt Ol</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 24,
    textAlign: "center",
    color: "#1a1a1a",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    marginTop: 15,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  link: {
    color: "#007AFF",
    fontWeight: "bold",
  },
});
