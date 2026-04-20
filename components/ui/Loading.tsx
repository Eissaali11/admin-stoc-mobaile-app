/**
 * Loading indicator component
 */

import { View, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/StyledText";
import { Colors } from "@/lib/theme";

interface LoadingProps {
  message?: string;
  size?: "small" | "large";
}

export function Loading({ message = "جاري التحميل...", size = "large" }: LoadingProps) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.dark[900],
        gap: 12,
      }}
    >
      <ActivityIndicator size={size} color={Colors.primary[500]} />
      <Text style={{ color: Colors.dark[400], fontSize: 14 }}>{message}</Text>
    </View>
  );
}
