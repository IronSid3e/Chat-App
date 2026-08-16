import { Tabs } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';
import FloatingTabBar from "@/components/FloatingTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#EA7B7B',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <Ionicons name="chatbox" size={24} color={ color } />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={ color } />
        }}
      />
    </Tabs>
  );
}
