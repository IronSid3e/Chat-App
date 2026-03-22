import { Drawer } from "expo-router/drawer";

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        drawerActiveBackgroundColor: "#ECECEC",
        drawerActiveTintColor: "#D25353",
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
