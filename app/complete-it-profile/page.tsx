"use client";

import { useWidgetProps, useMaxHeight, useDisplayMode } from "../hooks";
import type { CompleteITProfile } from "@/lib/unified-service";
import { useState } from "react";

export default function CompleteITProfilePage() {
  const toolOutput = useWidgetProps<{
    result?: {
      structuredContent?: CompleteITProfile;
    };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  const data = toolOutput?.result?.structuredContent;
  const [activeTab, setActiveTab] = useState<"services" | "devices" | "compliance">("services");

  if (!data) {
    return (
      <div className="p-6">
        <p>Loading IT profile...</p>
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
      {/* User Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{data.user.name}</h1>
            <p className="text-sm text-gray-600">{data.user.email}</p>
            <p className="text-xs text-gray-500 font-mono">{data.user.userId}</p>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded border mb-2 ${
              data.user.status === "Active"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-red-100 text-red-800 border-red-300"
            }`}>
              {data.user.status}
            </div>
            {data.user.role && (
              <div className="px-3 py-1 rounded border bg-blue-100 text-blue-800 border-blue-300 text-sm">
                {data.user.role}
              </div>
            )}
          </div>
        </div>

        {/* Compliance Score */}
        <div className="border rounded-lg p-4" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Compliance Score</span>
            <span className={`text-2xl font-bold ${
              data.complianceStatus.score >= 80 ? "text-green-600" :
              data.complianceStatus.score >= 60 ? "text-yellow-600" : "text-red-600"
            }`}>
              {data.complianceStatus.score}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                data.complianceStatus.score >= 80 ? "bg-green-600" :
                data.complianceStatus.score >= 60 ? "bg-yellow-600" : "bg-red-600"
              }`}
              style={{ width: `${data.complianceStatus.score}%` }}
            ></div>
          </div>
          {data.complianceStatus.issues.length > 0 && (
            <div className="mt-3 text-xs text-red-600">
              {data.complianceStatus.issues.map((issue, idx) => (
                <div key={idx}>⚠️ {issue}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === "services"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
        >
          Software ({data.softwareAccess.total})
        </button>
        <button
          onClick={() => setActiveTab("devices")}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === "devices"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
        >
          Hardware ({data.hardwareAssets.total})
        </button>
        <button
          onClick={() => setActiveTab("compliance")}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === "compliance"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500"
          }`}
        >
          Compliance
        </button>
      </div>

      {/* Services Tab */}
      {activeTab === "services" && (
        <div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="border rounded p-3 text-center" style={{ borderColor: "var(--color-border)" }}>
              <div className="text-xl font-bold text-green-600">{data.softwareAccess.activated}</div>
              <div className="text-xs text-gray-600">Activated</div>
            </div>
            <div className="border rounded p-3 text-center" style={{ borderColor: "var(--color-border)" }}>
              <div className="text-xl font-bold text-yellow-600">{data.softwareAccess.invited}</div>
              <div className="text-xs text-gray-600">Invited</div>
            </div>
            <div className="border rounded p-3 text-center" style={{ borderColor: "var(--color-border)" }}>
              <div className="text-xl font-bold text-gray-600">{data.softwareAccess.deactivated}</div>
              <div className="text-xs text-gray-600">Deactivated</div>
            </div>
            <div className="border rounded p-3 text-center" style={{ borderColor: "var(--color-border)" }}>
              <div className="text-xl font-bold text-red-600">{data.softwareAccess.deleted}</div>
              <div className="text-xs text-gray-600">Deleted</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {data.softwareAccess.services.map((service, idx) => (
              <div
                key={idx}
                className="border rounded p-2 flex justify-between items-center text-sm"
                style={{
                  backgroundColor: "var(--color-background-primary)",
                  borderColor: "var(--color-border)",
                }}
              >
                <span className="truncate">{service.name}</span>
                <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                  service.status === "Activated" ? "bg-green-100 text-green-700" :
                  service.status === "Invited" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Devices Tab */}
      {activeTab === "devices" && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="border rounded p-3 text-center" style={{ borderColor: "var(--color-border)" }}>
              <div className="text-xl font-bold">{data.hardwareAssets.laptops}</div>
              <div className="text-xs text-gray-600">Laptops</div>
            </div>
            <div className="border rounded p-3 text-center" style={{ borderColor: "var(--color-border)" }}>
              <div className="text-xl font-bold">{data.hardwareAssets.monitors}</div>
              <div className="text-xs text-gray-600">Monitors</div>
            </div>
            <div className="border rounded p-3 text-center" style={{ borderColor: "var(--color-border)" }}>
              <div className="text-xl font-bold">{data.hardwareAssets.others}</div>
              <div className="text-xs text-gray-600">Others</div>
            </div>
          </div>

          <div className="space-y-3">
            {data.hardwareAssets.devices.map((device, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-4"
                style={{
                  backgroundColor: "var(--color-background-primary)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{device.deviceType}</div>
                    <div className="text-sm text-gray-600">{device.manufacturer} - {device.modelName}</div>
                  </div>
                  <div className="flex gap-2">
                    {device.mdm === "Yes" && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">MDM</span>
                    )}
                    {device.appleCare === "Yes" && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">AppleCare</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div><span className="font-semibold">Asset:</span> {device.assetNumber}</div>
                  <div><span className="font-semibold">Serial:</span> {device.serialNumber}</div>
                  <div><span className="font-semibold">Assigned:</span> {device.assignedDate || "N/A"}</div>
                  <div><span className="font-semibold">Location:</span> {device.city || "N/A"}</div>
                </div>
              </div>
            ))}
            {data.hardwareAssets.devices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No devices assigned</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === "compliance" && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4" style={{ borderColor: "var(--color-border)" }}>
            <h3 className="font-semibold mb-3">Status Checks</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">All laptops MDM enrolled</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  data.complianceStatus.allDevicesMDMEnrolled
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {data.complianceStatus.allDevicesMDMEnrolled ? "✓ Yes" : "✗ No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Has active services</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  data.complianceStatus.hasActiveServices
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {data.complianceStatus.hasActiveServices ? "✓ Yes" : "✗ No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Has assigned devices</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  data.complianceStatus.hasAssignedDevices
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {data.complianceStatus.hasAssignedDevices ? "✓ Yes" : "- None"}
                </span>
              </div>
            </div>
          </div>

          {data.complianceStatus.issues.length > 0 && (
            <div className="border-l-4 border-orange-500 p-4 rounded" style={{ backgroundColor: "var(--color-background-secondary)" }}>
              <h3 className="font-semibold text-orange-700 mb-2">Issues Found</h3>
              <ul className="space-y-1 text-sm">
                {data.complianceStatus.issues.map((issue, idx) => (
                  <li key={idx} className="text-gray-700">• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

