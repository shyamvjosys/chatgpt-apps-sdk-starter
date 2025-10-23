"use client";

import { useWidgetProps, useMaxHeight, useDisplayMode } from "../hooks";
import type { Employee } from "@/lib/types";

export default function UsersByRolePage() {
  const toolOutput = useWidgetProps<{
    result?: {
      structuredContent?: {
        role: string;
        users: Employee[];
      };
    };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  const data = toolOutput?.result?.structuredContent;
  const users = data?.users || [];
  const role = data?.role || "";

  const getRoleBadge = (role: string) => {
    if (role.includes("IT Admin")) {
      return "bg-purple-100 text-purple-800 border-purple-300";
    }
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

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
        <h1 className="text-2xl font-bold mb-2">Users by Role</h1>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-600">Role:</span>
          <span className={`px-3 py-1 text-sm rounded border ${getRoleBadge(role)}`}>
            {role}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Found {users.length} active user{users.length !== 1 ? "s" : ""} with this role
        </p>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No users found with this role.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.userId}
              className="border rounded-lg p-4"
              style={{
                backgroundColor: "var(--color-background-primary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded border ${getRoleBadge(user.role)}`}>
                  {user.role}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <span className="text-gray-500">User ID:</span>{" "}
                  <span className="font-mono text-xs">{user.userId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>{" "}
                  <span>{user.workLocationCode || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Active Services:</span>{" "}
                  <span className="font-semibold">
                    {Object.values(user.services).filter((s) => s === "Activated").length}
                  </span>
                </div>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                  View all services
                </summary>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {Object.entries(user.services)
                    .filter(([, status]) => status)
                    .map(([serviceName, status]) => (
                      <div
                        key={serviceName}
                        className="flex justify-between items-center text-xs p-2 rounded"
                        style={{
                          backgroundColor: "var(--color-background-secondary)",
                        }}
                      >
                        <span className="truncate" title={serviceName}>
                          {serviceName}
                        </span>
                        <span
                          className={`ml-2 px-1.5 py-0.5 rounded ${
                            status === "Activated"
                              ? "bg-green-100 text-green-700"
                              : status === "Invited"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

