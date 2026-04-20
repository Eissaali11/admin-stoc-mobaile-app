/**
 * Error display component
 */

import { View, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/StyledText";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/theme";

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({
  message = "حدث خطأ في تحميل البيانات",
  onRetry,
}: ErrorViewProps) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.dark[900],
        gap: 16,
        padding: 24,
      }}
    >
      <Ionicons name="alert-circle-outline" size={56} color={Colors.error} />
      <Text
        style={{
          color: Colors.dark[300],
          fontSize: 16,
          textAlign: "center",
          lineHeight: 24,
        }}
      >
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary[500],
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="refresh-outline" size={18} color={Colors.white} />
          <Text style={{ color: Colors.white, fontSize: 14, fontWeight: "600" }}>
            إعادة المحاولة
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
