import { parseCSV, getServiceNames } from "./csv-parser";
import type {
  Employee,
  ServiceAccessInfo,
  ProvisioningStatus,
  LocationStats,
  DeletedUserAudit,
  ComplianceDashboard,
} from "./types";

/**
 * Helper function to find an employee by identifier with smart name matching
 * Handles cases like "Aby Pappachan" matching "Aby Saji Pappachan"
 */
export function findEmployeeByIdentifier(identifier: string): Employee | null {
  const employees = parseCSV();
  const lowerIdentifier = identifier.toLowerCase().trim();

  // 1. Try exact email match
  let match = employees.find(e => e.email.toLowerCase() === lowerIdentifier);
  if (match) return match;

  // 2. Try exact user ID match
  match = employees.find(e => e.userId.toLowerCase() === lowerIdentifier);
  if (match) return match;

  // 3. Try exact username match
  match = employees.find(e => e.username && e.username.toLowerCase() === lowerIdentifier);
  if (match) return match;

  // 4. Try exact full name match
  match = employees.find(e => 
    `${e.firstName} ${e.lastName}`.toLowerCase() === lowerIdentifier
  );
  if (match) return match;

  // 5. Try smart name matching for partial names
  // Split the query into words
  const queryWords = lowerIdentifier.split(/\s+/).filter(w => w.length > 0);
  
  if (queryWords.length >= 2) {
    // Try matching: firstName + (any word in lastName)
    const firstName = queryWords[0];
    const possibleLastName = queryWords.slice(1).join(' ');
    
    match = employees.find(e => {
      const empFirstName = e.firstName.toLowerCase();
      const empLastName = e.lastName.toLowerCase();
      
      // Check if firstName matches and lastName contains any of the query words
      if (empFirstName === firstName || empFirstName.includes(firstName) || firstName.includes(empFirstName)) {
        // Check if any word in the query matches any word in the employee's last name
        const lastNameWords = empLastName.split(/\s+/);
        const queryLastWords = possibleLastName.split(/\s+/);
        
        for (const queryWord of queryLastWords) {
          if (lastNameWords.some(lw => lw === queryWord || lw.includes(queryWord) || queryWord.includes(lw))) {
            return true;
          }
        }
      }
      return false;
    });
    
    if (match) return match;
  }

  // 6. Try email prefix match (before @)
  if (lowerIdentifier.includes('@')) {
    const emailPrefix = lowerIdentifier.split('@')[0];
    match = employees.find(e => e.email.toLowerCase().startsWith(emailPrefix + '@'));
    if (match) return match;
  } else {
    // Try as email prefix
    match = employees.find(e => e.email.toLowerCase().startsWith(lowerIdentifier + '@'));
    if (match) return match;
  }

  return null;
}

/**
 * Search for employees with improved name matching
 * Returns scored results, best matches first
 */
export function searchEmployee(query: string): Employee[] {
  const employees = parseCSV();
  const lowerQuery = query.toLowerCase().trim();

  // Score each employee based on match quality
  const scoredEmployees: Array<{ employee: Employee; score: number }> = [];

  for (const emp of employees) {
    let score = 0;
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const email = emp.email.toLowerCase();
    const userId = emp.userId.toLowerCase();
    const username = (emp.username || '').toLowerCase();

    // Exact matches get highest scores
    if (email === lowerQuery) score += 1000;
    if (userId === lowerQuery) score += 900;
    if (fullName === lowerQuery) score += 800;
    if (username === lowerQuery) score += 700;

    // Starts with matches
    if (email.startsWith(lowerQuery)) score += 600;
    if (fullName.startsWith(lowerQuery)) score += 500;
    if (emp.firstName.toLowerCase().startsWith(lowerQuery)) score += 400;
    if (emp.lastName.toLowerCase().startsWith(lowerQuery)) score += 350;

    // Contains matches
    if (email.includes(lowerQuery)) score += 300;
    if (fullName.includes(lowerQuery)) score += 250;
    if (emp.firstName.toLowerCase().includes(lowerQuery)) score += 200;
    if (emp.lastName.toLowerCase().includes(lowerQuery)) score += 150;
    if (userId.includes(lowerQuery)) score += 100;
    if (username.includes(lowerQuery)) score += 50;

    // Smart name matching for multi-word queries
    const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 0);
    if (queryWords.length >= 2) {
      const firstName = queryWords[0];
      const lastNameWords = emp.lastName.toLowerCase().split(/\s+/);
      
      // Check if first word matches first name
      const firstNameMatch = emp.firstName.toLowerCase() === firstName || 
                            emp.firstName.toLowerCase().includes(firstName);
      
      if (firstNameMatch) {
        // Check if any subsequent query words match any word in last name
        const queryLastWords = queryWords.slice(1);
        let lastNameMatches = 0;
        
        for (const queryWord of queryLastWords) {
          for (const lastWord of lastNameWords) {
            if (lastWord === queryWord) lastNameMatches += 50;
            else if (lastWord.includes(queryWord) || queryWord.includes(lastWord)) lastNameMatches += 30;
          }
        }
        
        if (lastNameMatches > 0) score += 400 + lastNameMatches;
      }
    }

    if (score > 0) {
      scoredEmployees.push({ employee: emp, score });
    }
  }

  // Sort by score (descending) and return employees
  return scoredEmployees
    .sort((a, b) => b.score - a.score)
    .map(item => item.employee);
}

export function getServiceAccess(
  serviceName: string,
  statusFilter?: string
): ServiceAccessInfo {
  const employees = parseCSV();
  const users: ServiceAccessInfo["users"] = [];

  let activeCount = 0;
  let invitedCount = 0;
  let deactivatedCount = 0;

  for (const emp of employees) {
    const serviceStatus = emp.services[serviceName];
    if (!serviceStatus) continue;

    if (statusFilter && serviceStatus !== statusFilter) continue;

    users.push({
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      userId: emp.userId,
      status: serviceStatus,
    });

    if (serviceStatus === "Activated") activeCount++;
    else if (serviceStatus === "Invited") invitedCount++;
    else if (serviceStatus === "Deactivated") deactivatedCount++;
  }

  return {
    serviceName,
    activeCount,
    invitedCount,
    deactivatedCount,
    totalCount: users.length,
    users,
  };
}

export function checkProvisioningStatus(
  identifier: string
): ProvisioningStatus | null {
  // Use smart identifier matching
  const emp = findEmployeeByIdentifier(identifier);

  if (!emp) return null;

  const services: ProvisioningStatus["services"] = [];
  let activated = 0;
  let invited = 0;
  let deactivated = 0;
  let deleted = 0;

  for (const [serviceName, status] of Object.entries(emp.services)) {
    if (!status) continue;

    services.push({ name: serviceName, status });

    if (status === "Activated") activated++;
    else if (status === "Invited") invited++;
    else if (status === "Deactivated") deactivated++;
    else if (status === "Deleted") deleted++;
  }

  return {
    employee: {
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      userId: emp.userId,
      status: emp.status,
      role: emp.role,
      workLocation: emp.workLocationCode,
    },
    servicesSummary: {
      total: services.length,
      activated,
      invited,
      deactivated,
      deleted,
    },
    services,
  };
}

export function getLocationStats(locationCode?: string): LocationStats[] {
  const employees = parseCSV();
  const locationMap = new Map<string, Employee[]>();

  for (const emp of employees) {
    const loc = emp.workLocationCode || "Unknown";
    if (locationCode && loc !== locationCode) continue;

    if (!locationMap.has(loc)) {
      locationMap.set(loc, []);
    }
    locationMap.get(loc)!.push(emp);
  }

  const stats: LocationStats[] = [];

  for (const [loc, emps] of locationMap) {
    const activeEmployees = emps.filter((e) => e.status === "Active").length;
    const deletedEmployees = emps.filter((e) => e.status === "Deleted").length;

    // Calculate top services for this location
    const serviceCounts = new Map<string, number>();
    for (const emp of emps) {
      if (emp.status !== "Active") continue;
      for (const [serviceName, status] of Object.entries(emp.services)) {
        if (status === "Activated") {
          serviceCounts.set(serviceName, (serviceCounts.get(serviceName) || 0) + 1);
        }
      }
    }

    const topServices = Array.from(serviceCounts.entries())
      .map(([name, activeCount]) => ({ name, activeCount }))
      .sort((a, b) => b.activeCount - a.activeCount)
      .slice(0, 10);

    stats.push({
      locationCode: loc,
      employeeCount: emps.length,
      activeEmployees,
      deletedEmployees,
      topServices,
    });
  }

  return stats.sort((a, b) => b.employeeCount - a.employeeCount);
}

export function auditDeletedUsers(): DeletedUserAudit[] {
  const employees = parseCSV();
  const deletedUsers = employees.filter((emp) => emp.status === "Deleted");

  const audits: DeletedUserAudit[] = [];

  for (const emp of deletedUsers) {
    const activeServices: string[] = [];
    const invitedServices: string[] = [];

    for (const [serviceName, status] of Object.entries(emp.services)) {
      if (status === "Activated") {
        activeServices.push(serviceName);
      } else if (status === "Invited") {
        invitedServices.push(serviceName);
      }
    }

    const issueCount = activeServices.length + invitedServices.length;

    if (issueCount > 0) {
      audits.push({
        userId: emp.userId,
        name: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        activeServices,
        invitedServices,
        issueCount,
      });
    }
  }

  return audits.sort((a, b) => b.issueCount - a.issueCount);
}

export function getComplianceDashboard(): ComplianceDashboard {
  const employees = parseCSV();
  const services = getServiceNames();

  const activeEmployees = employees.filter((e) => e.status === "Active");
  const deletedEmployees = employees.filter((e) => e.status === "Deleted");

  // Count deleted users with active services
  let deletedUsersWithActiveServices = 0;
  const recentIssues: ComplianceDashboard["recentIssues"] = [];

  for (const emp of deletedEmployees) {
    let hasActiveServices = false;

    for (const [serviceName, status] of Object.entries(emp.services)) {
      if (status === "Activated" || status === "Invited") {
        hasActiveServices = true;
        recentIssues.push({
          type: "Deleted User with Active Service",
          message: `${emp.firstName} ${emp.lastName} (${emp.userId}) still has ${status} access to ${serviceName}`,
          userId: emp.userId,
          userName: `${emp.firstName} ${emp.lastName}`,
        });
      }
    }

    if (hasActiveServices) {
      deletedUsersWithActiveServices++;
    }
  }

  // Calculate top services by active users
  const serviceCounts = new Map<string, number>();
  for (const emp of activeEmployees) {
    for (const [serviceName, status] of Object.entries(emp.services)) {
      if (status === "Activated") {
        serviceCounts.set(serviceName, (serviceCounts.get(serviceName) || 0) + 1);
      }
    }
  }

  const topServices = Array.from(serviceCounts.entries())
    .map(([name, activeUsers]) => ({ name, activeUsers }))
    .sort((a, b) => b.activeUsers - a.activeUsers)
    .slice(0, 15);

  return {
    totalEmployees: employees.length,
    activeEmployees: activeEmployees.length,
    deletedEmployees: deletedEmployees.length,
    totalServices: services.length,
    deletedUsersWithActiveServices,
    topServices,
    recentIssues: recentIssues.slice(0, 50),
  };
}

export function getUsersByRole(role: string): Employee[] {
  const employees = parseCSV();

  return employees.filter((emp) => {
    if (emp.status !== "Active") return false;
    return emp.role.includes(role);
  });
}

/**
 * Get users filtered by their activated service count
 * Returns users with service counts matching the specified criteria
 */
export function getUsersByServiceCount(
  minCount?: number,
  maxCount?: number,
  includeInactive: boolean = false
): Array<{
  employee: Employee;
  activatedServicesCount: number;
  activatedServices: string[];
}> {
  const employees = parseCSV();
  const results: Array<{
    employee: Employee;
    activatedServicesCount: number;
    activatedServices: string[];
  }> = [];

  for (const emp of employees) {
    // Skip inactive users unless explicitly requested
    if (!includeInactive && emp.status !== "Active") continue;

    // Count activated services
    const activatedServices: string[] = [];
    for (const [serviceName, status] of Object.entries(emp.services)) {
      if (status === "Activated") {
        activatedServices.push(serviceName);
      }
    }

    const count = activatedServices.length;

    // Apply filters
    if (minCount !== undefined && count < minCount) continue;
    if (maxCount !== undefined && count > maxCount) continue;

    results.push({
      employee: emp,
      activatedServicesCount: count,
      activatedServices,
    });
  }

  // Sort by count descending
  return results.sort((a, b) => b.activatedServicesCount - a.activatedServicesCount);
}

export function getAllServices(): string[] {
  return getServiceNames();
}

// Re-export device services
export {
  searchDevice,
  getDevicesByUser,
  getUserDevices,
  getAvailableDevices,
  getDeviceSummary,
  auditDeviceAssignments,
  getWarrantyExpiringDevices,
  getDevicesByLocation,
  getDeviceLifecycleStats,
  getAllDeviceTypes,
  getAllManufacturers,
} from "./device-service";

// Re-export unified services
export {
  getCompleteITProfile,
  auditDeviceAssignmentMismatch,
  getOnboardingChecklist,
  getOffboardingChecklist,
} from "./unified-service";

