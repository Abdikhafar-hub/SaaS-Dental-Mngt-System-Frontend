/**
 * Super Admin TypeScript Types
 * All types for Super Admin Dashboard
 */

// ============================================
// CLINICS
// ============================================

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  subdomain?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  status: 'active' | 'suspended' | 'inactive';
  subscriptionTier: string;
  maxUsers: number;
  maxPatients: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicStats {
  totalUsers: number;
  totalPatients: number;
  totalAppointments: number;
  totalInvoices: number;
  totalRevenue: number;
}

export interface ClinicAdmin {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
}

export interface ClinicWithStats extends Clinic {
  stats: ClinicStats;
  admin?: ClinicAdmin;
}

export interface CreateClinicData {
  name: string;
  slug?: string;
  subdomain?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  subscriptionTier?: string;
  maxUsers?: number;
  maxPatients?: number;
  adminEmail?: string;
  adminFullName?: string;
  adminPhone?: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateClinicData {
  name?: string;
  slug?: string;
  subdomain?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  status?: 'active' | 'suspended' | 'inactive';
  subscriptionTier?: string;
  maxUsers?: number;
  maxPatients?: number;
}

export interface ClinicsResponse {
  clinics: ClinicWithStats[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// BILLING
// ============================================

export interface Billing {
  id: string;
  clinicId: string;
  billingPeriod: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string | null;
  paidDate?: string | null;
  invoiceNumber: string;
  invoiceUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingWithClinic extends Billing {
  clinic: {
    id: string;
    name: string;
    email: string | null;
  };
}

export interface CreateBillingData {
  clinicId: string;
  billingPeriod: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  currency?: string;
  dueDate: string;
  notes?: string;
}

export interface UpdateBillingData {
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidDate?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  notes?: string;
}

export interface BillingResponse {
  billing: BillingWithClinic[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BillingStats {
  totalRevenue: number;
  pendingAmount: number;
  overdueAmount: number;
  totalBills: number;
  paidBills: number;
  pendingBills: number;
  overdueBills: number;
}

// ============================================
// ANALYTICS
// ============================================

export interface AnalyticsOverview {
  totalClinics: number;
  activeClinics: number;
  suspendedClinics: number;
  totalUsers: number;
  totalPatients: number;
  totalRevenue: number;
}

export interface ClinicAnalytics {
  id: string;
  name: string;
  status: string;
  totalUsers: number;
  totalPatients: number;
  totalRevenue: number;
  subscriptionTier: string;
}

export interface RevenueData {
  period: string;
  amount: number;
}

export interface GrowthData {
  period: string;
  count?: number;
  amount?: number;
}

export interface TopClinic {
  id: string;
  name: string;
  revenue: number;
  patients: number;
  users: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  clinics: ClinicAnalytics[];
  revenue: RevenueData[];
  growth: {
    clinics: GrowthData[];
    patients: GrowthData[];
    revenue: RevenueData[];
  };
  topClinics: TopClinic[];
}

export interface ClinicSpecificAnalytics {
  overview: {
    totalUsers: number;
    totalPatients: number;
    totalAppointments: number;
    totalRevenue: number;
  };
  recentActivity: {
    type: string;
    description: string;
    date: string;
  }[];
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  id: string;
  clinicId?: string | null;
  userId?: string | null;
  type: 'system' | 'billing' | 'clinic' | 'user';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string | null;
  metadata?: any;
  isRead: boolean;
  readAt?: string | null;
  sentAt: string;
  createdAt: string;
}

export interface NotificationWithRelations extends Notification {
  clinic?: {
    id: string;
    name: string;
  } | null;
  user?: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
}

export interface CreateNotificationData {
  clinicId?: string;
  userId?: string;
  type: 'system' | 'billing' | 'clinic' | 'user';
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: any;
}

export interface NotificationsResponse {
  notifications: NotificationWithRelations[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// MESSAGES
// ============================================

export interface Message {
  id: string;
  clinicId: string;
  fromUserId: string;
  toUserId?: string | null;
  subject: string;
  content: string;
  type: 'in_app' | 'email' | 'sms' | 'all';
  status: string;
  isRead: boolean;
  readAt?: string | null;
  sentAt: string;
  createdAt: string;
  metadata?: any;
}

export interface MessageWithRelations extends Message {
  clinic: {
    id: string;
    name: string;
  };
  fromUser?: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
  toUser?: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
}

export interface SendMessageData {
  clinicId: string;
  toUserId?: string;
  subject: string;
  content: string;
  type: 'in_app' | 'email' | 'sms' | 'all';
}

export interface MessagesResponse {
  messages: MessageWithRelations[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface ClinicFilters extends PaginationParams {
  status?: string;
  subscriptionTier?: string;
  search?: string;
}

export interface BillingFilters extends PaginationParams {
  clinicId?: string;
  status?: string;
  billingPeriod?: string;
  startDate?: string;
  endDate?: string;
}

export interface NotificationFilters extends PaginationParams {
  clinicId?: string;
  userId?: string;
  type?: string;
  isRead?: boolean;
  priority?: string;
}

export interface MessageFilters extends PaginationParams {
  clinicId?: string;
  fromUserId?: string;
  toUserId?: string;
  type?: string;
  status?: string;
  isRead?: boolean;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
}

