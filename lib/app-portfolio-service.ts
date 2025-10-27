import {
  parseAppPortfolioCSV,
  getPortfolioByEmail,
  getPortfolioByApp,
  getPortfolioByDepartment,
  getPortfolioByJobTitle,
  getContractorRecords,
  getAllDepartments,
  getAllJobTitles,
  type AppPortfolioRecord,
} from './app-portfolio-parser';
import { parseCSV } from './csv-parser';
import { findEmployeeByIdentifier } from './data-service';

// ========== FINANCIAL TOOLS ==========

export interface SoftwareSpendReport {
  totalMonthlySpend: number;
  byService: Array<{
    service: string;
    totalCost: number;
    activeUsers: number;
    costPerUser: number;
  }>;
  byUser: Array<{
    email: string;
    name: string;
    userId: string;
    totalCost: number;
    serviceCount: number;
  }>;
  byDepartment: Array<{
    department: string;
    totalCost: number;
    employeeCount: number;
    costPerEmployee: number;
  }>;
  topExpenses: Array<{
    type: string;
    name: string;
    cost: number;
  }>;
}

export function getSoftwareSpendReport(): SoftwareSpendReport {
  const records = parseAppPortfolioCSV();
  
  // Calculate by service
  const serviceMap = new Map<string, { cost: number; users: Set<string> }>();
  records.forEach(r => {
    if (!serviceMap.has(r.app)) {
      serviceMap.set(r.app, { cost: 0, users: new Set() });
    }
    const service = serviceMap.get(r.app)!;
    service.cost += r.monthlyExpense;
    service.users.add(r.email.toLowerCase());
  });

  const byService = Array.from(serviceMap.entries())
    .map(([service, data]) => ({
      service,
      totalCost: data.cost,
      activeUsers: data.users.size,
      costPerUser: data.users.size > 0 ? data.cost / data.users.size : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  // Calculate by user
  const userMap = new Map<string, { cost: number; services: Set<string>; name: string; userId: string }>();
  records.forEach(r => {
    const email = r.email.toLowerCase();
    if (!userMap.has(email)) {
      userMap.set(email, {
        cost: 0,
        services: new Set(),
        name: `${r.firstName} ${r.lastName}`,
        userId: r.userId,
      });
    }
    const user = userMap.get(email)!;
    user.cost += r.monthlyExpense;
    user.services.add(r.app);
  });

  const byUser = Array.from(userMap.entries())
    .map(([email, data]) => ({
      email,
      name: data.name,
      userId: data.userId,
      totalCost: data.cost,
      serviceCount: data.services.size,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  // Calculate by department
  const deptMap = new Map<string, { cost: number; users: Set<string> }>();
  records.forEach(r => {
    r.departments.forEach(dept => {
      if (!dept) return;
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { cost: 0, users: new Set() });
      }
      const deptData = deptMap.get(dept)!;
      deptData.cost += r.monthlyExpense;
      deptData.users.add(r.email.toLowerCase());
    });
  });

  const byDepartment = Array.from(deptMap.entries())
    .map(([department, data]) => ({
      department,
      totalCost: data.cost,
      employeeCount: data.users.size,
      costPerEmployee: data.users.size > 0 ? data.cost / data.users.size : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  // Top expenses
  const topExpenses = [
    ...byService.slice(0, 5).map(s => ({ type: 'Service', name: s.service, cost: s.totalCost })),
    ...byUser.slice(0, 5).map(u => ({ type: 'User', name: u.name, cost: u.totalCost })),
  ].sort((a, b) => b.cost - a.cost).slice(0, 10);

  const totalMonthlySpend = records.reduce((sum, r) => sum + r.monthlyExpense, 0);

  return {
    totalMonthlySpend,
    byService,
    byUser,
    byDepartment,
    topExpenses,
  };
}

export interface CostOptimizationReport {
  totalPotentialSavings: number;
  inactiveAccountsCosting: Array<{
    email: string;
    name: string;
    service: string;
    accountStatus: string;
    userStatus: string;
    monthlyCost: number;
  }>;
  duplicateAccounts: Array<{
    email: string;
    name: string;
    service: string;
    accountCount: number;
    totalCost: number;
    accounts: Array<{ identifier: string; roles: string[]; cost: number }>;
  }>;
  deletedUsersWithCost: Array<{
    email: string;
    name: string;
    userId: string;
    totalWastedCost: number;
    activeAccounts: Array<{ service: string; cost: number }>;
  }>;
  contractorsWithHighCost: Array<{
    email: string;
    name: string;
    userId: string;
    totalCost: number;
    serviceCount: number;
  }>;
}

export function auditCostOptimization(): CostOptimizationReport {
  const records = parseAppPortfolioCSV();
  
  // Inactive accounts costing money
  const inactiveAccountsCosting = records
    .filter(r => r.monthlyExpense > 0 && r.userStatus.toLowerCase() === 'deleted')
    .map(r => ({
      email: r.email,
      name: `${r.firstName} ${r.lastName}`,
      service: r.app,
      accountStatus: r.accountStatus,
      userStatus: r.userStatus,
      monthlyCost: r.monthlyExpense,
    }))
    .sort((a, b) => b.monthlyCost - a.monthlyCost);

  // Duplicate accounts (same user, same service, multiple accounts)
  const userServiceMap = new Map<string, Map<string, AppPortfolioRecord[]>>();
  records.forEach(r => {
    const email = r.email.toLowerCase();
    if (!userServiceMap.has(email)) {
      userServiceMap.set(email, new Map());
    }
    const serviceMap = userServiceMap.get(email)!;
    if (!serviceMap.has(r.app)) {
      serviceMap.set(r.app, []);
    }
    serviceMap.get(r.app)!.push(r);
  });

  const duplicateAccounts: CostOptimizationReport['duplicateAccounts'] = [];
  userServiceMap.forEach((serviceMap, email) => {
    serviceMap.forEach((accounts, service) => {
      if (accounts.length > 1) {
        duplicateAccounts.push({
          email,
          name: `${accounts[0].firstName} ${accounts[0].lastName}`,
          service,
          accountCount: accounts.length,
          totalCost: accounts.reduce((sum, a) => sum + a.monthlyExpense, 0),
          accounts: accounts.map(a => ({
            identifier: a.identifier,
            roles: a.roles,
            cost: a.monthlyExpense,
          })),
        });
      }
    });
  });

  // Deleted users with cost
  const deletedUserMap = new Map<string, AppPortfolioRecord[]>();
  records
    .filter(r => r.userStatus.toLowerCase() === 'deleted')
    .forEach(r => {
      const email = r.email.toLowerCase();
      if (!deletedUserMap.has(email)) {
        deletedUserMap.set(email, []);
      }
      deletedUserMap.get(email)!.push(r);
    });

  const deletedUsersWithCost = Array.from(deletedUserMap.entries())
    .map(([email, userRecords]) => ({
      email,
      name: `${userRecords[0].firstName} ${userRecords[0].lastName}`,
      userId: userRecords[0].userId,
      totalWastedCost: userRecords.reduce((sum, r) => sum + r.monthlyExpense, 0),
      activeAccounts: userRecords.map(r => ({ service: r.app, cost: r.monthlyExpense })),
    }))
    .filter(u => u.totalWastedCost > 0)
    .sort((a, b) => b.totalWastedCost - a.totalWastedCost);

  // Contractors with high cost
  const contractorRecords = getContractorRecords();
  const contractorCostMap = new Map<string, { cost: number; services: Set<string>; record: AppPortfolioRecord }>();
  contractorRecords.forEach(r => {
    const email = r.email.toLowerCase();
    if (!contractorCostMap.has(email)) {
      contractorCostMap.set(email, { cost: 0, services: new Set(), record: r });
    }
    const data = contractorCostMap.get(email)!;
    data.cost += r.monthlyExpense;
    data.services.add(r.app);
  });

  const contractorsWithHighCost = Array.from(contractorCostMap.entries())
    .map(([email, data]) => ({
      email,
      name: `${data.record.firstName} ${data.record.lastName}`,
      userId: data.record.userId,
      totalCost: data.cost,
      serviceCount: data.services.size,
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 20);

  const totalPotentialSavings =
    inactiveAccountsCosting.reduce((sum, a) => sum + a.monthlyCost, 0) +
    deletedUsersWithCost.reduce((sum, u) => sum + u.totalWastedCost, 0);

  return {
    totalPotentialSavings,
    inactiveAccountsCosting,
    duplicateAccounts,
    deletedUsersWithCost,
    contractorsWithHighCost,
  };
}

export interface DepartmentSpendAnalysis {
  department: string;
  totalMonthlySpend: number;
  employeeCount: number;
  costPerEmployee: number;
  services: Array<{
    service: string;
    userCount: number;
    totalCost: number;
    avgCostPerUser: number;
  }>;
  topSpenders: Array<{
    name: string;
    email: string;
    totalCost: number;
  }>;
}

export function getDepartmentSpendAnalysis(department: string): DepartmentSpendAnalysis | null {
  const records = getPortfolioByDepartment(department);
  
  if (records.length === 0) return null;

  const serviceMap = new Map<string, { users: Set<string>; cost: number }>();
  const userCostMap = new Map<string, { cost: number; name: string }>();

  records.forEach(r => {
    // Service aggregation
    if (!serviceMap.has(r.app)) {
      serviceMap.set(r.app, { users: new Set(), cost: 0 });
    }
    const service = serviceMap.get(r.app)!;
    service.users.add(r.email.toLowerCase());
    service.cost += r.monthlyExpense;

    // User aggregation
    const email = r.email.toLowerCase();
    if (!userCostMap.has(email)) {
      userCostMap.set(email, { cost: 0, name: `${r.firstName} ${r.lastName}` });
    }
    userCostMap.get(email)!.cost += r.monthlyExpense;
  });

  const services = Array.from(serviceMap.entries())
    .map(([service, data]) => ({
      service,
      userCount: data.users.size,
      totalCost: data.cost,
      avgCostPerUser: data.users.size > 0 ? data.cost / data.users.size : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  const topSpenders = Array.from(userCostMap.entries())
    .map(([email, data]) => ({
      email,
      name: data.name,
      totalCost: data.cost,
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 10);

  const totalMonthlySpend = records.reduce((sum, r) => sum + r.monthlyExpense, 0);
  const uniqueUsers = new Set(records.map(r => r.email.toLowerCase()));

  return {
    department,
    totalMonthlySpend,
    employeeCount: uniqueUsers.size,
    costPerEmployee: uniqueUsers.size > 0 ? totalMonthlySpend / uniqueUsers.size : 0,
    services,
    topSpenders,
  };
}

// ========== SECURITY & PERMISSION TOOLS ==========

export interface PrivilegedAccessAudit {
  totalPrivilegedUsers: number;
  privilegedUsers: Array<{
    email: string;
    name: string;
    userId: string;
    userCategory: string;
    jobTitle: string;
    privilegedAccounts: Array<{
      service: string;
      identifier: string;
      roles: string[];
      isAdmin: boolean;
    }>;
    adminServiceCount: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  contractorsWithAdmin: Array<{
    email: string;
    name: string;
    userId: string;
    adminServices: string[];
  }>;
  crossServiceAdmins: Array<{
    email: string;
    name: string;
    adminCount: number;
    services: string[];
  }>;
}

function isAdminRole(roles: string[]): boolean {
  const adminKeywords = ['admin', 'owner', 'superuser', 'root', 'full', 'unrestricted'];
  return roles.some(role =>
    adminKeywords.some(keyword => role.toLowerCase().includes(keyword))
  );
}

export function auditPrivilegedAccess(): PrivilegedAccessAudit {
  const records = parseAppPortfolioCSV();
  
  // Group by user
  const userMap = new Map<string, AppPortfolioRecord[]>();
  records.forEach(r => {
    const email = r.email.toLowerCase();
    if (!userMap.has(email)) {
      userMap.set(email, []);
    }
    userMap.get(email)!.push(r);
  });

  const privilegedUsers: PrivilegedAccessAudit['privilegedUsers'] = [];
  const contractorsWithAdmin: PrivilegedAccessAudit['contractorsWithAdmin'] = [];
  const crossServiceAdmins: PrivilegedAccessAudit['crossServiceAdmins'] = [];

  userMap.forEach((userRecords, email) => {
    const privilegedAccounts = userRecords
      .filter(r => r.roles.length > 0 && isAdminRole(r.roles))
      .map(r => ({
        service: r.app,
        identifier: r.identifier,
        roles: r.roles,
        isAdmin: isAdminRole(r.roles),
      }));

    if (privilegedAccounts.length > 0) {
      const firstRecord = userRecords[0];
      const adminServiceCount = privilegedAccounts.length;
      
      let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (adminServiceCount >= 5 || firstRecord.userCategory.toLowerCase().includes('contractor')) {
        riskLevel = 'HIGH';
      } else if (adminServiceCount >= 3) {
        riskLevel = 'MEDIUM';
      }

      privilegedUsers.push({
        email,
        name: `${firstRecord.firstName} ${firstRecord.lastName}`,
        userId: firstRecord.userId,
        userCategory: firstRecord.userCategory,
        jobTitle: firstRecord.jobTitle,
        privilegedAccounts,
        adminServiceCount,
        riskLevel,
      });

      // Check if contractor
      if (firstRecord.userCategory.toLowerCase().includes('contractor') || firstRecord.userId.startsWith('C')) {
        contractorsWithAdmin.push({
          email,
          name: `${firstRecord.firstName} ${firstRecord.lastName}`,
          userId: firstRecord.userId,
          adminServices: privilegedAccounts.map(a => a.service),
        });
      }

      // Cross-service admins (3+ services)
      if (adminServiceCount >= 3) {
        crossServiceAdmins.push({
          email,
          name: `${firstRecord.firstName} ${firstRecord.lastName}`,
          adminCount: adminServiceCount,
          services: privilegedAccounts.map(a => a.service),
        });
      }
    }
  });

  return {
    totalPrivilegedUsers: privilegedUsers.length,
    privilegedUsers: privilegedUsers.sort((a, b) => b.adminServiceCount - a.adminServiceCount),
    contractorsWithAdmin,
    crossServiceAdmins: crossServiceAdmins.sort((a, b) => b.adminCount - a.adminCount),
  };
}

export interface ServiceRoleBreakdown {
  service: string;
  totalUsers: number;
  roleDistribution: Array<{
    role: string;
    userCount: number;
    percentage: number;
    totalCost: number;
    users: Array<{ name: string; email: string; identifier: string }>;
  }>;
  adminCount: number;
  regularUserCount: number;
  totalCost: number;
}

export function getServiceRoleBreakdown(serviceName: string): ServiceRoleBreakdown | null {
  const records = getPortfolioByApp(serviceName);
  
  if (records.length === 0) return null;

  const roleMap = new Map<string, { users: Array<{ name: string; email: string; identifier: string }>; cost: number }>();
  
  records.forEach(r => {
    const roleKey = r.roles.length > 0 ? r.roles.join('|') : 'No Role';
    if (!roleMap.has(roleKey)) {
      roleMap.set(roleKey, { users: [], cost: 0 });
    }
    const roleData = roleMap.get(roleKey)!;
    roleData.users.push({
      name: `${r.firstName} ${r.lastName}`,
      email: r.email,
      identifier: r.identifier,
    });
    roleData.cost += r.monthlyExpense;
  });

  const totalUsers = records.length;
  const totalCost = records.reduce((sum, r) => sum + r.monthlyExpense, 0);

  const roleDistribution = Array.from(roleMap.entries())
    .map(([role, data]) => ({
      role,
      userCount: data.users.length,
      percentage: (data.users.length / totalUsers) * 100,
      totalCost: data.cost,
      users: data.users,
    }))
    .sort((a, b) => b.userCount - a.userCount);

  const adminCount = records.filter(r => isAdminRole(r.roles)).length;
  const regularUserCount = totalUsers - adminCount;

  return {
    service: records[0].app,
    totalUsers,
    roleDistribution,
    adminCount,
    regularUserCount,
    totalCost,
  };
}

export interface MultiAccountAnomaly {
  email: string;
  name: string;
  userId: string;
  anomalies: Array<{
    service: string;
    accountCount: number;
    accounts: Array<{
      identifier: string;
      roles: string[];
      accountStatus: string;
      cost: number;
    }>;
    isLegitimate: boolean;
    reason: string;
  }>;
}

export function auditMultiAccountAnomalies(): MultiAccountAnomaly[] {
  const records = parseAppPortfolioCSV();
  
  // Group by user and service
  const userServiceMap = new Map<string, Map<string, AppPortfolioRecord[]>>();
  records.forEach(r => {
    const email = r.email.toLowerCase();
    if (!userServiceMap.has(email)) {
      userServiceMap.set(email, new Map());
    }
    const serviceMap = userServiceMap.get(email)!;
    if (!serviceMap.has(r.app)) {
      serviceMap.set(r.app, []);
    }
    serviceMap.get(r.app)!.push(r);
  });

  const anomalies: MultiAccountAnomaly[] = [];

  userServiceMap.forEach((serviceMap, email) => {
    const userAnomalies: MultiAccountAnomaly['anomalies'] = [];
    
    serviceMap.forEach((accounts, service) => {
      if (accounts.length > 1) {
        // Determine if legitimate (e.g., AWS multi-environment is normal)
        const isAWS = service.toLowerCase().includes('aws');
        const hasMultipleEnvs = accounts.some(a =>
          a.identifier.toLowerCase().includes('dev') ||
          a.identifier.toLowerCase().includes('prod') ||
          a.identifier.toLowerCase().includes('staging') ||
          a.identifier.toLowerCase().includes('qa')
        );

        const isLegitimate = isAWS && hasMultipleEnvs;
        const reason = isLegitimate
          ? 'AWS multi-environment access (expected)'
          : 'Multiple accounts in same service (review needed)';

        userAnomalies.push({
          service,
          accountCount: accounts.length,
          accounts: accounts.map(a => ({
            identifier: a.identifier,
            roles: a.roles,
            accountStatus: a.accountStatus,
            cost: a.monthlyExpense,
          })),
          isLegitimate,
          reason,
        });
      }
    });

    if (userAnomalies.length > 0) {
      const firstRecord = Array.from(serviceMap.values())[0][0];
      anomalies.push({
        email,
        name: `${firstRecord.firstName} ${firstRecord.lastName}`,
        userId: firstRecord.userId,
        anomalies: userAnomalies,
      });
    }
  });

  return anomalies.sort((a, b) => b.anomalies.length - a.anomalies.length);
}

// ========== ANALYTICS TOOLS ==========

export interface ServicePortfolioOverview {
  totalServices: number;
  totalUsers: number;
  totalMonthlySpend: number;
  services: Array<{
    name: string;
    userCount: number;
    accountCount: number;
    totalCost: number;
    avgCostPerUser: number;
    utilizationRate: number;
  }>;
  byCategory: Array<{
    category: string;
    serviceCount: number;
    totalCost: number;
  }>;
}

export function getServicePortfolioOverview(): ServicePortfolioOverview {
  const records = parseAppPortfolioCSV();
  
  const serviceMap = new Map<string, { users: Set<string>; accountCount: number; cost: number }>();
  records.forEach(r => {
    if (!serviceMap.has(r.app)) {
      serviceMap.set(r.app, { users: new Set(), accountCount: 0, cost: 0 });
    }
    const service = serviceMap.get(r.app)!;
    service.users.add(r.email.toLowerCase());
    service.accountCount++;
    service.cost += r.monthlyExpense;
  });

  const services = Array.from(serviceMap.entries())
    .map(([name, data]) => ({
      name,
      userCount: data.users.size,
      accountCount: data.accountCount,
      totalCost: data.cost,
      avgCostPerUser: data.users.size > 0 ? data.cost / data.users.size : 0,
      utilizationRate: data.accountCount > 0 ? (data.users.size / data.accountCount) * 100 : 0,
    }))
    .sort((a, b) => b.userCount - a.userCount);

  const totalUsers = new Set(records.map(r => r.email.toLowerCase())).size;
  const totalMonthlySpend = records.reduce((sum, r) => sum + r.monthlyExpense, 0);

  // Simple category classification
  const categoryMap = new Map<string, { services: Set<string>; cost: number }>();
  services.forEach(s => {
    let category = 'Other';
    if (s.name.toLowerCase().includes('aws') || s.name.toLowerCase().includes('cloud') || s.name.toLowerCase().includes('gcp')) {
      category = 'Cloud Infrastructure';
    } else if (s.name.toLowerCase().includes('microsoft') || s.name.toLowerCase().includes('google workspace')) {
      category = 'Productivity';
    } else if (s.name.toLowerCase().includes('github') || s.name.toLowerCase().includes('gitlab')) {
      category = 'Development';
    } else if (s.name.toLowerCase().includes('slack') || s.name.toLowerCase().includes('zoom')) {
      category = 'Communication';
    }
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { services: new Set(), cost: 0 });
    }
    const catData = categoryMap.get(category)!;
    catData.services.add(s.name);
    catData.cost += s.totalCost;
  });

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      serviceCount: data.services.size,
      totalCost: data.cost,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  return {
    totalServices: services.length,
    totalUsers,
    totalMonthlySpend,
    services,
    byCategory,
  };
}

export interface DepartmentAnalysis {
  department: string;
  employeeCount: number;
  employees: Array<{
    name: string;
    email: string;
    userId: string;
    jobTitle: string;
    serviceCount: number;
    totalCost: number;
  }>;
  totalSpend: number;
  avgCostPerEmployee: number;
  topServices: Array<{
    service: string;
    userCount: number;
    totalCost: number;
  }>;
}

export function searchByDepartment(department: string): DepartmentAnalysis | null {
  const records = getPortfolioByDepartment(department);
  
  if (records.length === 0) return null;

  const userMap = new Map<string, AppPortfolioRecord[]>();
  records.forEach(r => {
    const email = r.email.toLowerCase();
    if (!userMap.has(email)) {
      userMap.set(email, []);
    }
    userMap.get(email)!.push(r);
  });

  const employees = Array.from(userMap.entries())
    .map(([email, userRecords]) => {
      const first = userRecords[0];
      return {
        name: `${first.firstName} ${first.lastName}`,
        email,
        userId: first.userId,
        jobTitle: first.jobTitle,
        serviceCount: new Set(userRecords.map(r => r.app)).size,
        totalCost: userRecords.reduce((sum, r) => sum + r.monthlyExpense, 0),
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost);

  const serviceMap = new Map<string, { users: Set<string>; cost: number }>();
  records.forEach(r => {
    if (!serviceMap.has(r.app)) {
      serviceMap.set(r.app, { users: new Set(), cost: 0 });
    }
    const service = serviceMap.get(r.app)!;
    service.users.add(r.email.toLowerCase());
    service.cost += r.monthlyExpense;
  });

  const topServices = Array.from(serviceMap.entries())
    .map(([service, data]) => ({
      service,
      userCount: data.users.size,
      totalCost: data.cost,
    }))
    .sort((a, b) => b.userCount - a.userCount)
    .slice(0, 10);

  const totalSpend = records.reduce((sum, r) => sum + r.monthlyExpense, 0);

  return {
    department,
    employeeCount: employees.length,
    employees,
    totalSpend,
    avgCostPerEmployee: employees.length > 0 ? totalSpend / employees.length : 0,
    topServices,
  };
}

export interface JobTitleAnalysis {
  jobTitle: string;
  employeeCount: number;
  employees: Array<{
    name: string;
    email: string;
    userId: string;
    department: string;
    serviceCount: number;
    totalCost: number;
  }>;
  commonServices: Array<{
    service: string;
    adoptionRate: number;
    avgCost: number;
  }>;
  avgServicesPerPerson: number;
  avgCostPerPerson: number;
}

export function searchByJobTitle(jobTitle: string): JobTitleAnalysis | null {
  const records = getPortfolioByJobTitle(jobTitle);
  
  if (records.length === 0) return null;

  const userMap = new Map<string, AppPortfolioRecord[]>();
  records.forEach(r => {
    const email = r.email.toLowerCase();
    if (!userMap.has(email)) {
      userMap.set(email, []);
    }
    userMap.get(email)!.push(r);
  });

  const employees = Array.from(userMap.entries())
    .map(([email, userRecords]) => {
      const first = userRecords[0];
      return {
        name: `${first.firstName} ${first.lastName}`,
        email,
        userId: first.userId,
        department: first.departments.join(', '),
        serviceCount: new Set(userRecords.map(r => r.app)).size,
        totalCost: userRecords.reduce((sum, r) => sum + r.monthlyExpense, 0),
      };
    });

  const serviceMap = new Map<string, { users: Set<string>; totalCost: number }>();
  records.forEach(r => {
    if (!serviceMap.has(r.app)) {
      serviceMap.set(r.app, { users: new Set(), totalCost: 0 });
    }
    const service = serviceMap.get(r.app)!;
    service.users.add(r.email.toLowerCase());
    service.totalCost += r.monthlyExpense;
  });

  const commonServices = Array.from(serviceMap.entries())
    .map(([service, data]) => ({
      service,
      adoptionRate: (data.users.size / employees.length) * 100,
      avgCost: data.users.size > 0 ? data.totalCost / data.users.size : 0,
    }))
    .sort((a, b) => b.adoptionRate - a.adoptionRate)
    .slice(0, 15);

  const avgServicesPerPerson = employees.reduce((sum, e) => sum + e.serviceCount, 0) / employees.length;
  const avgCostPerPerson = employees.reduce((sum, e) => sum + e.totalCost, 0) / employees.length;

  return {
    jobTitle: records[0].jobTitle,
    employeeCount: employees.length,
    employees,
    commonServices,
    avgServicesPerPerson,
    avgCostPerPerson,
  };
}

export interface ContractorAudit {
  totalContractors: number;
  totalMonthlyCost: number;
  contractors: Array<{
    name: string;
    email: string;
    userId: string;
    jobTitle: string;
    department: string;
    serviceCount: number;
    totalCost: number;
    hasAdminAccess: boolean;
    adminServices: string[];
  }>;
  contractorsWithAdmin: number;
  topCostlyContractors: Array<{
    name: string;
    email: string;
    totalCost: number;
  }>;
}

export function getContractorAudit(): ContractorAudit {
  const records = getContractorRecords();
  
  const userMap = new Map<string, AppPortfolioRecord[]>();
  records.forEach(r => {
    const email = r.email.toLowerCase();
    if (!userMap.has(email)) {
      userMap.set(email, []);
    }
    userMap.get(email)!.push(r);
  });

  const contractors = Array.from(userMap.entries())
    .map(([email, userRecords]) => {
      const first = userRecords[0];
      const adminServices = userRecords
        .filter(r => isAdminRole(r.roles))
        .map(r => r.app);
      
      return {
        name: `${first.firstName} ${first.lastName}`,
        email,
        userId: first.userId,
        jobTitle: first.jobTitle,
        department: first.departments.join(', '),
        serviceCount: new Set(userRecords.map(r => r.app)).size,
        totalCost: userRecords.reduce((sum, r) => sum + r.monthlyExpense, 0),
        hasAdminAccess: adminServices.length > 0,
        adminServices,
      };
    })
    .sort((a, b) => b.totalCost - a.totalCost);

  const topCostlyContractors = contractors
    .slice(0, 10)
    .map(c => ({
      name: c.name,
      email: c.email,
      totalCost: c.totalCost,
    }));

  return {
    totalContractors: contractors.length,
    totalMonthlyCost: records.reduce((sum, r) => sum + r.monthlyExpense, 0),
    contractors,
    contractorsWithAdmin: contractors.filter(c => c.hasAdminAccess).length,
    topCostlyContractors,
  };
}

// ========== RECONCILIATION TOOLS ==========

export interface ProvisionPortfolioReconciliation {
  totalDiscrepancies: number;
  inProvisionNotPortfolio: Array<{
    email: string;
    name: string;
    service: string;
    provisionStatus: string;
  }>;
  inPortfolioNotProvision: Array<{
    email: string;
    name: string;
    service: string;
    accountStatus: string;
  }>;
  statusMismatches: Array<{
    email: string;
    name: string;
    service: string;
    provisionStatus: string;
    portfolioStatus: string;
  }>;
  syncHealthScore: number;
}

export function reconcileProvisionVsPortfolio(): ProvisionPortfolioReconciliation {
  const portfolioRecords = parseAppPortfolioCSV();
  const employees = parseCSV();
  
  const inProvisionNotPortfolio: ProvisionPortfolioReconciliation['inProvisionNotPortfolio'] = [];
  const inPortfolioNotProvision: ProvisionPortfolioReconciliation['inPortfolioNotProvision'] = [];
  const statusMismatches: ProvisionPortfolioReconciliation['statusMismatches'] = [];

  // Build portfolio map
  const portfolioMap = new Map<string, Map<string, AppPortfolioRecord>>();
  portfolioRecords.forEach(r => {
    const email = r.email.toLowerCase();
    if (!portfolioMap.has(email)) {
      portfolioMap.set(email, new Map());
    }
    portfolioMap.get(email)!.set(r.app, r);
  });

  // Check provisions against portfolio
  employees.forEach(emp => {
    const email = emp.email.toLowerCase();
    const userPortfolio = portfolioMap.get(email);
    
    Object.entries(emp.services).forEach(([serviceName, status]) => {
      if (!status || status === '') return;
      
      // Try to find matching service in portfolio
      const portfolioService = userPortfolio?.get(serviceName);
      
      if (status === 'Activated' && !portfolioService) {
        inProvisionNotPortfolio.push({
          email: emp.email,
          name: `${emp.firstName} ${emp.lastName}`,
          service: serviceName,
          provisionStatus: status,
        });
      } else if (portfolioService && status !== portfolioService.accountStatus) {
        // Status mismatch
        if (status === 'Activated' && portfolioService.accountStatus !== 'Activated') {
          statusMismatches.push({
            email: emp.email,
            name: `${emp.firstName} ${emp.lastName}`,
            service: serviceName,
            provisionStatus: status,
            portfolioStatus: portfolioService.accountStatus,
          });
        }
      }
    });
  });

  // Check portfolio against provisions
  portfolioRecords.forEach(r => {
    const emp = employees.find(e => e.email.toLowerCase() === r.email.toLowerCase());
    if (!emp) {
      inPortfolioNotProvision.push({
        email: r.email,
        name: `${r.firstName} ${r.lastName}`,
        service: r.app,
        accountStatus: r.accountStatus,
      });
      return;
    }
    
    const provisionStatus = emp.services[r.app];
    if (!provisionStatus && r.accountStatus === 'Activated') {
      inPortfolioNotProvision.push({
        email: r.email,
        name: `${r.firstName} ${r.lastName}`,
        service: r.app,
        accountStatus: r.accountStatus,
      });
    }
  });

  const totalDiscrepancies = inProvisionNotPortfolio.length + inPortfolioNotProvision.length + statusMismatches.length;
  const totalRecords = portfolioRecords.length + Object.values(employees).reduce((sum, e) => sum + Object.keys(e.services).length, 0);
  const syncHealthScore = totalRecords > 0 ? ((totalRecords - totalDiscrepancies) / totalRecords) * 100 : 100;

  return {
    totalDiscrepancies,
    inProvisionNotPortfolio: inProvisionNotPortfolio.slice(0, 50),
    inPortfolioNotProvision: inPortfolioNotProvision.slice(0, 50),
    statusMismatches: statusMismatches.slice(0, 50),
    syncHealthScore,
  };
}

export interface EnhancedServiceAccess {
  serviceName: string;
  totalUsers: number;
  totalAccounts: number;
  totalMonthlyCost: number;
  users: Array<{
    name: string;
    email: string;
    userId: string;
    provisionStatus: string;
    portfolioAccounts: Array<{
      identifier: string;
      accountStatus: string;
      roles: string[];
      monthlyCost: number;
    }>;
    hasDiscrepancy: boolean;
  }>;
}

export function getUnifiedServiceView(serviceName: string): EnhancedServiceAccess | null {
  const portfolioRecords = getPortfolioByApp(serviceName);
  const employees = parseCSV();
  
  if (portfolioRecords.length === 0) return null;

  // Group portfolio records by user
  const portfolioByUser = new Map<string, AppPortfolioRecord[]>();
  portfolioRecords.forEach(r => {
    const email = r.email.toLowerCase();
    if (!portfolioByUser.has(email)) {
      portfolioByUser.set(email, []);
    }
    portfolioByUser.get(email)!.push(r);
  });

  // Merge with provision data
  const users: EnhancedServiceAccess['users'] = [];
  
  portfolioByUser.forEach((records, email) => {
    const emp = employees.find(e => e.email.toLowerCase() === email);
    const provisionStatus = emp?.services[records[0].app] || 'Unknown';
    
    const portfolioAccounts = records.map(r => ({
      identifier: r.identifier,
      accountStatus: r.accountStatus,
      roles: r.roles,
      monthlyCost: r.monthlyExpense,
    }));
    
    const hasDiscrepancy = provisionStatus !== records[0].accountStatus;
    
    users.push({
      name: `${records[0].firstName} ${records[0].lastName}`,
      email,
      userId: records[0].userId,
      provisionStatus,
      portfolioAccounts,
      hasDiscrepancy,
    });
  });

  const totalMonthlyCost = portfolioRecords.reduce((sum, r) => sum + r.monthlyExpense, 0);

  return {
    serviceName: portfolioRecords[0].app,
    totalUsers: portfolioByUser.size,
    totalAccounts: portfolioRecords.length,
    totalMonthlyCost,
    users: users.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

