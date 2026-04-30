import React, { forwardRef } from "react";
import { Pressable, PressableProps, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type EnteringAnim = NonNullable<
  React.ComponentProps<typeof Animated.View>["entering"]
>;

export interface PressableScaleProps extends PressableProps {
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  entering?: EnteringAnim;
  children?: React.ReactNode;
}

export const PressableScale = forwardRef<any, PressableScaleProps>(
  function PressableScale(
    {
      scaleTo = 0.96,
      style,
      entering,
      children,
      onPressIn,
      onPressOut,
      disabled,
      ...rest
    },
    ref,
  ) {
    const pressed = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        {
          scale: withSpring(1 - pressed.value * (1 - scaleTo), {
            damping: 18,
            stiffness: 220,
            mass: 0.6,
          }),
        },
      ],
      opacity: withTiming(disabled ? 0.5 : 1 - pressed.value * 0.08, {
        duration: 120,
        easing: Easing.out(Easing.quad),
      }),
    }));

    return (
      <AnimatedPressable
        ref={ref}
        {...rest}
        disabled={disabled}
        onPressIn={(e) => {
          pressed.value = 1;
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          pressed.value = 0;
          onPressOut?.(e);
        }}
        entering={entering}
        style={[animatedStyle, style as any]}
      >
        {children}
      </AnimatedPressable>
    );
  },
);
