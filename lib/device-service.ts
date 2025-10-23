import { parseDevicesCSV, getDeviceTypes, getManufacturers } from "./device-parser";
import type {
  Device,
  DeviceSummary,
  UserDevices,
  DeviceAssignmentIssue,
  WarrantyAlert,
  DeviceLifecycleStats,
} from "./device-types";

export function searchDevice(query: string): Device[] {
  const devices = parseDevicesCSV();
  const lowerQuery = query.toLowerCase();

  return devices.filter((device) => {
    return (
      device.assetNumber.toLowerCase().includes(lowerQuery) ||
      device.serialNumber.toLowerCase().includes(lowerQuery) ||
      device.modelName.toLowerCase().includes(lowerQuery) ||
      device.modelNumber.toLowerCase().includes(lowerQuery) ||
      device.manufacturer.toLowerCase().includes(lowerQuery) ||
      device.assignedUserEmail.toLowerCase().includes(lowerQuery) ||
      device.assignedUserId.toLowerCase().includes(lowerQuery)
    );
  });
}

export function getDevicesByUser(email: string): Device[] {
  const devices = parseDevicesCSV();
  const normalizedEmail = email.toLowerCase();

  return devices.filter(
    (device) => device.assignedUserEmail === normalizedEmail && device.deviceStatus === "In-use"
  );
}

export function getUserDevices(email: string): UserDevices | null {
  const devices = getDevicesByUser(email);
  
  if (devices.length === 0) {
    return null;
  }

  const laptops = devices.filter(d => d.deviceType === "Laptop").length;
  const monitors = devices.filter(d => d.deviceType === "Monitor" || d.deviceType === "Monitor 32 Inch").length;
  const others = devices.length - laptops - monitors;

  const allMDMEnrolled = devices
    .filter(d => d.deviceType === "Laptop")
    .every(d => d.mdm === "Yes");

  const hasActiveWarranty = devices.some(d => 
    d.appleCare === "Yes" || 
    (d.endDate && new Date(d.endDate) > new Date())
  );

  return {
    userEmail: email,
    userId: devices[0]?.assignedUserId || "",
    userName: "", // Will be populated by unified service
    devices,
    summary: {
      total: devices.length,
      laptops,
      monitors,
      others,
      allMDMEnrolled,
      hasActiveWarranty,
    },
  };
}

export function getAvailableDevices(deviceType?: string, manufacturer?: string): Device[] {
  const devices = parseDevicesCSV();

  return devices.filter((device) => {
    if (device.deviceStatus !== "Available") return false;
    if (deviceType && device.deviceType !== deviceType) return false;
    if (manufacturer && device.manufacturer !== manufacturer) return false;
    return true;
  });
}

export function getDeviceSummary(): DeviceSummary {
  const devices = parseDevicesCSV();

  const byType: Record<string, number> = {};
  const byManufacturer: Record<string, number> = {};

  let inUse = 0;
  let available = 0;
  let decommissioned = 0;
  let unknown = 0;
  let mdmEnrolled = 0;
  let mdmUnenrolled = 0;

  for (const device of devices) {
    // Count by status
    switch (device.deviceStatus) {
      case "In-use":
        inUse++;
        break;
      case "Available":
        available++;
        break;
      case "Decommissioned":
        decommissioned++;
        break;
      case "Unknown":
        unknown++;
        break;
    }

    // Count by type
    if (device.deviceType) {
      byType[device.deviceType] = (byType[device.deviceType] || 0) + 1;
    }

    // Count by manufacturer
    if (device.manufacturer) {
      byManufacturer[device.manufacturer] = (byManufacturer[device.manufacturer] || 0) + 1;
    }

    // MDM status (only for laptops)
    if (device.deviceType === "Laptop") {
      if (device.mdm === "Yes") {
        mdmEnrolled++;
      } else if (device.mdm === "No") {
        mdmUnenrolled++;
      }
    }
  }

  return {
    total: devices.length,
    inUse,
    available,
    decommissioned,
    unknown,
    byType,
    byManufacturer,
    mdmEnrolled,
    mdmUnenrolled,
  };
}

export function auditDeviceAssignments(): DeviceAssignmentIssue[] {
  const devices = parseDevicesCSV();
  const issues: DeviceAssignmentIssue[] = [];

  for (const device of devices) {
    // Issue: Device marked as "Available" but has assigned user
    if (device.deviceStatus === "Available" && device.assignedUserEmail) {
      issues.push({
        device,
        issue: "Device marked as Available but has assigned user",
        severity: "medium",
      });
    }

    // Issue: Device marked as "In-use" but no assigned user
    if (device.deviceStatus === "In-use" && !device.assignedUserEmail) {
      issues.push({
        device,
        issue: "Device marked as In-use but has no assigned user",
        severity: "medium",
      });
    }

    // Issue: Laptop not enrolled in MDM
    if (device.deviceType === "Laptop" && device.deviceStatus === "In-use" && device.mdm === "No") {
      issues.push({
        device,
        issue: "Laptop not enrolled in MDM (Security Risk)",
        severity: "high",
      });
    }

    // Issue: Decommissioned device still assigned
    if (device.deviceStatus === "Decommissioned" && device.assignedUserEmail) {
      issues.push({
        device,
        issue: "Decommissioned device still showing as assigned",
        severity: "high",
      });
    }
  }

  return issues.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

export function getWarrantyExpiringDevices(daysThreshold: number = 90): WarrantyAlert[] {
  const devices = parseDevicesCSV();
  const alerts: WarrantyAlert[] = [];
  const today = new Date();
  const thresholdDate = new Date(today.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  for (const device of devices) {
    if (!device.endDate || device.deviceStatus === "Decommissioned") continue;

    const endDate = new Date(device.endDate);
    if (endDate <= thresholdDate && endDate >= today) {
      const daysUntilExpiry = Math.floor((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

      alerts.push({
        device,
        warrantyEndDate: device.endDate,
        daysUntilExpiry,
        assignedUser: device.assignedUserEmail || undefined,
      });
    }
  }

  return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

export function getDevicesByLocation(city?: string): Record<string, Device[]> {
  const devices = parseDevicesCSV();
  const byLocation: Record<string, Device[]> = {};

  for (const device of devices) {
    const location = device.city || "Unknown";
    
    if (city && location !== city) continue;

    if (!byLocation[location]) {
      byLocation[location] = [];
    }
    byLocation[location].push(device);
  }

  return byLocation;
}

export function getDeviceLifecycleStats(): DeviceLifecycleStats {
  const devices = parseDevicesCSV();
  const today = new Date();

  const byType: Record<string, any> = {};
  const procurement: Record<string, number> = {};
  const refreshRecommendations: DeviceLifecycleStats["refreshRecommendations"] = [];

  // Analyze by type
  for (const device of devices) {
    const type = device.deviceType || "Unknown";

    if (!byType[type]) {
      byType[type] = {
        total: 0,
        manufacturers: {},
        ages: [] as number[],
        dueForRefresh: 0,
      };
    }

    byType[type].total++;

    // Track manufacturers
    if (device.manufacturer) {
      byType[type].manufacturers[device.manufacturer] = 
        (byType[type].manufacturers[device.manufacturer] || 0) + 1;
    }

    // Calculate age
    if (device.startDate) {
      const startDate = new Date(device.startDate);
      const age = (today.getTime() - startDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
      byType[type].ages.push(age);

      // Check if due for refresh (> 3 years for laptops)
      if (type === "Laptop" && age > 3 && device.deviceStatus !== "Decommissioned") {
        byType[type].dueForRefresh++;
      }
    }

    // Track procurement by year
    if (device.startDate) {
      const year = device.startDate.split("-")[0];
      if (year && year.length === 4) {
        procurement[year] = (procurement[year] || 0) + 1;
      }
    }
  }

  // Calculate average ages
  for (const type in byType) {
    const ages = byType[type].ages;
    byType[type].averageAge = ages.length > 0
      ? ages.reduce((a: number, b: number) => a + b, 0) / ages.length
      : 0;
    delete byType[type].ages; // Remove temporary data
  }

  // Generate recommendations for laptops
  if (byType["Laptop"] && byType["Laptop"].dueForRefresh > 0) {
    refreshRecommendations.push({
      deviceType: "Laptop",
      manufacturer: "Various",
      count: byType["Laptop"].dueForRefresh,
      reason: "Over 3 years old",
      estimatedCost: `$${(byType["Laptop"].dueForRefresh * 2000).toLocaleString()}`,
    });
  }

  return {
    totalDevices: devices.length,
    byType,
    procurement,
    refreshRecommendations,
  };
}

export function getAllDeviceTypes(): string[] {
  return getDeviceTypes();
}

export function getAllManufacturers(): string[] {
  return getManufacturers();
}

