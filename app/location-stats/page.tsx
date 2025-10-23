"use client";

import { useWidgetProps, useMaxHeight, useDisplayMode } from "../hooks";
import type { LocationStats } from "@/lib/types";

export default function LocationStatsPage() {
  const toolOutput = useWidgetProps<{
    result?: {
      structuredContent?: {
        locations: LocationStats[];
      };
    };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  const locations = toolOutput?.result?.structuredContent?.locations || [];

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
        <h1 className="text-2xl font-bold mb-2">Location Analytics</h1>
        <p className="text-sm text-gray-600">
          Showing statistics for {locations.length} location{locations.length !== 1 ? "s" : ""}
        </p>
      </div>

      {locations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No location data available.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {locations.map((location) => (
            <div
              key={location.locationCode}
              className="border rounded-lg p-5"
              style={{
                backgroundColor: "var(--color-background-primary)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-3">
                  {location.locationCode === "" ? "Unknown Location" : `Location: ${location.locationCode}`}
                </h2>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div
                    className="border rounded p-3 text-center"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div className="text-2xl font-bold">{location.employeeCount}</div>
                    <div className="text-xs text-gray-600">Total Employees</div>
                  </div>
                  <div
                    className="border rounded p-3 text-center"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div className="text-2xl font-bold text-green-600">
                      {location.activeEmployees}
                    </div>
                    <div className="text-xs text-gray-600">Active</div>
                  </div>
                  <div
                    className="border rounded p-3 text-center"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <div className="text-2xl font-bold text-red-600">
                      {location.deletedEmployees}
                    </div>
                    <div className="text-xs text-gray-600">Deleted</div>
                  </div>
                </div>
              </div>

              {location.topServices.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-700">
                    Top Services (Active Users)
                  </h3>
                  <div className="space-y-2">
                    {location.topServices.map((service, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2 rounded"
                        style={{
                          backgroundColor: "var(--color-background-secondary)",
                        }}
                      >
                        <span className="text-sm truncate flex-1" title={service.name}>
                          {service.name}
                        </span>
                        <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                          {service.activeCount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

