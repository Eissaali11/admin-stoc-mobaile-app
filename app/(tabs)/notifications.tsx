/**
 * Notifications Tab Screen - Placeholder
 */

import { View } from "react-native";
import { Text } from "@/components/ui/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/theme";

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark[900] }}>
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: Colors.white,
            textAlign: "right",
          }}
        >
          الإشعارات
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Ionicons
          name="notifications-outline"
          size={64}
          color={Colors.dark[600]}
        />
        <Text style={{ color: Colors.dark[400], fontSize: 16 }}>
          لا توجد إشعارات
        </Text>
      </View>
    </SafeAreaView>
  );
}
