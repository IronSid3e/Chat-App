import {
  KeyboardAvoidingView,
  Pressable,
  Alert,
  TextInput,
  View,
  Image,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";
import * as ImagePicker from "expo-image-picker";

type MessageInputProps = {
  onSend: (text: string) => Promise<void>;
};

export default function MessageInput({ onSend }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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
      setImage(result.assets[0].uri);
    }
  };

  const handleSend = async () => {
    const text = message.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      await onSend(text);
      setMessage("");
      setImage(null);
    } catch (e: any) {
      Alert.alert("Gönderilemedi", e?.message ?? "Mesaj gönderilemedi.");
    } finally {
      setSending(false);
    }
  };

  const canSend = message.trim().length > 0 && !sending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView
        edges={["bottom"]}
        className="w-full bg-white p-3 gap-2 border-t border-gray-200"
      >
        {image && (
          <View className="relative w-32 h-32 mb-1">
            <Image
              source={{ uri: image }}
              className="w-full h-full rounded-lg"
            />
            <Pressable
              onPress={() => setImage(null)}
              className="absolute -top-2 -right-2 bg-gray-700 rounded-full p-1 border-2 border-white"
            >
              <Feather name="x" size={14} color="white" />
            </Pressable>
          </View>
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
            disabled={!canSend}
            className={`${
              canSend ? "bg-blue-500" : "bg-gray-200"
            } rounded-full p-2 w-11 h-11 justify-center items-center`}
          >
            <Feather
              name="send"
              size={20}
              color={`${canSend ? "white" : "gray"}`}
              style={canSend ? { marginLeft: -2, marginTop: 2 } : {}}
            />
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
