import React, { createContext, useContext, useState, ReactNode } from 'react';
import { shiftService } from '../services';
import { Shift, CreateShiftRequest, UpdateShiftRequest } from '../types';

/**
 * ShiftContextType Interface
 * Defines the shape of the shift context
 */
interface ShiftContextType {
  shifts: Shift[];
  uploadedShifts: Shift[];
  loading: boolean;
  error: string | null;
  fetchAllShifts: () => Promise<void>;
  fetchUpcomingShifts: () => Promise<void>;
  addShift: (shift: CreateShiftRequest) => Promise<void>;
  updateShift: (id: string, shiftData: UpdateShiftRequest) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  setUploadedShifts: (shifts: Shift[]) => void;
  confirmShift: (id: string, reminderTime?: number) => Promise<void>;
}

/**
 * Create ShiftContext
 */
const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

/**
 * ShiftProvider Component
 * Manages shift state and provides shift methods to children
 */
export const ShiftProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State management
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [uploadedShifts, setUploadedShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all shifts for current user
   * Updates the shifts state with all user shifts
   */
  const fetchAllShifts = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await shiftService.fetchAllShifts();
      
      // Update shifts state with fetched data
      setShifts(response.shifts || []);
    } catch (error: any) {
      console.error('Error fetching all shifts:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to fetch shifts';
      setError(errorMessage);
      throw error; // Re-throw to allow component to handle
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch upcoming shifts (next 30 days)
   * Updates the shifts state with upcoming shifts only
   */
  const fetchUpcomingShifts = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const upcomingShifts = await shiftService.fetchUpcomingShifts();
      
      // Update shifts state with upcoming shifts
      setShifts(upcomingShifts);
    } catch (error: any) {
      console.error('Error fetching upcoming shifts:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to fetch upcoming shifts';
      setError(errorMessage);
      throw error; // Re-throw to allow component to handle
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new shift
   * Creates shift via API and adds it to the shifts state
   * @param shift - Shift data to create
   */
  const addShift = async (shift: CreateShiftRequest): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const newShift = await shiftService.createShift(shift);
      
      // Add new shift to the beginning of the shifts array
      setShifts((prevShifts) => [newShift, ...prevShifts]);
    } catch (error: any) {
      console.error('Error adding shift:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to create shift';
      setError(errorMessage);
      throw error; // Re-throw to allow component to handle
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing shift
   * Updates shift via API and updates it in the shifts state
   * @param id - Shift ID
   * @param shiftData - Shift data to update
   */
  const updateShift = async (id: string, shiftData: UpdateShiftRequest): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const updatedShift = await shiftService.updateShift(id, shiftData);
      
      // Update shift in the shifts array
      setShifts((prevShifts) =>
        prevShifts.map((shift) => (shift._id === id ? updatedShift : shift))
      );

      // Also update in uploadedShifts if it exists there
      setUploadedShifts((prevUploadedShifts) =>
        prevUploadedShifts.map((shift) => (shift._id === id ? updatedShift : shift))
      );
    } catch (error: any) {
      console.error('Error updating shift:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to update shift';
      setError(errorMessage);
      throw error; // Re-throw to allow component to handle
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a shift
   * Deletes shift via API and removes it from the shifts state
   * @param id - Shift ID
   */
  const deleteShift = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await shiftService.deleteShift(id);
      
      // Remove shift from the shifts array
      setShifts((prevShifts) => prevShifts.filter((shift) => shift._id !== id));

      // Also remove from uploadedShifts if it exists there
      setUploadedShifts((prevUploadedShifts) =>
        prevUploadedShifts.filter((shift) => shift._id !== id)
      );
    } catch (error: any) {
      console.error('Error deleting shift:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to delete shift';
      setError(errorMessage);
      throw error; // Re-throw to allow component to handle
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set uploaded shifts
   * Updates the uploadedShifts state (used after file upload)
   * @param shifts - Array of shifts extracted from uploaded file
   */
  const setUploadedShiftsHandler = (shifts: Shift[]): void => {
    try {
      setUploadedShifts(shifts);
      setError(null);
    } catch (error: any) {
      console.error('Error setting uploaded shifts:', error);
      setError('Failed to set uploaded shifts');
    }
  };

  /**
   * Confirm an extracted shift and set alarm
   * Confirms shift via API and updates it in both shifts and uploadedShifts
   * @param id - Shift ID
   * @param reminderTime - Optional reminder minutes before shift
   */
  const confirmShift = async (id: string, reminderTime?: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const confirmedShift = await shiftService.confirmShift(id, reminderTime);
      
      // Update shift in the shifts array
      setShifts((prevShifts) =>
        prevShifts.map((shift) => (shift._id === id ? confirmedShift : shift))
      );

      // Also update in uploadedShifts if it exists there
      setUploadedShifts((prevUploadedShifts) =>
        prevUploadedShifts.map((shift) => (shift._id === id ? confirmedShift : shift))
      );
    } catch (error: any) {
      console.error('Error confirming shift:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to confirm shift';
      setError(errorMessage);
      throw error; // Re-throw to allow component to handle
    } finally {
      setLoading(false);
    }
  };

  /**
   * Context value
   */
  const value: ShiftContextType = {
    shifts,
    uploadedShifts,
    loading,
    error,
    fetchAllShifts,
    fetchUpcomingShifts,
    addShift,
    updateShift,
    deleteShift,
    setUploadedShifts: setUploadedShiftsHandler,
    confirmShift,
  };

  return (
    <ShiftContext.Provider value={value}>
      {children}
    </ShiftContext.Provider>
  );
};

/**
 * useShifts Hook
 * Custom hook to access shift context
 * @returns ShiftContextType
 * @throws Error if used outside ShiftProvider
 */
export const useShifts = (): ShiftContextType => {
  const context = useContext(ShiftContext);
  
  if (context === undefined) {
    throw new Error('useShifts must be used within a ShiftProvider');
  }
  
  return context;
};

