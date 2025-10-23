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
});

export const GET = handler;
export const POST = handler;
