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

export type PendingImage = {
  uri: string;
  mimeType?: string;
};

type MessageInputProps = {
  onSend: (text: string, image?: PendingImage) => Promise<void>;
};

export default function MessageInput({ onSend }: MessageInputProps) {
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
      quality: 1,
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
      Alert.alert("Gönderilemedi", e?.message ?? "Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  const canSend = (message.trim().length > 0 || image !== null) && !sending;

  const input = (
    <SafeAreaView
      edges={["bottom"]}
      className="w-full bg-white p-3 gap-2 border-t border-gray-200"
    >
      {image && (
        <Animated.View
          className="relative w-32 h-32 mb-1"
          style={{ transform: [{ scale: previewScale }] }}
        >
          <Image
            source={{ uri: image.uri }}
            className="w-full h-full rounded-lg"
          />
          <Pressable
            onPress={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-gray-700 rounded-full p-1 border-2 border-white"
          >
            <Feather name="x" size={14} color="white" />
          </Pressable>
        </Animated.View>
      )}

      <View className="flex-row w-full gap-2 items-center">
        <Pressable
          onPress={pickImage}
          className="bg-gray-200 rounded-full p-2 w-11 h-11 justify-center items-center"
        >
          <Feather name="image" size={22} color="gray" />
        </Pressable>
        <TextInput
          className="bg-gray-100 flex-1 rounded-3xl px-4 py-3 text-gray-900 text-base max-h-[120px]"
          placeholder="type something"
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
          className={`${
            canSend ? "bg-blue-500" : "bg-gray-200"
          } rounded-full p-2 w-11 h-11 justify-center items-center`}
        >
          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <Feather
              name="send"
              size={20}
              color={`${canSend ? "white" : "gray"}`}
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
  return input;
}
