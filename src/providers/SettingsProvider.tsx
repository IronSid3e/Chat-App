import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type OwnBubbleColor =
  | "blue"
  | "green"
  | "purple"
  | "red"
  | "orange"
  | "dark";

export type OtherBubbleColor =
  | "slate"
  | "sky"
  | "mint"
  | "lilac"
  | "peach"
  | "rose";

export const OWN_BUBBLE_COLORS: Record<OwnBubbleColor, string> = {
  blue: "#3B82F6",
  green: "#22C55E",
  purple: "#A855F7",
  red: "#EF4444",
  orange: "#F97316",
  dark: "#334155",
};

export const OTHER_BUBBLE_COLORS: Record<OtherBubbleColor, string> = {
  slate: "#F3F4F6",
  sky: "#E0F2FE",
  mint: "#DCFCE7",
  lilac: "#F3E8FF",
  peach: "#FFEDD5",
  rose: "#FFE4E6",
};

export const DEFAULT_GRADIENT_COLORS = ["#3a1740", "#8a1f6b", "#1a0e1f"];

export const GRADIENT_PRESETS: { name: string; colors: string[] }[] = [
  { name: "Mor-Pembe", colors: ["#3a1740", "#8a1f6b", "#1a0e1f"] },
  { name: "Mavi-Lacivert", colors: ["#0f2027", "#203a43", "#2c5364"] },
  { name: "Turuncu-Kırmızı", colors: ["#ff512f", "#dd2476", "#4a0d2e"] },
  { name: "Yeşil-Deniz", colors: ["#134e5e", "#71b280", "#0b3d3d"] },
  { name: "Gece Mavisi", colors: ["#0f0c29", "#302b63", "#24243e"] },
];

export type AppSettings = {
  ownBubbleColor: OwnBubbleColor;
  otherBubbleColor: OtherBubbleColor;
  gradientColors: string[];
};

export const DEFAULT_SETTINGS: AppSettings = {
  ownBubbleColor: "blue",
  otherBubbleColor: "slate",
  gradientColors: DEFAULT_GRADIENT_COLORS,
};

const STORAGE_KEY = "chatapp.settings.v1";

type SettingsContextType = {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
});

export default function SettingsProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            !Array.isArray(parsed.gradientColors) ||
            parsed.gradientColors.length < 2 ||
            parsed.gradientColors.some((c: unknown) => typeof c !== "string")
          ) {
            parsed.gradientColors = DEFAULT_GRADIENT_COLORS;
          }
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        if (hydrated) {
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(
            () => {},
          );
        }
        return next;
      });
    },
    [hydrated],
  );

  const value = useMemo(
    () => ({ settings, updateSettings }),
    [settings, updateSettings],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
