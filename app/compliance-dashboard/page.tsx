"use client";

import { useWidgetProps, useMaxHeight, useDisplayMode } from "../hooks";
import type { ComplianceDashboard } from "@/lib/types";

export default function ComplianceDashboardPage() {
  const toolOutput = useWidgetProps<{
    result?: {
      structuredContent?: ComplianceDashboard;
    };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  const data = toolOutput?.result?.structuredContent;

  if (!data) {
    return (
      <div className="p-6">
        <p>Loading compliance dashboard...</p>
      </div>
    );
  }

  return (
    <div
      className="p-6"
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : undefined,
        overflow: "auto",
      }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Compliance Dashboard</h1>
        <p className="text-sm text-gray-600 mb-6">
          Overview of provisioning health and security issues
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div
            className="border rounded-lg p-4 text-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="text-2xl font-bold">{data.totalEmployees}</div>
            <div className="text-xs text-gray-600">Total Employees</div>
          </div>
          <div
            className="border rounded-lg p-4 text-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="text-2xl font-bold text-green-600">
              {data.activeEmployees}
            </div>
            <div className="text-xs text-gray-600">Active</div>
          </div>
          <div
            className="border rounded-lg p-4 text-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="text-2xl font-bold text-red-600">
              {data.deletedEmployees}
            </div>
            <div className="text-xs text-gray-600">Deleted</div>
          </div>
          <div
            className="border rounded-lg p-4 text-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="text-2xl font-bold text-blue-600">
              {data.totalServices}
            </div>
            <div className="text-xs text-gray-600">Total Services</div>
          </div>
          <div
            className="border rounded-lg p-4 text-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="text-2xl font-bold text-orange-600">
              {data.deletedUsersWithActiveServices}
            </div>
            <div className="text-xs text-gray-600">Security Issues</div>
          </div>
        </div>

        {data.deletedUsersWithActiveServices > 0 && (
          <div
            className="p-4 rounded-lg border-l-4 border-orange-500 mb-6"
            style={{
              backgroundColor: "var(--color-background-secondary)",
              borderRightColor: "var(--color-border)",
              borderTopColor: "var(--color-border)",
              borderBottomColor: "var(--color-border)",
            }}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-orange-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <div className="font-semibold text-orange-700">Action Required</div>
                <div className="text-sm text-gray-600">
                  {data.deletedUsersWithActiveServices} deleted user
                  {data.deletedUsersWithActiveServices !== 1 ? "s" : ""} still have active
                  service access
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Top Services by Active Users</h2>
          <div className="space-y-2">
            {data.topServices.map((service, idx) => (
              <div
                key={idx}
                className="border rounded p-3 flex justify-between items-center"
                style={{
                  backgroundColor: "var(--color-background-primary)",
                  borderColor: "var(--color-border)",
                }}
              >
                <span className="text-sm truncate flex-1" title={service.name}>
                  {service.name}
                </span>
                <div className="flex items-center gap-2 ml-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(
                          (service.activeUsers / data.activeEmployees) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">
                    {service.activeUsers}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">
            Recent Issues ({data.recentIssues.length})
          </h2>
          <div
            className="space-y-2 max-h-96 overflow-y-auto"
            style={{
              maxHeight: "400px",
            }}
          >
            {data.recentIssues.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No issues found</p>
              </div>
            ) : (
              data.recentIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="border rounded p-3"
                  style={{
                    backgroundColor: "var(--color-background-primary)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 mb-1">{issue.type}</div>
                      <div className="text-sm">{issue.message}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

