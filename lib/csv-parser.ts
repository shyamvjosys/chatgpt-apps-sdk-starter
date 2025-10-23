import { readFileSync } from "fs";
import { join } from "path";
import type { Employee, ServiceStatus, EmployeeStatus, EmployeeRole } from "./types";

const CSV_PATH = join(process.cwd(), "data", "josys-provisions.csv");

let cachedEmployees: Employee[] | null = null;
let cachedServiceNames: string[] | null = null;

export function parseCSV(): Employee[] {
  if (cachedEmployees) {
    return cachedEmployees;
  }

  const fileContent = readFileSync(CSV_PATH, "utf-8");
  const lines = fileContent.split("\n").filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }

  const headers = lines[0].split(",").map(h => h.trim());
  
  // First 8 columns are employee info, rest are services
  const serviceHeaders = headers.slice(8);
  
  const employees: Employee[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length < 8) continue;

    const services: Record<string, ServiceStatus> = {};
    for (let j = 0; j < serviceHeaders.length; j++) {
      const status = (values[8 + j] || "").trim() as ServiceStatus;
      services[serviceHeaders[j]] = status;
    }

    employees.push({
      firstName: values[0]?.trim() || "",
      lastName: values[1]?.trim() || "",
      userId: values[2]?.trim() || "",
      workLocationCode: values[3]?.trim() || "",
      status: (values[4]?.trim() || "Active") as EmployeeStatus,
      email: values[5]?.trim() || "",
      username: values[6]?.trim() || "",
      role: (values[7]?.trim() || "") as EmployeeRole,
      services,
    });
  }

  cachedEmployees = employees;
  return employees;
}

export function getServiceNames(): string[] {
  if (cachedServiceNames) {
    return cachedServiceNames;
  }

  const fileContent = readFileSync(CSV_PATH, "utf-8");
  const lines = fileContent.split("\n");
  
  if (lines.length === 0) {
    return [];
  }

  const headers = lines[0].split(",").map(h => h.trim());
  const serviceHeaders = headers.slice(8);
  
  cachedServiceNames = serviceHeaders;
  return serviceHeaders;
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

export function clearCache() {
  cachedEmployees = null;
  cachedServiceNames = null;
}

