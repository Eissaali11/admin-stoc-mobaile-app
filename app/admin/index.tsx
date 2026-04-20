/**
 * Admin Dashboard - لوحة الإدارة
 * System overview with regions, users, and stats management
 */

import { useState, useCallback } from "react";
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
import {
  useAdminStats,
  useRegions,
  useUsers,
  useCreateRegion,
  useCreateUser,
  useUpdateUser,
} from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/ui/Loading";
import { ErrorView } from "@/components/ui/ErrorView";
import { StatCard } from "@/components/dashboard/StatCard";
import type { User, Region } from "@/lib/types";

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "regions" | "users">("overview");
  const [showAddRegion, setShowAddRegion] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit user form
  const [editUser, setEditUser] = useState<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    city: string;
    regionId: string;
    isActive: boolean;
  }>({ id: "", fullName: "", email: "", role: "technician", city: "", regionId: "", isActive: true });

  // Region form
  const [regionName, setRegionName] = useState("");
  const [regionDesc, setRegionDesc] = useState("");

  // User form
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    role: "technician" as string,
    city: "",
  });

  const { data: adminStats, isLoading, error, refetch } = useAdminStats();
  const { data: regions = [], refetch: refetchRegions } = useRegions();
  const { data: users = [], refetch: refetchUsers } = useUsers();
  const createRegionMut = useCreateRegion();
  const createUserMut = useCreateUser();
  const updateUserMut = useUpdateUser();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchRegions(), refetchUsers()]);
    setRefreshing(false);
  }, [refetch, refetchRegions, refetchUsers]);

  if (user?.role !== "admin") {
    return (
      <ErrorView message="ليس لديك صلاحية الوصول لهذه الصفحة" />
    );
  }

  if (isLoading && !refreshing) {
    return <Loading message="جاري تحميل لوحة الإدارة..." />;
  }

  if (error && !adminStats) {
    return <ErrorView message="تعذر تحميل بيانات الإدارة" onRetry={() => refetch()} />;
  }

  const filteredUsers = users.filter(
    (u: User) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRegion = () => {
    if (!regionName.trim()) return;
    createRegionMut.mutate(
      { name: regionName.trim(), description: regionDesc.trim() || undefined },
      {
        onSuccess: () => {
          setShowAddRegion(false);
          setRegionName("");
          setRegionDesc("");
          Alert.alert("تم", "تم إنشاء المنطقة بنجاح");
        },
        onError: () => Alert.alert("خطأ", "فشل إنشاء المنطقة"),
      }
    );
  };

  const handleCreateUser = () => {
    if (!newUser.username.trim() || !newUser.password.trim() || !newUser.fullName.trim()) {
      Alert.alert("خطأ", "يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    createUserMut.mutate(newUser, {
      onSuccess: () => {
        setShowAddUser(false);
        setNewUser({ username: "", password: "", fullName: "", email: "", role: "technician", city: "" });
        Alert.alert("تم", "تم إنشاء المستخدم بنجاح");
      },
      onError: () => Alert.alert("خطأ", "فشل إنشاء المستخدم"),
    });
  };

  const toggleUserActive = (u: User) => {
    updateUserMut.mutate(
      { id: u.id, isActive: !u.isActive },
      {
        onSuccess: () => refetchUsers(),
        onError: () => Alert.alert("خطأ", "فشل تحديث المستخدم"),
      }
    );
  };

  const openEditUser = (u: User) => {
    setEditUser({
      id: u.id,
      fullName: u.fullName,
      email: u.email || "",
      role: u.role,
      city: u.city || "",
      regionId: u.regionId || "",
      isActive: u.isActive,
    });
    setShowEditUser(true);
  };

  const handleEditUser = () => {
    if (!editUser.fullName.trim()) {
      Alert.alert("خطأ", "الاسم الكامل مطلوب");
      return;
    }
    updateUserMut.mutate(
      {
        id: editUser.id,
        fullName: editUser.fullName.trim(),
        email: editUser.email.trim() || undefined,
        role: editUser.role,
        city: editUser.city.trim() || undefined,
        regionId: editUser.regionId || undefined,
        isActive: editUser.isActive,
      },
      {
        onSuccess: () => {
          setShowEditUser(false);
          refetchUsers();
          Alert.alert("تم", "تم تحديث بيانات المستخدم بنجاح");
        },
        onError: () => Alert.alert("خطأ", "فشل تحديث بيانات المستخدم"),
      }
    );
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "مسؤول";
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

  const tabs = [
    { key: "overview" as const, label: "نظرة عامة", icon: "stats-chart-outline" as const },
    { key: "regions" as const, label: "المناطق", icon: "globe-outline" as const },
    { key: "users" as const, label: "المستخدمين", icon: "people-outline" as const },
  ];

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
          لوحة الإدارة
        </Text>
        <Ionicons name="shield-checkmark" size={24} color={Colors.primary[500]} />
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row-reverse", paddingHorizontal: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.sm }}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              flexDirection: "row-reverse",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 10,
              borderRadius: BorderRadius.md,
              backgroundColor: activeTab === tab.key ? Colors.primary[500] : Colors.dark[800],
            }}
          >
            <Ionicons
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? Colors.white : Colors.dark[400]}
            />
            <Text
              style={{
                fontSize: FontSize.sm,
                fontWeight: "600",
                color: activeTab === tab.key ? Colors.white : Colors.dark[400],
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary[500]} colors={[Colors.primary[500]]} />
        }
      >
        {/* ─── Overview Tab ─── */}
        {activeTab === "overview" && (
          <>
            <View style={{ flexDirection: "row-reverse", gap: 12 }}>
              <StatCard icon="globe-outline" label="المناطق" value={adminStats?.totalRegions ?? 0} color={Colors.primary[500]} />
              <StatCard icon="people-outline" label="المستخدمين" value={adminStats?.totalUsers ?? 0} color={Colors.info} />
            </View>
            <View style={{ flexDirection: "row-reverse", gap: 12 }}>
              <StatCard icon="checkmark-circle" label="النشطون" value={adminStats?.activeUsers ?? 0} color={Colors.success} />
              <StatCard icon="swap-horizontal" label="العمليات" value={adminStats?.totalTransactions ?? 0} color={Colors.warning} />
            </View>

            {/* Quick Actions */}
            <Text style={{ fontSize: FontSize.lg, fontWeight: "600", color: Colors.white, textAlign: "right" }}>
              إجراءات سريعة
            </Text>
            <View style={{ gap: 10 }}>
              {[
                { label: "نظرة عامة على المخزون", icon: "layers-outline" as const, route: "/admin/inventory-overview" },
                { label: "إدارة العمليات", icon: "swap-horizontal-outline" as const, route: "/admin/operations-management" },
                { label: "إدارة المستودعات", icon: "business-outline" as const, route: "/admin/warehouses" },
                { label: "إدارة الأصناف", icon: "pricetags-outline" as const, route: "/admin/item-types" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.route}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: Colors.dark[800],
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.md,
                    borderWidth: 1,
                    borderColor: Colors.dark[700],
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      backgroundColor: Colors.primary[500] + "20",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name={item.icon} size={20} color={Colors.primary[400]} />
                  </View>
                  <Text style={{ flex: 1, fontSize: FontSize.md, color: Colors.white, textAlign: "right" }}>
                    {item.label}
                  </Text>
                  <Ionicons name="chevron-back" size={20} color={Colors.dark[500]} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Transactions */}
            {adminStats?.recentTransactions && adminStats.recentTransactions.length > 0 && (
              <View style={{ backgroundColor: Colors.dark[800], borderRadius: BorderRadius.lg, padding: Spacing.md }}>
                <Text style={{ fontSize: FontSize.md, fontWeight: "600", color: Colors.white, textAlign: "right", marginBottom: 12 }}>
                  آخر العمليات
                </Text>
                {adminStats.recentTransactions.slice(0, 5).map((tx) => (
                  <View
                    key={tx.id}
                    style={{
                      flexDirection: "row-reverse",
                      alignItems: "center",
                      gap: 10,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.dark[700],
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: (tx.type === "add" ? Colors.success : Colors.error) + "20",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Ionicons
                        name={tx.type === "add" ? "add-circle" : "remove-circle"}
                        size={16}
                        color={tx.type === "add" ? Colors.success : Colors.error}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: FontSize.sm, color: Colors.white, textAlign: "right" }}>
                        {tx.itemName}
                      </Text>
                      <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400], textAlign: "right" }}>
                        {tx.userName} • {tx.quantity} وحدة
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ─── Regions Tab ─── */}
        {activeTab === "regions" && (
          <>
            <TouchableOpacity
              onPress={() => setShowAddRegion(true)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row-reverse",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: Colors.primary[500],
                borderRadius: BorderRadius.md,
                padding: 14,
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
              <Text style={{ fontSize: FontSize.md, fontWeight: "600", color: Colors.white }}>
                إضافة منطقة
              </Text>
            </TouchableOpacity>

            {regions.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Ionicons name="globe-outline" size={56} color={Colors.dark[600]} />
                <Text style={{ color: Colors.dark[400], fontSize: 16, marginTop: 12 }}>لا توجد مناطق</Text>
              </View>
            ) : (
              regions.map((region: Region) => (
                <View
                  key={region.id}
                  style={{
                    backgroundColor: Colors.dark[800],
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.md,
                    borderRightWidth: 3,
                    borderRightColor: region.isActive ? Colors.success : Colors.dark[600],
                  }}
                >
                  <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontSize: FontSize.md, fontWeight: "600", color: Colors.white }}>
                      {region.name}
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: (region.isActive ? Colors.success : Colors.dark[600]) + "20",
                      }}
                    >
                      <Text style={{ fontSize: FontSize.xs, color: region.isActive ? Colors.success : Colors.dark[400] }}>
                        {region.isActive ? "نشط" : "غير نشط"}
                      </Text>
                    </View>
                  </View>
                  {region.description && (
                    <Text style={{ fontSize: FontSize.sm, color: Colors.dark[400], textAlign: "right", marginTop: 6 }}>
                      {region.description}
                    </Text>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {/* ─── Users Tab ─── */}
        {activeTab === "users" && (
          <>
            <View style={{ flexDirection: "row-reverse", gap: 10 }}>
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
                  placeholder="بحث عن مستخدم..."
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
              <TouchableOpacity
                onPress={() => setShowAddUser(true)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: BorderRadius.md,
                  backgroundColor: Colors.primary[500],
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="person-add-outline" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* User count badges */}
            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              {[
                { label: "الكل", count: users.length, color: Colors.dark[400] },
                { label: "مسؤول", count: users.filter((u: User) => u.role === "admin").length, color: Colors.error },
                { label: "مشرف", count: users.filter((u: User) => u.role === "supervisor").length, color: Colors.warning },
                { label: "فني", count: users.filter((u: User) => u.role === "technician").length, color: Colors.info },
              ].map((b) => (
                <View
                  key={b.label}
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: Colors.dark[800],
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: b.color }} />
                  <Text style={{ fontSize: FontSize.xs, color: Colors.dark[300] }}>
                    {b.label} ({b.count})
                  </Text>
                </View>
              ))}
            </View>

            {filteredUsers.map((u: User) => (
              <View
                key={u.id}
                style={{
                  backgroundColor: Colors.dark[800],
                  borderRadius: BorderRadius.lg,
                  padding: Spacing.md,
                  opacity: u.isActive ? 1 : 0.6,
                }}
              >
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: getRoleColor(u.role) + "30",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: FontSize.lg, fontWeight: "bold", color: getRoleColor(u.role) }}>
                      {u.fullName.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FontSize.md, fontWeight: "600", color: Colors.white, textAlign: "right" }}>
                      {u.fullName}
                    </Text>
                    <Text style={{ fontSize: FontSize.xs, color: Colors.dark[400], textAlign: "right" }}>
                      @{u.username} {u.city ? `• ${u.city}` : ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "center", gap: 6 }}>
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 10,
                        backgroundColor: getRoleColor(u.role) + "20",
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "600", color: getRoleColor(u.role) }}>
                        {getRoleLabel(u.role)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                      <TouchableOpacity onPress={() => openEditUser(u)}>
                        <Ionicons name="create-outline" size={22} color={Colors.primary[400]} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => toggleUserActive(u)}>
                        <Ionicons
                          name={u.isActive ? "checkmark-circle" : "close-circle"}
                          size={22}
                          color={u.isActive ? Colors.success : Colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* ─── Add Region Modal ─── */}
      <Modal visible={showAddRegion} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: Colors.dark[800], borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 }}>
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: "bold", color: Colors.white }}>إضافة منطقة</Text>
              <TouchableOpacity onPress={() => setShowAddRegion(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.dark[400]} />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="اسم المنطقة *"
              placeholderTextColor={Colors.dark[500]}
              value={regionName}
              onChangeText={setRegionName}
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
              placeholder="وصف المنطقة (اختياري)"
              placeholderTextColor={Colors.dark[500]}
              value={regionDesc}
              onChangeText={setRegionDesc}
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
              onPress={handleCreateRegion}
              disabled={createRegionMut.isPending}
              style={{
                backgroundColor: Colors.primary[500],
                borderRadius: BorderRadius.md,
                padding: 16,
                alignItems: "center",
                opacity: createRegionMut.isPending ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: FontSize.md, fontWeight: "bold", color: Colors.white }}>
                {createRegionMut.isPending ? "جاري الإنشاء..." : "إنشاء المنطقة"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Add User Modal ─── */}
      <Modal visible={showAddUser} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <ScrollView
            style={{ maxHeight: "85%" }}
            contentContainerStyle={{
              backgroundColor: Colors.dark[800],
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: "bold", color: Colors.white }}>إضافة مستخدم</Text>
              <TouchableOpacity onPress={() => setShowAddUser(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.dark[400]} />
              </TouchableOpacity>
            </View>
            {[
              { key: "fullName", placeholder: "الاسم الكامل *", icon: "person-outline" as const },
              { key: "username", placeholder: "اسم المستخدم *", icon: "at-outline" as const },
              { key: "password", placeholder: "كلمة المرور *", icon: "lock-closed-outline" as const, secure: true },
              { key: "email", placeholder: "البريد الإلكتروني", icon: "mail-outline" as const },
              { key: "city", placeholder: "المدينة", icon: "location-outline" as const },
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
                  value={(newUser as any)[field.key]}
                  onChangeText={(v) => setNewUser({ ...newUser, [field.key]: v })}
                  secureTextEntry={field.secure}
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    color: Colors.white,
                    fontSize: FontSize.sm,
                    paddingVertical: 14,
                    textAlign: "right",
                  }}
                />
              </View>
            ))}

            {/* Role selector */}
            <Text style={{ fontSize: FontSize.sm, color: Colors.dark[300], textAlign: "right" }}>الصلاحية:</Text>
            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              {(["admin", "supervisor", "technician"] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => setNewUser({ ...newUser, role })}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: BorderRadius.md,
                    backgroundColor: newUser.role === role ? getRoleColor(role) : Colors.dark[700],
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: Colors.white }}>
                    {getRoleLabel(role)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleCreateUser}
              disabled={createUserMut.isPending}
              style={{
                backgroundColor: Colors.primary[500],
                borderRadius: BorderRadius.md,
                padding: 16,
                alignItems: "center",
                opacity: createUserMut.isPending ? 0.6 : 1,
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: FontSize.md, fontWeight: "bold", color: Colors.white }}>
                {createUserMut.isPending ? "جاري الإنشاء..." : "إنشاء المستخدم"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      {/* ─── Edit User Modal ─── */}
      <Modal visible={showEditUser} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <ScrollView
            style={{ maxHeight: "85%" }}
            contentContainerStyle={{
              backgroundColor: Colors.dark[800],
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              gap: 14,
            }}
          >
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: FontSize.lg, fontWeight: "bold", color: Colors.white }}>تعديل المستخدم</Text>
              <TouchableOpacity onPress={() => setShowEditUser(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.dark[400]} />
              </TouchableOpacity>
            </View>

            {[
              { key: "fullName", placeholder: "الاسم الكامل *", icon: "person-outline" as const },
              { key: "email", placeholder: "البريد الإلكتروني", icon: "mail-outline" as const },
              { key: "city", placeholder: "المدينة", icon: "location-outline" as const },
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
                  value={(editUser as any)[field.key]}
                  onChangeText={(v) => setEditUser({ ...editUser, [field.key]: v })}
                  autoCapitalize="none"
                  style={{
                    flex: 1,
                    color: Colors.white,
                    fontSize: FontSize.sm,
                    paddingVertical: 14,
                    textAlign: "right",
                  }}
                />
              </View>
            ))}

            {/* Region selector */}
            <Text style={{ fontSize: FontSize.sm, color: Colors.dark[300], textAlign: "right" }}>المنطقة:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row-reverse", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setEditUser({ ...editUser, regionId: "" })}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: BorderRadius.md,
                  backgroundColor: !editUser.regionId ? Colors.primary[500] : Colors.dark[700],
                }}
              >
                <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: Colors.white }}>بدون</Text>
              </TouchableOpacity>
              {regions.map((r: Region) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setEditUser({ ...editUser, regionId: r.id })}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: BorderRadius.md,
                    backgroundColor: editUser.regionId === r.id ? Colors.primary[500] : Colors.dark[700],
                  }}
                >
                  <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: Colors.white }}>{r.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Role selector */}
            <Text style={{ fontSize: FontSize.sm, color: Colors.dark[300], textAlign: "right" }}>الصلاحية:</Text>
            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              {(["admin", "supervisor", "technician"] as const).map((role) => (
                <TouchableOpacity
                  key={role}
                  onPress={() => setEditUser({ ...editUser, role })}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: BorderRadius.md,
                    backgroundColor: editUser.role === role ? getRoleColor(role) : Colors.dark[700],
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: FontSize.sm, fontWeight: "600", color: Colors.white }}>
                    {getRoleLabel(role)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Active toggle */}
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.dark[700], borderRadius: BorderRadius.md, padding: 14 }}>
              <Text style={{ fontSize: FontSize.sm, color: Colors.white }}>الحساب نشط</Text>
              <Switch
                value={editUser.isActive}
                onValueChange={(v) => setEditUser({ ...editUser, isActive: v })}
                trackColor={{ false: Colors.dark[600], true: Colors.success + "60" }}
                thumbColor={editUser.isActive ? Colors.success : Colors.dark[400]}
              />
            </View>

            <TouchableOpacity
              onPress={handleEditUser}
              disabled={updateUserMut.isPending}
              style={{
                backgroundColor: Colors.primary[500],
                borderRadius: BorderRadius.md,
                padding: 16,
                alignItems: "center",
                opacity: updateUserMut.isPending ? 0.6 : 1,
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: FontSize.md, fontWeight: "bold", color: Colors.white }}>
                {updateUserMut.isPending ? "جاري التحديث..." : "حفظ التعديلات"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
