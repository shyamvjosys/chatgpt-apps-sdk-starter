export type ServiceStatus = "Activated" | "Deactivated" | "Deleted" | "Invited" | "Disabled" | "Inactive" | "Retired" | "";

export type EmployeeStatus = "Active" | "Deleted";

export type EmployeeRole = "IT User" | "IT Admin" | "IT User|IT Admin" | "";

export interface Employee {
  firstName: string;
  lastName: string;
  userId: string;
  workLocationCode: string;
  status: EmployeeStatus;
  email: string;
  username: string;
  role: EmployeeRole;
  services: Record<string, ServiceStatus>;
}

export interface ServiceAccessInfo {
  [x: string]: unknown;
  serviceName: string;
  activeCount: number;
  invitedCount: number;
  deactivatedCount: number;
  totalCount: number;
  users: {
    name: string;
    email: string;
    userId: string;
    status: ServiceStatus;
  }[];
}

export interface ProvisioningStatus {
  [x: string]: unknown;
  employee: {
    name: string;
    email: string;
    userId: string;
    status: EmployeeStatus;
    role: EmployeeRole;
    workLocation: string;
  };
  servicesSummary: {
    total: number;
    activated: number;
    invited: number;
    deactivated: number;
    deleted: number;
  };
  services: {
    name: string;
    status: ServiceStatus;
  }[];
}

export interface LocationStats {
  [x: string]: unknown;
  locationCode: string;
  employeeCount: number;
  activeEmployees: number;
  deletedEmployees: number;
  topServices: {
    name: string;
    activeCount: number;
  }[];
}

export interface DeletedUserAudit {
  [x: string]: unknown;
  userId: string;
  name: string;
  email: string;
  activeServices: string[];
  invitedServices: string[];
  issueCount: number;
}

export interface ComplianceDashboard {
  [x: string]: unknown;
  totalEmployees: number;
  activeEmployees: number;
  deletedEmployees: number;
  totalServices: number;
  deletedUsersWithActiveServices: number;
  topServices: {
    name: string;
    activeUsers: number;
  }[];
  recentIssues: {
    type: string;
    message: string;
    userId: string;
    userName: string;
  }[];
}

