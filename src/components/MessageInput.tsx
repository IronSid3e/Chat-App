import { KeyboardAvoidingView, Pressable, Text, TextInput } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Feather from "@expo/vector-icons/Feather";

export default function MessageInput() {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    //store in  db

    setMessage("");
  };

  return (
    <KeyboardAvoidingView>
      <SafeAreaView
        edges={["bottom"]}
        className="w-full bg-white p-3 flex-row items-center gap-2 border-t border-gray-200"
      >
        <Pressable className="bg-gray-200 rounded-full p-2 w-11 h-11">
          <Feather name="image" size={24} color="gray" />
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
          disabled={!message}
          className={`${message ? "bg-blue-500" : "bg-gray-200"} rounded-full p-2 w-11 h-11`}
        >
          <Feather
            name="send"
            size={24}
            color={`${message ? "white" : "gray"}`}
          />
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
