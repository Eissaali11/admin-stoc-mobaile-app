/**
 * Item Types Management - إدارة الأصناف
 * Create, update, toggle active, and manage item types
 */

import { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  Switch,
} from "react-native";
import { Text, TextInput } from "@/components/ui/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Spacing, FontSize, BorderRadius } from "@/lib/theme";
import { useItemTypes, useCreateItemType, useUpdateItemType } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/ui/Loading";
import { ErrorView } from "@/components/ui/ErrorView";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ItemType, ItemCategory } from "@/lib/types";

const CATEGORIES: { key: ItemCategory; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: "devices", label: "أجهزة", icon: "phone-portrait-outline", color: Colors.info },
  { key: "papers", label: "ورقيات", icon: "document-text-outline", color: Colors.warning },
  { key: "sim", label: "شرائح", icon: "card-outline", color: Colors.success },
  { key: "accessories", label: "إكسسوارات", icon: "build-outline", color: Colors.primary[500] },
];

export default function ItemTypesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create form
  const [newItem, setNewItem] = useState({
    nameAr: "",
    nameEn: "",
    category: "devices" as ItemCategory,
    unitsPerBox: "1",
  });

  // Edit
  const [editItem, setEditItem] = useState<ItemType | null>(null);

  const { data: itemTypes = [], isLoading, error, refetch } = useItemTypes();
  const createMut = useCreateItemType();
  const updateMut = useUpdateItemType();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  if (user?.role !== "admin") {
    return <ErrorView message="هذه الصفحة متاحة للمسؤولين فقط" />;
  }

  if (isLoading && !refreshing) {
    return <Loading message="جاري تحميل الأصناف..." />;
  }

  if (error && !itemTypes.length) {
    return <ErrorView message="تعذر تحميل الأصناف" onRetry={() => refetch()} />;
  }

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: itemTypes.length };
    CATEGORIES.forEach((c) => {
      counts[c.key] = itemTypes.filter((i: ItemType) => i.category === c.key).length;
    });
    return counts;
  }, [itemTypes]);

  const filtered = itemTypes
    .filter((i: ItemType) => selectedCategory === "all" || i.category === selectedCategory)
    .filter(
      (i: ItemType) =>
        i.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: ItemType, b: ItemType) => a.sortOrder - b.sortOrder);

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find((c) => c.key === category) || CATEGORIES[0];
  };

  const handleCreate = () => {
    if (!newItem.nameAr.trim() || !newItem.nameEn.trim()) {
      Alert.alert("خطأ", "يرجى ملء الاسم العربي والإنجليزي");
      return;
    }
    createMut.mutate(
      {
        nameAr: newItem.nameAr.trim(),
        nameEn: newItem.nameEn.trim(),
        category: newItem.category,
        unitsPerBox: parseInt(newItem.unitsPerBox) || 1,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setNewItem({ nameAr: "", nameEn: "", category: "devices", unitsPerBox: "1" });
          Alert.alert("تم", "تم إنشاء الصنف بنجاح");
        },
        onError: () => Alert.alert("خطأ", "فشل إنشاء الصنف"),
      }
    );
  };

  const handleToggleActive = (item: ItemType) => {
    updateMut.mutate(
      { id: item.id, isActive: !item.isActive },
      {
        onSuccess: () => refetch(),
        onError: () => Alert.alert("خطأ", "فشل تحديث الصنف"),
      }
    );
  };

  const handleUpdate = () => {
    if (!editItem) return;
    updateMut.mutate(
      {
        id: editItem.id,
        nameAr: editItem.nameAr,
        nameEn: editItem.nameEn,
        category: editItem.category,
        unitsPerBox: editItem.unitsPerBox,
        sortOrder: editItem.sortOrder,
      },
      {
        onSuccess: () => {
          setShowEdit(false);
          setEditItem(null);
          refetch();
          Alert.alert("تم", "تم تحديث الصنف بنجاح");
        },
        onError: () => Alert.alert("خطأ", "فشل تحديث الصنف"),
      }
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
          إدارة الأصناف
        </Text>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={{
            backgroundColor: Colors.primary[500],
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 8,
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Ionicons name="add-outline" size={18} color={Colors.white} />
          <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: Colors.white }}>إضافة</Text>
        </TouchableOpacity>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: 8, paddingBottom: 8 }}
        style={{ flexGrow: 0 }}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory("all")}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            backgroundColor: selectedCategory === "all" ? Colors.primary[500] : Colors.dark[800],
          }}
        >
          <Text style={{ fontSize: FontSize.sm, color: selectedCategory === "all" ? Colors.white : Colors.dark[400] }}>
            الكل ({categoryCounts.all})
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            onPress={() => setSelectedCategory(cat.key)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: selectedCategory === cat.key ? cat.color + "30" : Colors.dark[800],
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 6,
              borderWidth: selectedCategory === cat.key ? 1 : 0,
              borderColor: cat.color,
            }}
          >
            <Ionicons name={cat.icon} size={14} color={selectedCategory === cat.key ? cat.color : Colors.dark[400]} />
            <Text style={{ fontSize: FontSize.sm, color: selectedCategory === cat.key ? cat.color : Colors.dark[400] }}>
              {cat.label} ({categoryCounts[cat.key] || 0})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
          marginBottom: Spacing.sm,
        }}
      >
        <Ionicons name="search-outline" size={18} color={Colors.dark[400]} />
        <TextInput
          placeholder="بحث بالاسم..."
          placeholderTextColor={Colors.dark[500]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1, color: Colors.white, fontSize: FontSize.sm, paddingVertical: 12, textAlign: "right" }}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingBottom: 32, gap: 10 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} colors={[Colors.primary[500]]} />
        }
      >
        {filtered.length === 0 ? (
          <EmptyState icon="pricetags-outline" title="لا توجد أصناف" subtitle="أضف صنف جديد بالضغط على إضافة" />
        ) : (
          filtered.map((item: ItemType) => {
            const catInfo = getCategoryInfo(item.category);
            return (
              <View
                key={item.id}
                style={{
                  backgroundColor: Colors.dark[800],
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  opacity: item.isActive ? 1 : 0.55,
                  borderRightWidth: 3,
                  borderRightColor: catInfo.color,
                }}
              >
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                  {/* Icon */}
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: catInfo.color + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name={catInfo.icon} size={20} color={catInfo.color} />
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FontSize.md, fontWeight: "600", color: Colors.white, textAlign: "right" }}>
                      {item.nameAr}
                    </Text>
                    <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400], textAlign: "right" }}>
                      {item.nameEn}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={{ alignItems: "center", gap: 6 }}>
                    <Switch
                      value={item.isActive}
                      onValueChange={() => handleToggleActive(item)}
                      trackColor={{ false: Colors.dark[600], true: Colors.primary[500] + "50" }}
                      thumbColor={item.isActive ? Colors.primary[500] : Colors.dark[400]}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        setEditItem({ ...item });
                        setShowEdit(true);
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color={Colors.dark[400]} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Details row */}
                <View style={{ flexDirection: "row-reverse", gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.dark[700] }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                    <Ionicons name="grid-outline" size={12} color={Colors.dark[400]} />
                    <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400] }}>
                      {catInfo.label}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                    <Ionicons name="cube-outline" size={12} color={Colors.dark[400]} />
                    <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400] }}>
                      {item.unitsPerBox} وحدة/صندوق
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                    <Ionicons name="reorder-three-outline" size={12} color={Colors.dark[400]} />
                    <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400] }}>
                      ترتيب: {item.sortOrder}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ─── Create Item Type Modal ─── */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: Colors.dark[800], borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }}>
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: "bold", color: Colors.white }}>إضافة صنف جديد</Text>
              <TouchableOpacity onPress={() => setShowCreate(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.dark[400]} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="الاسم بالعربي *"
              placeholderTextColor={Colors.dark[500]}
              value={newItem.nameAr}
              onChangeText={(v) => setNewItem({ ...newItem, nameAr: v })}
              style={{
                backgroundColor: Colors.dark[700],
                borderRadius: BorderRadius.md,
                padding: 14,
                color: Colors.white,
                fontSize: FontSize.md,
                textAlign: "right",
              }}
            />
            <TextInput
              placeholder="Name in English *"
              placeholderTextColor={Colors.dark[500]}
              value={newItem.nameEn}
              onChangeText={(v) => setNewItem({ ...newItem, nameEn: v })}
              style={{
                backgroundColor: Colors.dark[700],
                borderRadius: BorderRadius.md,
                padding: 14,
                color: Colors.white,
                fontSize: FontSize.md,
                textAlign: "left",
              }}
            />
            <TextInput
              placeholder="وحدات لكل صندوق"
              placeholderTextColor={Colors.dark[500]}
              value={newItem.unitsPerBox}
              onChangeText={(v) => setNewItem({ ...newItem, unitsPerBox: v.replace(/[^0-9]/g, "") })}
              keyboardType="numeric"
              style={{
                backgroundColor: Colors.dark[700],
                borderRadius: BorderRadius.md,
                padding: 14,
                color: Colors.white,
                fontSize: FontSize.md,
                textAlign: "right",
              }}
            />

            {/* Category selector */}
            <Text style={{ fontSize: FontSize.sm, color: Colors.dark[300], textAlign: "right" }}>التصنيف:</Text>
            <View style={{ flexDirection: "row-reverse", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setNewItem({ ...newItem, category: cat.key })}
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: BorderRadius.md,
                    backgroundColor: newItem.category === cat.key ? cat.color + "30" : Colors.dark[700],
                    borderWidth: newItem.category === cat.key ? 1 : 0,
                    borderColor: cat.color,
                  }}
                >
                  <Ionicons name={cat.icon} size={16} color={newItem.category === cat.key ? cat.color : Colors.dark[400]} />
                  <Text style={{ fontSize: FontSize.sm, color: newItem.category === cat.key ? cat.color : Colors.dark[400] }}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
                {createMut.isPending ? "جاري الإنشاء..." : "إنشاء الصنف"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Edit Item Type Modal ─── */}
      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <ScrollView
            style={{ maxHeight: "85%" }}
            contentContainerStyle={{
              backgroundColor: Colors.dark[800],
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: "bold", color: Colors.white }}>تعديل الصنف</Text>
              <TouchableOpacity onPress={() => { setShowEdit(false); setEditItem(null); }}>
                <Ionicons name="close-circle" size={28} color={Colors.dark[400]} />
              </TouchableOpacity>
            </View>

            {editItem && (
              <>
                <TextInput
                  placeholder="الاسم بالعربي"
                  placeholderTextColor={Colors.dark[500]}
                  value={editItem.nameAr}
                  onChangeText={(v) => setEditItem({ ...editItem, nameAr: v })}
                  style={{
                    backgroundColor: Colors.dark[700],
                    borderRadius: BorderRadius.md,
                    padding: 14,
                    color: Colors.white,
                    fontSize: FontSize.md,
                    textAlign: "right",
                  }}
                />
                <TextInput
                  placeholder="Name in English"
                  placeholderTextColor={Colors.dark[500]}
                  value={editItem.nameEn}
                  onChangeText={(v) => setEditItem({ ...editItem, nameEn: v })}
                  style={{
                    backgroundColor: Colors.dark[700],
                    borderRadius: BorderRadius.md,
                    padding: 14,
                    color: Colors.white,
                    fontSize: FontSize.md,
                    textAlign: "left",
                  }}
                />
                <TextInput
                  placeholder="وحدات لكل صندوق"
                  placeholderTextColor={Colors.dark[500]}
                  value={String(editItem.unitsPerBox)}
                  onChangeText={(v) => setEditItem({ ...editItem, unitsPerBox: parseInt(v.replace(/[^0-9]/g, "")) || 1 })}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: Colors.dark[700],
                    borderRadius: BorderRadius.md,
                    padding: 14,
                    color: Colors.white,
                    fontSize: FontSize.md,
                    textAlign: "right",
                  }}
                />
                <TextInput
                  placeholder="ترتيب العرض"
                  placeholderTextColor={Colors.dark[500]}
                  value={String(editItem.sortOrder)}
                  onChangeText={(v) => setEditItem({ ...editItem, sortOrder: parseInt(v.replace(/[^0-9]/g, "")) || 0 })}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: Colors.dark[700],
                    borderRadius: BorderRadius.md,
                    padding: 14,
                    color: Colors.white,
                    fontSize: FontSize.md,
                    textAlign: "right",
                  }}
                />

                {/* Category selector */}
                <Text style={{ fontSize: FontSize.sm, color: Colors.dark[300], textAlign: "right" }}>التصنيف:</Text>
                <View style={{ flexDirection: "row-reverse", gap: 8, flexWrap: "wrap" }}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setEditItem({ ...editItem, category: cat.key })}
                      style={{
                        flexDirection: "row-reverse",
                        alignItems: "center",
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: BorderRadius.md,
                        backgroundColor: editItem.category === cat.key ? cat.color + "30" : Colors.dark[700],
                        borderWidth: editItem.category === cat.key ? 1 : 0,
                        borderColor: cat.color,
                      }}
                    >
                      <Ionicons name={cat.icon} size={16} color={editItem.category === cat.key ? cat.color : Colors.dark[400]} />
                      <Text style={{ fontSize: FontSize.sm, color: editItem.category === cat.key ? cat.color : Colors.dark[400] }}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleUpdate}
                  disabled={updateMut.isPending}
                  style={{
                    backgroundColor: Colors.primary[500],
                    borderRadius: BorderRadius.md,
                    padding: 16,
                    alignItems: "center",
                    opacity: updateMut.isPending ? 0.6 : 1,
                    marginBottom: 24,
                  }}
                >
                  <Text style={{ fontSize: FontSize.md, fontWeight: "bold", color: Colors.white }}>
                    {updateMut.isPending ? "جاري التحديث..." : "حفظ التعديلات"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
