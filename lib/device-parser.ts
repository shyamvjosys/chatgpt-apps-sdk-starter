import { readFileSync } from "fs";
import { join } from "path";
import type { Device, DeviceStatus, DeviceType, MDMStatus, AssetStatus } from "./device-types";

const CSV_PATH = join(process.cwd(), "data", "josys-devices.csv");

let cachedDevices: Device[] | null = null;

export function parseDevicesCSV(): Device[] {
  if (cachedDevices) {
    return cachedDevices;
  }

  const fileContent = readFileSync(CSV_PATH, "utf-8");
  const lines = fileContent.split("\n").filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }

  // Skip header
  const devices: Device[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < 22) continue;

    devices.push({
      assetNumber: values[0]?.trim() || "",
      deviceStatus: (values[1]?.trim() || "") as DeviceStatus,
      deviceType: (values[2]?.trim() || "") as DeviceType,
      manufacturer: values[3]?.trim() || "",
      modelNumber: values[4]?.trim() || "",
      modelName: values[5]?.trim() || "",
      operatingSystem: values[6]?.trim() || "",
      serialNumber: values[7]?.trim() || "",
      deviceProcurement: values[8]?.trim() || "",
      startDate: values[9]?.trim() || "",
      endDate: values[10]?.trim() || "",
      additionalInformation: values[11]?.trim() || "",
      assignedUserId: values[12]?.trim() || "",
      assignedUserEmail: values[13]?.trim().toLowerCase() || "", // Normalize email
      assignedDate: values[14]?.trim() || "",
      unassignedDate: values[15]?.trim() || "",
      mdm: (values[16]?.trim() || "") as MDMStatus,
      vendor: values[17]?.trim() || "",
      appleCare: values[18]?.trim() || "",
      assetStatus: (values[19]?.trim() || "") as AssetStatus,
      city: values[20]?.trim() || "",
      color: values[21]?.trim() || "",
      region: values[22]?.trim() || "",
    });
  }

  cachedDevices = devices;
  return devices;
}

export function getDeviceTypes(): string[] {
  const devices = parseDevicesCSV();
  const types = new Set<string>();
  
  devices.forEach(device => {
    if (device.deviceType) {
      types.add(device.deviceType);
    }
  });
  
  return Array.from(types).sort();
}

export function getManufacturers(): string[] {
  const devices = parseDevicesCSV();
  const manufacturers = new Set<string>();
  
  devices.forEach(device => {
    if (device.manufacturer) {
      manufacturers.add(device.manufacturer);
    }
  });
  
  return Array.from(manufacturers).sort();
}

// Helper to parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

export function clearDeviceCache() {
  cachedDevices = null;
}

