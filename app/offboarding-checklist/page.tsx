"use client";

import { useWidgetProps, useMaxHeight, useDisplayMode } from "../hooks";
import type { OffboardingChecklist } from "@/lib/unified-service";

export default function OffboardingChecklistPage() {
  const toolOutput = useWidgetProps<{
    result?: {
      structuredContent?: OffboardingChecklist;
    };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  const data = toolOutput?.result?.structuredContent;

  if (!data) {
    return <div className="p-6"><p>Loading checklist...</p></div>;
  }

  return (
    <div className="p-6" style={{ maxHeight, overflow: "auto" }}>
      <h1 className="text-2xl font-bold mb-2">Offboarding Checklist</h1>
      <p className="text-sm text-gray-600 mb-4">{data.user.name} ({data.user.email})</p>

      {/* Progress */}
      <div className="mb-6 border rounded-lg p-4" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Completion</span>
          <span className={`text-2xl font-bold ${
            data.checklist.completionPercentage === 100 ? "text-green-600" : "text-orange-600"
          }`}>{data.checklist.completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className={`h-3 rounded-full ${
            data.checklist.completionPercentage === 100 ? "bg-green-600" : "bg-orange-600"
          }`} style={{ width: `${data.checklist.completionPercentage}%` }}></div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border rounded p-4" style={{ borderColor: "var(--color-border)" }}>
          <div className="text-sm text-gray-600">Services Deactivated</div>
          <div className="text-2xl font-bold text-green-600">{data.checklist.servicesDeactivated}</div>
        </div>
        <div className="border rounded p-4" style={{ borderColor: "var(--color-border)" }}>
          <div className="text-sm text-gray-600">Services Still Active</div>
          <div className="text-2xl font-bold text-red-600">{data.checklist.servicesStillActive}</div>
        </div>
        <div className="border rounded p-4" style={{ borderColor: "var(--color-border)" }}>
          <div className="text-sm text-gray-600">Devices Returned</div>
          <div className="text-2xl font-bold text-green-600">{data.checklist.devicesReturned}</div>
        </div>
        <div className="border rounded p-4" style={{ borderColor: "var(--color-border)" }}>
          <div className="text-sm text-gray-600">Devices Still Assigned</div>
          <div className="text-2xl font-bold text-red-600">{data.checklist.devicesStillAssigned}</div>
        </div>
      </div>

      {/* Action Items */}
      {data.actionItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Action Items</h2>
          <div className="space-y-2">
            {data.actionItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 border rounded" style={{ borderColor: "var(--color-border)" }}>
                <input type="checkbox" className="mt-1 w-4 h-4" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Services */}
      {data.activeServices.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-red-700">Active Services ({data.activeServices.length})</h2>
          <div className="grid grid-cols-2 gap-2">
            {data.activeServices.map((service, idx) => (
              <div key={idx} className="border rounded p-2 text-sm bg-red-50 border-red-200">{service}</div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Devices */}
      {data.assignedDevices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-red-700">Assigned Devices ({data.assignedDevices.length})</h2>
          <div className="space-y-2">
            {data.assignedDevices.map((device, idx) => (
              <div key={idx} className="border rounded p-3 bg-red-50 border-red-200">
                <div className="font-semibold">{device.deviceType} - {device.manufacturer}</div>
                <div className="text-sm">{device.modelName}</div>
                <div className="text-xs font-mono">Asset: {device.assetNumber}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

