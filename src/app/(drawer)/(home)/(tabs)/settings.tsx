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
import { LinearGradient } from "expo-linear-gradient";
import {
  GRADIENT_PRESETS,
  OTHER_BUBBLE_COLORS,
  OWN_BUBBLE_COLORS,
  useSettings,
} from "@/providers/SettingsProvider";

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Text className="px-5 mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
      {children}
    </Text>
  );
}

function MenuCard({ children }: { children: ReactNode }) {
  return (
    <View className="mx-4 bg-white/10 rounded-2xl overflow-hidden border border-white/10">
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
      android_ripple={{ color: "rgba(255,255,255,0.1)" }}
      className="flex-row items-center px-4 py-3.5 active:bg-white/10"
    >
      <View className="w-8 items-center justify-center">
        <Feather
          name={icon}
          size={20}
          color={destructive ? "#EF4444" : "rgba(255,255,255,0.7)"}
        />
      </View>
      <Text
        className={`flex-1 ml-3 text-base ${
          destructive ? "text-red-400 font-medium" : "text-white"
        }`}
      >
        {label}
      </Text>
      {right ?? (
        <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
      )}
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-white/10 ml-[60px]" />;
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
      <Text className="text-sm font-medium text-white mb-3">{title}</Text>
      <View className="flex-row flex-wrap gap-2.5">
        {(Object.keys(colors) as T[]).map((key) => {
          const hex = colors[key];
          const selected = value === key;
          return (
            <Pressable
              key={key}
              onPress={() => onChange(key)}
              className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                selected ? "border-white" : "border-transparent"
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
    <SafeAreaView className="flex-1">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-bold text-white">Ayarlar</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-28"
        showsVerticalScrollIndicator={false}
      >
        <View className="mx-4 mt-5 p-4 bg-white/10 rounded-2xl border border-white/10 flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center overflow-hidden">
            {avatar ? (
              <Image
                source={{ uri: avatar }}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <Text className="text-2xl font-bold text-white">
                {(user?.firstName ?? "?").charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-lg font-bold text-white">
              {fullName || "Misafir"}
            </Text>
            <Text className="text-sm text-white/60 mt-0.5">
              {email || "E-posta yok"}
            </Text>
          </View>
        </View>

        <SectionTitle>Sohbet</SectionTitle>
        <MenuCard>
          <View className="px-4 py-4">
            <Text className="text-sm font-medium text-white mb-3">
              Mesaj Önizlemesi
            </Text>
            <View className="gap-2">
              <View
                className="self-start max-w-[80%] rounded-2xl rounded-bl-none px-3.5 py-2 border border-white/20"
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

        <SectionTitle>Tema Rengi</SectionTitle>
        <MenuCard>
          <View className="px-4 py-4">
            <Text className="text-sm font-medium text-white mb-3">
              Arka plan gradyanı
            </Text>
            <View className="flex-row flex-wrap gap-2.5">
              {GRADIENT_PRESETS.map((preset) => {
                const selected =
                  settings.gradientColors.join(",") ===
                  preset.colors.join(",");
                return (
                  <Pressable
                    key={preset.name}
                    onPress={() =>
                      updateSettings({ gradientColors: preset.colors })
                    }
                    className="items-center"
                  >
                    <LinearGradient
                      colors={preset.colors as [string, string, ...string[]]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="w-14 h-14 rounded-2xl items-center justify-center border-2"
                      style={{
                        borderColor: selected ? "#ffffff" : "transparent",
                      }}
                    >
                      {selected && (
                        <Feather name="check" size={20} color="#ffffff" />
                      )}
                    </LinearGradient>
                    <Text className="text-xs text-white/60 mt-1.5">
                      {preset.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
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
            right={<Text className="text-sm text-white/60">1.0.0</Text>}
          />
          <Divider />
          <MenuItem
            icon="bell"
            label="Bildirimler"
            right={
              <Text className="text-sm text-white/60">Açık</Text>
            }
          />
        </MenuCard>

        <Text className="text-center text-xs text-white/40 mt-8">
          ChatApp • {Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
