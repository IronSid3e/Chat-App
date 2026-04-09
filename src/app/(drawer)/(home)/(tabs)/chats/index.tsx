import { View, FlatList } from "react-native";
import channels from "@/data/channels";
import ChannelListItem from "@/components/ChannelListItem";

export default function ChannelListScreen() {
  return (
    <View className="flex-1 pt-24 bg-white">
      <FlatList
        showsVerticalScrollIndicator={false}
        data={channels}
        renderItem={({ item }) => <ChannelListItem channel={item} />}
        contentContainerClassName="pb-6"
      />
    </View>
  );
}
