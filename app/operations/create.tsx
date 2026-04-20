/**
 * Create Operation Screen
 * - Technician: Submit inventory request
 * - Supervisor: Create warehouse transfer to technician
 * - Admin/All: Add/Withdraw stock from inventory
 */

import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { Text, TextInput } from "@/components/ui/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import {
  useTechnicians,
  useWarehouses,
  useInventory,
  useCreateInventoryRequest,
  useCreateWarehouseTransfer,
  useAddStock,
  useWithdrawStock,
  useStockTransfer,
  useMyFixedInventory,
} from "@/lib/hooks";
import { ITEM_DEFINITIONS } from "@/lib/types";
import type { User, WarehouseWithStats, InventoryItemWithStatus } from "@/lib/types";
import { useState, useMemo } from "react";

type OperationType = "request" | "transfer" | "add" | "withdraw" | "stockTransfer";

interface OperationOption {
  type: OperationType;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  roles: string[];
}

const OPERATIONS: OperationOption[] = [
  {
    type: "request",
    label: "طلب مخزون",
    desc: "إرسال طلب للمشرف للحصول على مخزون",
    icon: "document-text-outline",
    color: Colors.primary[500],
    roles: ["technician", "supervisor"],
  },
  {
    type: "transfer",
    label: "تحويل من المستودع",
    desc: "نقل مخزون من المستودع إلى فني",
    icon: "swap-horizontal-outline",
    color: Colors.info,
    roles: ["supervisor", "admin"],
  },
  {
    type: "add",
    label: "إضافة للمخزون",
    desc: "إضافة كمية لعنصر مخزون",
    icon: "add-circle-outline",
    color: Colors.success,
    roles: ["admin", "supervisor", "technician"],
  },
  {
    type: "withdraw",
    label: "سحب من المخزون",
    desc: "سحب كمية من عنصر مخزون",
    icon: "remove-circle-outline",
    color: Colors.error,
    roles: ["admin", "supervisor", "technician"],
  },
  {
    type: "stockTransfer",
    label: "نقل مفرد",
    desc: "نقل أصناف من المخزون الثابت إلى المتحرك",
    icon: "arrow-undo-outline",
    color: "#9333ea",
    roles: ["technician", "supervisor", "admin"],
  },
];

export default function CreateOperationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedOp, setSelectedOp] = useState<OperationType | null>(null);

  const availableOps = OPERATIONS.filter((op) =>
    op.roles.includes(user?.role || "")
  );

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
          {selectedOp ? OPERATIONS.find((o) => o.type === selectedOp)?.label : "إجراء عملية"}
        </Text>
        {selectedOp && (
          <TouchableOpacity onPress={() => setSelectedOp(null)}>
            <Text style={{ color: Colors.primary[400], fontSize: 14 }}>تغيير</Text>
          </TouchableOpacity>
        )}
      </View>

      {!selectedOp ? (
        <OperationPicker operations={availableOps} onSelect={setSelectedOp} />
      ) : selectedOp === "request" ? (
        <InventoryRequestForm />
      ) : selectedOp === "transfer" ? (
        <WarehouseTransferForm />
      ) : selectedOp === "stockTransfer" ? (
        <StockTransferForm />
      ) : (
        <StockForm type={selectedOp} />
      )}
    </SafeAreaView>
  );
}

// ─── Operation Type Picker ───
function OperationPicker({
  operations,
  onSelect,
}: {
  operations: OperationOption[];
  onSelect: (type: OperationType) => void;
}) {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ color: Colors.dark[400], fontSize: 14, textAlign: "right", marginBottom: 4 }}>
        اختر نوع العملية
      </Text>
      {operations.map((op) => (
        <TouchableOpacity
          key={op.type}
          activeOpacity={0.7}
          onPress={() => onSelect(op.type)}
          style={{
            backgroundColor: Colors.dark[800],
            borderRadius: 14,
            padding: 16,
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 14,
            borderRightWidth: 3,
            borderRightColor: op.color,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: op.color + "20",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name={op.icon} size={22} color={op.color} />
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={{ color: Colors.white, fontSize: 16, fontWeight: "600" }}>
              {op.label}
            </Text>
            <Text style={{ color: Colors.dark[400], fontSize: 12, marginTop: 2 }}>
              {op.desc}
            </Text>
          </View>
          <Ionicons name="chevron-back" size={20} color={Colors.dark[500]} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Inventory Request Form (Technician/Supervisor) ───
function InventoryRequestForm() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateInventoryRequest();
  const { data: warehouses } = useWarehouses();
  const [quantities, setQuantities] = useState<Record<string, { boxes: number; units: number }>>({});
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);

  const hasItems = Object.values(quantities).some((q) => q.boxes > 0 || q.units > 0);

  const updateQty = (key: string, field: "boxes" | "units", val: string) => {
    const num = parseInt(val) || 0;
    setQuantities((prev) => ({
      ...prev,
      [key]: { ...prev[key], boxes: prev[key]?.boxes || 0, units: prev[key]?.units || 0, [field]: Math.max(0, num) },
    }));
  };

  const handleSubmit = async () => {
    if (!hasItems) {
      Alert.alert("تنبيه", "يرجى إضافة كمية واحدة على الأقل");
      return;
    }

    const body: Record<string, any> = {};
    for (const [key, val] of Object.entries(quantities)) {
      if (val.boxes > 0) body[`${key}Boxes`] = val.boxes;
      if (val.units > 0) body[`${key}Units`] = val.units;
    }
    if (selectedWarehouse) body.warehouseId = selectedWarehouse;
    if (notes.trim()) body.notes = notes.trim();

    try {
      await mutateAsync(body);
      Alert.alert("تم بنجاح ✓", "تم إرسال طلب المخزون للمشرف", [
        { text: "حسناً", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("خطأ", err?.response?.data?.message || "فشل في إرسال الطلب");
    }
  };

  const selectedWh = warehouses?.find((w) => w.id === selectedWarehouse);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      {/* Warehouse selector (optional) */}
      <View>
        <Text style={styles.sectionLabel}>المستودع (اختياري)</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowWarehousePicker(true)}
        >
          <Text style={{ color: selectedWh ? Colors.white : Colors.dark[500], fontSize: 14, flex: 1, textAlign: "right" }}>
            {selectedWh?.name || "اختر المستودع"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={Colors.dark[400]} />
        </TouchableOpacity>
      </View>

      {/* Item quantities */}
      <Text style={styles.sectionLabel}>الكميات المطلوبة</Text>
      {ITEM_DEFINITIONS.map((item) => (
        <ItemQuantityRow
          key={item.key}
          item={item}
          boxes={quantities[item.key]?.boxes || 0}
          units={quantities[item.key]?.units || 0}
          onBoxesChange={(v) => updateQty(item.key, "boxes", v)}
          onUnitsChange={(v) => updateQty(item.key, "units", v)}
        />
      ))}

      {/* Notes */}
      <View>
        <Text style={styles.sectionLabel}>ملاحظات</Text>
        <TextInput
          style={styles.textArea}
          placeholder="أضف ملاحظات للطلب..."
          placeholderTextColor={Colors.dark[500]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, !hasItems && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={isPending || !hasItems}
        activeOpacity={0.8}
      >
        {isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="send-outline" size={18} color={Colors.white} />
            <Text style={styles.submitText}>إرسال الطلب</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Warehouse Picker Modal */}
      <SearchablePickerModal
        visible={showWarehousePicker}
        onClose={() => setShowWarehousePicker(false)}
        title="اختر المستودع"
        data={(warehouses || []).map((w) => ({ id: w.id, label: w.name, sub: w.location }))}
        onSelect={(id) => { setSelectedWarehouse(id); setShowWarehousePicker(false); }}
        selected={selectedWarehouse}
      />
    </ScrollView>
  );
}

// ─── Warehouse Transfer Form (Supervisor/Admin) ───
function WarehouseTransferForm() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateWarehouseTransfer();
  const { data: warehouses } = useWarehouses();
  const { data: technicians } = useTechnicians();
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedTech, setSelectedTech] = useState("");
  const [showWarehousePicker, setShowWarehousePicker] = useState(false);
  const [showTechPicker, setShowTechPicker] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, { qty: number; packaging: "box" | "unit" }>>({});
  const [notes, setNotes] = useState("");

  const hasItems = Object.values(quantities).some((q) => q.qty > 0);
  const isValid = selectedWarehouse && selectedTech && hasItems;

  const updateQty = (key: string, val: string) => {
    const num = parseInt(val) || 0;
    setQuantities((prev) => ({
      ...prev,
      [key]: { qty: Math.max(0, num), packaging: prev[key]?.packaging || "box" },
    }));
  };

  const togglePackaging = (key: string) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: {
        qty: prev[key]?.qty || 0,
        packaging: prev[key]?.packaging === "box" ? "unit" : "box",
      },
    }));
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    const body: Record<string, any> = {
      warehouseId: selectedWarehouse,
      technicianId: selectedTech,
    };
    if (notes.trim()) body.notes = notes.trim();

    for (const [key, val] of Object.entries(quantities)) {
      if (val.qty > 0) {
        body[key] = val.qty;
        body[`${key}PackagingType`] = val.packaging;
      }
    }

    try {
      await mutateAsync(body as any);
      Alert.alert("تم بنجاح ✓", "تم إنشاء عملية التحويل", [
        { text: "حسناً", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("خطأ", err?.response?.data?.message || "فشل في إنشاء التحويل");
    }
  };

  const selectedWhObj = warehouses?.find((w) => w.id === selectedWarehouse);
  const selectedTechObj = technicians?.find((t) => t.id === selectedTech);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      {/* Warehouse selector */}
      <View>
        <Text style={styles.sectionLabel}>المستودع *</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setShowWarehousePicker(true)}>
          <Text style={{ color: selectedWhObj ? Colors.white : Colors.dark[500], fontSize: 14, flex: 1, textAlign: "right" }}>
            {selectedWhObj?.name || "اختر المستودع"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={Colors.dark[400]} />
        </TouchableOpacity>
      </View>

      {/* Technician selector */}
      <View>
        <Text style={styles.sectionLabel}>الفني المستهدف *</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setShowTechPicker(true)}>
          <Text style={{ color: selectedTechObj ? Colors.white : Colors.dark[500], fontSize: 14, flex: 1, textAlign: "right" }}>
            {selectedTechObj ? `${selectedTechObj.fullName} (${selectedTechObj.city || "—"})` : "اختر الفني"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={Colors.dark[400]} />
        </TouchableOpacity>
      </View>

      {/* Item quantities with packaging type */}
      <Text style={styles.sectionLabel}>الأصناف والكميات</Text>
      {ITEM_DEFINITIONS.map((item) => (
        <TransferItemRow
          key={item.key}
          item={item}
          qty={quantities[item.key]?.qty || 0}
          packaging={quantities[item.key]?.packaging || "box"}
          onQtyChange={(v) => updateQty(item.key, v)}
          onTogglePackaging={() => togglePackaging(item.key)}
        />
      ))}

      {/* Notes */}
      <View>
        <Text style={styles.sectionLabel}>ملاحظات</Text>
        <TextInput
          style={styles.textArea}
          placeholder="ملاحظات اختيارية..."
          placeholderTextColor={Colors.dark[500]}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={isPending || !isValid}
        activeOpacity={0.8}
      >
        {isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="swap-horizontal" size={18} color={Colors.white} />
            <Text style={styles.submitText}>تنفيذ التحويل</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Picker Modals */}
      <SearchablePickerModal
        visible={showWarehousePicker}
        onClose={() => setShowWarehousePicker(false)}
        title="اختر المستودع"
        data={(warehouses || []).map((w) => ({ id: w.id, label: w.name, sub: w.location }))}
        onSelect={(id) => { setSelectedWarehouse(id); setShowWarehousePicker(false); }}
        selected={selectedWarehouse}
      />
      <SearchablePickerModal
        visible={showTechPicker}
        onClose={() => setShowTechPicker(false)}
        title="اختر الفني"
        data={(technicians || []).filter((t) => t.role === "technician").map((t) => ({
          id: t.id,
          label: t.fullName,
          sub: t.city || t.username,
        }))}
        onSelect={(id) => { setSelectedTech(id); setShowTechPicker(false); }}
        selected={selectedTech}
      />
    </ScrollView>
  );
}

// ─── Add/Withdraw Stock Form ───
function StockForm({ type }: { type: "add" | "withdraw" }) {
  const router = useRouter();
  const { data: items, isLoading } = useInventory();
  const addMutation = useAddStock();
  const withdrawMutation = useWithdrawStock();
  const mutation = type === "add" ? addMutation : withdrawMutation;
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithStatus | null>(null);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const isAdd = type === "add";
  const qtyNum = parseInt(quantity) || 0;
  const isValid = selectedItem && qtyNum > 0;
  const exceedsStock = !isAdd && selectedItem && qtyNum > selectedItem.quantity;

  const handleSubmit = async () => {
    if (!isValid || !selectedItem) return;
    if (exceedsStock) {
      Alert.alert("تنبيه", `الكمية المطلوبة (${qtyNum}) تتجاوز المخزون المتاح (${selectedItem.quantity})`);
      return;
    }

    try {
      await mutation.mutateAsync({
        itemId: selectedItem.id,
        quantity: qtyNum,
        reason: reason.trim() || undefined,
      });
      Alert.alert(
        "تم بنجاح ✓",
        isAdd ? `تم إضافة ${qtyNum} ${selectedItem.unit} إلى ${selectedItem.name}` : `تم سحب ${qtyNum} ${selectedItem.unit} من ${selectedItem.name}`,
        [{ text: "حسناً", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("خطأ", err?.response?.data?.message || "فشل في تنفيذ العملية");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      {/* Item selector */}
      <View>
        <Text style={styles.sectionLabel}>العنصر *</Text>
        <TouchableOpacity style={styles.selector} onPress={() => setShowItemPicker(true)}>
          <Text style={{ color: selectedItem ? Colors.white : Colors.dark[500], fontSize: 14, flex: 1, textAlign: "right" }}>
            {selectedItem ? `${selectedItem.name} (${selectedItem.quantity} ${selectedItem.unit})` : "اختر العنصر"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={Colors.dark[400]} />
        </TouchableOpacity>
      </View>

      {/* Quantity */}
      <View>
        <Text style={styles.sectionLabel}>الكمية *</Text>
        <View style={{ flexDirection: "row-reverse", gap: 10, alignItems: "center" }}>
          <TextInput
            style={[styles.input, { flex: 1 }, exceedsStock && { borderColor: Colors.error, borderWidth: 1 }]}
            placeholder="0"
            placeholderTextColor={Colors.dark[500]}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
          />
          {selectedItem && (
            <Text style={{ color: Colors.dark[400], fontSize: 12 }}>
              المتاح: {selectedItem.quantity} {selectedItem.unit}
            </Text>
          )}
        </View>
        {exceedsStock && (
          <Text style={{ color: Colors.error, fontSize: 12, textAlign: "right", marginTop: 4 }}>
            الكمية تتجاوز المخزون المتاح
          </Text>
        )}
      </View>

      {/* Reason */}
      <View>
        <Text style={styles.sectionLabel}>السبب</Text>
        <TextInput
          style={styles.textArea}
          placeholder="سبب العملية (اختياري)..."
          placeholderTextColor={Colors.dark[500]}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          { backgroundColor: isAdd ? Colors.success : Colors.error },
          (!isValid || !!exceedsStock) && styles.submitBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={mutation.isPending || !isValid || !!exceedsStock}
        activeOpacity={0.8}
      >
        {mutation.isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name={isAdd ? "add-circle" : "remove-circle"} size={18} color={Colors.white} />
            <Text style={styles.submitText}>{isAdd ? "إضافة" : "سحب"}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Item Picker Modal */}
      <SearchablePickerModal
        visible={showItemPicker}
        onClose={() => setShowItemPicker(false)}
        title="اختر العنصر"
        data={(items || []).map((i) => ({ id: i.id, label: i.name, sub: `${i.quantity} ${i.unit} · ${i.regionName}` }))}
        onSelect={(id) => {
          const item = items?.find((i) => i.id === id);
          if (item) setSelectedItem(item);
          setShowItemPicker(false);
        }}
        selected={selectedItem?.id || ""}
      />
    </ScrollView>
  );
}

// ─── Stock Transfer Form (Fixed → Moving) ───
function StockTransferForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { mutateAsync, isPending } = useStockTransfer();
  const { data: fixedInventory } = useMyFixedInventory();
  const { data: technicians } = useTechnicians();
  const [selectedTech, setSelectedTech] = useState(user?.id || "");
  const [showTechPicker, setShowTechPicker] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, { qty: number; packaging: "box" | "unit" }>>({});

  const isAdmin = user?.role === "admin" || user?.role === "supervisor";
  const technicianId = isAdmin ? selectedTech : (user?.id || "");

  const hasItems = Object.values(quantities).some((q) => q.qty > 0);
  const isValid = technicianId && hasItems;

  const getAvailable = (key: string, packaging: "box" | "unit") => {
    if (!fixedInventory) return 0;
    const fieldKey = key === "newBatteries" ? key : key;
    const suffix = packaging === "box" ? "Boxes" : "Units";
    const fieldName = `${fieldKey}${suffix}`;
    return (fixedInventory as any)[fieldName] || 0;
  };

  const updateQty = (key: string, val: string) => {
    const num = parseInt(val) || 0;
    setQuantities((prev) => ({
      ...prev,
      [key]: { qty: Math.max(0, num), packaging: prev[key]?.packaging || "unit" },
    }));
  };

  const togglePackaging = (key: string) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: {
        qty: prev[key]?.qty || 0,
        packaging: prev[key]?.packaging === "box" ? "unit" : "box",
      },
    }));
  };

  const handleSubmit = async () => {
    if (!isValid) return;

    // Validate quantities
    for (const [key, val] of Object.entries(quantities)) {
      if (val.qty > 0) {
        const available = getAvailable(key, val.packaging);
        if (val.qty > available) {
          const itemDef = ITEM_DEFINITIONS.find((i) => i.key === key);
          Alert.alert(
            "كمية غير كافية",
            `${itemDef?.nameAr}: المتاح ${available} ${val.packaging === "box" ? "صندوق" : "وحدة"} فقط`
          );
          return;
        }
      }
    }

    const body: Record<string, any> = { technicianId };
    for (const [key, val] of Object.entries(quantities)) {
      if (val.qty > 0) {
        const apiKey = key === "newBatteries" ? "newBatteries" : key;
        body[apiKey] = val.qty;
        body[`${apiKey}PackagingType`] = val.packaging;
      }
    }

    try {
      await mutateAsync(body);
      Alert.alert("تم بنجاح ✓", "تم نقل الأصناف من المخزون الثابت إلى المتحرك", [
        { text: "حسناً", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("خطأ", err?.response?.data?.message || "فشل في عملية النقل");
    }
  };

  const selectedTechObj = technicians?.find((t) => t.id === selectedTech);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      {/* Info banner */}
      <View
        style={{
          backgroundColor: "#9333ea" + "15",
          borderRadius: 12,
          padding: 14,
          flexDirection: "row-reverse",
          alignItems: "center",
          gap: 10,
          borderWidth: 1,
          borderColor: "#9333ea" + "30",
        }}
      >
        <Ionicons name="information-circle" size={20} color="#9333ea" />
        <Text style={{ color: Colors.dark[300], fontSize: 12, flex: 1, textAlign: "right" }}>
          نقل الأصناف بالوحدات المفردة من المخزون الثابت إلى المخزون المتحرك
        </Text>
      </View>

      {/* Technician selector (admin/supervisor only) */}
      {isAdmin && (
        <View>
          <Text style={styles.sectionLabel}>الفني *</Text>
          <TouchableOpacity style={styles.selector} onPress={() => setShowTechPicker(true)}>
            <Text style={{ color: selectedTechObj ? Colors.white : Colors.dark[500], fontSize: 14, flex: 1, textAlign: "right" }}>
              {selectedTechObj ? `${selectedTechObj.fullName} (${selectedTechObj.city || "—"})` : "اختر الفني"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.dark[400]} />
          </TouchableOpacity>
        </View>
      )}

      {/* Items with packaging toggle */}
      <Text style={styles.sectionLabel}>الأصناف والكميات</Text>
      {ITEM_DEFINITIONS.map((item) => {
        const packaging = quantities[item.key]?.packaging || "unit";
        const qty = quantities[item.key]?.qty || 0;
        const available = getAvailable(item.key, packaging);
        const exceeds = qty > 0 && qty > available;
        return (
          <View key={item.key}>
            <View
              style={{
                backgroundColor: Colors.dark[800],
                borderRadius: 12,
                padding: 12,
                flexDirection: "row-reverse",
                alignItems: "center",
                gap: 10,
                borderWidth: exceeds ? 1 : 0,
                borderColor: Colors.error,
              }}
            >
              <Ionicons name={item.icon as any} size={18} color="#9333ea" />
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={{ color: Colors.white, fontSize: 13 }}>{item.nameAr}</Text>
                <Text style={{ color: Colors.dark[500], fontSize: 10, marginTop: 2 }}>
                  المتاح: {available} {packaging === "box" ? "صندوق" : "وحدة"}
                </Text>
              </View>
              <TextInput
                style={styles.qtyInput}
                placeholder="0"
                placeholderTextColor={Colors.dark[600]}
                value={qty > 0 ? String(qty) : ""}
                onChangeText={(v) => updateQty(item.key, v)}
                keyboardType="numeric"
              />
              <TouchableOpacity
                onPress={() => togglePackaging(item.key)}
                style={{
                  backgroundColor: packaging === "unit" ? "#9333ea" + "30" : Colors.primary[500] + "30",
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  minWidth: 52,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: packaging === "unit" ? "#9333ea" : Colors.primary[400], fontSize: 11, fontWeight: "600" }}>
                  {packaging === "unit" ? "وحدة" : "صندوق"}
                </Text>
              </TouchableOpacity>
            </View>
            {exceeds && (
              <Text style={{ color: Colors.error, fontSize: 11, textAlign: "right", marginTop: 2, marginRight: 4 }}>
                الكمية تتجاوز المتاح ({available})
              </Text>
            )}
          </View>
        );
      })}

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          { backgroundColor: "#9333ea" },
          !isValid && styles.submitBtnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isPending || !isValid}
        activeOpacity={0.8}
      >
        {isPending ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Ionicons name="arrow-undo" size={18} color={Colors.white} />
            <Text style={styles.submitText}>تنفيذ النقل</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Tech Picker Modal */}
      {isAdmin && (
        <SearchablePickerModal
          visible={showTechPicker}
          onClose={() => setShowTechPicker(false)}
          title="اختر الفني"
          data={(technicians || []).filter((t) => t.role === "technician").map((t) => ({
            id: t.id,
            label: t.fullName,
            sub: t.city || t.username,
          }))}
          onSelect={(id) => { setSelectedTech(id); setShowTechPicker(false); }}
          selected={selectedTech}
        />
      )}
    </ScrollView>
  );
}

// ─── Shared Components ───

function ItemQuantityRow({
  item,
  boxes,
  units,
  onBoxesChange,
  onUnitsChange,
}: {
  item: (typeof ITEM_DEFINITIONS)[0];
  boxes: number;
  units: number;
  onBoxesChange: (v: string) => void;
  onUnitsChange: (v: string) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: Colors.dark[800],
        borderRadius: 12,
        padding: 12,
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Ionicons name={item.icon as any} size={18} color={Colors.primary[400]} />
      <Text style={{ color: Colors.white, fontSize: 13, flex: 1, textAlign: "right" }}>
        {item.nameAr}
      </Text>
      <View style={{ flexDirection: "row-reverse", gap: 6, alignItems: "center" }}>
        <TextInput
          style={styles.qtyInput}
          placeholder="0"
          placeholderTextColor={Colors.dark[600]}
          value={boxes > 0 ? String(boxes) : ""}
          onChangeText={onBoxesChange}
          keyboardType="numeric"
        />
        <Text style={{ color: Colors.dark[500], fontSize: 10 }}>صندوق</Text>
        <TextInput
          style={styles.qtyInput}
          placeholder="0"
          placeholderTextColor={Colors.dark[600]}
          value={units > 0 ? String(units) : ""}
          onChangeText={onUnitsChange}
          keyboardType="numeric"
        />
        <Text style={{ color: Colors.dark[500], fontSize: 10 }}>وحدة</Text>
      </View>
    </View>
  );
}

function TransferItemRow({
  item,
  qty,
  packaging,
  onQtyChange,
  onTogglePackaging,
}: {
  item: (typeof ITEM_DEFINITIONS)[0];
  qty: number;
  packaging: "box" | "unit";
  onQtyChange: (v: string) => void;
  onTogglePackaging: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: Colors.dark[800],
        borderRadius: 12,
        padding: 12,
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 10,
      }}
    >
      <Ionicons name={item.icon as any} size={18} color={Colors.primary[400]} />
      <Text style={{ color: Colors.white, fontSize: 13, flex: 1, textAlign: "right" }}>
        {item.nameAr}
      </Text>
      <TextInput
        style={styles.qtyInput}
        placeholder="0"
        placeholderTextColor={Colors.dark[600]}
        value={qty > 0 ? String(qty) : ""}
        onChangeText={onQtyChange}
        keyboardType="numeric"
      />
      <TouchableOpacity
        onPress={onTogglePackaging}
        style={{
          backgroundColor: packaging === "box" ? Colors.primary[500] + "30" : Colors.warning + "30",
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 8,
          minWidth: 52,
          alignItems: "center",
        }}
      >
        <Text style={{ color: packaging === "box" ? Colors.primary[400] : Colors.warning, fontSize: 11, fontWeight: "600" }}>
          {packaging === "box" ? "صندوق" : "وحدة"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function SearchablePickerModal({
  visible,
  onClose,
  title,
  data,
  onSelect,
  selected,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  data: { id: string; label: string; sub?: string }[];
  onSelect: (id: string) => void;
  selected: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((d) => d.label.toLowerCase().includes(q) || d.sub?.toLowerCase().includes(q));
  }, [data, search]);

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
            maxHeight: "70%",
          }}
          onPress={() => {}}
        >
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.dark[700] }}>
            <View style={{ width: 40, height: 4, backgroundColor: Colors.dark[600], borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />
            <Text style={{ color: Colors.white, fontSize: 17, fontWeight: "bold", textAlign: "right", marginBottom: 12 }}>
              {title}
            </Text>
            <View
              style={{
                flexDirection: "row-reverse",
                backgroundColor: Colors.dark[700],
                borderRadius: 10,
                paddingHorizontal: 12,
                alignItems: "center",
                gap: 8,
              }}
            >
              <Ionicons name="search-outline" size={16} color={Colors.dark[400]} />
              <TextInput
                style={{ flex: 1, color: Colors.white, fontSize: 14, textAlign: "right", paddingVertical: 10 }}
                placeholder="بحث..."
                placeholderTextColor={Colors.dark[500]}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { onSelect(item.id); setSearch(""); }}
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.dark[700],
                  backgroundColor: item.id === selected ? Colors.primary[500] + "15" : "transparent",
                  gap: 10,
                }}
              >
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={{ color: Colors.white, fontSize: 14, fontWeight: item.id === selected ? "600" : "400" }}>
                    {item.label}
                  </Text>
                  {item.sub && (
                    <Text style={{ color: Colors.dark[400], fontSize: 12, marginTop: 2 }}>
                      {item.sub}
                    </Text>
                  )}
                </View>
                {item.id === selected && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.primary[500]} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ padding: 40, alignItems: "center" }}>
                <Text style={{ color: Colors.dark[500], fontSize: 14 }}>لا توجد نتائج</Text>
              </View>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = {
  sectionLabel: {
    color: Colors.dark[300],
    fontSize: 14,
    fontWeight: "600" as const,
    textAlign: "right" as const,
    marginBottom: 8,
  },
  selector: {
    backgroundColor: Colors.dark[800],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row-reverse" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  input: {
    backgroundColor: Colors.dark[800],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.white,
    fontSize: 16,
    textAlign: "right" as const,
  },
  textArea: {
    backgroundColor: Colors.dark[800],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.white,
    fontSize: 14,
    textAlign: "right" as const,
    minHeight: 80,
  },
  qtyInput: {
    backgroundColor: Colors.dark[700],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: Colors.white,
    fontSize: 14,
    textAlign: "center" as const,
    width: 48,
  },
  submitBtn: {
    backgroundColor: Colors.primary[500],
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row-reverse" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600" as const,
  },
};
