import React, { useEffect } from "react";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface AnimatedTabIconProps {
  name: keyof typeof Feather.glyphMap;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
  size?: number;
}

export function AnimatedTabIcon({
  name,
  focused,
  activeColor,
  inactiveColor,
  size = 22,
}: AnimatedTabIconProps) {
  const scale = useSharedValue(focused ? 1 : 0.92);
  const lift = useSharedValue(focused ? -2 : 0);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withTiming(1.18, { duration: 140 }),
        withSpring(1, { damping: 8, stiffness: 220, mass: 0.5 }),
      );
      lift.value = withSpring(-2, { damping: 14, stiffness: 220 });
    } else {
      scale.value = withSpring(0.92, { damping: 14, stiffness: 220 });
      lift.value = withSpring(0, { damping: 14, stiffness: 220 });
    }
  }, [focused, scale, lift]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: lift.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Feather
        name={name}
        size={size}
        color={focused ? activeColor : inactiveColor}
      />
    </Animated.View>
  );
}
