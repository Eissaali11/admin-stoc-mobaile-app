/**
 * Inventory Overview - نظرة عامة على المخزون
 * View all technicians' inventory with alerts and search
 */

import { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Text, TextInput } from "@/components/ui/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Spacing, FontSize, BorderRadius } from "@/lib/theme";
import { useAllTechniciansInventory, useItemTypes } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/ui/Loading";
import { ErrorView } from "@/components/ui/ErrorView";
import { EmptyState } from "@/components/ui/EmptyState";
import { hasRoleOrAbove } from "@/lib/types";
import type { TechnicianOverview, ItemType, InventoryEntry } from "@/lib/types";

// Legacy field mapping (matches web frontend)
const legacyFieldMapping: Record<string, { boxes: string; units: string }> = {
  n950: { boxes: "n950Boxes", units: "n950Units" },
  i9000s: { boxes: "i9000sBoxes", units: "i9000sUnits" },
  i9100: { boxes: "i9100Boxes", units: "i9100Units" },
  rollPaper: { boxes: "rollPaperBoxes", units: "rollPaperUnits" },
  stickers: { boxes: "stickersBoxes", units: "stickersUnits" },
  newBatteries: { boxes: "newBatteriesBoxes", units: "newBatteriesUnits" },
  mobilySim: { boxes: "mobilySimBoxes", units: "mobilySimUnits" },
  stcSim: { boxes: "stcSimBoxes", units: "stcSimUnits" },
  zainSim: { boxes: "zainSimBoxes", units: "zainSimUnits" },
  lebaraSim: { boxes: "lebaraBoxes", units: "lebaraUnits" },
};

function getInventoryValue(
  itemTypeId: string,
  entries: InventoryEntry[] | undefined | null,
  legacyInventory: Record<string, any> | null | undefined,
  valueType: "boxes" | "units"
): number {
  if (entries && Array.isArray(entries)) {
    const entry = entries.find((e) => e.itemTypeId === itemTypeId);
    if (entry) {
      return valueType === "boxes" ? entry.boxes : entry.units;
    }
  }
  if (legacyInventory) {
    const legacy = legacyFieldMapping[itemTypeId];
    if (legacy) {
      const fieldName = valueType === "boxes" ? legacy.boxes : legacy.units;
      return (legacyInventory as any)[fieldName] || 0;
    }
  }
  return 0;
}

interface DisplayItem {
  id: string;
  nameAr: string;
  boxes: number;
  units: number;
  category: string;
}

function buildDisplayItems(
  activeItemTypes: ItemType[],
  entries: InventoryEntry[] | undefined | null,
  legacyInventory: Record<string, any> | null | undefined
): DisplayItem[] {
  return activeItemTypes
    .filter((t) => t.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((itemType) => ({
      id: itemType.id,
      nameAr: itemType.nameAr,
      boxes: getInventoryValue(itemType.id, entries, legacyInventory, "boxes"),
      units: getInventoryValue(itemType.id, entries, legacyInventory, "units"),
      category: itemType.category,
    }))
    .filter((item) => item.boxes > 0 || item.units > 0);
}

export default function InventoryOverviewScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterAlert, setFilterAlert] = useState<"all" | "critical" | "warning" | "good">("all");

  const { data, isLoading, error, refetch } = useAllTechniciansInventory(user?.role);
  const { data: itemTypes = [] } = useItemTypes();

  const activeItemTypes = useMemo(() =>
    itemTypes.filter((t: ItemType) => t.isActive),
    [itemTypes]
  );

  const technicians = data?.technicians || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const alertCounts = useMemo(() => ({
    critical: technicians.filter((t) => t.alertLevel === "critical").length,
    warning: technicians.filter((t) => t.alertLevel === "warning").length,
    good: technicians.filter((t) => t.alertLevel === "good").length,
  }), [technicians]);

  if (!user || !hasRoleOrAbove(user.role, "supervisor")) {
    return <ErrorView message="ليس لديك صلاحية الوصول" />;
  }

  if (isLoading && !refreshing) {
    return <Loading message="جاري تحميل بيانات الفنيين..." />;
  }

  if (error && !data) {
    return <ErrorView message="تعذر تحميل بيانات المخزون" onRetry={() => refetch()} />;
  }

  const filtered = technicians.filter((t) => {
    const matchesSearch =
      t.technicianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.city || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterAlert === "all" || t.alertLevel === filterAlert;
    return matchesSearch && matchesFilter;
  });

  const getAlertIcon = (level: string): keyof typeof Ionicons.glyphMap => {
    switch (level) {
      case "critical": return "alert-circle";
      case "warning": return "warning";
      default: return "checkmark-circle";
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case "critical": return Colors.error;
      case "warning": return Colors.warning;
      default: return Colors.success;
    }
  };

  const getAlertLabel = (level: string) => {
    switch (level) {
      case "critical": return "حرج";
      case "warning": return "تحذير";
      default: return "جيد";
    }
  };

  const renderInventorySection = (
    inventory: Record<string, any> | null,
    entries: InventoryEntry[] | undefined | null,
    label: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => {
    const items = buildDisplayItems(activeItemTypes, entries, inventory);
    if (items.length === 0) return null;
    return (
      <View style={{ marginTop: 10 }}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Ionicons name={icon} size={14} color={Colors.primary[400]} />
          <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: Colors.primary[400] }}>
            {label} ({items.length} صنف)
          </Text>
        </View>
        {items.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: "row-reverse",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 6,
              paddingHorizontal: 8,
              backgroundColor: Colors.dark[700] + "60",
              borderRadius: 8,
              marginBottom: 4,
            }}
          >
            <Text style={{ fontSize: FontSize.xs, color: Colors.dark[300], flex: 1, textAlign: "right" }}>
              {item.nameAr}
            </Text>
            <View style={{ flexDirection: "row-reverse", gap: 12 }}>
              <Text style={{ fontSize: FontSize.xs, color: Colors.white }}>
                📦 {item.boxes}
              </Text>
              <Text style={{ fontSize: FontSize.xs, color: Colors.dark[300] }}>
                🔢 {item.units}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
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
          نظرة عامة على المخزون
        </Text>
        <Ionicons name="layers" size={24} color={Colors.primary[500]} />
      </View>

      {/* Search */}
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          backgroundColor: Colors.dark[800],
          borderRadius: BorderRadius.md,
          marginHorizontal: Spacing.md,
          paddingHorizontal: 12,
          gap: 8,
        }}
      >
        <Ionicons name="search-outline" size={18} color={Colors.dark[400]} />
        <TextInput
          placeholder="بحث باسم الفني أو المدينة..."
          placeholderTextColor={Colors.dark[500]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{
            flex: 1,
            color: Colors.white,
            fontSize: FontSize.sm,
            paddingVertical: 12,
            textAlign: "right",
          }}
        />
      </View>

      {/* Alert Summary Cards */}
      <View style={{ flexDirection: "row-reverse", gap: 8, padding: Spacing.md }}>
        {[
          { key: "all" as const, label: "الكل", count: technicians.length, color: Colors.dark[400], icon: "people" as const },
          { key: "critical" as const, label: "حرج", count: alertCounts.critical, color: Colors.error, icon: "alert-circle" as const },
          { key: "warning" as const, label: "تحذير", count: alertCounts.warning, color: Colors.warning, icon: "warning" as const },
          { key: "good" as const, label: "جيد", count: alertCounts.good, color: Colors.success, icon: "checkmark-circle" as const },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => setFilterAlert(item.key)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              alignItems: "center",
              gap: 4,
              paddingVertical: 10,
              borderRadius: BorderRadius.md,
              backgroundColor: filterAlert === item.key ? item.color + "30" : Colors.dark[800],
              borderWidth: filterAlert === item.key ? 1 : 0,
              borderColor: item.color,
            }}
          >
            <Ionicons name={item.icon} size={16} color={item.color} />
            <Text style={{ fontSize: FontSize.lg, fontWeight: "bold", color: Colors.white }}>{item.count}</Text>
            <Text style={{ fontSize: 10, color: Colors.dark[400] }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 32, gap: 10 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} colors={[Colors.primary[500]]} />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon="people-outline" title="لا يوجد فنيين" subtitle="لم يتم العثور على نتائج" />
        ) : (
          filtered.map((tech: TechnicianOverview) => {
            const isExpanded = expandedId === tech.technicianId;
            return (
              <TouchableOpacity
                key={tech.technicianId}
                onPress={() => setExpandedId(isExpanded ? null : tech.technicianId)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: Colors.dark[800],
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  borderRightWidth: 3,
                  borderRightColor: getAlertColor(tech.alertLevel),
                }}
              >
                {/* Tech header */}
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: getAlertColor(tech.alertLevel) + "25",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name={getAlertIcon(tech.alertLevel)} size={20} color={getAlertColor(tech.alertLevel)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FontSize.md, fontWeight: "600", color: Colors.white, textAlign: "right" }}>
                      {tech.technicianName}
                    </Text>
                    <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400], textAlign: "right" }}>
                      {tech.city || "غير محدد"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 10,
                        backgroundColor: getAlertColor(tech.alertLevel) + "20",
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "600", color: getAlertColor(tech.alertLevel) }}>
                        {getAlertLabel(tech.alertLevel)}
                      </Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={Colors.dark[500]}
                    />
                  </View>
                </View>

                {/* Expanded details */}
                {isExpanded && (
                  <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.dark[700], paddingTop: 12 }}>
                    {renderInventorySection(
                      tech.fixedInventory,
                      tech.fixedInventory?.entries,
                      "المخزون الثابت",
                      "lock-closed-outline"
                    )}
                    {renderInventorySection(
                      tech.movingInventory,
                      tech.movingInventory?.entries,
                      "المخزون المتحرك",
                      "swap-horizontal-outline"
                    )}
                    {(() => {
                      const fixedItems = buildDisplayItems(activeItemTypes, tech.fixedInventory?.entries, tech.fixedInventory);
                      const movingItems = buildDisplayItems(activeItemTypes, tech.movingInventory?.entries, tech.movingInventory);
                      if (fixedItems.length === 0 && movingItems.length === 0) {
                        return (
                          <Text style={{ fontSize: FontSize.sm, color: Colors.dark[500], textAlign: "center", paddingVertical: 12 }}>
                            لا يوجد مخزون مسجل
                          </Text>
                        );
                      }
                      return null;
                    })()}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
