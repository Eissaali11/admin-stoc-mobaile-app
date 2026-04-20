/**
 * Login Screen - Professional RASSCO themed
 */

import { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  TextInput as RNTextInput,
} from "react-native";
import { Text, TextInput } from "@/components/ui/StyledText";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { Colors } from "@/lib/theme";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const passwordRef = useRef<RNTextInput>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ username: username.trim(), password });
    } catch (error: any) {
      Alert.alert(
        "خطأ في تسجيل الدخول",
        error?.message || "اسم المستخدم أو كلمة المرور غير صحيحة"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={["#0d1b2a", "#132d3e", "#18B2B0", "#14a8a6"]}
        locations={[0, 0.35, 0.85, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Decorative circles */}
        <View
          style={{
            position: "absolute",
            top: -80,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "rgba(24, 178, 176, 0.08)",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 60,
            left: -40,
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: "rgba(24, 178, 176, 0.06)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: 100,
            right: -30,
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: "rgba(255, 255, 255, 0.03)",
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingHorizontal: 28,
              paddingTop: Platform.OS === "ios" ? 60 : 40,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo Section */}
            <View style={{ alignItems: "center", marginBottom: 40 }}>
              <View
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                  shadowColor: "#18B2B0",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                <Image
                  source={require("@/assets/logo.png")}
                  style={{
                    width: 110,
                    height: 110,
                    resizeMode: "contain",
                  }}
                />
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.6)",
                  letterSpacing: 4,
                  fontWeight: "300",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                نظام إدارة المخزون
              </Text>
            </View>

            {/* Login Card */}
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 24,
                padding: 28,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.15)",
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#ffffff",
                  textAlign: "right",
                  marginBottom: 6,
                }}
              >
                تسجيل الدخول
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.5)",
                  textAlign: "right",
                  marginBottom: 24,
                }}
              >
                أدخل بياناتك للمتابعة
              </Text>

              {/* Username Field */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: 8,
                    textAlign: "right",
                    fontWeight: "500",
                  }}
                >
                  اسم المستخدم
                </Text>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    backgroundColor: focusedField === "username"
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: focusedField === "username"
                      ? "#18B2B0"
                      : "rgba(255,255,255,0.1)",
                    paddingHorizontal: 16,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: focusedField === "username"
                        ? "rgba(24,178,176,0.2)"
                        : "rgba(255,255,255,0.08)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={focusedField === "username" ? "#18B2B0" : "rgba(255,255,255,0.4)"}
                    />
                  </View>
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="أدخل اسم المستخدم"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    onFocus={() => setFocusedField("username")}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      flex: 1,
                      color: "#ffffff",
                      fontSize: 15,
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      textAlign: "right",
                      writingDirection: "rtl",
                    }}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: 8,
                    textAlign: "right",
                    fontWeight: "500",
                  }}
                >
                  كلمة المرور
                </Text>
                <View
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    backgroundColor: focusedField === "password"
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: focusedField === "password"
                      ? "#18B2B0"
                      : "rgba(255,255,255,0.1)",
                    paddingHorizontal: 16,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: focusedField === "password"
                        ? "rgba(24,178,176,0.2)"
                        : "rgba(255,255,255,0.08)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={focusedField === "password" ? "#18B2B0" : "rgba(255,255,255,0.4)"}
                    />
                  </TouchableOpacity>
                  <TextInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="أدخل كلمة المرور"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      flex: 1,
                      color: "#ffffff",
                      fontSize: 15,
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                      textAlign: "right",
                      writingDirection: "rtl",
                    }}
                  />
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isSubmitting
                    ? ["#0f8a88", "#0d7a78"]
                    : ["#18B2B0", "#14a8a6", "#109e9c"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 14,
                    paddingVertical: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                    shadowColor: "#18B2B0",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="log-in-outline" size={20} color="#ffffff" />
                      <Text
                        style={{
                          color: "#ffffff",
                          fontSize: 17,
                          fontWeight: "700",
                          letterSpacing: 0.5,
                        }}
                      >
                        تسجيل الدخول
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 11,
                  letterSpacing: 2,
                }}
              >
                STOCKPRO v1.0.0
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 10,
                  marginTop: 4,
                }}
              >
                © RAS SAUDI COMPANY LTD
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}
