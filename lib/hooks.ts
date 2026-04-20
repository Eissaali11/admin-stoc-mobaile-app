/**
 * React Query hooks for STOCKPRO API
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type {
  DashboardStats,
  AdminStats,
  InventoryItemWithStatus,
  TechnicianFixedInventory,
  TechnicianMovingInventory,
  WarehouseWithStats,
  TransactionsResponse,
  TransactionStatistics,
  TechnicianOverview,
  ItemType,
  Region,
  StockMovement,
  User,
  WarehouseTransfer,
  InventoryRequest,
  CreateInventoryRequestBody,
  CreateWarehouseTransferBody,
} from "./types";

// ─── Dashboard ───
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/dashboard");
      return data;
    },
  });
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/stats");
      return data;
    },
  });
}

// ─── Inventory ───
export function useInventory() {
  return useQuery<InventoryItemWithStatus[]>({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data } = await api.get("/api/inventory");
      return data;
    },
  });
}

// ─── My Inventory (Technician) ───
export function useMyFixedInventory() {
  return useQuery<TechnicianFixedInventory>({
    queryKey: ["my-fixed-inventory"],
    queryFn: async () => {
      const { data } = await api.get("/api/my-fixed-inventory");
      return data;
    },
  });
}

export function useMyMovingInventory() {
  return useQuery<TechnicianMovingInventory>({
    queryKey: ["my-moving-inventory"],
    queryFn: async () => {
      const { data } = await api.get("/api/my-moving-inventory");
      return data;
    },
  });
}

// ─── Technicians ───
export function useTechnicians() {
  return useQuery<User[]>({
    queryKey: ["technicians"],
    queryFn: async () => {
      const { data } = await api.get("/api/technicians");
      return data;
    },
  });
}

export function useAllTechniciansInventory(role?: string) {
  const endpoint = role === "supervisor"
    ? "/api/supervisor/technicians-inventory"
    : "/api/admin/all-technicians-inventory";
  return useQuery<{ technicians: TechnicianOverview[] }>({
    queryKey: ["all-technicians-inventory", role],
    queryFn: async () => {
      const { data } = await api.get(endpoint);
      return data;
    },
  });
}

// ─── Warehouses ───
export function useWarehouses() {
  return useQuery<WarehouseWithStats[]>({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const { data } = await api.get("/api/warehouses");
      return data;
    },
  });
}

// ─── Transactions ───
export function useTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
}) {
  return useQuery<TransactionsResponse>({
    queryKey: ["transactions", params],
    queryFn: async () => {
      const { data } = await api.get("/api/transactions", { params });
      return data;
    },
  });
}

export function useTransactionStatistics() {
  return useQuery<TransactionStatistics>({
    queryKey: ["transaction-statistics"],
    queryFn: async () => {
      const { data } = await api.get("/api/transactions/statistics");
      return data;
    },
  });
}

// ─── Stock Movements ───
export function useStockMovements(technicianId?: string) {
  return useQuery<StockMovement[]>({
    queryKey: ["stock-movements", technicianId],
    queryFn: async () => {
      const { data } = await api.get("/api/stock-movements", {
        params: { technicianId, limit: 20 },
      });
      return data;
    },
    enabled: !!technicianId,
  });
}

// ─── Item Types ───
export function useItemTypes() {
  return useQuery<ItemType[]>({
    queryKey: ["item-types"],
    queryFn: async () => {
      const { data } = await api.get("/api/item-types");
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 min (rarely changes)
  });
}

// ─── Regions ───
export function useRegions() {
  return useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: async () => {
      const { data } = await api.get("/api/regions");
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });
}

// ─── Warehouse Transfers ───
export function useWarehouseTransfers(warehouseId?: string) {
  return useQuery<WarehouseTransfer[]>({
    queryKey: ["warehouse-transfers", warehouseId],
    queryFn: async () => {
      const { data } = await api.get("/api/warehouse-transfers", {
        params: { warehouseId, limit: 50 },
      });
      return data;
    },
  });
}

// ─── Inventory Requests ───
export function useMyInventoryRequests() {
  return useQuery<InventoryRequest[]>({
    queryKey: ["my-inventory-requests"],
    queryFn: async () => {
      const { data } = await api.get("/api/inventory-requests/my");
      return data;
    },
  });
}

export function useSupervisorInventoryRequests() {
  return useQuery<InventoryRequest[]>({
    queryKey: ["supervisor-inventory-requests"],
    queryFn: async () => {
      const { data } = await api.get("/api/supervisor/inventory-requests");
      return data;
    },
  });
}

export function useAllInventoryRequests() {
  return useQuery<InventoryRequest[]>({
    queryKey: ["all-inventory-requests"],
    queryFn: async () => {
      const { data } = await api.get("/api/inventory-requests");
      return data;
    },
  });
}

export function usePendingRequestsCount() {
  return useQuery<{ count: number }>({
    queryKey: ["pending-requests-count"],
    queryFn: async () => {
      const { data } = await api.get("/api/supervisor/inventory-requests/pending/count");
      return data;
    },
  });
}

// ─── Users (Admin) ───
export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get("/api/users");
      return data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { username: string; password: string; fullName: string; email: string; role: string; regionId?: string; city?: string }) => {
      const { data } = await api.post("/api/users", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; fullName?: string; email?: string; role?: string; regionId?: string; city?: string; isActive?: boolean }) => {
      const { data } = await api.patch(`/api/users/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// ─── Regions (Admin) ───
export function useCreateRegion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; description?: string }) => {
      const { data } = await api.post("/api/regions", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

// ─── Warehouses (CRUD) ───
export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; location: string; description?: string; regionId?: string }) => {
      const { data } = await api.post("/api/warehouses", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

// ─── Item Types (CRUD) ───
export function useCreateItemType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { nameAr: string; nameEn: string; category: string; unitsPerBox: number }) => {
      const { data } = await api.post("/api/item-types", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-types"] });
    },
  });
}

export function useUpdateItemType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; nameAr?: string; nameEn?: string; category?: string; unitsPerBox?: number; isActive?: boolean; sortOrder?: number }) => {
      const { data } = await api.patch(`/api/item-types/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-types"] });
    },
  });
}

// ─── Grouped Transfers (Operations) ───
export function useGroupedTransfers() {
  return useQuery<{ pending: any[]; processed: any[] }>({
    queryKey: ["grouped-transfers"],
    queryFn: async () => {
      const { data } = await api.get("/api/warehouse-transfers/grouped");
      return data;
    },
  });
}

// ─── Mutations ───
export function useCreateInventoryRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateInventoryRequestBody) => {
      const { data } = await api.post("/api/inventory-requests", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-inventory-requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCreateWarehouseTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateWarehouseTransferBody) => {
      const { data } = await api.post("/api/warehouse-transfers", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, warehouseId, adminNotes }: { id: string; warehouseId: string; adminNotes?: string }) => {
      const { data } = await api.patch(`/api/inventory-requests/${id}/approve`, { warehouseId, adminNotes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervisor-inventory-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-inventory-requests"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["pending-requests-count"] });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, adminNotes }: { id: string; adminNotes: string }) => {
      const { data } = await api.patch(`/api/inventory-requests/${id}/reject`, { adminNotes });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supervisor-inventory-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-inventory-requests"] });
      queryClient.invalidateQueries({ queryKey: ["pending-requests-count"] });
    },
  });
}

export function useAcceptTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/warehouse-transfers/${id}/accept`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["my-fixed-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["my-moving-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useRejectTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.post(`/api/warehouse-transfers/${id}/reject`, { reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-transfers"] });
    },
  });
}

export function useAddStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity, reason }: { itemId: string; quantity: number; reason?: string }) => {
      const { data } = await api.post(`/api/inventory/${itemId}/add`, { quantity, reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useWithdrawStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity, reason }: { itemId: string; quantity: number; reason?: string }) => {
      const { data } = await api.post(`/api/inventory/${itemId}/withdraw`, { quantity, reason });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: Record<string, any>) => {
      const { data } = await api.post("/api/stock-transfer", body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-fixed-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["my-moving-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
    },
  });
}
