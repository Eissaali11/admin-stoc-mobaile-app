/**
 * Operations Management - إدارة العمليات
 * View and manage warehouse transfers with batch actions
 */

import { useState, useCallback, useMemo } from "react";
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
import {
  useWarehouseTransfers,
  useItemTypes,
  useAcceptTransfer,
  useRejectTransfer,
} from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/ui/Loading";
import { ErrorView } from "@/components/ui/ErrorView";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { hasRoleOrAbove } from "@/lib/types";
import type { WarehouseTransfer, ItemType } from "@/lib/types";

export default function OperationsManagementScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "processed">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: transfers = [], isLoading, error, refetch } = useWarehouseTransfers();
  const { data: itemTypes = [] } = useItemTypes();
  const acceptMut = useAcceptTransfer();
  const rejectMut = useRejectTransfer();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, []);

  if (!user || !hasRoleOrAbove(user.role, "supervisor")) {
    return <ErrorView message="ليس لديك صلاحية الوصول" />;
  }

  if (isLoading && !refreshing) {
    return <Loading message="جاري تحميل العمليات..." />;
  }

  if (error && !transfers.length) {
    return <ErrorView message="تعذر تحميل العمليات" onRetry={() => refetch()} />;
  }

  const pending = transfers.filter((t: WarehouseTransfer) => t.status === "pending");
  const accepted = transfers.filter((t: WarehouseTransfer) => t.status === "accepted");
  const rejected = transfers.filter((t: WarehouseTransfer) => t.status === "rejected");
  const processed = [...accepted, ...rejected].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filtered = (activeTab === "pending" ? pending : processed).filter((t: WarehouseTransfer) =>
    (t.technicianName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.warehouseName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getItemName = (transfer: WarehouseTransfer) => {
    if (transfer.itemNameAr) return transfer.itemNameAr;
    const it = itemTypes.find((i: ItemType) => i.id === transfer.itemType);
    return it?.nameAr || transfer.itemType;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return Colors.warning;
      case "accepted": return Colors.success;
      case "rejected": return Colors.error;
      default: return Colors.dark[400];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "قيد الانتظار";
      case "accepted": return "مقبول";
      case "rejected": return "مرفوض";
      default: return status;
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const handleAccept = (id: string) => {
    Alert.alert("تأكيد القبول", "هل تريد قبول هذا التحويل؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "قبول",
        onPress: () => {
          acceptMut.mutate(id, {
            onSuccess: () => {
              refetch();
              Alert.alert("تم", "تم قبول التحويل بنجاح");
            },
            onError: () => Alert.alert("خطأ", "فشل قبول التحويل"),
          });
        },
      },
    ]);
  };

  const handleReject = () => {
    if (!selectedTransferId) return;
    rejectMut.mutate(
      { id: selectedTransferId, reason: rejectReason.trim() || undefined },
      {
        onSuccess: () => {
          setShowRejectModal(false);
          setSelectedTransferId(null);
          setRejectReason("");
          refetch();
          Alert.alert("تم", "تم رفض التحويل");
        },
        onError: () => Alert.alert("خطأ", "فشل رفض التحويل"),
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
          إدارة العمليات
        </Text>
        <Ionicons name="swap-horizontal" size={24} color={Colors.primary[500]} />
      </View>

      {/* Stats */}
      <View style={{ flexDirection: "row-reverse", gap: 8, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }}>
        <StatCard icon="time-outline" label="قيد الانتظار" value={pending.length} color={Colors.warning} />
        <StatCard icon="checkmark-circle" label="مقبول" value={accepted.length} color={Colors.success} />
        <StatCard icon="close-circle" label="مرفوض" value={rejected.length} color={Colors.error} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row-reverse", paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm }}>
        {(["pending", "processed"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: BorderRadius.md,
              backgroundColor: activeTab === tab ? Colors.primary[500] : Colors.dark[800],
              alignItems: "center",
              flexDirection: "row-reverse",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Ionicons
              name={tab === "pending" ? "hourglass-outline" : "checkmark-done-outline"}
              size={16}
              color={activeTab === tab ? Colors.white : Colors.dark[400]}
            />
            <Text
              style={{
                fontSize: FontSize.sm,
                fontWeight: "600",
                color: activeTab === tab ? Colors.white : Colors.dark[400],
              }}
            >
              {tab === "pending" ? `قيد الانتظار (${pending.length})` : `تمت المعالجة (${processed.length})`}
            </Text>
          </TouchableOpacity>
        ))}
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
          marginBottom: Spacing.sm,
        }}
      >
        <Ionicons name="search-outline" size={18} color={Colors.dark[400]} />
        <TextInput
          placeholder="بحث بالفني أو المستودع..."
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
          <EmptyState
            icon="swap-horizontal-outline"
            title={activeTab === "pending" ? "لا توجد عمليات معلقة" : "لا توجد عمليات"}
            subtitle="لم يتم العثور على نتائج"
          />
        ) : (
          filtered.map((transfer: WarehouseTransfer) => (
            <View
              key={transfer.id}
              style={{
                backgroundColor: Colors.dark[800],
                borderRadius: BorderRadius.lg,
                padding: Spacing.md,
                borderRightWidth: 3,
                borderRightColor: getStatusColor(transfer.status),
              }}
            >
              {/* Transfer header */}
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.md, fontWeight: "600", color: Colors.white, textAlign: "right" }}>
                    {getItemName(transfer)}
                  </Text>
                  <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400], textAlign: "right", marginTop: 2 }}>
                    {transfer.quantity} {transfer.packagingType === "box" ? "صندوق" : "وحدة"}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 10,
                    backgroundColor: getStatusColor(transfer.status) + "20",
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: "600", color: getStatusColor(transfer.status) }}>
                    {getStatusLabel(transfer.status)}
                  </Text>
                </View>
              </View>

              {/* Transfer details */}
              <View style={{ marginTop: 10, gap: 6 }}>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                  <Ionicons name="person-outline" size={14} color={Colors.dark[400]} />
                  <Text style={{ fontSize: FontSize.xs, color: Colors.dark[300] }}>
                    الفني: {transfer.technicianName || "غير محدد"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                  <Ionicons name="business-outline" size={14} color={Colors.dark[400]} />
                  <Text style={{ fontSize: FontSize.xs, color: Colors.dark[300] }}>
                    المستودع: {transfer.warehouseName || "غير محدد"}
                  </Text>
                </View>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                  <Ionicons name="calendar-outline" size={14} color={Colors.dark[400]} />
                  <Text style={{ fontSize: FontSize.xs, color: Colors.dark[300] }}>
                    {formatDate(transfer.createdAt)}
                  </Text>
                </View>
                {transfer.notes && (
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                    <Ionicons name="chatbox-outline" size={14} color={Colors.dark[400]} />
                    <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400] }}>{transfer.notes}</Text>
                  </View>
                )}
                {transfer.rejectionReason && (
                  <View
                    style={{
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: Colors.error + "15",
                      borderRadius: 8,
                      padding: 8,
                      marginTop: 4,
                    }}
                  >
                    <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                    <Text style={{ fontSize: FontSize.xs, color: Colors.error, flex: 1, textAlign: "right" }}>
                      سبب الرفض: {transfer.rejectionReason}
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions for pending */}
              {transfer.status === "pending" && (
                <View style={{ flexDirection: "row-reverse", gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleAccept(transfer.id)}
                    disabled={acceptMut.isPending}
                    style={{
                      flex: 1,
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      backgroundColor: Colors.success,
                      borderRadius: BorderRadius.md,
                      paddingVertical: 10,
                      opacity: acceptMut.isPending ? 0.6 : 1,
                    }}
                  >
                    <Ionicons name="checkmark-outline" size={18} color={Colors.white} />
                    <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: Colors.white }}>قبول</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedTransferId(transfer.id);
                      setShowRejectModal(true);
                    }}
                    style={{
                      flex: 1,
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      backgroundColor: Colors.error + "20",
                      borderRadius: BorderRadius.md,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: Colors.error,
                    }}
                  >
                    <Ionicons name="close-outline" size={18} color={Colors.error} />
                    <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: Colors.error }}>رفض</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={showRejectModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: Colors.dark[800], borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }}>
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: "bold", color: Colors.white }}>رفض التحويل</Text>
              <TouchableOpacity onPress={() => { setShowRejectModal(false); setRejectReason(""); }}>
                <Ionicons name="close-circle" size={28} color={Colors.dark[400]} />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="سبب الرفض (اختياري)"
              placeholderTextColor={Colors.dark[500]}
              value={rejectReason}
              onChangeText={setRejectReason}
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
              onPress={handleReject}
              disabled={rejectMut.isPending}
              style={{
                backgroundColor: Colors.error,
                borderRadius: BorderRadius.md,
                padding: 16,
                alignItems: "center",
                opacity: rejectMut.isPending ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: FontSize.md, fontWeight: "bold", color: Colors.white }}>
                {rejectMut.isPending ? "جاري الرفض..." : "تأكيد الرفض"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
