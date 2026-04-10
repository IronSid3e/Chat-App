import { FlatList } from "react-native";
import React from "react";
import messages from "@/data/messages";
import MessageListItem from "./MessageListItem";

export default function MessageList() {
  const myId = "u-1";

  return (
    <FlatList
      data={messages}
      contentContainerClassName="p-3"
      renderItem={({ item }) => (
        <MessageListItem message={item} isOwnMessage={item.user.id === myId} />
      )}
      inverted
      showsVerticalScrollIndicator={false}
    />
  );
}
