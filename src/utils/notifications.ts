import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let activeChannelId: string | null = null;

export function setActiveChannel(id: string | null) {
  activeChannelId = id;
}

export function getActiveChannel(): string | null {
  return activeChannelId;
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("messages", {
      name: "Mesajlar",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3b82f6",
    });
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;

  const res = await Notifications.requestPermissionsAsync();
  return res.status === "granted";
}

export async function notifyNewMessage(
  title: string,
  body: string,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        categoryIdentifier: "messages",
      },
      trigger: null,
    });
  } catch (e) {
    console.error("Bildirim gönderilemedi:", e);
  }
}
