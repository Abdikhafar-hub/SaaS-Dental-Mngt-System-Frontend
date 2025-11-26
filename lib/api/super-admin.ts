/**
 * Super Admin API Service
 * All API calls for Super Admin Dashboard
 */

import api from '@/lib/axiosConfig';
import type {
  ClinicWithStats,
  CreateClinicData,
  UpdateClinicData,
  ClinicsResponse,
  BillingWithClinic,
  CreateBillingData,
  UpdateBillingData,
  BillingResponse,
  BillingStats,
  AnalyticsData,
  ClinicSpecificAnalytics,
  NotificationWithRelations,
  CreateNotificationData,
  NotificationsResponse,
  MessageWithRelations,
  SendMessageData,
  MessagesResponse,
  ApiResponse,
  ClinicFilters,
  BillingFilters,
  NotificationFilters,
  MessageFilters,
  AnalyticsFilters,
} from '@/types/super-admin';

// ============================================
// CLINICS
// ============================================

export const superAdminApi = {
  /**
   * Create new clinic
   */
  createClinic: async (data: CreateClinicData): Promise<ClinicWithStats> => {
    const response = await api.post<ApiResponse<ClinicWithStats>>('/super-admin/clinics', data);
    return response.data.data;
  },

  /**
   * Get all clinics with filters
   */
  getClinics: async (filters?: ClinicFilters): Promise<ClinicsResponse> => {
    const response = await api.get<ApiResponse<ClinicsResponse>>('/super-admin/clinics', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Get clinic by ID
   */
  getClinicById: async (id: string): Promise<ClinicWithStats> => {
    const response = await api.get<ApiResponse<ClinicWithStats>>(`/super-admin/clinics/${id}`);
    return response.data.data;
  },

  /**
   * Update clinic
   */
  updateClinic: async (id: string, data: UpdateClinicData): Promise<ClinicWithStats> => {
    const response = await api.put<ApiResponse<ClinicWithStats>>(`/super-admin/clinics/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete clinic
   */
  deleteClinic: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/super-admin/clinics/${id}`);
    return response.data.data;
  },

  /**
   * Suspend clinic
   */
  suspendClinic: async (id: string): Promise<ClinicWithStats> => {
    const response = await api.post<ApiResponse<ClinicWithStats>>(`/super-admin/clinics/${id}/suspend`);
    return response.data.data;
  },

  /**
   * Activate clinic
   */
  activateClinic: async (id: string): Promise<ClinicWithStats> => {
    const response = await api.post<ApiResponse<ClinicWithStats>>(`/super-admin/clinics/${id}/activate`);
    return response.data.data;
  },

  /**
   * Assign admin to clinic
   */
  assignAdmin: async (
    clinicId: string,
    adminData: {
      email: string;
      fullName?: string;
      phone?: string;
      password?: string;
      sendWelcomeEmail?: boolean;
    }
  ): Promise<any> => {
    const response = await api.post<ApiResponse<any>>(`/super-admin/clinics/${clinicId}/assign-admin`, adminData);
    return response.data.data;
  },

  // ============================================
  // BILLING
  // ============================================

  /**
   * Create billing record
   */
  createBilling: async (data: CreateBillingData): Promise<BillingWithClinic> => {
    const response = await api.post<ApiResponse<BillingWithClinic>>('/super-admin/billing', data);
    return response.data.data;
  },

  /**
   * Get all billing records
   */
  getBilling: async (filters?: BillingFilters): Promise<BillingResponse> => {
    const response = await api.get<ApiResponse<BillingResponse>>('/super-admin/billing', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Get billing by ID
   */
  getBillingById: async (id: string): Promise<BillingWithClinic> => {
    const response = await api.get<ApiResponse<BillingWithClinic>>(`/super-admin/billing/${id}`);
    return response.data.data;
  },

  /**
   * Update billing record
   */
  updateBilling: async (id: string, data: UpdateBillingData): Promise<BillingWithClinic> => {
    const response = await api.put<ApiResponse<BillingWithClinic>>(`/super-admin/billing/${id}`, data);
    return response.data.data;
  },

  /**
   * Mark billing as paid
   */
  markBillingAsPaid: async (id: string, paymentMethod: string, paidDate?: string): Promise<BillingWithClinic> => {
    const response = await api.post<ApiResponse<BillingWithClinic>>(`/super-admin/billing/${id}/mark-paid`, {
      paymentMethod,
      paidDate,
    });
    return response.data.data;
  },

  /**
   * Get billing statistics
   */
  getBillingStats: async (filters?: { startDate?: string; endDate?: string; clinicId?: string }): Promise<BillingStats> => {
    const response = await api.get<ApiResponse<BillingStats>>('/super-admin/billing/stats', {
      params: filters,
    });
    return response.data.data;
  },

  // ============================================
  // ANALYTICS
  // ============================================

  /**
   * Get comprehensive analytics
   */
  getAnalytics: async (filters?: AnalyticsFilters): Promise<AnalyticsData> => {
    const response = await api.get<ApiResponse<AnalyticsData>>('/super-admin/analytics', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Get clinic-specific analytics
   */
  getClinicAnalytics: async (clinicId: string): Promise<ClinicSpecificAnalytics> => {
    const response = await api.get<ApiResponse<ClinicSpecificAnalytics>>(`/super-admin/analytics/clinics/${clinicId}`);
    return response.data.data;
  },

  // ============================================
  // NOTIFICATIONS
  // ============================================

  /**
   * Get all notifications
   */
  getNotifications: async (filters?: NotificationFilters): Promise<NotificationsResponse> => {
    const response = await api.get<ApiResponse<NotificationsResponse>>('/super-admin/notifications', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Get notification by ID
   */
  getNotificationById: async (id: string): Promise<NotificationWithRelations> => {
    const response = await api.get<ApiResponse<NotificationWithRelations>>(`/super-admin/notifications/${id}`);
    return response.data.data;
  },

  /**
   * Mark notification as read
   */
  markNotificationAsRead: async (id: string): Promise<NotificationWithRelations> => {
    const response = await api.post<ApiResponse<NotificationWithRelations>>(`/super-admin/notifications/${id}/read`);
    return response.data.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead: async (filters?: { clinicId?: string; userId?: string }): Promise<number> => {
    const response = await api.post<ApiResponse<{ count: number }>>('/super-admin/notifications/read-all', filters);
    return response.data.data.count;
  },

  // ============================================
  // MESSAGING
  // ============================================

  /**
   * Send message to clinic admin(s)
   */
  sendMessage: async (data: SendMessageData): Promise<MessageWithRelations[]> => {
    const response = await api.post<ApiResponse<MessageWithRelations[]>>('/super-admin/messages', data);
    return response.data.data;
  },

  /**
   * Get all messages
   */
  getMessages: async (filters?: MessageFilters): Promise<MessagesResponse> => {
    const response = await api.get<ApiResponse<MessagesResponse>>('/super-admin/messages', {
      params: filters,
    });
    return response.data.data;
  },

  /**
   * Get message by ID
   */
  getMessageById: async (id: string): Promise<MessageWithRelations> => {
    const response = await api.get<ApiResponse<MessageWithRelations>>(`/super-admin/messages/${id}`);
    return response.data.data;
  },

  /**
   * Mark message as read
   */
  markMessageAsRead: async (id: string): Promise<MessageWithRelations> => {
    const response = await api.post<ApiResponse<MessageWithRelations>>(`/super-admin/messages/${id}/read`);
    return response.data.data;
  },
};

export default superAdminApi;

