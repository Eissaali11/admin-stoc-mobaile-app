/**
 * Barcode Scanner Screen
 * Uses expo-camera to scan barcodes and look up inventory items
 */

import { View, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/StyledText";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/lib/theme";
import { api } from "@/lib/api";
import { useState, useCallback, useRef } from "react";

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastScanRef = useRef<string>("");

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned || loading || data === lastScanRef.current) return;
      setScanned(true);
      setLoading(true);
      lastScanRef.current = data;

      try {
        const response = await api.get(`/api/inventory/barcode/${encodeURIComponent(data)}`);
        const item = response.data;

        Alert.alert(
          "تم العثور على العنصر",
          `الاسم: ${item.name}\nالكمية: ${item.quantity} ${item.unit}\nالمنطقة: ${item.regionName || "—"}`,
          [
            { text: "مسح آخر", onPress: () => resetScanner() },
            { text: "رجوع", onPress: () => router.back() },
          ]
        );
      } catch (err: any) {
        const status = err?.response?.status;
        const message =
          status === 404
            ? `لم يتم العثور على عنصر بالباركود:\n${data}`
            : "حدث خطأ أثناء البحث";

        Alert.alert("نتيجة المسح", message, [
          { text: "مسح آخر", onPress: () => resetScanner() },
          { text: "رجوع", onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [scanned, loading]
  );

  const resetScanner = () => {
    setScanned(false);
    lastScanRef.current = "";
  };

  // Permission not determined yet
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionBox}>
          <Ionicons name="camera-outline" size={56} color={Colors.dark[400]} />
          <Text style={styles.permissionTitle}>صلاحية الكاميرا مطلوبة</Text>
          <Text style={styles.permissionDesc}>
            يحتاج التطبيق إلى الوصول للكاميرا لمسح الباركود
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>منح الصلاحية</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: Colors.dark[400], fontSize: 14 }}>رجوع</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
            "ean13",
            "ean8",
            "code128",
            "code39",
            "code93",
            "upc_a",
            "upc_e",
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <SafeAreaView>
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => setTorch((t) => !t)}
              style={[styles.iconBtn, torch && styles.iconBtnActive]}
            >
              <Ionicons
                name={torch ? "flash" : "flash-outline"}
                size={22}
                color={Colors.white}
              />
            </TouchableOpacity>

            <Text style={styles.topTitle}>ماسح الباركود</Text>

            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="close" size={22} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Scan frame */}
        <View style={styles.frameContainer}>
          <View style={styles.frame}>
            {/* Corner decorations */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {loading && (
              <ActivityIndicator size="large" color={Colors.primary[500]} />
            )}
          </View>
          <Text style={styles.hint}>
            {loading ? "جاري البحث..." : "وجّه الكاميرا نحو الباركود"}
          </Text>
        </View>

        {/* Bottom */}
        {scanned && !loading && (
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.rescanBtn} onPress={resetScanner}>
              <Ionicons name="scan-outline" size={20} color={Colors.white} />
              <Text style={styles.rescanText}>مسح مرة أخرى</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark[900],
    justifyContent: "center",
    alignItems: "center",
  },
  permissionBox: {
    alignItems: "center",
    gap: 12,
    padding: 32,
  },
  permissionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  permissionDesc: {
    color: Colors.dark[400],
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  permissionBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topTitle: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "600",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBtnActive: {
    backgroundColor: Colors.primary[500],
  },
  frameContainer: {
    alignItems: "center",
    gap: 20,
  },
  frame: {
    width: 260,
    height: 260,
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: Colors.primary[500],
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  hint: {
    color: Colors.white,
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  bottomBar: {
    alignItems: "center",
    paddingBottom: 60,
  },
  rescanBtn: {
    flexDirection: "row-reverse",
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    gap: 8,
  },
  rescanText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
});
