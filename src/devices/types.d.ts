import type { MeasurementType } from '@prisma/client';

export type Device = {
  id: string;
  title: string;
  description: string | null;
  serial_number: string;
  uri: string | null;
  category: MeasurementType;
  created_by: {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
  };
  patient_devices: PatientDevices[];
  created_at: Date;
  updated_at: Date | null;
};

type PatientDevices = {
  issued_to: {
    user: {
      id: string;
      first_name: string;
      middle_name: string | null;
      last_name: string;
      email: string;
    };
  };
  issued_by: {
    id: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
  };
  issued_at: Date;
};

/**
 * Result of Vivalink device sync operation
 */
export interface VivalinkDeviceSyncResult {
  attempted: boolean;
  success: boolean;
  error?: string;
  syncedAt?: Date;
}

/**
 * Result of device creation with Vivalink sync status
 */
export interface AddDeviceResult {
  success: boolean;
  deviceId: string;
  cardiacMonitoring: import('@prisma/client').VivalinkSyncStatus;
  vivalinkSync: VivalinkDeviceSyncResult;
}

/**
 * Result of manual Vivalink sync trigger for device
 */
export interface TriggerDeviceVivalinkSyncResult {
  success: boolean;
  error?: string;
  syncedAt?: Date;
}

/**
 * Result of Vivalink device-patient assignment sync
 */
export interface VivalinkAssignmentSyncResult {
  attempted: boolean;
  success: boolean;
  error?: string;
  syncedAt?: Date;
}

/**
 * Result of device assignment to patient with Vivalink sync
 */
export interface AssignDeviceResult {
  success: boolean;
  patientDeviceId: string | null;
  vivalinkSync: VivalinkAssignmentSyncResult;
}
/**
 * Result of managing device assignments with Vivalink sync
 */
export interface ManageDeviceResult {
  success: boolean;
  patientDevices?: { id: string; issued_to_user_id: string }[];
  error?: string;
  vivalinkSync: VivalinkAssignmentSyncResult;
}
