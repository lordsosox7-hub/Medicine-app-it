import React from "react";
import { View, TextInput, StyleSheet, Pressable, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface SearchBarProps {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  onPress?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
}

export function SearchBar({
  placeholder,
  value,
  onChangeText,
  onSubmit,
  onPress,
  editable = true,
  autoFocus = false,
}: SearchBarProps) {
  const colors = useColors();
  const showClear = !!value && value.length > 0 && editable;

  const inner = (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.input, borderRadius: colors.radius },
      ]}
      pointerEvents={onPress && !editable ? "none" : "auto"}
    >
      <Feather name="search" size={20} color={colors.mutedForeground} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_500Medium" }]}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={(e) => onSubmit?.(e.nativeEvent.text)}
        returnKeyType="search"
        editable={editable}
        autoFocus={autoFocus}
        writingDirection="rtl"
      />
      {showClear && (
        <TouchableOpacity
          onPress={() => onChangeText?.("")}
          hitSlop={8}
          style={styles.clearBtn}
          accessibilityLabel="مسح البحث"
        >
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress && !editable) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  icon: {},
  input: {
    flex: 1,
    height: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
