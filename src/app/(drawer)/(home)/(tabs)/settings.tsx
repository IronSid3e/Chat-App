import React, { type ReactNode } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import Text from "@/components/AppText";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import Feather from "@expo/vector-icons/Feather";
import Constants from "expo-constants";
import {
  OTHER_BUBBLE_COLORS,
  OWN_BUBBLE_COLORS,
  useSettings,
} from "@/providers/SettingsProvider";

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="px-5 mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children}
    </Text>
  );
}

function MenuCard({ children }: { children: ReactNode }) {
  return (
    <View className="mx-4 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      {children}
    </View>
  );
}

type MenuItemProps = {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  right?: ReactNode;
};

function MenuItem({ icon, label, onPress, destructive, right }: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#F3F4F6" }}
      className="flex-row items-center px-4 py-3.5 active:bg-gray-50"
    >
      <View className="w-8 items-center justify-center">
        <Feather
          name={icon}
          size={20}
          color={destructive ? "#EF4444" : "#6B7280"}
        />
      </View>
      <Text
        className={`flex-1 ml-3 text-base ${
          destructive ? "text-red-500 font-medium" : "text-gray-900"
        }`}
      >
        {label}
      </Text>
      {right ?? (
        <Feather name="chevron-right" size={20} color="#D1D5DB" />
      )}
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-gray-100 ml-[60px]" />;
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 180;
}

type ColorPickerProps<T extends string> = {
  title: string;
  colors: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
};

function ColorPicker<T extends string>({
  title,
  colors,
  value,
  onChange,
}: ColorPickerProps<T>) {
  return (
    <View className="px-4 py-4">
      <Text className="text-sm font-medium text-gray-900 mb-3">{title}</Text>
      <View className="flex-row flex-wrap gap-2.5">
        {(Object.keys(colors) as T[]).map((key) => {
          const hex = colors[key];
          const selected = value === key;
          return (
            <Pressable
              key={key}
              onPress={() => onChange(key)}
              className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                selected ? "border-gray-800" : "border-transparent"
              }`}
            >
              <View
                style={{ backgroundColor: hex }}
                className="w-8 h-8 rounded-full items-center justify-center"
              >
                {selected && (
                  <Feather
                    name="check"
                    size={16}
                    color={isLightColor(hex) ? "#111827" : "#ffffff"}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings } = useSettings();
  const { signOut } = useAuth();
  const { user } = useUser();

  const ownColor = OWN_BUBBLE_COLORS[settings.ownBubbleColor];
  const otherColor = OTHER_BUBBLE_COLORS[settings.otherBubbleColor];

  const confirmAndSignOut = (mode: "switch" | "logout") => {
    Alert.alert(
      mode === "switch" ? "Hesap Değiştir" : "Çıkış Yap",
      mode === "switch"
        ? "Başka bir hesapla giriş yapmak için oturumun kapatılacak. Devam edilsin mi?"
        : "Oturumun kapatılacak. Devam edilsin mi?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: mode === "switch" ? "Değiştir" : "Çıkış Yap",
          style: "destructive",
          onPress: () => signOut(),
        },
      ],
    );
  };

  const fullName = user?.fullName ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const avatar = user?.imageUrl;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-3 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Ayarlar</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        <View className="mx-4 mt-5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <Text className="text-2xl font-bold text-gray-600">
                {(user?.firstName ?? "?").charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-lg font-bold text-gray-900">
              {fullName || "Misafir"}
            </Text>
            <Text className="text-sm text-gray-500 mt-0.5">
              {email || "E-posta yok"}
            </Text>
          </View>
        </View>

        <SectionTitle>Sohbet</SectionTitle>
        <MenuCard>
          <View className="px-4 py-4">
            <Text className="text-sm font-medium text-gray-900 mb-3">
              Mesaj Önizlemesi
            </Text>
            <View className="gap-2">
              <View
                className="self-start max-w-[80%] rounded-2xl rounded-bl-none px-3.5 py-2 border border-gray-200"
                style={{ backgroundColor: otherColor }}
              >
                <Text className="text-gray-900">Selam, nasılsın?</Text>
              </View>
              <View
                className="self-end max-w-[80%] rounded-2xl rounded-br-none px-3.5 py-2"
                style={{ backgroundColor: ownColor }}
              >
                <Text className="text-white">İyiyim, teşekkürler!</Text>
              </View>
            </View>
          </View>
          <Divider />
          <ColorPicker
            title="Mesaj balonumun rengi"
            colors={OWN_BUBBLE_COLORS}
            value={settings.ownBubbleColor}
            onChange={(v) => updateSettings({ ownBubbleColor: v })}
          />
          <Divider />
          <ColorPicker
            title="Karşı tarafın mesaj rengi"
            colors={OTHER_BUBBLE_COLORS}
            value={settings.otherBubbleColor}
            onChange={(v) => updateSettings({ otherBubbleColor: v })}
          />
        </MenuCard>

        <SectionTitle>Hesap</SectionTitle>
        <MenuCard>
          <MenuItem
            icon="repeat"
            label="Hesap Değiştir"
            onPress={() => confirmAndSignOut("switch")}
          />
          <Divider />
          <MenuItem
            icon="log-out"
            label="Çıkış Yap"
            destructive
            onPress={() => confirmAndSignOut("logout")}
          />
        </MenuCard>

        <SectionTitle>Uygulama</SectionTitle>
        <MenuCard>
          <MenuItem
            icon="info"
            label="Sürüm"
            right={<Text className="text-sm text-gray-500">1.0.0</Text>}
          />
          <Divider />
          <MenuItem
            icon="bell"
            label="Bildirimler"
            right={
              <Text className="text-sm text-gray-500">Açık</Text>
            }
          />
        </MenuCard>

        <Text className="text-center text-xs text-gray-400 mt-8">
          ChatApp • {Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
