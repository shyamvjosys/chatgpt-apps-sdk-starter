"use client";

import { useWidgetProps, useMaxHeight, useDisplayMode } from "../hooks";

interface ServiceInfo {
  name: string;
  activeUsers: number;
}

export default function ServiceListPage() {
  const toolOutput = useWidgetProps<{
    services?: ServiceInfo[];
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  const services = toolOutput?.services || [];

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
        <h1 className="text-2xl font-bold mb-2">Service Inventory</h1>
        <p className="text-sm text-gray-600">
          Complete list of {services.length} tracked services
        </p>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No services available.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="border rounded p-3 flex justify-between items-center hover:shadow-sm transition-shadow"
              style={{
                backgroundColor: "var(--color-background-primary)",
                borderColor: "var(--color-border)",
              }}
            >
              <span className="text-sm font-medium truncate flex-1" title={service.name}>
                {service.name}
              </span>
              <div className="flex items-center gap-2 ml-3">
                <span className="text-xs text-gray-500">Active users:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                  {service.activeUsers}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

