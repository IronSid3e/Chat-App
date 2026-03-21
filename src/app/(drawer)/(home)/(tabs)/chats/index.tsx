import { View, Text, StatusBar } from "react-native";

export default function HomeScreen() {
    return (
        <View className='flex-1 items-center justify-center'>
            <Text className="text-3xl">Channel List</Text>
            <StatusBar/>
        </View>
    )
}