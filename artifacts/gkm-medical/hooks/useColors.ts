import colors from "@/constants/colors";
import { useTheme } from "./useTheme";

/**
 * Returns the design tokens for the current effective color scheme,
 * driven by the user's theme preference (light/dark/system).
 */
export function useColors() {
  const { scheme } = useTheme();
  const palette = scheme === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
