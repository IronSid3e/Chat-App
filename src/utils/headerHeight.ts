import { Platform, StatusBar } from "react-native";

const HEADER_HEIGHT_DP = Platform.OS === "android" ? 56 : 44;

export function getHeaderBandHeight(): number {
  return (StatusBar.currentHeight ?? 0) + HEADER_HEIGHT_DP;
}
