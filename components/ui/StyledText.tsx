import React, { forwardRef } from "react";
import {
  Text as RNText,
  TextProps,
  TextInput as RNTextInput,
  TextInputProps,
  StyleSheet,
  Platform,
} from "react-native";

// On Android, fontWeight with a single-weight custom font causes fallback to system font.
// Strip fontWeight to keep BeinNormal rendering everywhere.
function stripWeight(style: any) {
  if (!style) return styles.defaultFont;
  const flat = StyleSheet.flatten([styles.defaultFont, style]);
  if (Platform.OS === "android") {
    delete flat.fontWeight;
  }
  return flat;
}

export function Text({ style, ...props }: TextProps) {
  return <RNText {...props} style={stripWeight(style)} />;
}

export const TextInput = forwardRef<RNTextInput, TextInputProps>(({ style, ...props }, ref) => {
  return <RNTextInput ref={ref} {...props} style={stripWeight(style)} />;
});

const styles = StyleSheet.create({
  defaultFont: {
    fontFamily: "BeinNormal",
  },
});
