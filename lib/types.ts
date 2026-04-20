/**
 * Shared TypeScript types for STOCKPRO Mobile
 * Mirrors the backend schema exactly
 */

export type UserRole = "admin" | "supervisor" | "technician";

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  profileImage: string | null;
  role: UserRole;
  regionId: string | null;
  isActive: boolean;
  city: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
  message: string;
}

export interface AuthMeResponse {
  user: User;
}

// ─── Dashboard ───
export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  todayTransactions: number;
}

export interface AdminStats {
  totalRegions: number;
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  recentTransactions: TransactionWithDetails[];
}

// ─── Inventory ───
export type InventoryStatus = "available" | "low" | "out";
export type InventoryType = "devices" | "sim" | "papers";

export interface InventoryItem {
  id: string;
  name: string;
  type: InventoryType;
  unit: string;
  quantity: number;
  minThreshold: number;
  technicianName: string | null;
  city: string | null;
  regionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemWithStatus extends InventoryItem {
  regionName: string;
  status: InventoryStatus;
}

// ─── Item Types ───
export type ItemCategory = "devices" | "papers" | "sim" | "accessories";

export interface ItemType {
  id: string;
  nameAr: string;
  nameEn: string;
  category: ItemCategory;
  unitsPerBox: number;
  isActive: boolean;
  sortOrder: number;
  icon: string | null;
  color: string | null;
}

// ─── Technician Inventory ───
export interface InventoryFields {
  n950Boxes: number;
  n950Units: number;
  i9000sBoxes: number;
  i9000sUnits: number;
  i9100Boxes: number;
  i9100Units: number;
  rollPaperBoxes: number;
  rollPaperUnits: number;
  stickersBoxes: number;
  stickersUnits: number;
  newBatteriesBoxes: number;
  newBatteriesUnits: number;
  mobilySimBoxes: number;
  mobilySimUnits: number;
  stcSimBoxes: number;
  stcSimUnits: number;
  zainSimBoxes: number;
  zainSimUnits: number;
  lebaraBoxes: number;
  lebaraUnits: number;
}

export interface TechnicianFixedInventory extends InventoryFields {
  id: string;
  technicianId: string;
  lowStockThreshold: number;
  criticalStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryEntry {
  id: string;
  technicianId?: string;
  warehouseId?: string;
  itemTypeId: string;
  boxes: number;
  units: number;
  updatedAt: string;
}

export interface TechnicianMovingInventory extends InventoryFields {
  id: string;
  technicianName: string;
  city: string;
  notes: string | null;
  createdBy: string;
  regionId: string;
  createdAt: string;
  updatedAt: string;
  entries: InventoryEntry[];
}

// ─── Warehouses ───
export interface Warehouse {
  id: string;
  name: string;
  location: string;
  description: string | null;
  isActive: boolean;
  createdBy: string;
  regionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseWithStats extends Warehouse {
  creatorName: string;
  inventory: (InventoryFields & { id: string; warehouseId: string; updatedAt: string }) | null;
  totalItems: number;
  lowStockItemsCount: number;
}

// ─── Transactions ───
export interface TransactionWithDetails {
  id: string;
  itemId: string;
  userId: string | null;
  type: "add" | "withdraw";
  quantity: number;
  reason: string | null;
  createdAt: string;
  itemName: string;
  userName: string;
  regionName: string;
}

export interface TransactionsResponse {
  transactions: TransactionWithDetails[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TransactionStatistics {
  totalTransactions: number;
  totalAdditions: number;
  totalWithdrawals: number;
  totalAddedQuantity: number;
  totalWithdrawnQuantity: number;
  byRegion: { regionName: string; count: number }[];
  byUser: { userName: string; count: number }[];
  dailyTransactions: { date: string; count: number }[];
}

// ─── Stock Movements ───
export interface StockMovement {
  id: string;
  technicianId: string;
  itemType: string;
  packagingType: "box" | "unit";
  quantity: number;
  fromInventory: "fixed" | "moving";
  toInventory: "fixed" | "moving";
  reason: string | null;
  performedBy: string;
  notes: string | null;
  createdAt: string;
  performerName: string;
  technicianName: string;
}

// ─── All Technicians Overview (Admin/Supervisor) ───
export interface TechnicianOverview {
  technicianId: string;
  technicianName: string;
  city: string;
  regionId: string;
  fixedInventory: (TechnicianFixedInventory & { entries: InventoryEntry[] }) | null;
  movingInventory: (TechnicianMovingInventory & { entries: InventoryEntry[] }) | null;
  alertLevel: "good" | "warning" | "critical";
}

// ─── Regions ───
export interface Region {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ───
export interface ApiError {
  message: string;
  status?: number;
}

export const ROLE_LEVELS: Record<UserRole, number> = {
  admin: 3,
  supervisor: 2,
  technician: 1,
};

export function hasRoleOrAbove(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole];
}

// ─── Warehouse Transfers ───
export type TransferStatus = "pending" | "accepted" | "rejected";

export interface WarehouseTransfer {
  id: string;
  requestId: string | null;
  warehouseId: string;
  technicianId: string;
  itemType: string;
  packagingType: "box" | "unit";
  quantity: number;
  performedBy: string;
  notes: string | null;
  status: TransferStatus;
  rejectionReason: string | null;
  respondedAt: string | null;
  createdAt: string;
  warehouseName?: string;
  technicianName?: string;
  performedByName?: string;
  itemNameAr?: string;
}

// ─── Inventory Requests ───
export type RequestStatus = "pending" | "approved" | "rejected";

export interface InventoryRequest {
  id: string;
  technicianId: string;
  warehouseId: string | null;
  n950Boxes: number;
  n950Units: number;
  i9000sBoxes: number;
  i9000sUnits: number;
  i9100Boxes: number;
  i9100Units: number;
  rollPaperBoxes: number;
  rollPaperUnits: number;
  stickersBoxes: number;
  stickersUnits: number;
  newBatteriesBoxes: number;
  newBatteriesUnits: number;
  mobilySimBoxes: number;
  mobilySimUnits: number;
  stcSimBoxes: number;
  stcSimUnits: number;
  zainSimBoxes: number;
  zainSimUnits: number;
  lebaraBoxes: number;
  lebaraUnits: number;
  notes: string | null;
  status: RequestStatus;
  adminNotes: string | null;
  respondedBy: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export interface CreateInventoryRequestBody {
  n950Boxes?: number;
  n950Units?: number;
  i9000sBoxes?: number;
  i9000sUnits?: number;
  i9100Boxes?: number;
  i9100Units?: number;
  rollPaperBoxes?: number;
  rollPaperUnits?: number;
  stickersBoxes?: number;
  stickersUnits?: number;
  newBatteriesBoxes?: number;
  newBatteriesUnits?: number;
  mobilySimBoxes?: number;
  mobilySimUnits?: number;
  stcSimBoxes?: number;
  stcSimUnits?: number;
  zainSimBoxes?: number;
  zainSimUnits?: number;
  lebaraBoxes?: number;
  lebaraUnits?: number;
  warehouseId?: string;
  notes?: string;
}

export interface CreateWarehouseTransferBody {
  warehouseId: string;
  technicianId: string;
  notes?: string;
  [key: string]: string | number | undefined;
}

// ─── Item definitions for forms ───
export interface ItemDefinition {
  key: string;
  nameAr: string;
  category: "devices" | "papers" | "sim";
  icon: string;
}

export const ITEM_DEFINITIONS: ItemDefinition[] = [
  { key: "n950", nameAr: "جهاز N950", category: "devices", icon: "phone-portrait-outline" },
  { key: "i9000s", nameAr: "جهاز I9000S", category: "devices", icon: "phone-portrait-outline" },
  { key: "i9100", nameAr: "جهاز I9100", category: "devices", icon: "phone-portrait-outline" },
  { key: "rollPaper", nameAr: "ورق حراري", category: "papers", icon: "document-text-outline" },
  { key: "stickers", nameAr: "ملصقات", category: "papers", icon: "pricetag-outline" },
  { key: "newBatteries", nameAr: "بطاريات جديدة", category: "devices", icon: "battery-charging-outline" },
  { key: "mobilySim", nameAr: "شريحة موبايلي", category: "sim", icon: "card-outline" },
  { key: "stcSim", nameAr: "شريحة STC", category: "sim", icon: "card-outline" },
  { key: "zainSim", nameAr: "شريحة زين", category: "sim", icon: "card-outline" },
  { key: "lebara", nameAr: "شريحة ليبارا", category: "sim", icon: "card-outline" },
];
