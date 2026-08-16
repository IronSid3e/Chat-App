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

export type AppSettings = {
  ownBubbleColor: OwnBubbleColor;
  otherBubbleColor: OtherBubbleColor;
};

export const DEFAULT_SETTINGS: AppSettings = {
  ownBubbleColor: "blue",
  otherBubbleColor: "slate",
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
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
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
