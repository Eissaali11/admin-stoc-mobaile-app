/**
 * Recent Transactions list component
 */

import { View } from "react-native";
import { Text } from "@/components/ui/StyledText";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/lib/theme";
import type { TransactionWithDetails } from "@/lib/types";

interface RecentTransactionsProps {
  transactions: TransactionWithDetails[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <View
        style={{
          backgroundColor: Colors.dark[800],
          borderRadius: 16,
          padding: 24,
          alignItems: "center",
        }}
      >
        <Text style={{ color: Colors.dark[500], fontSize: 14 }}>
          لا توجد عمليات حديثة
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: Colors.dark[800],
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: Colors.dark[700],
        }}
      >
        <Text style={{ color: Colors.white, fontSize: 16, fontWeight: "600" }}>
          آخر العمليات
        </Text>
        <Ionicons name="time-outline" size={18} color={Colors.dark[400]} />
      </View>

      {transactions.slice(0, 5).map((tx, index) => {
        const isAdd = tx.type === "add";
        return (
          <View
            key={tx.id}
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: index < transactions.length - 1 ? 1 : 0,
              borderBottomColor: Colors.dark[700],
              gap: 12,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: (isAdd ? Colors.success : Colors.error) + "20",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons
                name={isAdd ? "add-circle-outline" : "remove-circle-outline"}
                size={16}
                color={isAdd ? Colors.success : Colors.error}
              />
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text
                style={{ color: Colors.white, fontSize: 13, fontWeight: "500" }}
                numberOfLines={1}
              >
                {tx.itemName}
              </Text>
              <Text style={{ color: Colors.dark[400], fontSize: 11, marginTop: 2 }}>
                {tx.userName} · {tx.regionName}
              </Text>
            </View>
            <Text
              style={{
                color: isAdd ? Colors.success : Colors.error,
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {isAdd ? "+" : "-"}{tx.quantity}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
