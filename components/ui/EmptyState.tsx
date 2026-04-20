/**
 * Empty state component
 */

import { View } from "react-native";
import { Text } from "@/components/ui/StyledText";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/theme";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  subtitle?: string;
}

export function EmptyState({
  icon = "file-tray-outline",
  title = "لا توجد بيانات",
  subtitle,
}: EmptyStateProps) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 48,
        gap: 12,
      }}
    >
      <Ionicons name={icon} size={56} color={Colors.dark[600]} />
      <Text style={{ color: Colors.dark[400], fontSize: 16, fontWeight: "500" }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ color: Colors.dark[500], fontSize: 13, textAlign: "center" }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
