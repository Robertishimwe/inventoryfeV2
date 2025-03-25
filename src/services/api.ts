import axios from 'axios';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, format } from 'date-fns';

const API_URL = 'https://hardwarems-3.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Token = token;
  }
  return config;
});

export interface Product {
  id: number;
  ProductName: string;
  Description: string;
  Category: string;
  Supplier: string;
  Unit: string;
  buying_price: string;
  selling_price: string;
  Quantity: string;
  MinimumStockLevel: string;
  LastRestockDate: string;
  LastUpdatedBy: number;
}

export interface Category {
  id: number;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  productName: string;
  currentStock: number;
  minimumStockLevel: number;
  status: string;
}

export interface SystemSettings {
  id: number;
  currency: string;
  organization_name: string;
  location: string;
  organization_email: string;
  organization_phone: string;
  TIN: string | null;
  updatedBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  monthlyPurchases: number;
  monthlySales: number;
  dailySales: number;
  estimatedProfit: {
    totalRevenue: string;
    totalCost: string;
    estimatedProfit: string;
    profitMargin: string;
  };
  lowStockItems: InventoryItem[];
}

export interface SaleItem {
  productId: number;
  amount: number;
  final_price: string;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const response = await api.get('/settings/get');
  return response.data.setting;
}

export async function getDashboardData(): Promise<DashboardData> {
  const today = new Date();
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
  const dayStart = format(startOfDay(today), 'yyyy-MM-dd');
  const dayEnd = format(endOfDay(today), 'yyyy-MM-dd');

  const [purchases, sales, dailySales, profit, inventory] = await Promise.all([
    api.get(`/dashboard/getPurchasesByDate?startDate=${monthStart}&endDate=${monthEnd}`),
    api.get(`/dashboard/getSalesByDate?startDate=${monthStart}&endDate=${monthEnd}`),
    api.get(`/dashboard/getSalesByDate?startDate=${dayStart}&endDate=${dayEnd}`),
    api.get(`/report/estimated-profit?startDate=${monthStart}&endDate=${monthEnd}`),
    api.get('/report/inventory-status'),
  ]);

  const lowStockItems = inventory.data.data.filter(
    (item: InventoryItem) => item.status === 'Low Stock'
  );

  return {
    monthlyPurchases: purchases.data.sales,
    monthlySales: sales.data.sales,
    dailySales: dailySales.data.sales,
    estimatedProfit: profit.data.data,
    lowStockItems,
  };
}

export async function getProducts(): Promise<Product[]> {
  const response = await api.get('/product');
  return response.data;
}

export async function getCategories(): Promise<Category[]> {
  const response = await api.get('/category/getAll');
  return response.data.categories;
}

export async function completeSale(items: SaleItem[]): Promise<any> {
  const response = await api.patch('/stock/dedact', items);
  return response.data;
}