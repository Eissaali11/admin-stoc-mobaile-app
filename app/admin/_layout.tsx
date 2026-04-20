import { Stack } from "expo-router";
import { Colors } from "@/lib/theme";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark[900] },
        animation: "slide_from_left",
      }}
    />
  );
}
