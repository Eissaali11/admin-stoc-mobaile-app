/**
 * Profile Tab Screen
 */

import { View, TouchableOpacity, Alert } from "react-native";
import { Text } from "@/components/ui/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { Colors } from "@/lib/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل أنت متأكد من تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "مسؤول النظام";
      case "supervisor":
        return "مشرف";
      case "technician":
        return "فني";
      default:
        return role;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark[900] }}>
      <View style={{ padding: 16, gap: 16 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: Colors.white,
            textAlign: "right",
          }}
        >
          حسابي
        </Text>

        {/* User Card */}
        <View
          style={{
            backgroundColor: Colors.dark[800],
            borderRadius: 16,
            padding: 24,
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: Colors.primary[500],
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontSize: 28, fontWeight: "bold", color: Colors.white }}
            >
              {user?.fullName?.charAt(0) || "U"}
            </Text>
          </View>

          <Text
            style={{ fontSize: 18, fontWeight: "600", color: Colors.white }}
          >
            {user?.fullName}
          </Text>

          <Text style={{ fontSize: 14, color: Colors.dark[400] }}>
            @{user?.username}
          </Text>

          <View
            style={{
              backgroundColor: Colors.primary[500] + "20",
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                color: Colors.primary[400],
                fontSize: 13,
                fontWeight: "500",
              }}
            >
              {getRoleLabel(user?.role || "")}
            </Text>
          </View>
        </View>

        {/* Info Cards */}
        <View
          style={{
            backgroundColor: Colors.dark[800],
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <InfoRow icon="mail-outline" label="البريد" value={user?.email || "-"} />
          <InfoRow icon="location-outline" label="المدينة" value={user?.city || "-"} />
          <InfoRow
            icon="shield-checkmark-outline"
            label="الحالة"
            value={user?.isActive ? "نشط" : "غير نشط"}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.error + "15",
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text
            style={{ color: Colors.error, fontSize: 16, fontWeight: "600" }}
          >
            تسجيل الخروج
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.dark[700],
        gap: 12,
      }}
    >
      <Ionicons name={icon} size={20} color={Colors.dark[400]} />
      <Text style={{ color: Colors.dark[400], fontSize: 14, width: 60, textAlign: "right" }}>
        {label}
      </Text>
      <Text
        style={{
          flex: 1,
          color: Colors.white,
          fontSize: 14,
          textAlign: "left",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
