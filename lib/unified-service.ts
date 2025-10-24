import { parseCSV } from "./csv-parser";
import { parseDevicesCSV } from "./device-parser";
import { getDevicesByUser } from "./device-service";
import type { Employee } from "./types";
import type { Device } from "./device-types";

// Unified interface combining employee and device data
export interface CompleteITProfile {
  [x: string]: unknown;
  user: {
    name: string;
    userId: string;
    email: string;
    status: string;
    role: string;
    workLocation: string;
  };
  softwareAccess: {
    total: number;
    activated: number;
    invited: number;
    deactivated: number;
    deleted: number;
    services: { name: string; status: string }[];
  };
  hardwareAssets: {
    total: number;
    laptops: number;
    monitors: number;
    others: number;
    devices: Device[];
  };
  complianceStatus: {
    allDevicesMDMEnrolled: boolean;
    hasActiveServices: boolean;
    hasAssignedDevices: boolean;
    score: number;
    issues: string[];
  };
}

export interface DeviceAssignmentMismatch {
  [x: string]: unknown;
  devicesAssignedToDeletedUsers: {
    device: Device;
    userEmail: string;
    userId: string;
    userName: string;
    userStatus: string;
    assignedDate: string;
    daysAssigned: number;
  }[];
  devicesAssignedToUnknownUsers: {
    device: Device;
    email: string;
  }[];
  employeesWithoutRequiredDevices: {
    name: string;
    email: string;
    userId: string;
    role: string;
    missingDevices: string[];
  }[];
}

export interface OnboardingChecklist {
  [x: string]: unknown;
  user: {
    name: string;
    userId: string;
    email: string;
    status: string;
    role: string;
  };
  checklist: {
    services: {
      required: string[];
      assigned: string[];
      missing: string[];
      status: "complete" | "incomplete";
    };
    devices: {
      required: string[];
      assigned: string[];
      missing: string[];
      status: "complete" | "incomplete";
    };
    completionPercentage: number;
  };
  recommendations: {
    availableDevices: Device[];
  };
}

export interface OffboardingChecklist {
  [x: string]: unknown;
  user: {
    name: string;
    userId: string;
    email: string;
    status: string;
  };
  checklist: {
    servicesDeactivated: number;
    servicesStillActive: number;
    devicesReturned: number;
    devicesStillAssigned: number;
    completionPercentage: number;
  };
  actionItems: string[];
  activeServices: string[];
  assignedDevices: Device[];
}

export function getCompleteITProfile(identifier: string): CompleteITProfile | null {
  // Import the smart identifier matching function
  const { findEmployeeByIdentifier } = require("./data-service");
  const employee = findEmployeeByIdentifier(identifier);

  if (!employee) return null;

  // Get software access
  const services: { name: string; status: string }[] = [];
  let activated = 0;
  let invited = 0;
  let deactivated = 0;
  let deleted = 0;

  for (const [serviceName, status] of Object.entries(employee.services)) {
    if (!status) continue;
    services.push({ name: serviceName, status: status as string });

    if (status === "Activated") activated++;
    else if (status === "Invited") invited++;
    else if (status === "Deactivated") deactivated++;
    else if (status === "Deleted") deleted++;
  }

  // Get hardware assets
  const devices = getDevicesByUser(employee.email);
  const laptops = devices.filter(d => d.deviceType === "Laptop").length;
  const monitors = devices.filter(d => d.deviceType === "Monitor" || d.deviceType === "Monitor 32 Inch").length;
  const others = devices.length - laptops - monitors;

  // Calculate compliance
  const laptopDevices = devices.filter(d => d.deviceType === "Laptop");
  const allDevicesMDMEnrolled = laptopDevices.length === 0 || laptopDevices.every(d => d.mdm === "Yes");
  const hasActiveServices = activated > 0;
  const hasAssignedDevices = devices.length > 0;

  const issues: string[] = [];
  if (!allDevicesMDMEnrolled) issues.push("Not all laptops enrolled in MDM");
  if (employee.status === "Active" && !hasActiveServices) issues.push("No active services");
  if (employee.status === "Active" && !hasAssignedDevices && employee.role.includes("IT")) {
    issues.push("IT staff without assigned devices");
  }
  if (employee.status === "Deleted" && hasActiveServices) issues.push("Deleted user with active services");
  if (employee.status === "Deleted" && hasAssignedDevices) issues.push("Deleted user with assigned devices");

  const score = Math.round(
    ((allDevicesMDMEnrolled ? 30 : 0) +
      (hasActiveServices && employee.status === "Active" ? 30 : 0) +
      (hasAssignedDevices && employee.status === "Active" ? 20 : 0) +
      (issues.length === 0 ? 20 : 0))
  );

  return {
    user: {
      name: `${employee.firstName} ${employee.lastName}`,
      userId: employee.userId,
      email: employee.email,
      status: employee.status,
      role: employee.role,
      workLocation: employee.workLocationCode,
    },
    softwareAccess: {
      total: services.length,
      activated,
      invited,
      deactivated,
      deleted,
      services,
    },
    hardwareAssets: {
      total: devices.length,
      laptops,
      monitors,
      others,
      devices,
    },
    complianceStatus: {
      allDevicesMDMEnrolled,
      hasActiveServices,
      hasAssignedDevices,
      score,
      issues,
    },
  };
}

export function auditDeviceAssignmentMismatch(): DeviceAssignmentMismatch {
  const employees = parseCSV();
  const devices = parseDevicesCSV();

  const employeeMap = new Map(employees.map(e => [e.email.toLowerCase(), e]));

  const devicesAssignedToDeletedUsers: DeviceAssignmentMismatch["devicesAssignedToDeletedUsers"] = [];
  const devicesAssignedToUnknownUsers: DeviceAssignmentMismatch["devicesAssignedToUnknownUsers"] = [];

  // Check devices assigned to deleted or unknown users
  for (const device of devices) {
    if (!device.assignedUserEmail || device.deviceStatus !== "In-use") continue;

    const employee = employeeMap.get(device.assignedUserEmail);

    if (!employee) {
      // Device assigned to unknown user
      devicesAssignedToUnknownUsers.push({
        device,
        email: device.assignedUserEmail,
      });
    } else if (employee.status === "Deleted") {
      // Device assigned to deleted user
      const assignedDate = device.assignedDate ? new Date(device.assignedDate) : new Date();
      const daysAssigned = Math.floor((Date.now() - assignedDate.getTime()) / (24 * 60 * 60 * 1000));

      devicesAssignedToDeletedUsers.push({
        device,
        userEmail: employee.email,
        userId: employee.userId,
        userName: `${employee.firstName} ${employee.lastName}`,
        userStatus: employee.status,
        assignedDate: device.assignedDate,
        daysAssigned,
      });
    }
  }

  // Check employees without required devices
  const employeesWithoutRequiredDevices: DeviceAssignmentMismatch["employeesWithoutRequiredDevices"] = [];

  for (const employee of employees) {
    if (employee.status !== "Active") continue;
    if (!employee.role.includes("IT")) continue; // Only check IT staff

    const userDevices = getDevicesByUser(employee.email);
    const hasLaptop = userDevices.some(d => d.deviceType === "Laptop");

    if (!hasLaptop) {
      employeesWithoutRequiredDevices.push({
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        userId: employee.userId,
        role: employee.role,
        missingDevices: ["Laptop"],
      });
    }
  }

  return {
    devicesAssignedToDeletedUsers,
    devicesAssignedToUnknownUsers,
    employeesWithoutRequiredDevices,
  };
}

export function getOnboardingChecklist(userEmail: string): OnboardingChecklist | null {
  const employees = parseCSV();
  const employee = employees.find(e => e.email.toLowerCase() === userEmail.toLowerCase());

  if (!employee) return null;

  // Define required services (customizable)
  const requiredServices = ["Slack", "Google Workspace - josys.com", "Microsoft 365 (Azure AD)"];
  const requiredDevices: string[] = ["Laptop"];

  const assignedServices: string[] = [];
  for (const [serviceName, status] of Object.entries(employee.services)) {
    if (status === "Activated" && requiredServices.includes(serviceName)) {
      assignedServices.push(serviceName);
    }
  }

  const missingServices = requiredServices.filter(s => !assignedServices.includes(s));

  const userDevices = getDevicesByUser(employee.email);
  const assignedDeviceTypes: string[] = [...new Set(userDevices.map(d => d.deviceType))];
  const missingDeviceTypes = requiredDevices.filter(d => !assignedDeviceTypes.includes(d));

  const totalItems = requiredServices.length + requiredDevices.length;
  const completedItems = assignedServices.length + (requiredDevices.length - missingDeviceTypes.length);
  const completionPercentage = Math.round((completedItems / totalItems) * 100);

  // Get available devices for recommendations
  const availableDevices = parseDevicesCSV().filter(
    d => d.deviceStatus === "Available" && d.deviceType === "Laptop"
  ).slice(0, 5);

  return {
    user: {
      name: `${employee.firstName} ${employee.lastName}`,
      userId: employee.userId,
      email: employee.email,
      status: employee.status,
      role: employee.role,
    },
    checklist: {
      services: {
        required: requiredServices,
        assigned: assignedServices,
        missing: missingServices,
        status: missingServices.length === 0 ? "complete" : "incomplete",
      },
      devices: {
        required: requiredDevices,
        assigned: assignedDeviceTypes,
        missing: missingDeviceTypes,
        status: missingDeviceTypes.length === 0 ? "complete" : "incomplete",
      },
      completionPercentage,
    },
    recommendations: {
      availableDevices,
    },
  };
}

export function getOffboardingChecklist(userEmail: string): OffboardingChecklist | null {
  const employees = parseCSV();
  const employee = employees.find(e => e.email.toLowerCase() === userEmail.toLowerCase());

  if (!employee) return null;

  // Count active services
  const activeServices: string[] = [];
  let deactivatedCount = 0;

  for (const [serviceName, status] of Object.entries(employee.services)) {
    if (status === "Activated" || status === "Invited") {
      activeServices.push(serviceName);
    } else if (status === "Deactivated" || status === "Deleted") {
      deactivatedCount++;
    }
  }

  // Get assigned devices
  const assignedDevices = getDevicesByUser(employee.email);
  
  // For deleted users, also check devices that might still show as assigned
  const allDevices = parseDevicesCSV();
  const devicesByEmail = allDevices.filter(
    d => d.assignedUserEmail.toLowerCase() === userEmail.toLowerCase()
  );

  const totalItems = Object.keys(employee.services).length + devicesByEmail.length;
  const completedItems = deactivatedCount + (devicesByEmail.length - assignedDevices.length);
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 100;

  // Generate action items
  const actionItems: string[] = [];
  activeServices.forEach(service => {
    actionItems.push(`Deactivate access to ${service}`);
  });
  assignedDevices.forEach(device => {
    actionItems.push(`Collect ${device.deviceType} (${device.assetNumber})`);
  });

  return {
    user: {
      name: `${employee.firstName} ${employee.lastName}`,
      userId: employee.userId,
      email: employee.email,
      status: employee.status,
    },
    checklist: {
      servicesDeactivated: deactivatedCount,
      servicesStillActive: activeServices.length,
      devicesReturned: devicesByEmail.length - assignedDevices.length,
      devicesStillAssigned: assignedDevices.length,
      completionPercentage,
    },
    actionItems,
    activeServices,
    assignedDevices,
  };
}

