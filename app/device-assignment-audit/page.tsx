"use client";

import { useWidgetProps, useMaxHeight, useDisplayMode } from "../hooks";
import type { DeviceAssignmentMismatch } from "@/lib/unified-service";

export default function DeviceAssignmentAuditPage() {
  const toolOutput = useWidgetProps<{
    result?: {
      structuredContent?: DeviceAssignmentMismatch;
    };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  const data = toolOutput?.result?.structuredContent;

  if (!data) {
    return (
      <div className="p-6">
        <p>Loading audit data...</p>
      </div>
    );
  }

  const totalIssues = 
    data.devicesAssignedToDeletedUsers.length +
    data.devicesAssignedToUnknownUsers.length +
    data.employeesWithoutRequiredDevices.length;

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
        <h1 className="text-2xl font-bold mb-2">Device Assignment Audit</h1>
        <p className="text-sm text-gray-600 mb-4">
          Security and compliance check for device assignments
        </p>

        {totalIssues > 0 ? (
          <div className="p-4 rounded-lg border-l-4 border-red-500" style={{
            backgroundColor: "var(--color-background-secondary)",
            borderRightColor: "var(--color-border)",
            borderTopColor: "var(--color-border)",
            borderBottomColor: "var(--color-border)",
          }}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-semibold text-red-700">
                  {totalIssues} Issue{totalIssues !== 1 ? "s" : ""} Found
                </div>
                <div className="text-sm text-gray-600">
                  Device assignment mismatches detected
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg border-l-4 border-green-500" style={{
            backgroundColor: "var(--color-background-secondary)",
            borderRightColor: "var(--color-border)",
            borderTopColor: "var(--color-border)",
            borderBottomColor: "var(--color-border)",
          }}>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <div className="font-semibold text-green-700">All Clear</div>
                <div className="text-sm text-gray-600">
                  No device assignment issues found
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Devices Assigned to Deleted Users */}
      {data.devicesAssignedToDeletedUsers.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-red-700">
            ⚠️ Devices Assigned to Deleted Users ({data.devicesAssignedToDeletedUsers.length})
          </h2>
          <div className="space-y-3">
            {data.devicesAssignedToDeletedUsers.map((item, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-4 border-l-4 border-l-red-500"
                style={{
                  backgroundColor: "var(--color-background-primary)",
                  borderRightColor: "var(--color-border)",
                  borderTopColor: "var(--color-border)",
                  borderBottomColor: "var(--color-border)",
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{item.device.deviceType} - {item.device.manufacturer}</div>
                    <div className="text-sm text-gray-600">{item.device.modelName}</div>
                    <div className="text-xs text-gray-500 font-mono">Asset: {item.device.assetNumber}</div>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded border border-red-300">
                    {item.daysAssigned} days
                  </span>
                </div>
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <div><span className="font-semibold">User:</span> {item.userName} ({item.userId})</div>
                  <div><span className="font-semibold">Email:</span> {item.userEmail}</div>
                  <div><span className="font-semibold">Assigned:</span> {item.assignedDate}</div>
                  <div className="text-red-600 mt-1">⚠️ User status: {item.userStatus}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Devices Assigned to Unknown Users */}
      {data.devicesAssignedToUnknownUsers.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-orange-700">
            ⚠️ Devices Assigned to Unknown Users ({data.devicesAssignedToUnknownUsers.length})
          </h2>
          <div className="space-y-3">
            {data.devicesAssignedToUnknownUsers.map((item, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-4 border-l-4 border-l-orange-500"
                style={{
                  backgroundColor: "var(--color-background-primary)",
                  borderRightColor: "var(--color-border)",
                  borderTopColor: "var(--color-border)",
                  borderBottomColor: "var(--color-border)",
                }}
              >
                <div className="font-semibold">{item.device.deviceType} - {item.device.manufacturer}</div>
                <div className="text-sm text-gray-600">{item.device.modelName}</div>
                <div className="text-xs text-gray-500 font-mono">Asset: {item.device.assetNumber}</div>
                <div className="mt-2 text-sm text-orange-700">
                  ⚠️ Assigned to: {item.email} (not found in employee database)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees Without Required Devices */}
      {data.employeesWithoutRequiredDevices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-blue-700">
            📋 IT Staff Without Required Devices ({data.employeesWithoutRequiredDevices.length})
          </h2>
          <div className="space-y-2">
            {data.employeesWithoutRequiredDevices.map((item, idx) => (
              <div
                key={idx}
                className="border rounded p-3 flex justify-between items-center"
                style={{
                  backgroundColor: "var(--color-background-primary)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.email}</div>
                  <div className="text-xs text-gray-500">{item.role}</div>
                </div>
                <div className="text-sm text-blue-700">
                  Missing: {item.missingDevices.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

