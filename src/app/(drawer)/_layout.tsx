import { Drawer } from "expo-router/drawer";

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        drawerActiveBackgroundColor: "rgba(255,255,255,0.15)",
        drawerActiveTintColor: "#ffffff",
        drawerInactiveTintColor: "rgba(255,255,255,0.7)",
        drawerStyle: { backgroundColor: "#241026" },
        sceneStyle: { backgroundColor: "transparent" },
        headerStyle: { backgroundColor: "transparent" },
        headerTintColor: "#ffffff",
        headerShadowVisible: false,
      }}
    >
      <Drawer.Screen
        name="(home)"
        options={{ title: "Home", headerShown: false }}
      />
      <Drawer.Screen name="about" options={{ title: "About" }} />
    </Drawer>
  );
}
