/**
 * Operations History Screen
 * - Technician: See my requests + incoming transfers
 * - Supervisor: See requests to approve/reject + transfers
 * - Admin: See all requests + transfers
 */

import {
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { Text, TextInput } from "@/components/ui/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import {
  useMyInventoryRequests,
  useSupervisorInventoryRequests,
  useAllInventoryRequests,
  useWarehouseTransfers,
  useWarehouses,
  useApproveRequest,
  useRejectRequest,
  useAcceptTransfer,
  useRejectTransfer,
} from "@/lib/hooks";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import type { InventoryRequest, WarehouseTransfer, RequestStatus, TransferStatus, WarehouseWithStats } from "@/lib/types";
import { ITEM_DEFINITIONS } from "@/lib/types";
import { useState, useCallback, useMemo } from "react";

type TabKey = "requests" | "transfers";

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: Colors.warning + "20", text: Colors.warning, label: "قيد الانتظار" },
  approved: { bg: Colors.success + "20", text: Colors.success, label: "مقبول" },
  accepted: { bg: Colors.success + "20", text: Colors.success, label: "مقبول" },
  rejected: { bg: Colors.error + "20", text: Colors.error, label: "مرفوض" },
};

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("requests");
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === "admin";
  const isSupervisor = user?.role === "supervisor";
  const isTechnician = user?.role === "technician";

  // Requests query - role-based
  const myRequests = useMyInventoryRequests();
  const supervisorRequests = useSupervisorInventoryRequests();
  const allRequests = useAllInventoryRequests();

  const requestsQuery = isAdmin ? allRequests : isSupervisor ? supervisorRequests : myRequests;
  const requests = requestsQuery.data || [];

  // Transfers query
  const transfersQuery = useWarehouseTransfers();
  const transfers = transfersQuery.data || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([requestsQuery.refetch(), transfersQuery.refetch()]);
    setRefreshing(false);
  }, []);

  const sortedRequests = useMemo(
    () => [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [requests]
  );

  const sortedTransfers = useMemo(
    () => [...transfers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [transfers]
  );

  const isLoading = requestsQuery.isLoading || transfersQuery.isLoading;

  if (isLoading && !refreshing) {
    return <Loading message="جاري تحميل العمليات..." />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark[900] }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: "bold", color: Colors.white, textAlign: "right" }}>
          سجل العمليات
        </Text>
        <TouchableOpacity onPress={() => router.push("/operations/create")}>
          <Ionicons name="add-circle-outline" size={24} color={Colors.primary[500]} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row-reverse", paddingHorizontal: 16, gap: 8, marginBottom: 8 }}>
        <TabButton
          label="الطلبات"
          count={requests.filter((r) => r.status === "pending").length}
          active={activeTab === "requests"}
          onPress={() => setActiveTab("requests")}
        />
        <TabButton
          label="التحويلات"
          count={transfers.filter((t) => t.status === "pending").length}
          active={activeTab === "transfers"}
          onPress={() => setActiveTab("transfers")}
        />
      </View>

      {activeTab === "requests" ? (
        <FlatList
          data={sortedRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} colors={[Colors.primary[500]]} />
          }
          ListEmptyComponent={<EmptyState icon="document-text-outline" title="لا توجد طلبات" />}
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              canApprove={(isSupervisor || isAdmin) && item.status === "pending"}
            />
          )}
        />
      ) : (
        <FlatList
          data={sortedTransfers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} colors={[Colors.primary[500]]} />
          }
          ListEmptyComponent={<EmptyState icon="swap-horizontal-outline" title="لا توجد تحويلات" />}
          renderItem={({ item }) => (
            <TransferCard
              transfer={item}
              canRespond={isTechnician && item.status === "pending"}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Tab Button ───
function TabButton({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: active ? Colors.primary[500] + "20" : Colors.dark[800],
        borderWidth: 1,
        borderColor: active ? Colors.primary[500] : Colors.dark[700],
        borderRadius: 12,
        paddingVertical: 10,
        flexDirection: "row-reverse",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Text style={{ color: active ? Colors.primary[400] : Colors.dark[400], fontSize: 14, fontWeight: "600" }}>
        {label}
      </Text>
      {count > 0 && (
        <View
          style={{
            backgroundColor: Colors.warning,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 6,
          }}
        >
          <Text style={{ color: Colors.white, fontSize: 11, fontWeight: "bold" }}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Request Card ───
function RequestCard({ request, canApprove }: { request: InventoryRequest; canApprove: boolean }) {
  const { data: warehouses } = useWarehouses();
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const statusInfo = STATUS_COLORS[request.status] || STATUS_COLORS.pending;

  // Gather requested items
  const requestedItems = useMemo(() => {
    const items: { name: string; boxes: number; units: number }[] = [];
    for (const def of ITEM_DEFINITIONS) {
      const boxes = (request as any)[`${def.key}Boxes`] || 0;
      const units = (request as any)[`${def.key}Units`] || 0;
      if (boxes > 0 || units > 0) {
        items.push({ name: def.nameAr, boxes, units });
      }
    }
    return items;
  }, [request]);

  const formattedDate = new Date(request.createdAt).toLocaleDateString("ar-SA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View style={{ backgroundColor: Colors.dark[800], borderRadius: 14, overflow: "hidden" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 14,
          borderBottomWidth: 1,
          borderBottomColor: Colors.dark[700],
        }}
      >
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
          <Ionicons name="document-text-outline" size={16} color={Colors.primary[400]} />
          <Text style={{ color: Colors.dark[400], fontSize: 12 }}>{formattedDate}</Text>
        </View>
        <View style={{ backgroundColor: statusInfo.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ color: statusInfo.text, fontSize: 11, fontWeight: "600" }}>{statusInfo.label}</Text>
        </View>
      </View>

      {/* Items summary */}
      <View style={{ padding: 14, gap: 6 }}>
        {requestedItems.map((item, idx) => (
          <View key={idx} style={{ flexDirection: "row-reverse", justifyContent: "space-between" }}>
            <Text style={{ color: Colors.white, fontSize: 13 }}>{item.name}</Text>
            <Text style={{ color: Colors.dark[400], fontSize: 12 }}>
              {item.boxes > 0 ? `${item.boxes} صندوق` : ""}{item.boxes > 0 && item.units > 0 ? " · " : ""}{item.units > 0 ? `${item.units} وحدة` : ""}
            </Text>
          </View>
        ))}
        {request.notes && (
          <Text style={{ color: Colors.dark[400], fontSize: 12, textAlign: "right", marginTop: 4 }}>
            📝 {request.notes}
          </Text>
        )}
        {request.adminNotes && (
          <Text style={{ color: Colors.info, fontSize: 12, textAlign: "right", marginTop: 4 }}>
            💬 {request.adminNotes}
          </Text>
        )}
      </View>

      {/* Actions for supervisor */}
      {canApprove && (
        <View
          style={{
            flexDirection: "row-reverse",
            borderTopWidth: 1,
            borderTopColor: Colors.dark[700],
            padding: 10,
            gap: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setShowApproveModal(true)}
            disabled={approveMutation.isPending}
            style={{
              flex: 1,
              backgroundColor: Colors.success,
              borderRadius: 10,
              paddingVertical: 10,
              flexDirection: "row-reverse",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
            }}
          >
            {approveMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                <Text style={{ color: Colors.white, fontSize: 13, fontWeight: "600" }}>موافقة</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowRejectModal(true)}
            disabled={rejectMutation.isPending}
            style={{
              flex: 1,
              backgroundColor: Colors.error + "20",
              borderRadius: 10,
              paddingVertical: 10,
              flexDirection: "row-reverse",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
            }}
          >
            {rejectMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle" size={16} color={Colors.error} />
                <Text style={{ color: Colors.error, fontSize: 13, fontWeight: "600" }}>رفض</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Approve Modal */}
      <ApproveModal
        visible={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        warehouses={warehouses || []}
        isPending={approveMutation.isPending}
        onApprove={async (warehouseId, adminNotes) => {
          try {
            await approveMutation.mutateAsync({ id: request.id, warehouseId, adminNotes });
            setShowApproveModal(false);
            Alert.alert("تم ✓", "تمت الموافقة على الطلب");
          } catch (err: any) {
            Alert.alert("خطأ", err?.response?.data?.message || "فشل في الموافقة");
          }
        }}
      />

      {/* Reject Modal */}
      <RejectModal
        visible={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        isPending={rejectMutation.isPending}
        onReject={async (adminNotes) => {
          try {
            await rejectMutation.mutateAsync({ id: request.id, adminNotes });
            setShowRejectModal(false);
            Alert.alert("تم", "تم رفض الطلب");
          } catch (err: any) {
            Alert.alert("خطأ", err?.response?.data?.message || "فشل في الرفض");
          }
        }}
      />
    </View>
  );
}

// ─── Transfer Card ───
function TransferCard({ transfer, canRespond }: { transfer: WarehouseTransfer; canRespond: boolean }) {
  const acceptMutation = useAcceptTransfer();
  const rejectMutation = useRejectTransfer();

  const statusInfo = STATUS_COLORS[transfer.status] || STATUS_COLORS.pending;
  const itemDef = ITEM_DEFINITIONS.find((d) => d.key === transfer.itemType);

  const formattedDate = new Date(transfer.createdAt).toLocaleDateString("ar-SA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleAccept = () => {
    Alert.alert("تأكيد القبول", "هل تريد قبول هذا التحويل؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "قبول",
        onPress: async () => {
          try {
            await acceptMutation.mutateAsync(transfer.id);
            Alert.alert("تم ✓", "تم قبول التحويل");
          } catch (err: any) {
            Alert.alert("خطأ", err?.response?.data?.message || "فشل في القبول");
          }
        },
      },
    ]);
  };

  const handleReject = () => {
    Alert.prompt?.(
      "سبب الرفض",
      "أدخل سبب رفض التحويل",
      async (reason: string) => {
        try {
          await rejectMutation.mutateAsync({ id: transfer.id, reason });
          Alert.alert("تم", "تم رفض التحويل");
        } catch (err: any) {
          Alert.alert("خطأ", err?.response?.data?.message || "فشل في الرفض");
        }
      }
    ) ??
      Alert.alert("رفض التحويل", "هل تريد رفض هذا التحويل؟", [
        { text: "إلغاء", style: "cancel" },
        {
          text: "رفض",
          style: "destructive",
          onPress: async () => {
            try {
              await rejectMutation.mutateAsync({ id: transfer.id });
              Alert.alert("تم", "تم رفض التحويل");
            } catch (err: any) {
              Alert.alert("خطأ", err?.response?.data?.message || "فشل في الرفض");
            }
          },
        },
      ]);
  };

  return (
    <View style={{ backgroundColor: Colors.dark[800], borderRadius: 14, padding: 14, gap: 8 }}>
      <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
          <Ionicons name="swap-horizontal" size={16} color={Colors.info} />
          <Text style={{ color: Colors.white, fontSize: 14, fontWeight: "600" }}>
            {itemDef?.nameAr || transfer.itemType}
          </Text>
        </View>
        <View style={{ backgroundColor: statusInfo.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ color: statusInfo.text, fontSize: 11, fontWeight: "600" }}>{statusInfo.label}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row-reverse", gap: 16 }}>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: Colors.dark[500], fontSize: 11 }}>الكمية</Text>
          <Text style={{ color: Colors.white, fontSize: 16, fontWeight: "bold" }}>
            {transfer.quantity}{" "}
            <Text style={{ fontSize: 11, color: Colors.dark[400] }}>
              {transfer.packagingType === "box" ? "صندوق" : "وحدة"}
            </Text>
          </Text>
        </View>
        {transfer.warehouseName && (
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: Colors.dark[500], fontSize: 11 }}>من</Text>
            <Text style={{ color: Colors.dark[300], fontSize: 12 }}>{transfer.warehouseName}</Text>
          </View>
        )}
        {transfer.technicianName && (
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: Colors.dark[500], fontSize: 11 }}>إلى</Text>
            <Text style={{ color: Colors.dark[300], fontSize: 12 }}>{transfer.technicianName}</Text>
          </View>
        )}
      </View>

      <Text style={{ color: Colors.dark[500], fontSize: 11, textAlign: "right" }}>{formattedDate}</Text>

      {transfer.notes && (
        <Text style={{ color: Colors.dark[400], fontSize: 12, textAlign: "right" }}>📝 {transfer.notes}</Text>
      )}

      {transfer.rejectionReason && (
        <Text style={{ color: Colors.error, fontSize: 12, textAlign: "right" }}>
          سبب الرفض: {transfer.rejectionReason}
        </Text>
      )}

      {/* Actions for technician */}
      {canRespond && (
        <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 4 }}>
          <TouchableOpacity
            onPress={handleAccept}
            disabled={acceptMutation.isPending}
            style={{
              flex: 1,
              backgroundColor: Colors.success,
              borderRadius: 10,
              paddingVertical: 10,
              flexDirection: "row-reverse",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
            }}
          >
            {acceptMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color={Colors.white} />
                <Text style={{ color: Colors.white, fontSize: 13, fontWeight: "600" }}>قبول</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleReject}
            disabled={rejectMutation.isPending}
            style={{
              flex: 1,
              backgroundColor: Colors.error + "20",
              borderRadius: 10,
              paddingVertical: 10,
              flexDirection: "row-reverse",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
            }}
          >
            {rejectMutation.isPending ? (
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <>
                <Ionicons name="close-circle" size={16} color={Colors.error} />
                <Text style={{ color: Colors.error, fontSize: 13, fontWeight: "600" }}>رفض</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Approve Modal ───
function ApproveModal({
  visible,
  onClose,
  warehouses,
  isPending,
  onApprove,
}: {
  visible: boolean;
  onClose: () => void;
  warehouses: WarehouseWithStats[];
  isPending: boolean;
  onApprove: (warehouseId: string, adminNotes?: string) => void;
}) {
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 }} onPress={onClose}>
        <Pressable
          style={{
            backgroundColor: Colors.dark[800],
            borderRadius: 20,
            padding: 20,
          }}
          onPress={() => {}}
        >
          <Text style={{ color: Colors.white, fontSize: 17, fontWeight: "bold", textAlign: "right", marginBottom: 16 }}>
            موافقة على الطلب
          </Text>

          <Text style={{ color: Colors.dark[300], fontSize: 13, textAlign: "right", marginBottom: 8 }}>
            المستودع المصدر *
          </Text>
          {warehouses.map((wh) => (
            <TouchableOpacity
              key={wh.id}
              onPress={() => setSelectedWarehouse(wh.id)}
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: selectedWarehouse === wh.id ? Colors.primary[500] + "20" : Colors.dark[700],
                borderRadius: 10,
                marginBottom: 6,
                borderWidth: 1,
                borderColor: selectedWarehouse === wh.id ? Colors.primary[500] : Colors.dark[600],
                gap: 8,
              }}
            >
              <Text style={{ color: Colors.white, fontSize: 13, flex: 1, textAlign: "right" }}>{wh.name}</Text>
              {selectedWarehouse === wh.id && <Ionicons name="checkmark-circle" size={18} color={Colors.primary[500]} />}
            </TouchableOpacity>
          ))}

          <Text style={{ color: Colors.dark[300], fontSize: 13, textAlign: "right", marginTop: 12, marginBottom: 8 }}>
            ملاحظات (اختياري)
          </Text>
          <TextInput
            style={{
              backgroundColor: Colors.dark[700],
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: Colors.white,
              fontSize: 13,
              textAlign: "right",
            }}
            placeholder="ملاحظات..."
            placeholderTextColor={Colors.dark[500]}
            value={adminNotes}
            onChangeText={setAdminNotes}
          />

          <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => {
                if (!selectedWarehouse) {
                  Alert.alert("تنبيه", "يرجى اختيار المستودع");
                  return;
                }
                onApprove(selectedWarehouse, adminNotes.trim() || undefined);
              }}
              disabled={isPending || !selectedWarehouse}
              style={{
                flex: 1,
                backgroundColor: Colors.success,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: "center",
                opacity: !selectedWarehouse ? 0.5 : 1,
              }}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={{ color: Colors.white, fontSize: 14, fontWeight: "600" }}>تأكيد الموافقة</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: Colors.dark[700],
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: Colors.dark[300], fontSize: 14 }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Reject Modal ───
function RejectModal({
  visible,
  onClose,
  isPending,
  onReject,
}: {
  visible: boolean;
  onClose: () => void;
  isPending: boolean;
  onReject: (adminNotes: string) => void;
}) {
  const [adminNotes, setAdminNotes] = useState("");

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 24 }} onPress={onClose}>
        <Pressable
          style={{ backgroundColor: Colors.dark[800], borderRadius: 20, padding: 20 }}
          onPress={() => {}}
        >
          <Text style={{ color: Colors.white, fontSize: 17, fontWeight: "bold", textAlign: "right", marginBottom: 16 }}>
            رفض الطلب
          </Text>

          <Text style={{ color: Colors.dark[300], fontSize: 13, textAlign: "right", marginBottom: 8 }}>
            سبب الرفض *
          </Text>
          <TextInput
            style={{
              backgroundColor: Colors.dark[700],
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              color: Colors.white,
              fontSize: 13,
              textAlign: "right",
              minHeight: 80,
            }}
            placeholder="أدخل سبب الرفض..."
            placeholderTextColor={Colors.dark[500]}
            value={adminNotes}
            onChangeText={setAdminNotes}
            multiline
            textAlignVertical="top"
          />

          <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 16 }}>
            <TouchableOpacity
              onPress={() => {
                if (!adminNotes.trim()) {
                  Alert.alert("تنبيه", "سبب الرفض مطلوب");
                  return;
                }
                onReject(adminNotes.trim());
              }}
              disabled={isPending || !adminNotes.trim()}
              style={{
                flex: 1,
                backgroundColor: Colors.error,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: "center",
                opacity: !adminNotes.trim() ? 0.5 : 1,
              }}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={{ color: Colors.white, fontSize: 14, fontWeight: "600" }}>تأكيد الرفض</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                backgroundColor: Colors.dark[700],
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: Colors.dark[300], fontSize: 14 }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
