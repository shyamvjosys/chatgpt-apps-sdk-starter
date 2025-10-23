import { parseCSV, getServiceNames } from "./csv-parser";
import type {
  Employee,
  ServiceAccessInfo,
  ProvisioningStatus,
  LocationStats,
  DeletedUserAudit,
  ComplianceDashboard,
} from "./types";

export function searchEmployee(query: string): Employee[] {
  const employees = parseCSV();
  const lowerQuery = query.toLowerCase();

  return employees.filter((emp) => {
    return (
      emp.firstName.toLowerCase().includes(lowerQuery) ||
      emp.lastName.toLowerCase().includes(lowerQuery) ||
      emp.email.toLowerCase().includes(lowerQuery) ||
      emp.userId.toLowerCase().includes(lowerQuery) ||
      emp.username.toLowerCase().includes(lowerQuery)
    );
  });
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
  const employees = parseCSV();
  const lowerIdentifier = identifier.toLowerCase();

  const emp = employees.find(
    (e) =>
      e.email.toLowerCase() === lowerIdentifier ||
      e.userId.toLowerCase() === lowerIdentifier ||
      `${e.firstName} ${e.lastName}`.toLowerCase() === lowerIdentifier
  );

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

export function getAllServices(): string[] {
  return getServiceNames();
}

