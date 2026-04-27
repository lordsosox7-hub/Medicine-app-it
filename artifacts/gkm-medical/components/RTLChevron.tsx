import React from "react";
import { Feather } from "@expo/vector-icons";

interface RTLChevronProps {
  color?: string;
  size?: number;
}

export function RTLChevron({ color, size = 20 }: RTLChevronProps) {
  // Since we force RTL, things are flipped visually. But a chevron pointing to the "next" screen
  // in RTL should point LEFT.
  return <Feather name="chevron-left" size={size} color={color} />;
}
