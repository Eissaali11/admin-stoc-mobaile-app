/**
 * Home / Dashboard Screen - with real data
 */

import { View, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { Colors } from "@/lib/theme";
import { useDashboardStats, useAdminStats } from "@/lib/hooks";
import { hasRoleOrAbove } from "@/lib/types";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { Loading } from "@/components/ui/Loading";
import { ErrorView } from "@/components/ui/ErrorView";
import { useState, useCallback } from "react";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === "admin";
  const isSupervisorOrAbove = user ? hasRoleOrAbove(user.role, "supervisor") : false;

  const {
    data: dashboardStats,
    isLoading: dashLoading,
    error: dashError,
    refetch: refetchDash,
  } = useDashboardStats();

  const {
    data: adminStats,
    isLoading: adminLoading,
    refetch: refetchAdmin,
  } = useAdminStats();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchDash(),
      isAdmin ? refetchAdmin() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [isAdmin, refetchDash, refetchAdmin]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "مسؤول النظام";
      case "supervisor": return "مشرف";
      case "technician": return "فني";
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return Colors.error;
      case "supervisor": return Colors.warning;
      case "technician": return Colors.info;
      default: return Colors.dark[400];
    }
  };

  if (dashLoading && !refreshing) {
    return <Loading message="جاري تحميل لوحة التحكم..." />;
  }

  if (dashError && !dashboardStats) {
    return (
      <ErrorView
        message="تعذر تحميل بيانات لوحة التحكم"
        onRetry={() => refetchDash()}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark[900] }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row-reverse",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 14, color: Colors.dark[400] }}>
              مرحباً بك
            </Text>
            <Text
              style={{ fontSize: 20, fontWeight: "bold", color: Colors.white }}
            >
              {user?.fullName || "مستخدم"}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: getRoleColor(user?.role || ""),
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: Colors.white, fontSize: 12, fontWeight: "600" }}>
              {getRoleLabel(user?.role || "")}
            </Text>
          </View>
        </View>

        {/* Stats Row 1 */}
        <View style={{ flexDirection: "row-reverse", gap: 12 }}>
          <StatCard
            icon="cube"
            label="إجمالي المخزون"
            value={dashboardStats?.totalItems ?? 0}
            color={Colors.primary[500]}
          />
          <StatCard
            icon="receipt-outline"
            label="عمليات اليوم"
            value={dashboardStats?.todayTransactions ?? 0}
            color={Colors.info}
          />
        </View>

        {/* Stats Row 2 */}
        <View style={{ flexDirection: "row-reverse", gap: 12 }}>
          <StatCard
            icon="warning-outline"
            label="مخزون منخفض"
            value={dashboardStats?.lowStockItems ?? 0}
            color={Colors.warning}
            subtitle={dashboardStats?.lowStockItems ? "يحتاج تعبئة" : undefined}
          />
          <StatCard
            icon="alert-circle"
            label="نفاد المخزون"
            value={dashboardStats?.outOfStockItems ?? 0}
            color={Colors.error}
            subtitle={dashboardStats?.outOfStockItems ? "عاجل!" : undefined}
          />
        </View>

        {/* Admin-only section */}
        {isAdmin && adminStats && (
          <>
            {/* Admin quick stats */}
            <View
              style={{
                backgroundColor: Colors.dark[800],
                borderRadius: 16,
                padding: 16,
              }}
            >
              <Text
                style={{
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: "600",
                  textAlign: "right",
                  marginBottom: 16,
                }}
              >
                إحصائيات النظام
              </Text>
              <View style={{ flexDirection: "row-reverse", gap: 16 }}>
                <MiniStat label="المناطق" value={adminStats.totalRegions} icon="globe-outline" />
                <MiniStat label="المستخدمين" value={adminStats.totalUsers} icon="people-outline" />
                <MiniStat label="النشطون" value={adminStats.activeUsers} icon="checkmark-circle-outline" />
                <MiniStat label="العمليات" value={adminStats.totalTransactions} icon="swap-horizontal" />
              </View>
            </View>

            {/* Recent Transactions */}
            <RecentTransactions transactions={adminStats.recentTransactions || []} />
          </>
        )}

        {/* Admin Navigation */}
        {isSupervisorOrAbove && (
          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: Colors.white,
                fontSize: 16,
                fontWeight: "600",
                textAlign: "right",
              }}
            >
              إدارة النظام
            </Text>
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
              {[
                ...(isAdmin
                  ? [{ label: "لوحة الإدارة", icon: "shield-checkmark-outline" as const, route: "/admin" }]
                  : []),
                { label: "المخزون", icon: "layers-outline" as const, route: "/admin/inventory-overview" },
                { label: "العمليات", icon: "swap-horizontal-outline" as const, route: "/admin/operations-management" },
                { label: "المستودعات", icon: "business-outline" as const, route: "/admin/warehouses" },
                ...(isAdmin
                  ? [{ label: "الأصناف", icon: "pricetags-outline" as const, route: "/admin/item-types" }]
                  : []),
              ].map((item) => (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.7}
                  style={{
                    width: "48%",
                    backgroundColor: Colors.dark[800],
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 8,
                    borderWidth: 1,
                    borderColor: Colors.dark[700],
                  }}
                >
                  <Ionicons name={item.icon} size={18} color={Colors.primary[400]} />
                  <Text style={{ color: Colors.dark[200], fontSize: 13, fontWeight: "500" }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={{ flexDirection: "row-reverse", gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push("/operations/create")}
            activeOpacity={0.7}
            style={{
              flex: 1,
              backgroundColor: Colors.primary[500],
              borderRadius: 14,
              padding: 14,
              flexDirection: "row-reverse",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
            <Text style={{ color: Colors.white, fontSize: 14, fontWeight: "600" }}>إجراء عملية</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/operations/history")}
            activeOpacity={0.7}
            style={{
              flex: 1,
              backgroundColor: Colors.dark[800],
              borderRadius: 14,
              padding: 14,
              flexDirection: "row-reverse",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: Colors.dark[700],
            }}
          >
            <Ionicons name="time-outline" size={20} color={Colors.primary[400]} />
            <Text style={{ color: Colors.primary[400], fontSize: 14, fontWeight: "600" }}>سجل العمليات</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 6 }}>
      <Ionicons name={icon} size={18} color={Colors.primary[400]} />
      <Text style={{ color: Colors.white, fontSize: 18, fontWeight: "bold" }}>
        {value}
      </Text>
      <Text style={{ color: Colors.dark[400], fontSize: 10 }}>{label}</Text>
    </View>
  );
}
