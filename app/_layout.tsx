/**
 * Root Layout - App entry point
 * Sets up providers, RTL, and auth-based routing
 */

import React, { useEffect, useCallback } from "react";
import { I18nManager, Platform, View, ScrollView, StyleSheet } from "react-native";
import { Text } from "@/components/ui/StyledText";
import { Slot, useRouter, useSegments, ErrorBoundary } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";

import { AuthProvider, useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

// Keep splash screen visible while loading auth
SplashScreen.preventAutoHideAsync().catch(() => {});

// Force RTL for Arabic
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", padding: 20 }}>
          <Text style={{ color: "#ef4444", fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
            App Error:
          </Text>
          <ScrollView>
            <Text style={{ color: "#fff", fontSize: 14 }}>
              {this.state.error?.message}
            </Text>
            <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 10 }}>
              {this.state.error?.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Not authenticated, redirect to login
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated, redirect to main app
      router.replace("/(tabs)/home");
    }

    SplashScreen.hideAsync();
  }, [isAuthenticated, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BeinNormal: require("@/assets/fonts/BeinNormal.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="light" />
            <AuthGate />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}
