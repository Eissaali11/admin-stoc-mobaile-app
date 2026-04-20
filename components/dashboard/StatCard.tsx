/**
 * Stat Card component - used in Dashboard
 */

import { View } from "react-native";
import { Text } from "@/components/ui/StyledText";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/theme";

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  color: string;
  subtitle?: string;
}

export function StatCard({ icon, label, value, color, subtitle }: StatCardProps) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.dark[800],
        borderRadius: 16,
        padding: 16,
        borderRightWidth: 3,
        borderRightColor: color,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: color + "20",
          justifyContent: "center",
          alignItems: "center",
          alignSelf: "flex-end",
          marginBottom: 12,
        }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: Colors.white,
          textAlign: "right",
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: Colors.dark[400],
          textAlign: "right",
          marginTop: 2,
        }}
      >
        {label}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 11,
            color: color,
            textAlign: "right",
            marginTop: 4,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
