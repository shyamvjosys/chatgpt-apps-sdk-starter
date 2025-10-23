import { baseURL } from "@/baseUrl";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  searchEmployee,
  getServiceAccess,
  checkProvisioningStatus,
  getLocationStats,
  auditDeletedUsers,
  getComplianceDashboard,
  getUsersByRole,
  getAllServices,
} from "@/lib/data-service";

const getAppsSdkCompatibleHtml = async (baseUrl: string, path: string) => {
  const result = await fetch(`${baseUrl}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  path: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const handler = createMcpHandler(async (server) => {
  // Define all widgets
  const widgets: ContentWidget[] = [
    {
      id: "search_employee",
      title: "Employee Search",
      templateUri: "ui://widget/employee-search.html",
      invoking: "Searching employees...",
      invoked: "Employee search complete",
      path: "/employee-search",
      description: "Search and display employee information",
      widgetDomain: baseURL,
    },
    {
      id: "get_service_access",
      title: "Service Access Report",
      templateUri: "ui://widget/service-access.html",
      invoking: "Fetching service access...",
      invoked: "Service access loaded",
      path: "/service-access",
      description: "View users with access to a specific service",
      widgetDomain: baseURL,
    },
    {
      id: "check_provisioning_status",
      title: "Provisioning Status",
      templateUri: "ui://widget/provisioning-status.html",
      invoking: "Checking provisioning status...",
      invoked: "Provisioning status loaded",
      path: "/provisioning-status",
      description: "View all service access for an employee",
      widgetDomain: baseURL,
    },
    {
      id: "get_location_stats",
      title: "Location Analytics",
      templateUri: "ui://widget/location-stats.html",
      invoking: "Analyzing locations...",
      invoked: "Location analytics ready",
      path: "/location-stats",
      description: "View employee and service statistics by location",
      widgetDomain: baseURL,
    },
    {
      id: "audit_deleted_users",
      title: "Offboarding Audit",
      templateUri: "ui://widget/deleted-users-audit.html",
      invoking: "Auditing deleted users...",
      invoked: "Audit complete",
      path: "/deleted-users-audit",
      description: "Find deleted users with active service access",
      widgetDomain: baseURL,
    },
    {
      id: "get_compliance_dashboard",
      title: "Compliance Dashboard",
      templateUri: "ui://widget/compliance-dashboard.html",
      invoking: "Loading compliance data...",
      invoked: "Dashboard ready",
      path: "/compliance-dashboard",
      description: "Overview of provisioning health and security issues",
      widgetDomain: baseURL,
    },
    {
      id: "get_users_by_role",
      title: "Users by Role",
      templateUri: "ui://widget/users-by-role.html",
      invoking: "Fetching users by role...",
      invoked: "Users loaded",
      path: "/users-by-role",
      description: "List all users with a specific role",
      widgetDomain: baseURL,
    },
  ];

  // Register resources for each widget
  for (const widget of widgets) {
    server.registerResource(
      widget.id,
      widget.templateUri,
      {
        title: widget.title,
        description: widget.description,
        mimeType: "text/html+skybridge",
        _meta: {
          "openai/widgetDescription": widget.description,
          "openai/widgetPrefersBorder": true,
        },
      },
      async (uri) => {
        const html = await getAppsSdkCompatibleHtml(baseURL, widget.path);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/html+skybridge",
              text: `<html>${html}</html>`,
              _meta: {
                "openai/widgetDescription": widget.description,
                "openai/widgetPrefersBorder": true,
                "openai/widgetDomain": widget.widgetDomain,
              },
            },
          ],
        };
      }
    );
  }

  // Register service list resource
  const serviceListWidget = {
    templateUri: "ui://widget/service-list.html",
    description: "Complete list of all tracked services",
    path: "/service-list",
  };

  server.registerResource(
    "service_list",
    serviceListWidget.templateUri,
    {
      title: "Service Inventory",
      description: serviceListWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": serviceListWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => {
      const serviceListHtml = await getAppsSdkCompatibleHtml(
        baseURL,
        serviceListWidget.path
      );
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/html+skybridge",
            text: `<html>${serviceListHtml}</html>`,
            _meta: {
              "openai/widgetDescription": serviceListWidget.description,
              "openai/widgetPrefersBorder": true,
              "openai/widgetDomain": baseURL,
            },
          },
        ],
      };
    }
  );

  // Tool 1: Search Employee
  const searchWidget = widgets.find((w) => w.id === "search_employee")!;
  server.registerTool(
    searchWidget.id,
    {
      title: searchWidget.title,
      description:
        "Search for employees by name, email, user ID, or username. Returns matching employee profiles with their service access.",
      inputSchema: {
        query: z
          .string()
          .describe(
            "Search query - can be name, email, user ID, or username"
          ),
      },
      _meta: widgetMeta(searchWidget),
    },
    async ({ query }) => {
      const employees = searchEmployee(query);

      return {
        content: [
          {
            type: "text",
            text: `Found ${employees.length} employee(s) matching "${query}". ${
              employees.length > 0
                ? `Top result: ${employees[0].firstName} ${employees[0].lastName} (${employees[0].email})`
                : ""
            }`,
          },
        ],
        structuredContent: {
          employees,
          query,
        },
        _meta: widgetMeta(searchWidget),
      };
    }
  );

  // Tool 2: Get Service Access
  const serviceAccessWidget = widgets.find(
    (w) => w.id === "get_service_access"
  )!;
  server.registerTool(
    serviceAccessWidget.id,
    {
      title: serviceAccessWidget.title,
      description:
        "Get a list of all users who have access to a specific service. Shows active, invited, and deactivated users.",
      inputSchema: {
        serviceName: z
          .string()
          .describe(
            "Name of the service (e.g., 'Slack', 'GitHub', 'Microsoft 365')"
          ),
        statusFilter: z
          .enum(["Activated", "Invited", "Deactivated", "Deleted", "Disabled"])
          .optional()
          .describe("Optional: Filter users by their service status"),
      },
      _meta: widgetMeta(serviceAccessWidget),
    },
    async ({ serviceName, statusFilter }) => {
      const data = getServiceAccess(serviceName, statusFilter);

      return {
        content: [
          {
            type: "text",
            text: `${serviceName}: ${data.activeCount} active, ${data.invitedCount} invited, ${data.deactivatedCount} deactivated (${data.totalCount} total)`,
          },
        ],
        structuredContent: data,
        _meta: widgetMeta(serviceAccessWidget),
      };
    }
  );

  // Tool 3: Check Provisioning Status
  const provisioningWidget = widgets.find(
    (w) => w.id === "check_provisioning_status"
  )!;
  server.registerTool(
    provisioningWidget.id,
    {
      title: provisioningWidget.title,
      description:
        "Check the complete provisioning status for a specific employee. Shows all services and their activation status.",
      inputSchema: {
        identifier: z
          .string()
          .describe(
            "Employee identifier - email, user ID, or full name"
          ),
      },
      _meta: widgetMeta(provisioningWidget),
    },
    async ({ identifier }) => {
      const data = checkProvisioningStatus(identifier);

      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: `Employee not found: ${identifier}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `${data.employee.name}: ${data.servicesSummary.activated} active services, ${data.servicesSummary.invited} invited, ${data.servicesSummary.deactivated} deactivated`,
          },
        ],
        structuredContent: data,
        _meta: widgetMeta(provisioningWidget),
      };
    }
  );

  // Tool 4: Get Location Stats
  const locationWidget = widgets.find((w) => w.id === "get_location_stats")!;
  server.registerTool(
    locationWidget.id,
    {
      title: locationWidget.title,
      description:
        "Get employee and service statistics aggregated by work location. Shows employee counts and top services per location.",
      inputSchema: {
        locationCode: z
          .string()
          .optional()
          .describe(
            "Optional: Specific location code to analyze. Leave empty for all locations."
          ),
      },
      _meta: widgetMeta(locationWidget),
    },
    async ({ locationCode }) => {
      const locations = getLocationStats(locationCode);

      return {
        content: [
          {
            type: "text",
            text: `Analyzed ${locations.length} location(s). ${
              locations.length > 0
                ? `Largest: ${locations[0].locationCode} with ${locations[0].employeeCount} employees`
                : ""
            }`,
          },
        ],
        structuredContent: { locations },
        _meta: widgetMeta(locationWidget),
      };
    }
  );

  // Tool 5: Audit Deleted Users
  const auditWidget = widgets.find((w) => w.id === "audit_deleted_users")!;
  server.registerTool(
    auditWidget.id,
    {
      title: auditWidget.title,
      description:
        "Audit deleted employees to find those who still have active or invited service access. Critical for security and compliance.",
      inputSchema: {},
      _meta: widgetMeta(auditWidget),
    },
    async () => {
      const audits = auditDeletedUsers();

      return {
        content: [
          {
            type: "text",
            text: `Found ${audits.length} deleted user(s) with lingering service access. ${
              audits.length > 0
                ? `Most issues: ${audits[0].name} with ${audits[0].issueCount} active/invited services`
                : "All deleted users have been properly deprovisioned."
            }`,
          },
        ],
        structuredContent: { audits },
        _meta: widgetMeta(auditWidget),
      };
    }
  );

  // Tool 6: Get Compliance Dashboard
  const complianceWidget = widgets.find(
    (w) => w.id === "get_compliance_dashboard"
  )!;
  server.registerTool(
    complianceWidget.id,
    {
      title: complianceWidget.title,
      description:
        "Get a comprehensive compliance dashboard showing employee counts, service usage, and security issues.",
      inputSchema: {},
      _meta: widgetMeta(complianceWidget),
    },
    async () => {
      const data = getComplianceDashboard();

      return {
        content: [
          {
            type: "text",
            text: `Compliance Overview: ${data.totalEmployees} employees (${data.activeEmployees} active), ${data.totalServices} services tracked. ${data.deletedUsersWithActiveServices} security issues found.`,
          },
        ],
        structuredContent: data,
        _meta: widgetMeta(complianceWidget),
      };
    }
  );

  // Tool 7: Get Users by Role
  const roleWidget = widgets.find((w) => w.id === "get_users_by_role")!;
  server.registerTool(
    roleWidget.id,
    {
      title: roleWidget.title,
      description:
        "Get all active users with a specific role (e.g., 'IT Admin', 'IT User').",
      inputSchema: {
        role: z
          .string()
          .describe(
            "Role name to filter by (e.g., 'IT Admin', 'IT User')"
          ),
      },
      _meta: widgetMeta(roleWidget),
    },
    async ({ role }) => {
      const users = getUsersByRole(role);

      return {
        content: [
          {
            type: "text",
            text: `Found ${users.length} active user(s) with role containing "${role}"`,
          },
        ],
        structuredContent: { role, users },
        _meta: widgetMeta(roleWidget),
      };
    }
  );

  // Tool 8: List All Services (simple tool without widget)
  server.registerTool(
    "list_services",
    {
      title: "List All Services",
      description:
        "Get a complete list of all services tracked in the provisioning system.",
      inputSchema: {},
    },
    async () => {
      const services = getAllServices();

      return {
        content: [
          {
            type: "text",
            text: `Total services tracked: ${services.length}\n\nServices:\n${services
              .slice(0, 20)
              .join("\n")}${services.length > 20 ? `\n\n...and ${services.length - 20} more` : ""}`,
          },
        ],
      };
    }
  );

  // UNIFIED TOOLS - Combining Employee + Device Data

  // Tool 9: Get Complete IT Profile
  const completeProfileWidget = {
    id: "get_complete_it_profile",
    title: "Complete IT Profile",
    templateUri: "ui://widget/complete-it-profile.html",
    invoking: "Loading complete IT profile...",
    invoked: "IT profile loaded",
    path: "/complete-it-profile",
    description: "View complete IT profile with services and devices",
    widgetDomain: baseURL,
  };

  const completeProfileHtml = await getAppsSdkCompatibleHtml(baseURL, completeProfileWidget.path);
  server.registerResource(
    completeProfileWidget.id,
    completeProfileWidget.templateUri,
    {
      title: completeProfileWidget.title,
      description: completeProfileWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": completeProfileWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/html+skybridge",
            text: `<html>${completeProfileHtml}</html>`,
            _meta: {
              "openai/widgetDescription": completeProfileWidget.description,
              "openai/widgetPrefersBorder": true,
              "openai/widgetDomain": completeProfileWidget.widgetDomain,
            },
          },
        ],
      };
    }
  );

  server.registerTool(
    completeProfileWidget.id,
    {
      title: completeProfileWidget.title,
      description:
        "Get complete IT profile for a user including software access and hardware assets. Shows services, devices, and compliance status.",
      inputSchema: {
        identifier: z
          .string()
          .describe("Employee identifier - email, user ID, or full name"),
      },
      _meta: widgetMeta(completeProfileWidget),
    },
    async ({ identifier }) => {
      const data = await import("@/lib/data-service").then((m) =>
        m.getCompleteITProfile(identifier)
      );

      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: `User not found: ${identifier}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `${data.user.name}: ${data.softwareAccess.activated} active services, ${data.hardwareAssets.total} devices (${data.hardwareAssets.laptops} laptops). Compliance: ${data.complianceStatus.score}%`,
          },
        ],
        structuredContent: data,
        _meta: widgetMeta(completeProfileWidget),
      };
    }
  );

  // Tool 10: Audit Device Assignment Mismatch
  const deviceAuditWidget = {
    id: "audit_device_assignment_mismatch",
    title: "Device Assignment Audit",
    templateUri: "ui://widget/device-assignment-audit.html",
    invoking: "Auditing device assignments...",
    invoked: "Audit complete",
    path: "/device-assignment-audit",
    description: "Find device assignment mismatches and security issues",
    widgetDomain: baseURL,
  };

  const deviceAuditHtml = await getAppsSdkCompatibleHtml(baseURL, deviceAuditWidget.path);
  server.registerResource(
    deviceAuditWidget.id,
    deviceAuditWidget.templateUri,
    {
      title: deviceAuditWidget.title,
      description: deviceAuditWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": deviceAuditWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/html+skybridge",
            text: `<html>${deviceAuditHtml}</html>`,
            _meta: {
              "openai/widgetDescription": deviceAuditWidget.description,
              "openai/widgetPrefersBorder": true,
              "openai/widgetDomain": deviceAuditWidget.widgetDomain,
            },
          },
        ],
      };
    }
  );

  server.registerTool(
    deviceAuditWidget.id,
    {
      title: deviceAuditWidget.title,
      description:
        "Audit device assignments to find devices assigned to deleted users, unknown users, and employees without required devices.",
      inputSchema: {},
      _meta: widgetMeta(deviceAuditWidget),
    },
    async () => {
      const data = await import("@/lib/data-service").then((m) =>
        m.auditDeviceAssignmentMismatch()
      );

      const totalIssues =
        data.devicesAssignedToDeletedUsers.length +
        data.devicesAssignedToUnknownUsers.length +
        data.employeesWithoutRequiredDevices.length;

      return {
        content: [
          {
            type: "text",
            text: `Device Audit: Found ${totalIssues} issue(s). ${data.devicesAssignedToDeletedUsers.length} devices assigned to deleted users, ${data.devicesAssignedToUnknownUsers.length} to unknown users, ${data.employeesWithoutRequiredDevices.length} employees without required devices.`,
          },
        ],
        structuredContent: data,
        _meta: widgetMeta(deviceAuditWidget),
      };
    }
  );

  // Tool 11: Onboarding Checklist
  const onboardingWidget = {
    id: "get_onboarding_checklist",
    title: "Onboarding Checklist",
    templateUri: "ui://widget/onboarding-checklist.html",
    invoking: "Loading onboarding checklist...",
    invoked: "Checklist loaded",
    path: "/onboarding-checklist",
    description: "View onboarding checklist for new hires",
    widgetDomain: baseURL,
  };

  const onboardingHtml = await getAppsSdkCompatibleHtml(baseURL, onboardingWidget.path);
  server.registerResource(
    onboardingWidget.id,
    onboardingWidget.templateUri,
    {
      title: onboardingWidget.title,
      description: onboardingWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": onboardingWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/html+skybridge",
            text: `<html>${onboardingHtml}</html>`,
            _meta: {
              "openai/widgetDescription": onboardingWidget.description,
              "openai/widgetPrefersBorder": true,
              "openai/widgetDomain": onboardingWidget.widgetDomain,
            },
          },
        ],
      };
    }
  );

  server.registerTool(
    onboardingWidget.id,
    {
      title: onboardingWidget.title,
      description:
        "Get onboarding checklist for a new hire showing required services and devices, completion status, and available devices for assignment.",
      inputSchema: {
        userEmail: z.string().describe("Email address of the new hire"),
      },
      _meta: widgetMeta(onboardingWidget),
    },
    async ({ userEmail }) => {
      const data = await import("@/lib/data-service").then((m) =>
        m.getOnboardingChecklist(userEmail)
      );

      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: `User not found: ${userEmail}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Onboarding for ${data.user.name}: ${data.checklist.completionPercentage}% complete. Missing: ${data.checklist.services.missing.length} services, ${data.checklist.devices.missing.length} devices.`,
          },
        ],
        structuredContent: data,
        _meta: widgetMeta(onboardingWidget),
      };
    }
  );

  // Tool 12: Offboarding Checklist
  const offboardingWidget = {
    id: "get_offboarding_checklist",
    title: "Offboarding Checklist",
    templateUri: "ui://widget/offboarding-checklist.html",
    invoking: "Loading offboarding checklist...",
    invoked: "Checklist loaded",
    path: "/offboarding-checklist",
    description: "View offboarding checklist for departing employees",
    widgetDomain: baseURL,
  };

  const offboardingHtml = await getAppsSdkCompatibleHtml(baseURL, offboardingWidget.path);
  server.registerResource(
    offboardingWidget.id,
    offboardingWidget.templateUri,
    {
      title: offboardingWidget.title,
      description: offboardingWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": offboardingWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/html+skybridge",
            text: `<html>${offboardingHtml}</html>`,
            _meta: {
              "openai/widgetDescription": offboardingWidget.description,
              "openai/widgetPrefersBorder": true,
              "openai/widgetDomain": offboardingWidget.widgetDomain,
            },
          },
        ],
      };
    }
  );

  server.registerTool(
    offboardingWidget.id,
    {
      title: offboardingWidget.title,
      description:
        "Get offboarding checklist showing services to deactivate, devices to collect, and action items for departing employees.",
      inputSchema: {
        userEmail: z.string().describe("Email address of the departing employee"),
      },
      _meta: widgetMeta(offboardingWidget),
    },
    async ({ userEmail }) => {
      const data = await import("@/lib/data-service").then((m) =>
        m.getOffboardingChecklist(userEmail)
      );

      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: `User not found: ${userEmail}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Offboarding for ${data.user.name}: ${data.checklist.completionPercentage}% complete. ${data.checklist.servicesStillActive} services active, ${data.checklist.devicesStillAssigned} devices still assigned. ${data.actionItems.length} action items pending.`,
          },
        ],
        structuredContent: data,
        _meta: widgetMeta(offboardingWidget),
      };
    }
  );

  // Tool 13: Get User Devices (Simple device listing)
  server.registerTool(
    "get_user_devices",
    {
      title: "Get User Devices",
      description:
        "Get a simple list of all devices assigned to a specific user. Shows device details, MDM status, and warranty information. Use this for quick device lookups.",
      inputSchema: {
        userEmail: z
          .string()
          .describe("Email address of the user to lookup devices for"),
      },
    },
    async ({ userEmail }) => {
      const data = await import("@/lib/data-service").then((m) =>
        m.getUserDevices(userEmail)
      );

      if (!data) {
        return {
          content: [
            {
              type: "text",
              text: `No devices found for user: ${userEmail}`,
            },
          ],
        };
      }

      // Format device list for readable output
      const deviceList = data.devices
        .map(
          (d) =>
            `- ${d.deviceType} (${d.manufacturer} ${d.modelName}) - Asset: ${d.assetNumber}, Serial: ${d.serialNumber}${d.mdm === "Yes" ? ", MDM ✓" : ""}${d.appleCare === "Yes" ? ", AppleCare ✓" : ""}`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Devices for ${userEmail}:\n\nTotal: ${data.summary.total} devices (${data.summary.laptops} laptops, ${data.summary.monitors} monitors, ${data.summary.others} others)\nMDM Enrolled: ${data.summary.allMDMEnrolled ? "✓ Yes" : "✗ No"}\nActive Warranty: ${data.summary.hasActiveWarranty ? "✓ Yes" : "✗ No"}\n\nDevices:\n${deviceList}`,
          },
        ],
        structuredContent: data,
      };
    }
  );
});

export const GET = handler;
export const POST = handler;
