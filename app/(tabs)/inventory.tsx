/**
 * Inventory Tab Screen - with search, filter, and real data
 */

import { View, FlatList, TouchableOpacity, RefreshControl, Modal, Pressable } from "react-native";
import { Text, TextInput } from "@/components/ui/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useInventory } from "@/lib/hooks";
import { Loading } from "@/components/ui/Loading";
import { ErrorView } from "@/components/ui/ErrorView";
import { EmptyState } from "@/components/ui/EmptyState";
import type { InventoryItemWithStatus, InventoryStatus, InventoryType } from "@/lib/types";
import { useState, useMemo, useCallback } from "react";

const STATUS_MAP: Record<InventoryStatus, { label: string; color: string }> = {
  available: { label: "متوفر", color: Colors.success },
  low: { label: "منخفض", color: Colors.warning },
  out: { label: "نفاد", color: Colors.error },
};

const TYPE_MAP: Record<InventoryType, string> = {
  devices: "أجهزة",
  sim: "شرائح",
  papers: "ورقيات",
};

export default function InventoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: items, isLoading, error, refetch } = useInventory();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<InventoryStatus | null>(null);
  const [filterType, setFilterType] = useState<InventoryType | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      if (search) {
        const q = search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchRegion = item.regionName?.toLowerCase().includes(q);
        const matchTech = item.technicianName?.toLowerCase().includes(q);
        if (!matchName && !matchRegion && !matchTech) return false;
      }
      if (filterStatus && item.status !== filterStatus) return false;
      if (filterType && item.type !== filterType) return false;
      return true;
    });
  }, [items, search, filterStatus, filterType]);

  const activeFiltersCount = (filterStatus ? 1 : 0) + (filterType ? 1 : 0);

  const clearFilters = () => {
    setFilterStatus(null);
    setFilterType(null);
  };

  if (isLoading && !refreshing) {
    return <Loading message="جاري تحميل المخزون..." />;
  }

  if (error && !items) {
    return <ErrorView message="تعذر تحميل بيانات المخزون" onRetry={() => refetch()} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark[900] }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: Colors.white, textAlign: "right" }}>
            المخزون
          </Text>
          <Text style={{ fontSize: 13, color: Colors.dark[400], textAlign: "right", marginTop: 2 }}>
            {filteredItems.length} عنصر {items && filteredItems.length !== items.length ? `من ${items.length}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/scanner")}
          style={{
            backgroundColor: Colors.primary[500],
            width: 40,
            height: 40,
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="scan-outline" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search + Filter bar */}
      <View style={{ flexDirection: "row-reverse", paddingHorizontal: 16, paddingVertical: 10, gap: 10 }}>
        <View
          style={{
            flex: 1,
            flexDirection: "row-reverse",
            backgroundColor: Colors.dark[800],
            borderRadius: 12,
            paddingHorizontal: 14,
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="search-outline" size={18} color={Colors.dark[400]} />
          <TextInput
            style={{ flex: 1, color: Colors.white, fontSize: 14, textAlign: "right", paddingVertical: 10 }}
            placeholder="بحث بالاسم أو المنطقة..."
            placeholderTextColor={Colors.dark[500]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.dark[400]} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowFilter(true)}
          style={{
            backgroundColor: activeFiltersCount > 0 ? Colors.primary[500] : Colors.dark[800],
            borderRadius: 12,
            width: 44,
            height: 44,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="filter" size={18} color={activeFiltersCount > 0 ? Colors.white : Colors.dark[400]} />
          {activeFiltersCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: 4,
                left: 4,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: Colors.error,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: Colors.white, fontSize: 9, fontWeight: "bold" }}>
                {activeFiltersCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={search || activeFiltersCount ? "لا توجد نتائج" : "المخزون فارغ"}
            subtitle={search || activeFiltersCount ? "جرب تغيير كلمة البحث أو الفلاتر" : undefined}
          />
        }
        renderItem={({ item }) => <InventoryCard item={item} />}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        filterStatus={filterStatus}
        filterType={filterType}
        onStatusChange={setFilterStatus}
        onTypeChange={setFilterType}
        onClear={clearFilters}
      />
    </SafeAreaView>
  );
}

function InventoryCard({ item }: { item: InventoryItemWithStatus }) {
  const statusInfo = STATUS_MAP[item.status];
  const typeLabel = TYPE_MAP[item.type] || item.type;

  return (
    <View
      style={{
        backgroundColor: Colors.dark[800],
        borderRadius: 14,
        padding: 14,
        borderRightWidth: 3,
        borderRightColor: statusInfo.color,
      }}
    >
      <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text style={{ color: Colors.white, fontSize: 15, fontWeight: "600" }} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 4, alignItems: "center" }}>
            <Text style={{ color: Colors.dark[400], fontSize: 12 }}>{typeLabel}</Text>
            <Text style={{ color: Colors.dark[600], fontSize: 10 }}>•</Text>
            <Text style={{ color: Colors.dark[400], fontSize: 12 }}>{item.regionName}</Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: statusInfo.color + "20",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: statusInfo.color, fontSize: 11, fontWeight: "600" }}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row-reverse", marginTop: 10, gap: 16 }}>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: Colors.dark[500], fontSize: 11 }}>الكمية</Text>
          <Text style={{ color: Colors.white, fontSize: 16, fontWeight: "bold" }}>
            {item.quantity} <Text style={{ fontSize: 11, color: Colors.dark[400] }}>{item.unit}</Text>
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: Colors.dark[500], fontSize: 11 }}>الحد الأدنى</Text>
          <Text style={{ color: Colors.dark[400], fontSize: 14 }}>{item.minThreshold}</Text>
        </View>
        {item.technicianName && (
          <View style={{ flex: 1, alignItems: "flex-start" }}>
            <Text style={{ color: Colors.dark[500], fontSize: 11 }}>الفني</Text>
            <Text style={{ color: Colors.dark[400], fontSize: 12 }} numberOfLines={1}>
              {item.technicianName}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function FilterModal({
  visible,
  onClose,
  filterStatus,
  filterType,
  onStatusChange,
  onTypeChange,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  filterStatus: InventoryStatus | null;
  filterType: InventoryType | null;
  onStatusChange: (s: InventoryStatus | null) => void;
  onTypeChange: (t: InventoryType | null) => void;
  onClear: () => void;
}) {
  const statusOptions: { value: InventoryStatus; label: string; color: string }[] = [
    { value: "available", label: "متوفر", color: Colors.success },
    { value: "low", label: "منخفض", color: Colors.warning },
    { value: "out", label: "نفاد", color: Colors.error },
  ];

  const typeOptions: { value: InventoryType; label: string }[] = [
    { value: "devices", label: "أجهزة" },
    { value: "sim", label: "شرائح" },
    { value: "papers", label: "ورقيات" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={onClose}>
        <Pressable
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: Colors.dark[800],
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: 40,
          }}
          onPress={() => {}}
        >
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: Colors.dark[600],
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 20,
            }}
          />

          <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ color: Colors.white, fontSize: 18, fontWeight: "bold" }}>
              تصفية النتائج
            </Text>
            <TouchableOpacity onPress={onClear}>
              <Text style={{ color: Colors.primary[400], fontSize: 13 }}>مسح الكل</Text>
            </TouchableOpacity>
          </View>

          {/* Status filter */}
          <Text style={{ color: Colors.dark[300], fontSize: 14, fontWeight: "600", textAlign: "right", marginBottom: 10 }}>
            الحالة
          </Text>
          <View style={{ flexDirection: "row-reverse", gap: 8, marginBottom: 20 }}>
            {statusOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onStatusChange(filterStatus === opt.value ? null : opt.value)}
                style={{
                  flex: 1,
                  backgroundColor: filterStatus === opt.value ? opt.color + "30" : Colors.dark[700],
                  borderWidth: 1,
                  borderColor: filterStatus === opt.value ? opt.color : Colors.dark[600],
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: filterStatus === opt.value ? opt.color : Colors.dark[300],
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Type filter */}
          <Text style={{ color: Colors.dark[300], fontSize: 14, fontWeight: "600", textAlign: "right", marginBottom: 10 }}>
            النوع
          </Text>
          <View style={{ flexDirection: "row-reverse", gap: 8, marginBottom: 20 }}>
            {typeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => onTypeChange(filterType === opt.value ? null : opt.value)}
                style={{
                  flex: 1,
                  backgroundColor: filterType === opt.value ? Colors.primary[500] + "30" : Colors.dark[700],
                  borderWidth: 1,
                  borderColor: filterType === opt.value ? Colors.primary[500] : Colors.dark[600],
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: filterType === opt.value ? Colors.primary[400] : Colors.dark[300],
                    fontSize: 13,
                    fontWeight: "500",
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Apply */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: Colors.primary[500],
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: Colors.white, fontSize: 15, fontWeight: "600" }}>تطبيق</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
