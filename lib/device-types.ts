export type DeviceStatus = "In-use" | "Available" | "Decommissioned" | "Unknown" | "";

export type DeviceType = 
  | "Laptop" 
  | "Monitor" 
  | "Monitor 32 Inch"
  | "Headset" 
  | "CCTV Camera" 
  | "TV" 
  | "Tablet" 
  | "Printer" 
  | "Speaker"
  | "Jabra Speaker"
  | "Jabra Speak 510 UC"
  | "Pendrive"
  | "Netgear ORBI"
  | "Fridge"
  | "Head Set"
  | "Speakar"
  | "ノートPC"
  | "";

export type MDMStatus = "Yes" | "No" | "Not Applicable" | "Need to Confirm" | "";

export type AssetStatus = "New" | "Used" | "";

export interface Device {
  assetNumber: string;
  deviceStatus: DeviceStatus;
  deviceType: DeviceType;
  manufacturer: string;
  modelNumber: string;
  modelName: string;
  operatingSystem: string;
  serialNumber: string;
  deviceProcurement: string;
  startDate: string;
  endDate: string;
  additionalInformation: string;
  assignedUserId: string;
  assignedUserEmail: string;
  assignedDate: string;
  unassignedDate: string;
  mdm: MDMStatus;
  vendor: string;
  appleCare: string;
  assetStatus: AssetStatus;
  city: string;
  color: string;
  region: string;
}

export interface DeviceSummary {
  total: number;
  inUse: number;
  available: number;
  decommissioned: number;
  unknown: number;
  byType: Record<string, number>;
  byManufacturer: Record<string, number>;
  mdmEnrolled: number;
  mdmUnenrolled: number;
}

export interface UserDevices {
  [x: string]: unknown;
  userEmail: string;
  userId: string;
  userName: string;
  devices: Device[];
  summary: {
    total: number;
    laptops: number;
    monitors: number;
    others: number;
    allMDMEnrolled: boolean;
    hasActiveWarranty: boolean;
  };
}

export interface DeviceAssignmentIssue {
  [x: string]: unknown;
  device: Device;
  issue: string;
  severity: "high" | "medium" | "low";
  userStatus?: string;
  daysUnresolved?: number;
}

export interface WarrantyAlert {
  [x: string]: unknown;
  device: Device;
  warrantyEndDate: string;
  daysUntilExpiry: number;
  assignedUser?: string;
}

export interface DeviceLifecycleStats {
  [x: string]: unknown;
  totalDevices: number;
  byType: Record<string, {
    total: number;
    manufacturers: Record<string, number>;
    averageAge: number;
    dueForRefresh: number;
  }>;
  procurement: Record<string, number>;
  refreshRecommendations: {
    deviceType: string;
    manufacturer: string;
    count: number;
    reason: string;
    estimatedCost: string;
  }[];
}

