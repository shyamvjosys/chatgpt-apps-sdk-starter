"use client";

import { useWidgetProps, useMaxHeight, useDisplayMode } from "../hooks";
import type { OnboardingChecklist } from "@/lib/unified-service";

export default function OnboardingChecklistPage() {
  const toolOutput = useWidgetProps<{
    result?: {
      structuredContent?: OnboardingChecklist;
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
      <h1 className="text-2xl font-bold mb-2">Onboarding Checklist</h1>
      <p className="text-sm text-gray-600 mb-4">{data.user.name} ({data.user.email})</p>

      {/* Progress */}
      <div className="mb-6 border rounded-lg p-4" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Completion</span>
          <span className="text-2xl font-bold text-blue-600">{data.checklist.completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${data.checklist.completionPercentage}%` }}></div>
        </div>
      </div>

      {/* Services Checklist */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Software Access</h2>
        <div className="space-y-2">
          {data.checklist.services.required.map((service) => {
            const isAssigned = data.checklist.services.assigned.includes(service);
            return (
              <div key={service} className="flex items-center gap-2 p-2 border rounded" style={{ borderColor: "var(--color-border)" }}>
                <input type="checkbox" checked={isAssigned} readOnly className="w-4 h-4" />
                <span className={isAssigned ? "text-gray-700" : "text-gray-400"}>{service}</span>
                {isAssigned && <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Assigned</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Devices Checklist */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Hardware</h2>
        <div className="space-y-2">
          {data.checklist.devices.required.map((device) => {
            const isAssigned = data.checklist.devices.assigned.includes(device);
            return (
              <div key={device} className="flex items-center gap-2 p-2 border rounded" style={{ borderColor: "var(--color-border)" }}>
                <input type="checkbox" checked={isAssigned} readOnly className="w-4 h-4" />
                <span className={isAssigned ? "text-gray-700" : "text-gray-400"}>{device}</span>
                {isAssigned && <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Assigned</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Devices */}
      {data.recommendations.availableDevices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Available Devices</h2>
          <div className="space-y-2">
            {data.recommendations.availableDevices.map((device, idx) => (
              <div key={idx} className="border rounded p-3" style={{ borderColor: "var(--color-border)" }}>
                <div className="font-semibold">{device.deviceType} - {device.manufacturer}</div>
                <div className="text-sm text-gray-600">{device.modelName}</div>
                <div className="text-xs font-mono text-gray-500">Asset: {device.assetNumber}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

