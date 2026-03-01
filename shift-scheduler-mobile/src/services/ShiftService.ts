import api from './api';
import {
  Shift,
  CreateShiftRequest,
  UpdateShiftRequest,
  ConfirmShiftRequest,
  GetShiftsResponse,
  GetUpcomingShiftsResponse,
  ApiResponse,
  ShiftFilters,
} from '../types';

/**
 * Shift Service
 * Handles all shift-related API calls
 */
export const shiftService = {
  /**
   * Fetch all shifts for current user
   * @param filters - Optional filters (startDate, endDate, limit, skip)
   * @returns Promise with shifts array and pagination info
   */
  async fetchAllShifts(filters?: ShiftFilters): Promise<GetShiftsResponse> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
    if (filters?.page) params.append('page', filters.page.toString());

    const queryString = params.toString();
    const response = await api.get<GetShiftsResponse>(
      `/shifts${queryString ? `?${queryString}` : ''}`
    );
    return response;
  },

  /**
   * Fetch upcoming shifts (next 30 days)
   * @returns Promise with shifts array
   */
  async fetchUpcomingShifts(): Promise<Shift[]> {
    const response = await api.get<GetUpcomingShiftsResponse>('/shifts/upcoming');
    return response.shifts;
  },

  /**
   * Fetch a single shift by ID
   * @param id - Shift ID
   * @returns Promise with shift data
   */
  async fetchShiftById(id: string): Promise<Shift> {
    const response = await api.get<{ success: boolean; shift: Shift }>(`/shifts/${id}`);
    return response.shift;
  },

  /**
   * Create a new shift
   * @param shiftData - Shift data to create
   * @returns Promise with created shift
   */
  async createShift(shiftData: CreateShiftRequest): Promise<Shift> {
    const response = await api.post<{ success: boolean; shift: Shift }>('/shifts', shiftData);
    return response.shift;
  },

  /**
   * Update an existing shift
   * @param id - Shift ID
   * @param shiftData - Shift data to update
   * @returns Promise with updated shift
   */
  async updateShift(id: string, shiftData: UpdateShiftRequest): Promise<Shift> {
    const response = await api.put<{ success: boolean; shift: Shift }>(`/shifts/${id}`, shiftData);
    return response.shift;
  },

  /**
   * Delete a shift
   * @param id - Shift ID
   * @returns Promise<void>
   */
  async deleteShift(id: string): Promise<void> {
    await api.delete(`/shifts/${id}`);
  },

  /**
   * Confirm an extracted shift and set alarm
   * @param id - Shift ID
   * @param reminderMinutesBefore - Optional reminder minutes before shift
   * @returns Promise with updated shift
   */
  async confirmShift(id: string, reminderMinutesBefore?: number): Promise<Shift> {
    const payload: ConfirmShiftRequest = {};
    if (reminderMinutesBefore !== undefined) {
      payload.reminderMinutesBefore = reminderMinutesBefore;
    }
    
    const response = await api.post<{ success: boolean; shift: Shift }>(
      `/shifts/${id}/confirm`,
      payload
    );
    return response.shift;
  },
};

// Export default for convenience
export default shiftService;
