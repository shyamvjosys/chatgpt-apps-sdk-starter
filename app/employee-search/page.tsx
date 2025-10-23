"use client";

import { useWidgetProps, useMaxHeight, useDisplayMode } from "../hooks";
import type { Employee } from "@/lib/types";

export default function EmployeeSearchPage() {
  const toolOutput = useWidgetProps<{
    result?: {
      structuredContent?: {
        employees: Employee[];
        query: string;
      };
    };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  const employees = toolOutput?.result?.structuredContent?.employees || [];
  const query = toolOutput?.result?.structuredContent?.query || "";

  const getStatusBadge = (status: string) => {
    const colors = {
      Active: "bg-green-100 text-green-800 border-green-300",
      Deleted: "bg-red-100 text-red-800 border-red-300",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-300";
  };

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
        <h1 className="text-2xl font-bold mb-2">Employee Search Results</h1>
        <p className="text-sm text-gray-600">
          Search query: <span className="font-semibold">{query}</span>
        </p>
        <p className="text-sm text-gray-600">
          Found {employees.length} employee{employees.length !== 1 ? "s" : ""}
        </p>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No employees found matching your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {employees.map((emp) => (
            <div
              key={emp.userId}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              style={{
                backgroundColor: "var(--color-background-primary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {emp.firstName} {emp.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{emp.email}</p>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded border ${getStatusBadge(emp.status)}`}
                  >
                    {emp.status}
                  </span>
                  {emp.role && (
                    <span
                      className={`px-2 py-1 text-xs rounded border ${getRoleBadge(emp.role)}`}
                    >
                      {emp.role}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">User ID:</span>{" "}
                  <span className="font-mono">{emp.userId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>{" "}
                  <span>{emp.workLocationCode || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Username:</span>{" "}
                  <span className="font-mono">{emp.username || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Active Services:</span>{" "}
                  <span className="font-semibold">
                    {
                      Object.values(emp.services).filter(
                        (s) => s === "Activated"
                      ).length
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

