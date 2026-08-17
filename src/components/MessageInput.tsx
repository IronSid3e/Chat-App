import * as Sentry from "@sentry/react-native";
import {
  Animated,
  KeyboardAvoidingView,
  Pressable,
  Alert,
  TextInput,
  View,
  Image,
  Platform,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";
import { OWN_BUBBLE_COLORS, useSettings } from "@/providers/SettingsProvider";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";

export type PendingImage = {
  uri: string;
  mimeType?: string;
};

type MessageInputProps = {
  onSend: (text: string, image?: PendingImage) => Promise<void>;
};

export default function MessageInput({ onSend }: MessageInputProps) {
  const { settings } = useSettings();
  const keyboardHeight = useKeyboardHeight();
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<PendingImage | null>(null);
  const [sending, setSending] = useState(false);

  const sendScale = useRef(new Animated.Value(1)).current;
  const previewScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(previewScale, {
      toValue: image ? 1 : 0,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
    }).start();
  }, [image, previewScale]);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Permission to access the media library is required.",
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({ uri: asset.uri, mimeType: asset.mimeType });
    }
  };

  const pulseSend = () => {
    Animated.sequence([
      Animated.spring(sendScale, {
        toValue: 1.3,
        useNativeDriver: true,
        speed: 30,
        bounciness: 14,
      }),
      Animated.spring(sendScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
    ]).start();
  };

  const handleSend = async () => {
    const text = message.trim();
    const img = image;
    if ((!text && !img) || sending) return;

    setMessage("");
    setImage(null);
    pulseSend();
    setSending(true);
    try {
      await onSend(text, img ?? undefined);
    } catch (e: any) {
      Sentry.captureException(e);
      Alert.alert("Gönderilemedi", e?.message ?? "Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  const canSend = (message.trim().length > 0 || image !== null) && !sending;

  const input = (
    <SafeAreaView
      edges={["bottom"]}
      className="w-full gap-2 border-t border-white/10 p-3"
    >
      {image && (
        <Animated.View
          className="relative mb-1 h-32 w-32"
          style={{ transform: [{ scale: previewScale }] }}
        >
          <Image
            source={{ uri: image.uri }}
            className="h-full w-full rounded-lg"
          />
          <Pressable
            onPress={() => setImage(null)}
            className="absolute -right-2 -top-2 rounded-full border-2 border-white bg-gray-700 p-1"
            accessibilityRole="button"
            accessibilityLabel="Görseli kaldır"
          >
            <Feather name="x" size={14} color="white" />
          </Pressable>
        </Animated.View>
      )}

      <View className="w-full flex-row items-center gap-2">
        <Pressable
          onPress={pickImage}
          className="h-11 w-11 items-center justify-center rounded-full bg-white/15 p-2"
          accessibilityRole="button"
          accessibilityLabel="Görsel ekle"
        >
          <Feather name="image" size={22} color="white" />
        </Pressable>
        <TextInput
          className="max-h-[120px] flex-1 rounded-3xl bg-white/15 px-4 py-3 text-base text-white"
          placeholder="type something"
          placeholderTextColor="rgba(255,255,255,0.5)"
          multiline
          value={message}
          onChangeText={setMessage}
        />
        <Pressable
          onPress={handleSend}
          onPressIn={() =>
            Animated.spring(sendScale, {
              toValue: 0.85,
              useNativeDriver: true,
              speed: 40,
              bounciness: 8,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(sendScale, {
              toValue: 1,
              useNativeDriver: true,
              speed: 30,
              bounciness: 6,
            }).start()
          }
          disabled={!canSend}
          style={
            canSend
              ? { backgroundColor: OWN_BUBBLE_COLORS[settings.ownBubbleColor] }
              : undefined
          }
          className={`${
            canSend ? "" : "bg-white/15"
          } h-11 w-11 items-center justify-center rounded-full p-2`}
          accessibilityRole="button"
          accessibilityLabel="Gönder"
          accessibilityState={{ disabled: !canSend }}
        >
          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <Feather
              name="send"
              size={20}
              color={`${canSend ? "white" : "rgba(255,255,255,0.5)"}`}
              style={canSend ? { marginLeft: -2, marginTop: 2 } : {}}
            />
          </Animated.View>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  if (Platform.OS === "ios") {
    return (
      <KeyboardAvoidingView behavior="padding">{input}</KeyboardAvoidingView>
    );
  }
  return <View style={{ paddingBottom: keyboardHeight }}>{input}</View>;
}
