/**
 * Rahah Medical Care — palette
 * Inspired by the design mockups: clean medical blue with calming whites.
 */

const colors = {
  light: {
    text: "#0b1f3a",
    tint: "#1e6bf0",

    background: "#ffffff",
    foreground: "#0b1f3a",

    card: "#ffffff",
    cardForeground: "#0b1f3a",

    // Brand blue
    primary: "#1e6bf0",
    primaryForeground: "#ffffff",
    primaryDark: "#0b3fb5",
    primarySoft: "#e8f0ff",

    secondary: "#f3f6fb",
    secondaryForeground: "#0b1f3a",

    muted: "#f3f6fb",
    mutedForeground: "#6b7a92",

    accent: "#e8f0ff",
    accentForeground: "#1e6bf0",

    success: "#16a34a",
    warning: "#f59e0b",
    danger: "#ef4444",

    destructive: "#ef4444",
    destructiveForeground: "#ffffff",

    border: "#e6ecf5",
    input: "#e6ecf5",

    // Brand gradient stops
    gradientFrom: "#1e6bf0",
    gradientTo: "#0b3fb5",
  },

  dark: {
    text: "#e6ecf5",
    tint: "#5a9bff",

    background: "#0a1220",
    foreground: "#e6ecf5",

    card: "#121c2e",
    cardForeground: "#e6ecf5",

    primary: "#5a9bff",
    primaryForeground: "#0a1220",
    primaryDark: "#1e6bf0",
    primarySoft: "#1a2a47",

    secondary: "#1a2336",
    secondaryForeground: "#e6ecf5",

    muted: "#1a2336",
    mutedForeground: "#8a99b5",

    accent: "#1a2a47",
    accentForeground: "#5a9bff",

    success: "#22c55e",
    warning: "#fbbf24",
    danger: "#f87171",

    destructive: "#f87171",
    destructiveForeground: "#0a1220",

    border: "#1f2a40",
    input: "#1f2a40",

    gradientFrom: "#1e6bf0",
    gradientTo: "#0b3fb5",
  },

  radius: 16,

  accents: {
    light: {
      blue:   { color: "#1e6bf0", bg: "#e8f0ff" },
      green:  { color: "#16a34a", bg: "#e7f7ee" },
      purple: { color: "#7c3aed", bg: "#f1ebff" },
      teal:   { color: "#0891b2", bg: "#e0f5fa" },
      amber:  { color: "#d97706", bg: "#fef3d7" },
      red:    { color: "#ef4444", bg: "#fde8e8" },
      indigo: { color: "#0b3fb5", bg: "#e8f0ff" },
      rose:   { color: "#e11d48", bg: "#ffe4ec" },
    },
    dark: {
      blue:   { color: "#60a5fa", bg: "#16263f" },
      green:  { color: "#34d399", bg: "#10281d" },
      purple: { color: "#a78bfa", bg: "#221a3a" },
      teal:   { color: "#22d3ee", bg: "#0e2a32" },
      amber:  { color: "#fbbf24", bg: "#332410" },
      red:    { color: "#fca5a5", bg: "#3a1818" },
      indigo: { color: "#818cf8", bg: "#1a1f3a" },
      rose:   { color: "#fb7185", bg: "#3a1820" },
    },
  },
};

export type AccentName =
  | "blue"
  | "green"
  | "purple"
  | "teal"
  | "amber"
  | "red"
  | "indigo"
  | "rose";

export default colors;
