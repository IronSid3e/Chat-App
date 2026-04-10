import { View, Text, FlatList } from "react-native";
import React from "react";
import users from "@/data/users";
import UserListItem from "./UserListItem";

export default function UserList() {
  return (
    <FlatList
      data={users}
      renderItem={({ item }) => <UserListItem user={item} />}
    />
  );
}
