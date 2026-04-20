/**
 * Warehouses Management - إدارة المستودعات
 * List, create and manage warehouses with stats
 */

import { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { Text, TextInput } from "@/components/ui/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Spacing, FontSize, BorderRadius } from "@/lib/theme";
import { useWarehouses, useCreateWarehouse, useItemTypes } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/ui/Loading";
import { ErrorView } from "@/components/ui/ErrorView";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasRoleOrAbove } from "@/lib/types";
import type { WarehouseWithStats, ItemType, InventoryEntry } from "@/lib/types";

export default function WarehousesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form
  const [newWarehouse, setNewWarehouse] = useState({ name: "", location: "", description: "" });

  const { data: warehouses = [], isLoading, error, refetch } = useWarehouses();
  const { data: itemTypes = [] } = useItemTypes();
  const createMut = useCreateWarehouse();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (!user || !hasRoleOrAbove(user.role, "supervisor")) {
    return <ErrorView message="ليس لديك صلاحية الوصول" />;
  }

  if (isLoading && !refreshing) {
    return <Loading message="جاري تحميل المستودعات..." />;
  }

  if (error && !warehouses.length) {
    return <ErrorView message="تعذر تحميل المستودعات" onRetry={() => refetch()} />;
  }

  const filtered = warehouses.filter(
    (w: WarehouseWithStats) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = warehouses.reduce((sum: number, w: WarehouseWithStats) => sum + (w.totalItems || 0), 0);
  const lowStockWarehouses = warehouses.filter((w: WarehouseWithStats) => (w.lowStockItemsCount || 0) > 0).length;

  const handleCreate = () => {
    if (!newWarehouse.name.trim() || !newWarehouse.location.trim()) {
      Alert.alert("خطأ", "يرجى ملء اسم المستودع والموقع");
      return;
    }
    createMut.mutate(
      {
        name: newWarehouse.name.trim(),
        location: newWarehouse.location.trim(),
        description: newWarehouse.description.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setNewWarehouse({ name: "", location: "", description: "" });
          Alert.alert("تم", "تم إنشاء المستودع بنجاح");
        },
        onError: () => Alert.alert("خطأ", "فشل إنشاء المستودع"),
      }
    );
  };

  const getStockLevel = (w: WarehouseWithStats) => {
    if ((w.lowStockItemsCount || 0) > 2) return { label: "مخزون منخفض", color: Colors.error, icon: "alert-circle" as const };
    if ((w.lowStockItemsCount || 0) > 0) return { label: "تحذير", color: Colors.warning, icon: "warning" as const };
    return { label: "جيد", color: Colors.success, icon: "checkmark-circle" as const };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark[900] }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          padding: Spacing.md,
          gap: Spacing.sm,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: FontSize.xl, fontWeight: "bold", color: Colors.white, textAlign: "right" }}>
          إدارة المستودعات
        </Text>
        <Ionicons name="business" size={24} color={Colors.primary[500]} />
      </View>

      {/* Summary */}
      <View style={{ flexDirection: "row-reverse", gap: 8, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }}>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.dark[800],
            borderRadius: BorderRadius.md,
            padding: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: FontSize.xl, fontWeight: "bold", color: Colors.primary[400] }}>
            {warehouses.length}
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400] }}>مستودع</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.dark[800],
            borderRadius: BorderRadius.md,
            padding: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: FontSize.xl, fontWeight: "bold", color: Colors.info }}>
            {totalItems}
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400] }}>إجمالي المواد</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.dark[800],
            borderRadius: BorderRadius.md,
            padding: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: FontSize.xl, fontWeight: "bold", color: lowStockWarehouses > 0 ? Colors.warning : Colors.success }}>
            {lowStockWarehouses}
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400] }}>منخفض المخزون</Text>
        </View>
      </View>

      {/* Search + Add */}
      <View style={{ flexDirection: "row-reverse", gap: 10, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }}>
        <View
          style={{
            flex: 1,
            flexDirection: "row-reverse",
            alignItems: "center",
            backgroundColor: Colors.dark[800],
            borderRadius: BorderRadius.md,
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <Ionicons name="search-outline" size={18} color={Colors.dark[400]} />
          <TextInput
            placeholder="بحث بالاسم أو الموقع..."
            placeholderTextColor={Colors.dark[500]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ flex: 1, color: Colors.white, fontSize: FontSize.sm, paddingVertical: 12, textAlign: "right" }}
          />
        </View>
        {user?.role === "admin" && (
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: BorderRadius.md,
              backgroundColor: Colors.primary[500],
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="add-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 32, gap: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} colors={[Colors.primary[500]]} />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title="لا توجد مستودعات"
            subtitle={searchQuery ? "جرب بحث مختلف" : "أضف أول مستودع بالضغط على +"}
          />
        ) : (
          filtered.map((warehouse: WarehouseWithStats) => {
            const stockLevel = getStockLevel(warehouse);
            const isExpanded = expandedId === warehouse.id;

            return (
              <TouchableOpacity
                key={warehouse.id}
                onPress={() => setExpandedId(isExpanded ? null : warehouse.id)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: Colors.dark[800],
                  borderRadius: BorderRadius.lg,
                  overflow: "hidden",
                }}
              >
                {/* Warehouse header */}
                <View style={{ padding: Spacing.md }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: Colors.primary[500] + "20",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons name="business" size={24} color={Colors.primary[400]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: FontSize.md, fontWeight: "bold", color: Colors.white, textAlign: "right" }}>
                        {warehouse.name}
                      </Text>
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Ionicons name="location-outline" size={12} color={Colors.dark[400]} />
                        <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400] }}>
                          {warehouse.location}
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "center", gap: 4 }}>
                      <Ionicons name={stockLevel.icon} size={20} color={stockLevel.color} />
                      <Text style={{ fontSize: 10, color: stockLevel.color }}>{stockLevel.label}</Text>
                    </View>
                  </View>

                  {/* Quick stats */}
                  <View style={{ flexDirection: "row-reverse", gap: 12, marginTop: 12 }}>
                    <View style={{ flex: 1, flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                      <Ionicons name="cube-outline" size={14} color={Colors.primary[400]} />
                      <Text style={{ fontSize: FontSize.xs, color: Colors.dark[300] }}>
                        {warehouse.totalItems || 0} مادة
                      </Text>
                    </View>
                    {(warehouse.lowStockItemsCount || 0) > 0 && (
                      <View style={{ flex: 1, flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                        <Ionicons name="warning-outline" size={14} color={Colors.warning} />
                        <Text style={{ fontSize: FontSize.xs, color: Colors.warning }}>
                          {warehouse.lowStockItemsCount} منخفض
                        </Text>
                      </View>
                    )}
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={Colors.dark[500]}
                    />
                  </View>
                </View>

                {/* Expanded details */}
                {isExpanded && (
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: Colors.dark[700],
                      padding: Spacing.md,
                      gap: 8,
                    }}
                  >
                    {warehouse.description && (
                      <Text style={{ fontSize: FontSize.sm, color: Colors.dark[400], textAlign: "right" }}>
                        {warehouse.description}
                      </Text>
                    )}
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                      <Ionicons name="person-outline" size={14} color={Colors.dark[400]} />
                      <Text style={{ fontSize: FontSize.xs, color: Colors.dark[300] }}>
                        أنشأه: {warehouse.creatorName || "غير معروف"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                      <Ionicons name="calendar-outline" size={14} color={Colors.dark[400]} />
                      <Text style={{ fontSize: FontSize.xs, color: Colors.dark[300] }}>
                        تاريخ الإنشاء: {new Date(warehouse.createdAt).toLocaleDateString("ar-SA")}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        alignItems: "center",
                        gap: 6,
                        backgroundColor: (warehouse.isActive ? Colors.success : Colors.dark[600]) + "15",
                        padding: 8,
                        borderRadius: 8,
                      }}
                    >
                      <Ionicons
                        name={warehouse.isActive ? "checkmark-circle" : "close-circle"}
                        size={14}
                        color={warehouse.isActive ? Colors.success : Colors.dark[500]}
                      />
                      <Text style={{ fontSize: FontSize.xs, color: warehouse.isActive ? Colors.success : Colors.dark[500] }}>
                        {warehouse.isActive ? "نشط" : "غير نشط"}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Create Warehouse Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: Colors.dark[800], borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }}>
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: "bold", color: Colors.white }}>إنشاء مستودع</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.dark[400]} />
              </TouchableOpacity>
            </View>
            {[
              { key: "name", placeholder: "اسم المستودع *", icon: "business-outline" as const },
              { key: "location", placeholder: "الموقع *", icon: "location-outline" as const },
            ].map((field) => (
              <View
                key={field.key}
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  backgroundColor: Colors.dark[700],
                  borderRadius: BorderRadius.md,
                  paddingHorizontal: 12,
                  gap: 8,
                }}
              >
                <Ionicons name={field.icon} size={18} color={Colors.dark[400]} />
                <TextInput
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.dark[500]}
                  value={(newWarehouse as any)[field.key]}
                  onChangeText={(v) => setNewWarehouse({ ...newWarehouse, [field.key]: v })}
                  style={{ flex: 1, color: Colors.white, fontSize: FontSize.sm, paddingVertical: 14, textAlign: "right" }}
                />
              </View>
            ))}
            <TextInput
              placeholder="وصف (اختياري)"
              placeholderTextColor={Colors.dark[500]}
              value={newWarehouse.description}
              onChangeText={(v) => setNewWarehouse({ ...newWarehouse, description: v })}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: Colors.dark[700],
                borderRadius: BorderRadius.md,
                padding: 14,
                color: Colors.white,
                fontSize: FontSize.md,
                textAlign: "right",
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />
            <TouchableOpacity
              onPress={handleCreate}
              disabled={createMut.isPending}
              style={{
                backgroundColor: Colors.primary[500],
                borderRadius: BorderRadius.md,
                padding: 16,
                alignItems: "center",
                opacity: createMut.isPending ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: FontSize.md, fontWeight: "bold", color: Colors.white }}>
                {createMut.isPending ? "جاري الإنشاء..." : "إنشاء المستودع"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
